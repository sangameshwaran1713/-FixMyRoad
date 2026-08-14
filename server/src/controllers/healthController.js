import mongoose from 'mongoose';

/**
 * @desc    General API Health Status
 * @route   GET /api/health
 * @access  Public
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FixMyRoad API is running',
    timestamp: new Date().toISOString(),
  });
};

/**
 * @desc    Liveness Health Check (Verifies Express process is alive)
 * @route   GET /api/health/live
 * @access  Public
 */
export const getLivenessHealth = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ONLINE',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

/**
 * @desc    Readiness Health Check (Verifies required dependencies like MongoDB)
 * @route   GET /api/health/ready
 * @access  Public
 */
export const getReadinessHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isReady = dbState === 1;

  if (isReady) {
    return res.status(200).json({
      success: true,
      status: 'READY',
      services: {
        database: 'CONNECTED',
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    success: false,
    status: 'NOT_READY',
    services: {
      database: dbState === 2 ? 'CONNECTING' : 'DISCONNECTED',
    },
    timestamp: new Date().toISOString(),
  });
};
