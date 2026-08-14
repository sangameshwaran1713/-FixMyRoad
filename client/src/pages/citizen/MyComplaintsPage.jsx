import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2, AlertCircle, ArrowLeft, Filter, Calendar, MapPin, Building2, ChevronRight, RefreshCw } from 'lucide-react';
import { getMyComplaintsApi } from '../../services/complaintService';

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [activeStatus, setActiveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = async (page = 1, status = '') => {
    try {
      setLoading(true);
      setError('');
      const res = await getMyComplaintsApi({ page, limit: 10, status: status || undefined });

      if (res.success && res.data) {
        setComplaints(res.data.complaints || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load submitted complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(1, activeStatus);
  }, [activeStatus]);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'SUBMITTED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/citizen/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Dashboard</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>My Submitted Complaints</span>
          </h1>
          <p className="text-xs text-slate-400">Track status and lifecycle history of your reported road defects</p>
        </div>

        <Link
          to="/citizen/report"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2"
        >
          <span>+ Report New Issue</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        {['', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setActiveStatus(st)}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeStatus === st
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {st === '' ? 'All Complaints' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center text-cyan-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 space-y-4">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No Complaints Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              You haven't submitted any road damage complaints yet under this filter.
            </p>
          </div>
          <Link
            to="/citizen/report"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all"
          >
            <span>Report First Road Defect</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <Link
              key={c._id}
              to={`/citizen/complaints/${c.complaintId}`}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group cursor-pointer"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={c.imageUrl}
                  alt={c.complaintId}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-900"
                />
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-cyan-400 group-hover:underline">
                      {c.complaintId}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white">
                    {c.issueType} • <span className="text-slate-400">{c.address || 'Location Captured'}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{c.municipalityId?.name || 'Local Authority'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityBadge(c.severity)}`}>
                  {c.severity}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs">
              <span className="text-slate-400">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchComplaints(pagination.page - 1, activeStatus)}
                  className="px-3 py-1.5 rounded-lg glass-panel text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchComplaints(pagination.page + 1, activeStatus)}
                  className="px-3 py-1.5 rounded-lg glass-panel text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyComplaintsPage;
