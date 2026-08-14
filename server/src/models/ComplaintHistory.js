import mongoose from 'mongoose';

const complaintHistorySchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: [true, 'Complaint reference is required'],
    index: true,
  },
  oldStatus: {
    type: String,
    default: '',
  },
  newStatus: {
    type: String,
    required: [true, 'New status is required'],
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by User reference is required'],
  },
  comment: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const ComplaintHistory = mongoose.model('ComplaintHistory', complaintHistorySchema);

export default ComplaintHistory;
