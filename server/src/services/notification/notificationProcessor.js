import NotificationDelivery from '../../models/NotificationDelivery.js';
import { sendEmailNotification } from './emailNotificationService.js';
import { sendSmsNotification } from './smsNotificationService.js';
import { sendApiNotification } from './apiNotificationService.js';
import { sendDashboardNotification } from './dashboardNotificationService.js';
import { updateAggregateEventStatus } from './notificationService.js';

let isProcessing = false;
let processorTimer = null;

const getExponentialBackoffMs = (attemptNumber) => {
  switch (attemptNumber) {
    case 1:
      return 60 * 1000; // 1 minute
    case 2:
      return 5 * 60 * 1000; // 5 minutes
    case 3:
      return 15 * 60 * 1000; // 15 minutes
    default:
      return 60 * 60 * 1000; // 60 minutes
  }
};

/**
 * Recovers stale deliveries stuck in PROCESSING state due to server crashes or unhandled timeouts.
 */
const recoverStaleProcessingJobs = async () => {
  try {
    const staleTimeoutMs = parseInt(process.env.NOTIFICATION_PROCESSING_TIMEOUT_MS || '600000', 10);
    const staleThreshold = new Date(Date.now() - staleTimeoutMs);

    const result = await NotificationDelivery.updateMany(
      {
        status: 'PROCESSING',
        lastAttemptAt: { $lt: staleThreshold },
      },
      {
        $set: {
          status: 'RETRYING',
          nextAttemptAt: new Date(),
          errorMessage: 'Stale processing lock recovered by background worker',
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`⚠️ Recovered ${result.modifiedCount} stale notification delivery jobs back to RETRYING state.`);
    }
  } catch (err) {
    console.error('❌ Error recovering stale notification jobs:', err.message);
  }
};

/**
 * Core notification processor batch loop.
 */
export const processPendingNotificationsBatch = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // 1. Stale processing lock recovery check
    await recoverStaleProcessingJobs();

    const batchSize = parseInt(process.env.NOTIFICATION_PROCESSOR_BATCH_SIZE || '20', 10);
    const now = new Date();

    // 2. Find pending/retrying delivery jobs due for attempt
    const pendingDeliveries = await NotificationDelivery.find({
      status: { $in: ['PENDING', 'RETRYING'] },
      nextAttemptAt: { $lte: now },
    })
      .sort({ nextAttemptAt: 1 })
      .limit(batchSize);

    if (pendingDeliveries.length === 0) {
      isProcessing = false;
      return;
    }

    console.log(`⚙️ [NOTIFICATION PROCESSOR] Processing ${pendingDeliveries.length} outbox delivery jobs...`);

    for (const delivery of pendingDeliveries) {
      // Claim job lock
      delivery.status = 'PROCESSING';
      delivery.lastAttemptAt = new Date();
      delivery.attempts += 1;
      await delivery.save();

      try {
        let result;
        const channel = delivery.channel;

        if (channel === 'DASHBOARD') {
          result = await sendDashboardNotification({ recipient: delivery.recipient, payload: delivery.payload });
        } else if (channel === 'EMAIL') {
          result = await sendEmailNotification({ recipient: delivery.recipient, payload: delivery.payload });
        } else if (channel === 'SMS') {
          result = await sendSmsNotification({ recipient: delivery.recipient, payload: delivery.payload });
        } else if (channel === 'API') {
          result = await sendApiNotification({ recipient: delivery.recipient, payload: delivery.payload });
        } else {
          throw new Error(`Unsupported notification channel: ${channel}`);
        }

        // Delivery success
        delivery.status = 'SENT';
        delivery.deliveredAt = result.deliveredAt || new Date();
        delivery.provider = result.provider || 'DEFAULT';
        delivery.providerMessageId = result.providerMessageId || null;
        delivery.errorMessage = null;
        await delivery.save();

        console.log(`  ✓ Delivered [${channel}] to ${delivery.recipient} (MsgID: ${delivery.providerMessageId})`);
      } catch (deliveryError) {
        console.error(`  ❌ Delivery failed [${delivery.channel}] to ${delivery.recipient}:`, deliveryError.message);

        const maxAttempts = delivery.maxAttempts || 5;

        if (delivery.attempts >= maxAttempts) {
          delivery.status = 'FAILED';
          delivery.failedAt = new Date();
          delivery.errorMessage = deliveryError.message;
        } else {
          delivery.status = 'RETRYING';
          delivery.errorMessage = deliveryError.message;
          const backoffMs = getExponentialBackoffMs(delivery.attempts);
          delivery.nextAttemptAt = new Date(Date.now() + backoffMs);
        }
        await delivery.save();
      }

      // Update aggregate event status authoritatively
      await updateAggregateEventStatus(delivery.notificationEventId);
    }
  } catch (error) {
    console.error('❌ Error inside notification processor batch loop:', error);
  } finally {
    isProcessing = false;
  }
};

/**
 * Starts the background notification poller timer.
 */
export const startNotificationProcessor = () => {
  const enabled = process.env.NOTIFICATION_PROCESSOR_ENABLED !== 'false';
  if (!enabled) {
    console.log('ℹ️ Background notification processor is disabled (NOTIFICATION_PROCESSOR_ENABLED=false).');
    return;
  }

  const intervalMs = parseInt(process.env.NOTIFICATION_PROCESSOR_INTERVAL_MS || '10000', 10);
  console.log(`🚀 Starting background notification processor (Polling interval: ${intervalMs}ms)...`);

  // Initial immediate run
  processPendingNotificationsBatch();

  processorTimer = setInterval(() => {
    processPendingNotificationsBatch();
  }, intervalMs);
};

export const stopNotificationProcessor = async () => {
  if (processorTimer) {
    clearInterval(processorTimer);
    processorTimer = null;
    console.log('🛑 Background notification processor stopped.');
  }
  
  try {
    const result = await NotificationDelivery.updateMany(
      { status: 'PROCESSING' },
      {
        $set: {
          status: 'RETRYING',
          nextAttemptAt: new Date(),
          errorMessage: 'Processing lock released due to server shutdown',
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`🔓 Released ${result.modifiedCount} PROCESSING notification jobs back to RETRYING state.`);
    }
  } catch (err) {
    console.error('❌ Error releasing notification jobs on shutdown:', err.message);
  }
};

