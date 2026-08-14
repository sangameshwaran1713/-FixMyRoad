import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Building2, FileText, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Activity, BarChart3, Settings } from 'lucide-react';
import { getAdminStatsApi, getAdminComplaintsApi } from '../services/municipalityComplaintService';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  const [globalData, setGlobalData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      const [sRes, cRes] = await Promise.all([
        getAdminStatsApi(),
        getAdminComplaintsApi({ limit: 10, sort: 'newest' }),
      ]);

      if (sRes.success && sRes.data) {
        setGlobalData(sRes.data);
      }
      if (cRes.success && cRes.data?.complaints) {
        setComplaints(cRes.data.complaints);
      }
    } catch (err) {
      setError(err.message || 'Failed to load Super Admin system metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
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

  const stats = globalData?.stats;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 bg-purple-950/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Global Command Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            FixMyRoad Multi-Tenant Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-slate-200 font-semibold">{user?.name}</span> ({user?.role})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadAdminData}
            className="p-3 rounded-xl glass-panel text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            title="Refresh System Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/admin/operations"
            className="px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 font-bold text-xs transition-all flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Operations Dashboard</span>
          </Link>

          <Link
            to="/admin/analytics"
            className="px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 font-bold text-xs transition-all flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Global Analytics</span>
          </Link>

          <Link
            to="/admin/health"
            className="px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 font-bold text-xs transition-all flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>System Health Inspector</span>
          </Link>
        </div>
      </div>

      {/* Global Metrics Cards */}
      {loading ? (
        <div className="p-12 text-center text-purple-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Loading system-wide multi-tenant metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Active Municipalities</span>
            <p className="text-2xl font-black text-purple-400">{globalData?.totalMunicipalities || 0}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">System Complaints</span>
            <p className="text-2xl font-black text-white">{stats?.total || 0}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">System Resolved</span>
            <p className="text-2xl font-black text-emerald-300">{stats?.resolved || 0}</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-1">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">Critical Defects</span>
            <p className="text-2xl font-black text-rose-400">{stats?.critical || 0}</p>
          </div>
        </div>
      )}

      {/* Global Complaints Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold text-white tracking-tight">System-Wide Complaints Audit Log</h2>

        {complaints.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No complaints reported in the system yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Municipality</th>
                  <th className="py-3 px-4">Issue</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-purple-400">{c.complaintId}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{c.municipalityId?.name || 'Local Authority'}</td>
                    <td className="py-3.5 px-4 text-slate-200">{c.issueType}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(c.severity)}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/municipality/complaints/${c.complaintId}`}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 font-semibold text-[11px] transition-all"
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

export default AdminDashboard;
