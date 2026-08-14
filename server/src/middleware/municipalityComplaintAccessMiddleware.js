import Complaint from '../models/Complaint.js';

/**
 * Middleware ensuring strict tenant isolation for municipality complaints.
 * MUNICIPALITY_ADMIN and MUNICIPALITY_OFFICER can ONLY access complaints belonging to their assigned municipality.
 */
export const verifyMunicipalityComplaintAccess = async (req, res, next) => {
  try {
    const { complaintId } = req.params;

    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID is required',
      });
    }

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // SUPER_ADMIN has global system authorization
    if (req.user.role === 'SUPER_ADMIN') {
      req.complaint = complaint;
      return next();
    }

    // MUNICIPALITY_ADMIN & MUNICIPALITY_OFFICER Tenant Isolation
    if (req.user.role === 'MUNICIPALITY_ADMIN' || req.user.role === 'MUNICIPALITY_OFFICER') {
      const adminMunId = req.user.municipalityId ? req.user.municipalityId.toString() : null;
      const complaintMunId = complaint.municipalityId ? complaint.municipalityId.toString() : null;

      if (!adminMunId || adminMunId !== complaintMunId) {
        return res.status(403).json({
          success: false,
          code: 'TENANT_ACCESS_DENIED',
          message: 'Access denied: You are not authorized to access complaints outside your assigned municipality.',
        });
      }

      req.complaint = complaint;
      return next();
    }

    // CITIZEN Ownership Protection
    if (req.user.role === 'CITIZEN') {
      if (complaint.citizenId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view this complaint',
        });
      }

      req.complaint = complaint;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden',
    });
  } catch (error) {
    next(error);
  }
};
