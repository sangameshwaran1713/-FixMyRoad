import React, { useState } from 'react';
import { X, AlertCircle, Loader2, Upload, CheckCircle2, RotateCcw } from 'lucide-react';
import { createReopenRequestApi, uploadReopenImageApi } from '../../services/reopenService';

const ReopenRequestModal = ({ isOpen, onClose, complaintId, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Evidence image size must be 10MB or less.');
      return;
    }

    try {
      setIsUploadingImage(true);
      setError('');
      setImageFile(file);

      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);

      const formData = new FormData();
      formData.append('image', file);

      const res = await uploadReopenImageApi(complaintId, formData);
      if (res.success && res.data?.imageUrl) {
        setImageUrl(res.data.imageUrl);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload evidence image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('A detailed reason is required to request reopening.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await createReopenRequestApi(complaintId, {
        reason: reason.trim(),
        imageUrl: imageUrl || undefined,
      });

      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit reopen request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Request Complaint Reopening</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Why does this issue still exist? <span className="text-rose-400">* (Required)</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The pothole was filled with loose gravel which washed away during rain. Damaged section remains unsafe."
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Upload Current Road Condition Photo (Optional Evidence)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer"
            />

            {isUploadingImage && (
              <div className="text-[11px] text-amber-400 flex items-center space-x-1.5 pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading evidence to Cloudinary...</span>
              </div>
            )}

            {imageUrl && (
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Evidence photo uploaded successfully</span>
              </div>
            )}

            {imagePreview && (
              <div className="mt-2 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 max-h-40 flex items-center justify-center">
                <img src={imagePreview} alt="Evidence Preview" className="max-h-40 w-auto object-contain rounded-xl" />
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl glass-panel text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Reopen Request...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Submit Reopen Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReopenRequestModal;
