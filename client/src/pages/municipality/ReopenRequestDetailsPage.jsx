import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, AlertCircle, Loader2, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { getReopenRequestDetailsApi, acceptReopenRequestApi, rejectReopenRequestApi } from '../../services/reopenService';
import { useAuth } from '../../context/AuthContext';

const ReopenRequestDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reopenReq, setReopenReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rejectComment, setRejectComment] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getReopenRequestDetailsApi(id);
      if (res.success && res.data?.reopenRequest) {
        setReopenReq(res.data.reopenRequest);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reopen request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      setError('');

      const res = await acceptReopenRequestApi(id, {
        comment: 'Reopen request approved by municipal admin',
      });

      if (res.success) {
        loadDetails();
      }
    } catch (err) {
      setError(err.message || 'Failed to accept reopen request.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      setError('A review comment is required when rejecting a reopen request.');
      return;
    }

    try {
      setIsRejecting(true);
      setError('');

      const res = await rejectReopenRequestApi(id, {
        comment: rejectComment.trim(),
      });

      if (res.success) {
        loadDetails();
      }
    } catch (err) {
      setError(err.message || 'Failed to reject reopen request.');
    } finally {
      setIsRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-amber-400 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading side-by-side reopen comparison...</p>
      </div>
    );
  }

  if (error || !reopenReq) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto space-y-4 text-center">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <h2 className="text-base font-bold">Request Not Found</h2>
          <p className="text-xs text-slate-300">{error || 'Reopen request record does not exist.'}</p>
        </div>
        <Link
          to="/municipality/reopen-requests"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reopen Requests Queue</span>
        </Link>
      </div>
    );
  }

  const complaint = reopenReq.complaintId;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Link
            to="/municipality/reopen-requests"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reopen Requests Queue</span>
          </Link>

          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black font-mono text-white tracking-wider">
              {complaint?.complaintId || 'FMR-COMPLAINT'}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              reopenReq.status === 'PENDING'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : reopenReq.status === 'ACCEPTED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              REOPEN REQUEST: {reopenReq.status}
            </span>
          </div>
        </div>

        {reopenReq.status === 'PENDING' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isAccepting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Accept Reopen (RESOLVED → UNDER_REVIEW)</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Side-by-Side Comparison Container */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-amber-400" />
          <span>Side-by-Side Evidence Comparison</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Previous Resolution Evidence (Left) */}
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                1. Previous Resolution Proof
              </h3>
              <span className="text-[11px] text-slate-400">By Municipal Team</span>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-80 flex items-center justify-center">
              {complaint?.resolutionImage ? (
                <img
                  src={complaint.resolutionImage}
                  alt="Previous Resolution Proof"
                  className="max-h-80 w-auto object-contain rounded-2xl"
                />
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">No resolution photo uploaded</div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
              <span className="text-slate-400 font-semibold block">Resolution Notes:</span>
              <p className="text-emerald-300 font-medium">{complaint?.resolutionComment || 'Resolution notes recorded'}</p>
            </div>
          </div>

          {/* Citizen Current Evidence (Right) */}
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-amber-950/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                2. Citizen Current Evidence
              </h3>
              <span className="text-[11px] text-slate-400">By {reopenReq.citizenId?.name || 'Citizen'}</span>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-80 flex items-center justify-center">
              {reopenReq.imageUrl ? (
                <img
                  src={reopenReq.imageUrl}
                  alt="Citizen Reopen Evidence"
                  className="max-h-80 w-auto object-contain rounded-2xl"
                />
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">No current evidence photo uploaded</div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
              <span className="text-amber-400 font-semibold block">Citizen Reopen Reason:</span>
              <p className="text-slate-200 font-medium">"{reopenReq.reason}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Decision Form if PENDING */}
      {reopenReq.status === 'PENDING' && (
        <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 bg-rose-950/10 space-y-4">
          <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>Reject Reopen Request (Complaint remains RESOLVED)</span>
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Rejection Reason Comment * (Required)</label>
            <textarea
              rows={3}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="e.g. On-site inspection confirms the reported section has been properly repaired according to municipal standards."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleReject}
            disabled={isRejecting || !rejectComment.trim()}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>Confirm Rejection</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ReopenRequestDetailsPage;
