import { submitCitizenFeedbackWithTransaction, getComplaintFeedback } from '../services/complaintFeedbackService.js';

/**
 * @desc    Submit citizen rating & feedback for resolved complaint (moves RESOLVED -> CLOSED)
 * @route   POST /api/complaints/:complaintId/feedback
 * @access  Private (CITIZEN)
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { rating, comment } = req.body;

    const result = await submitCitizenFeedbackWithTransaction({
      complaintIdParam: complaintId,
      rating,
      comment,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Complaint verified and marked as CLOSED.',
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
 * @desc    Get feedback entries for a complaint
 * @route   GET /api/complaints/:complaintId/feedback
 * @access  Private (CITIZEN, MUNICIPALITY_ADMIN, MUNICIPALITY_OFFICER, SUPER_ADMIN)
 */
export const getFeedback = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const feedbackList = await getComplaintFeedback(complaintId);

    res.status(200).json({
      success: true,
      data: {
        feedback: feedbackList,
      },
    });
  } catch (error) {
    next(error);
  }
};
