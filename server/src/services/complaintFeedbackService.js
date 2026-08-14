import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import ComplaintFeedback from '../models/ComplaintFeedback.js';
import AuditLog from '../models/AuditLog.js';
import { changeComplaintStatusWithTransaction } from './complaintStatusService.js';

/**
 * Submits citizen satisfaction rating & feedback.
 * Rating 4-5: Sets citizenVerified = true and transitions complaint RESOLVED -> CLOSED.
 * Rating 1-3: Saves feedback, keeps status RESOLVED, and prompts optional reopening.
 */
export const submitCitizenFeedbackWithTransaction = async ({ complaintIdParam, rating, comment = '', user }) => {
  const complaint = await Complaint.findOne({ complaintId: complaintIdParam });

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // 1. Citizen Ownership Check
  if (complaint.citizenId.toString() !== user._id.toString()) {
    const error = new Error('Access denied: You can only submit feedback for your own reported complaints');
    error.statusCode = 403;
    throw error;
  }

  // 2. Status Check
  if (complaint.status !== 'RESOLVED') {
    const error = new Error(`Feedback can only be submitted for RESOLVED complaints (Current status: ${complaint.status})`);
    error.statusCode = 400;
    error.code = 'COMPLAINT_NOT_RESOLVED';
    throw error;
  }

  // 3. Rating Validation
  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    const error = new Error('Rating must be an integer between 1 and 5');
    error.statusCode = 400;
    error.code = 'INVALID_RATING';
    throw error;
  }

  const currentCycle = complaint.resolutionCycle || 1;

  // 4. Duplicate Check in current resolution cycle
  const existingFeedback = await ComplaintFeedback.findOne({
    complaintId: complaint._id,
    resolutionCycle: currentCycle,
    citizenId: user._id,
  });

  if (existingFeedback) {
    const error = new Error('Feedback has already been submitted for this resolution cycle');
    error.statusCode = 409;
    error.code = 'FEEDBACK_ALREADY_SUBMITTED';
    throw error;
  }

  const sanitizedComment = comment && typeof comment === 'string' ? comment.trim().substring(0, 1000) : '';

  // 5. Create Feedback Document
  const feedbackDoc = await ComplaintFeedback.create({
    complaintId: complaint._id,
    citizenId: user._id,
    resolutionCycle: currentCycle,
    rating: numericRating,
    comment: sanitizedComment,
  });

  complaint.citizenRating = numericRating;

  // Rating 4-5: Satisfied -> RESOLVED to CLOSED
  if (numericRating >= 4) {
    complaint.citizenVerified = true;
    complaint.citizenVerifiedAt = new Date();
    await complaint.save();

    const closedComplaint = await changeComplaintStatusWithTransaction({
      complaint,
      targetStatus: 'CLOSED',
      comment: `Citizen verified repair work with ${numericRating}-star rating. ${sanitizedComment}`,
      updatedBy: user._id,
    });

    await AuditLog.create({
      action: 'COMPLAINT_CITIZEN_VERIFIED',
      entity: 'Complaint',
      entityId: complaint._id,
      actor: user._id,
      metadata: {
        complaintId: complaint.complaintId,
        rating: numericRating,
        resolutionCycle: currentCycle,
      },
    });

    return {
      feedback: feedbackDoc,
      complaint: closedComplaint,
      isClosed: true,
      promptReopen: false,
    };
  } else {
    // Rating 1-3: Low rating feedback recorded, complaint remains RESOLVED, prompt optional reopen
    await complaint.save();

    await AuditLog.create({
      action: 'CITIZEN_FEEDBACK_SUBMITTED',
      entity: 'Complaint',
      entityId: complaint._id,
      actor: user._id,
      metadata: {
        complaintId: complaint.complaintId,
        rating: numericRating,
        resolutionCycle: currentCycle,
      },
    });

    return {
      feedback: feedbackDoc,
      complaint,
      isClosed: false,
      promptReopen: true,
    };
  }
};

/**
 * Gets feedback list for a complaint.
 */
export const getComplaintFeedback = async (complaintIdParam) => {
  const complaint = await Complaint.findOne({ complaintId: complaintIdParam });
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  return await ComplaintFeedback.find({ complaintId: complaint._id })
    .sort({ resolutionCycle: -1 })
    .populate('citizenId', 'name email');
};
