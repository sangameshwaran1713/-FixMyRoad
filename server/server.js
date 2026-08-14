import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { validateProductionConfig, getSafeConfigSummary } from './src/config/productionConfig.js';
import { startNotificationProcessor, stopNotificationProcessor } from './src/services/notification/notificationProcessor.js';

// Load environment variables
dotenv.config();

// 1. Production Config Validation (Fails safely if secrets missing)
validateProductionConfig();

const safeConfig = getSafeConfigSummary();
console.log('ℹ️ Safe Configuration Summary loaded:', JSON.stringify(safeConfig, null, 2));

const PORT = safeConfig.port;

// 2. Connect to MongoDB
connectDB();

// 3. Start Express server
const server = app.listen(PORT, () => {
  console.log(`🚀 FixMyRoad Server running in ${safeConfig.environment} mode on port ${PORT}`);

  // Start background notification processor poller
  startNotificationProcessor();
});

// 4. Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown sequence...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('  ✓ HTTP server closed.');

    // Stop background outbox poller and unlock PROCESSING jobs
    await stopNotificationProcessor();

    // Close MongoDB connection
    try {
      await mongoose.connection.close();
      console.log('  ✓ MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing MongoDB connection during shutdown:', err.message);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if shutdown hangs
  setTimeout(() => {
    console.error('❌ Forced shutdown initiated after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down server...', err);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(1);
  });
});
