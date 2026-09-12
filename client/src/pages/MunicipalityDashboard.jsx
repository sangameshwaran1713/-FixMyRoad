import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, RefreshCw, ChevronRight, RotateCcw, BarChart3, Loader2 } from 'lucide-react';
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
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      case 'UNDER_REVIEW':
      case 'ACCEPTED':
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-900 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-900 text-white font-bold';
      case 'HIGH':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'MEDIUM':
        return 'bg-[#f4f3ef] text-neutral-800 border-neutral-300';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="py-10 px-6 max-w-7xl mx-auto space-y-10 bg-[#f9f8f6]">
      {/* Header Banner */}
      <div className="editorial-panel p-8 border border-[#e5e5e0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 border border-neutral-300 px-3 py-1 bg-[#f9f8f6] mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>JURISDICTION OPERATIONS CENTER</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-[0.15em] uppercase text-neutral-900">
            MUNICIPAL OPERATIONS
          </h1>
          <p className="text-xs text-neutral-500 font-light mt-1">
            Logged officer: <span className="text-neutral-900 font-semibold">{user?.name}</span> ({user?.role})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="p-2.5 border border-[#e5e5e0] hover:border-neutral-900 text-neutral-700 transition-all cursor-pointer bg-white"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/municipality/analytics"
            className="editorial-btn editorial-btn-secondary text-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            <span>ANALYTICS & CSV</span>
          </Link>

          <Link
            to="/municipality/reopen-requests"
            className="editorial-btn editorial-btn-secondary text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>REOPEN REQUESTS ({pendingReopenCount})</span>
          </Link>

          <Link
            to="/municipality/complaints"
            className="editorial-btn text-xs bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <span>MANAGE COMPLAINTS</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="p-12 text-center text-neutral-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-600" />
          <p className="text-xs text-neutral-500 mt-2 font-light">Loading municipal metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="editorial-card p-5 border border-[#e5e5e0] bg-white space-y-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Total</span>
            <p className="font-serif text-3xl font-bold text-neutral-900">{stats?.total || 0}</p>
          </div>

          <div className="editorial-card p-5 border border-[#e5e5e0] bg-white space-y-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Submitted</span>
            <p className="font-serif text-3xl font-bold text-neutral-900">{stats?.submitted || 0}</p>
          </div>

          <div className="editorial-card p-5 border border-[#e5e5e0] bg-white space-y-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Review</span>
            <p className="font-serif text-3xl font-bold text-neutral-900">{stats?.underReview || 0}</p>
          </div>

          <div className="editorial-card p-5 border border-[#e5e5e0] bg-white space-y-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Progress</span>
            <p className="font-serif text-3xl font-bold text-neutral-900">{stats?.inProgress || 0}</p>
          </div>

          <div className="editorial-card p-5 border border-[#e5e5e0] bg-white space-y-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Resolved</span>
            <p className="font-serif text-3xl font-bold text-neutral-900">{stats?.resolved || 0}</p>
          </div>

          <div className="editorial-card p-5 border border-[#e5e5e0] bg-white space-y-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Reopens</span>
            <p className="font-serif text-3xl font-bold text-neutral-900">{pendingReopenCount}</p>
          </div>

          <div className="editorial-card p-5 border border-rose-200 bg-rose-50/30 space-y-1">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest block">Critical</span>
            <p className="font-serif text-3xl font-bold text-rose-900">{stats?.critical || 0}</p>
          </div>
        </div>
      )}

      {/* Recent Complaints Table */}
      <div className="editorial-panel p-8 border border-[#e5e5e0] bg-white space-y-6">
        <div className="flex items-center justify-between border-b border-[#e5e5e0] pb-4">
          <div>
            <p className="font-script-accent text-xl text-neutral-500">Jurisdiction Log</p>
            <h2 className="font-serif text-2xl font-bold tracking-[0.15em] uppercase text-neutral-900">
              RECENT COMPLAINTS
            </h2>
          </div>

          <Link
            to="/municipality/complaints"
            className="text-xs font-semibold uppercase tracking-widest text-neutral-900 hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs font-light">No complaints reported in your jurisdiction yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e5e5e0] text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Issue</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0efe9]">
                {recentComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-[#f9f8f6] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">{c.complaintId}</td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-900">{c.issueType}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${getSeverityBadge(c.severity)}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate font-light">{c.address || 'Captured GPS Location'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/municipality/complaints/${c.complaintId}`}
                        className="px-3 py-1 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white font-semibold text-[10px] uppercase tracking-wider transition-all"
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
