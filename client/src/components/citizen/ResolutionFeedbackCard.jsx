import React, { useState } from 'react';
import { Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitFeedbackApi } from '../../services/feedbackService';

const ResolutionFeedbackCard = ({ complaintId, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await submitFeedbackApi(complaintId, {
        rating,
        comment: comment.trim(),
      });

      if (res.success) {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
      <div className="flex items-center space-x-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <h2 className="text-sm font-bold text-white">How satisfied are you with the repair?</h2>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Selection */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300 font-semibold block">Select Rating</label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      active ? 'text-amber-400 fill-amber-400' : 'text-slate-700 fill-slate-900'
                    }`}
                  />
                </button>
              );
            })}
            <span className="text-xs font-bold text-amber-400 ml-2">{rating} / 5 Stars</span>
          </div>
        </div>

        {/* Comment Input */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300 font-semibold block">Tell us about the repair (Optional)</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. The pothole has been properly filled and asphalt smoothed."
            maxLength={1000}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Feedback...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Verify Resolution</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ResolutionFeedbackCard;
