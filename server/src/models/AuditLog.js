import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Actor reference is required'],
    index: true,
  },
  action: {
    type: String,
    required: [true, 'Audit action is required'],
    trim: true,
  },
  entity: {
    type: String,
    required: [true, 'Target entity is required'],
    trim: true,
    index: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Immutable Collection: Prevent modifications and deletions
auditLogSchema.pre('remove', function(next) {
  next(new Error('Audit logs are immutable and cannot be deleted.'));
});
auditLogSchema.pre('updateOne', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated.'));
});
auditLogSchema.pre('updateMany', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated.'));
});
auditLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated.'));
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
