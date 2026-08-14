import Counter from '../models/Counter.js';

/**
 * Generates a unique, sequential, human-readable Complaint ID.
 * Format: FMR-YYYY-00001 (e.g. FMR-2026-00001)
 * Safe under concurrent traffic via atomic MongoDB findOneAndUpdate with $inc.
 */
export const generateComplaintId = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `complaint_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSequence = String(counter.seq).padStart(5, '0');
  return `FMR-${currentYear}-${paddedSequence}`;
};
