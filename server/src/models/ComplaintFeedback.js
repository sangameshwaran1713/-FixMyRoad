import mongoose from 'mongoose';

const complaintFeedbackSchema = new mongoose.Schema(
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
    resolutionCycle: {
      type: Number,
      default: 1,
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      default: '',
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate feedback within the same resolution cycle
complaintFeedbackSchema.index(
  { complaintId: 1, resolutionCycle: 1, citizenId: 1 },
  { unique: true }
);

const ComplaintFeedback = mongoose.model('ComplaintFeedback', complaintFeedbackSchema);

export default ComplaintFeedback;
