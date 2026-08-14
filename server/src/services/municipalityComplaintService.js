import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { changeComplaintStatusWithTransaction } from './complaintStatusService.js';

/**
 * Retrieves aggregate complaint statistics strictly scoped to a municipalityId.
 */
export const getMunicipalityStats = async (municipalityId) => {
  const matchQuery = { municipalityId };

  const stats = await Complaint.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        submitted: { $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] } },
        underReview: { $sum: { $cond: [{ $eq: ['$status', 'UNDER_REVIEW'] }, 1, 0] } },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$status', 'ASSIGNED'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      submitted: 0,
      underReview: 0,
      accepted: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      rejected: 0,
      critical: 0,
      high: 0,
    };
  }

  const res = stats[0];
  delete res._id;
  return res;
};

/**
 * Retrieves paginated complaints strictly scoped to municipalityId with whitelisted filters.
 */
export const getMunicipalityComplaints = async ({
  municipalityId,
  page = 1,
  limit = 10,
  status,
  severity,
  issueType,
  search,
  sort = 'newest',
  from,
  to,
}) => {
  const query = {};

  if (municipalityId) {
    query.municipalityId = municipalityId;
  }

  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (issueType) query.issueType = issueType;

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const cleanSearch = search.trim();
    query.$or = [
      { complaintId: { $regex: cleanSearch, $options: 'i' } },
      { address: { $regex: cleanSearch, $options: 'i' } },
      { description: { $regex: cleanSearch, $options: 'i' } },
      { issueType: { $regex: cleanSearch, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'severity') sortOption = { severity: -1, createdAt: -1 };
  if (sort === 'updated') sortOption = { updatedAt: -1 };

  const total = await Complaint.countDocuments(query);
  const complaints = await Complaint.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum)
    .populate('citizenId', 'name email phone')
    .populate('assignedTo', 'name email role phone')
    .populate('municipalityId', 'name code state district')
    .exec();

  return {
    complaints,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Finds active municipal officers & admins belonging to a specific municipality available for assignment.
 */
export const getMunicipalityOfficers = async (municipalityId) => {
  return await User.find({
    municipalityId,
    role: { $in: ['MUNICIPALITY_OFFICER', 'MUNICIPALITY_ADMIN'] },
    isActive: true,
  }).select('_id name email role phone');
};

/**
 * Assigns a complaint to an active officer within the same municipality and executes state machine transition (ACCEPTED -> ASSIGNED).
 */
export const assignComplaintToOfficer = async ({ complaint, officerId, comment, updatedBy }) => {
  // Verify officer exists, is active, and belongs to same municipality
  const officer = await User.findOne({
    _id: officerId,
    municipalityId: complaint.municipalityId,
    role: { $in: ['MUNICIPALITY_OFFICER', 'MUNICIPALITY_ADMIN'] },
    isActive: true,
  });

  if (!officer) {
    const error = new Error('Invalid officer assignment target: Officer does not exist, is inactive, or belongs to a different municipality');
    error.statusCode = 400;
    error.code = 'INVALID_OFFICER_ASSIGNMENT';
    throw error;
  }

  // Enforce state machine rules: Assignment requires current status to be ACCEPTED to move to ASSIGNED
  if (complaint.status !== 'ACCEPTED') {
    const error = new Error(`Cannot assign officer: Complaint status must be ACCEPTED (Current status: ${complaint.status})`);
    error.statusCode = 400;
    error.code = 'INVALID_STATUS_TRANSITION';
    throw error;
  }

  const assignComment = comment || `Assigned to municipal officer ${officer.name} (${officer.email})`;

  return await changeComplaintStatusWithTransaction({
    complaint,
    targetStatus: 'ASSIGNED',
    comment: assignComment,
    assignedTo: officer._id,
    updatedBy,
  });
};
