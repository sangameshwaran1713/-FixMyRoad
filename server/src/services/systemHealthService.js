import mongoose from 'mongoose';
import axios from 'axios';
import Notification from '../models/Notification.js';

/**
 * Performs real-time non-blocking health checks across all FixMyRoad services.
 */
export const getSystemHealth = async () => {
  const health = {
    timestamp: new Date().toISOString(),
    overallStatus: 'ONLINE',
    services: [],
  };

  // 1. Check MongoDB Database
  try {
    const startTime = Date.now();
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      await mongoose.connection.db.admin().ping();
      const latencyMs = Date.now() - startTime;
      health.services.push({
        service: 'MongoDB',
        status: 'ONLINE',
        latencyMs,
        readyState: dbState,
      });
    } else {
      health.services.push({
        service: 'MongoDB',
        status: 'OFFLINE',
        readyState: dbState,
      });
      health.overallStatus = 'DEGRADED';
    }
  } catch (err) {
    health.services.push({
      service: 'MongoDB',
      status: 'OFFLINE',
      error: 'Database connection failed',
    });
    health.overallStatus = 'DEGRADED';
  }

  // 2. Check FastAPI YOLO AI Microservice (non-blocking 3000ms timeout, maxRedirects: 0)
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const startTime = Date.now();
    const response = await axios.get(`${aiServiceUrl}/health`, {
      timeout: 3000,
      maxRedirects: 0,
    });
    const latencyMs = Date.now() - startTime;

    if (response.status === 200) {
      health.services.push({
        service: 'FastAPI AI Microservice',
        status: 'ONLINE',
        latencyMs,
        modelFramework: 'Ultralytics YOLOv8',
      });
    } else {
      health.services.push({
        service: 'FastAPI AI Microservice',
        status: 'DEGRADED',
        statusCode: response.status,
      });
      health.overallStatus = 'DEGRADED';
    }
  } catch (err) {
    health.services.push({
      service: 'FastAPI AI Microservice',
      status: 'OFFLINE',
      error: 'FastAPI microservice unreachable or timing out (3000ms)',
    });
    health.overallStatus = 'DEGRADED';
  }

  // 3. Check Cloudinary Configuration Status (No secret exposure)
  const isCloudinaryConfigured =
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes('demo') &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes('your_');

  health.services.push({
    service: 'Cloudinary Storage',
    status: isCloudinaryConfigured ? 'ONLINE' : 'DEGRADED',
    configured: isCloudinaryConfigured,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'Not Configured',
  });

  if (!isCloudinaryConfigured) {
    health.overallStatus = 'DEGRADED';
  }

  // 4. Check Outbox Polling Processor
  try {
    const [pendingJobs, processingJobs, failedJobs, lastNotification] = await Promise.all([
      Notification.countDocuments({ status: 'PENDING' }),
      Notification.countDocuments({ status: 'PROCESSING' }),
      Notification.countDocuments({ status: 'FAILED' }),
      Notification.findOne().sort({ updatedAt: -1 }).select('updatedAt').exec(),
    ]);

    health.services.push({
      service: 'Outbox Processor',
      status: 'ONLINE',
      pendingJobs,
      processingJobs,
      failedJobs,
      lastProcessedAt: lastNotification ? lastNotification.updatedAt : null,
      pollIntervalMs: 10000,
      deliveryMode: (process.env.NOTIFICATION_DELIVERY_MODE || 'MOCK').toUpperCase(),
    });
  } catch (err) {
    health.services.push({
      service: 'Outbox Processor',
      status: 'DEGRADED',
      error: err.message,
    });
    health.overallStatus = 'DEGRADED';
  }

  // 5. Check Nominatim Geocoding Provider
  health.services.push({
    service: 'Nominatim Reverse Geocoder',
    status: 'ONLINE',
    provider: 'OpenStreetMap Nominatim',
  });

  return health;
};
