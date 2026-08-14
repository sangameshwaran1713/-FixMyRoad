import mongoose from 'mongoose';

const reopenRequestSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen ID is required'],
    },
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: [true, 'Municipality ID is required'],
    },
    resolutionCycle: {
      type: Number,
      default: 1,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reopen reason is required'],
      maxlength: [1000, 'Reopen reason cannot exceed 1000 characters'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewComment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reopenRequestSchema.index({ complaintId: 1, status: 1 });
reopenRequestSchema.index({ municipalityId: 1, status: 1 });

const ReopenRequest = mongoose.model('ReopenRequest', reopenRequestSchema);

export default ReopenRequest;
