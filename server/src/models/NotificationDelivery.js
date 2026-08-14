import mongoose from 'mongoose';

const notificationDeliverySchema = new mongoose.Schema(
  {
    notificationEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationEvent',
      required: [true, 'Notification Event ID is required'],
    },
    channel: {
      type: String,
      enum: ['DASHBOARD', 'EMAIL', 'SMS', 'API'],
      required: [true, 'Notification channel is required'],
    },
    recipient: {
      type: String,
      required: [true, 'Recipient identifier is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SENT', 'RETRYING', 'FAILED'],
      default: 'PENDING',
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    provider: {
      type: String,
      default: 'MOCK',
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    errorCode: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    payload: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for strict delivery idempotency per event, channel, and recipient
notificationDeliverySchema.index(
  { notificationEventId: 1, channel: 1, recipient: 1 },
  { unique: true }
);

// Polling index for background processor
notificationDeliverySchema.index({ status: 1, nextAttemptAt: 1 });

const NotificationDelivery = mongoose.model('NotificationDelivery', notificationDeliverySchema);

export default NotificationDelivery;
