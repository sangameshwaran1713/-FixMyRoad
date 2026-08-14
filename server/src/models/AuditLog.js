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

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
