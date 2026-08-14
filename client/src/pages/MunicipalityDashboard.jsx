import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, AlertTriangle, CheckCircle2, Clock, ShieldCheck, Loader2, ArrowRight, RefreshCw, ChevronRight, RotateCcw, BarChart3 } from 'lucide-react';
import { getMunicipalityStatsApi, getMunicipalityComplaintsApi } from '../services/municipalityComplaintService';
import { getMunicipalityReopenRequestsApi } from '../services/reopenService';
import { useAuth } from '../context/AuthContext';

const MunicipalityDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [pendingReopenCount, setPendingReopenCount] = useState(0);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [sRes, cRes, rRes] = await Promise.all([
        getMunicipalityStatsApi(),
        getMunicipalityComplaintsApi({ limit: 5, sort: 'newest' }),
        getMunicipalityReopenRequestsApi({ status: 'PENDING', limit: 1 }),
      ]);

      if (sRes.success && sRes.data?.stats) {
        setStats(sRes.data.stats);
      }
      if (cRes.success && cRes.data?.complaints) {
        setRecentComplaints(cRes.data.complaints);
      }
      if (rRes.success && rRes.data?.pagination) {
        setPendingReopenCount(rRes.data.pagination.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load municipality metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'SUBMITTED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'UNDER_REVIEW':
      case 'ACCEPTED':
      case 'ASSIGNED':
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
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Authorized Jurisdiction Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Municipality Operations Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-slate-200 font-semibold">{user?.name}</span> ({user?.role})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="p-3 rounded-xl glass-panel text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/municipality/analytics"
            className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 font-bold text-xs transition-all flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & CSV Report</span>
          </Link>

          <Link
            to="/municipality/reopen-requests"
            className="px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 font-bold text-xs transition-all flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reopen Requests ({pendingReopenCount})</span>
          </Link>

          <Link
            to="/municipality/complaints"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2"
          >
            <span>Manage Complaints</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="p-12 text-center text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Loading municipal metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Complaints</span>
            <p className="text-2xl font-black text-white">{stats?.total || 0}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/10 space-y-1">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">Submitted</span>
            <p className="text-2xl font-black text-cyan-300">{stats?.submitted || 0}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Under Review</span>
            <p className="text-2xl font-black text-amber-300">{stats?.underReview || 0}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/10 space-y-1">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">In Progress</span>
            <p className="text-2xl font-black text-indigo-300">{stats?.inProgress || 0}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Resolved</span>
            <p className="text-2xl font-black text-emerald-300">{stats?.resolved || 0}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Reopen Pending</span>
            <p className="text-2xl font-black text-amber-300">{pendingReopenCount}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-1">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">Critical Severity</span>
            <p className="text-2xl font-black text-rose-400">{stats?.critical || 0}</p>
          </div>
        </div>
      )}

      {/* Recent Complaints Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Municipal Complaints</h2>
            <p className="text-xs text-slate-400">Latest issues requiring administrative review</p>
          </div>

          <Link
            to="/municipality/complaints"
            className="text-xs font-semibold text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No complaints reported in your jurisdiction yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Issue</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-cyan-400">{c.complaintId}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{c.issueType}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(c.severity)}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">{c.address || 'Captured GPS Location'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/municipality/complaints/${c.complaintId}`}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-semibold text-[11px] transition-all"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MunicipalityDashboard;
