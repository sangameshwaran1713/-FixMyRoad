import mongoose from 'mongoose';

const notificationEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, 'Event ID is required'],
      unique: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['NEW_COMPLAINT', 'COMPLAINT_STATUS_CHANGED', 'COMPLAINT_RESOLVED'],
      default: 'NEW_COMPLAINT',
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
    },
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: [true, 'Municipality ID is required'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SENT', 'RETRYING', 'PARTIAL_FAILED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

notificationEventSchema.index({ status: 1, createdAt: -1 });
notificationEventSchema.index({ complaintId: 1 });
notificationEventSchema.index({ municipalityId: 1, createdAt: -1 });

const NotificationEvent = mongoose.model('NotificationEvent', notificationEventSchema);

export default NotificationEvent;
