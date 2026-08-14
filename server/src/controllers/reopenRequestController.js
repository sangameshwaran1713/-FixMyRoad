import {
  createReopenRequestWithTransaction,
  getMunicipalityReopenRequests,
  reviewReopenRequest,
} from '../services/reopenRequestService.js';
import ReopenRequest from '../models/ReopenRequest.js';
import { processAndUploadImage } from '../services/imageUploadService.js';

/**
 * @desc    Submit citizen reopen request while complaint status remains RESOLVED
 * @route   POST /api/complaints/:complaintId/reopen
 * @access  Private (CITIZEN)
 */
export const createReopen = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { reason, imageUrl } = req.body;

    const result = await createReopenRequestWithTransaction({
      complaintIdParam: complaintId,
      reason,
      imageUrl,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Reopen request submitted successfully. Sent to municipality for review.',
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code || 'BAD_REQUEST',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    Upload fresh reopen evidence photo to Cloudinary
 * @route   POST /api/complaints/:complaintId/reopen-image
 * @access  Private (CITIZEN)
 */
export const uploadReopenImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an evidence image file',
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const folder = `fixmyroad/reopen-evidence/${year}/${month}`;

    const uploadResult = await processAndUploadImage(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      message: 'Reopen evidence image uploaded successfully',
      data: {
        imageUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated reopen requests for municipality
 * @route   GET /api/municipality/reopen-requests
 * @access  Private (MUNICIPALITY_ADMIN, MUNICIPALITY_OFFICER, SUPER_ADMIN)
 */
export const getReopenRequests = async (req, res, next) => {
  try {
    const municipalityId = req.user.role === 'SUPER_ADMIN' ? req.query.municipalityId : req.user.municipalityId;
    const { page, limit, status } = req.query;

    const result = await getMunicipalityReopenRequests({
      municipalityId,
      page,
      limit,
      status,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single reopen request detail for side-by-side comparison
 * @route   GET /api/municipality/reopen-requests/:id
 * @access  Private (MUNICIPALITY_ADMIN, MUNICIPALITY_OFFICER, SUPER_ADMIN)
 */
export const getReopenRequestDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reopenRequest = await ReopenRequest.findById(id)
      .populate('complaintId')
      .populate('citizenId', 'name email phone')
      .populate('municipalityId', 'name code district')
      .populate('reviewedBy', 'name email role')
      .exec();

    if (!reopenRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reopen request not found',
      });
    }

    // Tenant Isolation check
    if (req.user.role !== 'SUPER_ADMIN') {
      const adminMunId = req.user.municipalityId ? req.user.municipalityId.toString() : null;
      const reqMunId = reopenRequest.municipalityId ? reopenRequest.municipalityId.toString() : null;

      if (!adminMunId || adminMunId !== reqMunId) {
        return res.status(403).json({
          success: false,
          code: 'TENANT_ACCESS_DENIED',
          message: 'Access denied: Reopen request belongs to a different municipality',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        reopenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept reopen request (moves complaint RESOLVED -> UNDER_REVIEW)
 * @route   PATCH /api/municipality/reopen-requests/:id/accept
 * @access  Private (MUNICIPALITY_ADMIN, SUPER_ADMIN)
 */
export const acceptReopen = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const result = await reviewReopenRequest({
      reopenRequestId: id,
      action: 'ACCEPT',
      reviewComment: comment,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: 'Reopen request accepted. Complaint status moved to UNDER_REVIEW.',
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code || 'BAD_REQUEST',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    Reject reopen request (complaint remains RESOLVED)
 * @route   PATCH /api/municipality/reopen-requests/:id/reject
 * @access  Private (MUNICIPALITY_ADMIN, SUPER_ADMIN)
 */
export const rejectReopen = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const result = await reviewReopenRequest({
      reopenRequestId: id,
      action: 'REJECT',
      reviewComment: comment,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: 'Reopen request rejected. Complaint remains RESOLVED.',
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code || 'BAD_REQUEST',
        message: error.message,
      });
    }
    next(error);
  }
};
