import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, Search, Filter, ArrowLeft, Loader2, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { getMunicipalityComplaintsApi } from '../../services/municipalityComplaintService';

const MunicipalityComplaintsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get('status') || '';
  const severityParam = searchParams.get('severity') || '';
  const issueTypeParam = searchParams.get('issueType') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState(searchParam);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getMunicipalityComplaintsApi({
        page: pageParam,
        limit: 10,
        status: statusParam || undefined,
        severity: severityParam || undefined,
        issueType: issueTypeParam || undefined,
        search: searchParam || undefined,
        sort: sortParam,
      });

      if (res.success && res.data) {
        setComplaints(res.data.complaints || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [searchParams]);

  const updateFilters = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });
    params.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

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
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/municipality/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Center</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-cyan-400" />
          <span>Municipal Complaint Management</span>
        </h1>
        <p className="text-xs text-slate-400">Strictly isolated jurisdiction queue and workflow processing</p>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Complaint ID, Address, or Keywords..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-md shadow-cyan-500/20 hover:scale-[1.02] transition-all"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Status</label>
            <select
              value={statusParam}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Severity</label>
            <select
              value={severityParam}
              onChange={(e) => updateFilters({ severity: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Issue Type Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Issue Type</label>
            <select
              value={issueTypeParam}
              onChange={(e) => updateFilters({ issueType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Issue Types</option>
              <option value="POTHOLE">POTHOLE</option>
              <option value="ROAD_CRACK">ROAD_CRACK</option>
              <option value="BROKEN_ROAD">BROKEN_ROAD</option>
              <option value="WATERLOGGING">WATERLOGGING</option>
              <option value="OPEN_MANHOLE">OPEN_MANHOLE</option>
              <option value="DAMAGED_DIVIDER">DAMAGED_DIVIDER</option>
              <option value="MISSING_ROAD_SIGN">MISSING_ROAD_SIGN</option>
              <option value="DAMAGED_STREET_LIGHT">DAMAGED_STREET_LIGHT</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Sort Order</label>
            <select
              value={sortParam}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="severity">Highest Severity</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaints Table */}
      {loading ? (
        <div className="p-12 text-center text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Loading municipal complaints queue...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 space-y-3">
          <p className="text-sm font-bold text-white">No Complaints Found</p>
          <p className="text-xs text-slate-400">No complaints match your selected search criteria or filters.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Complaint ID</th>
                  <th className="py-3.5 px-4">Issue</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Assigned Officer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-cyan-400">{c.complaintId}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{c.issueType}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(c.severity)}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">{c.address || 'Captured GPS Location'}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {c.assignedTo?.name ? (
                        <span className="font-semibold text-cyan-300">{c.assignedTo.name}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
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
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-semibold text-[11px] transition-all"
                      >
                        Inspect & Process
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total complaints)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => updateFilters({ page: (pagination.page - 1).toString() })}
                  className="px-3 py-1.5 rounded-lg glass-panel text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => updateFilters({ page: (pagination.page + 1).toString() })}
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

export default MunicipalityComplaintsPage;
