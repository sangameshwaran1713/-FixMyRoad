import { getSystemHealth } from '../services/systemHealthService.js';

/**
 * @desc    Get real-time operational status across system microservices
 * @route   GET /api/admin/health/system
 * @access  Private (SUPER_ADMIN)
 */
export const getSystemHealthHandler = async (req, res, next) => {
  try {
    const health = await getSystemHealth();
    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};
