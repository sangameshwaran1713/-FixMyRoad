import { metricsService } from '../services/metricsService.js';
import { getSystemHealth } from '../services/systemHealthService.js';
import { getSafeConfigSummary } from '../config/productionConfig.js';

/**
 * @desc    Get real-time operational and infrastructure metrics
 * @route   GET /api/admin/operations/metrics
 * @access  Private (SUPER_ADMIN)
 */
export const getOperationsMetrics = async (req, res, next) => {
  try {
    const metrics = metricsService.getMetrics();
    const health = await getSystemHealth();
    const config = getSafeConfigSummary();

    res.status(200).json({
      success: true,
      data: {
        metrics,
        health,
        config,
      },
    });
  } catch (error) {
    next(error);
  }
};
