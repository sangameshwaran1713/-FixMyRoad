import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RotateCcw, ArrowLeft, Loader2, AlertCircle, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { getMunicipalityReopenRequestsApi } from '../../services/reopenService';

const ReopenRequestsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getMunicipalityReopenRequestsApi({
        page: pageParam,
        limit: 10,
        status: statusParam || undefined,
      });

      if (res.success && res.data) {
        setRequests(res.data.reopenRequests || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load reopen requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [searchParams]);

  const updateStatusFilter = (st) => {
    const params = new URLSearchParams(searchParams);
    if (st) {
      params.set('status', st);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ACCEPTED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
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
          <RotateCcw className="w-6 h-6 text-amber-400" />
          <span>Citizen Reopen Requests Queue</span>
        </h1>
        <p className="text-xs text-slate-400">Review citizen dissatisfaction claims and side-by-side evidence</p>
      </div>

      {/* Status Filter */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Filter by Request Status:</span>
        <div className="flex items-center space-x-2">
          {['', 'PENDING', 'ACCEPTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => updateStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                statusParam === st
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                  : 'glass-panel text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {st === '' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Requests Table */}
      {loading ? (
        <div className="p-12 text-center text-amber-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Loading citizen reopen requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 space-y-3">
          <p className="text-sm font-bold text-white">No Reopen Requests Found</p>
          <p className="text-xs text-slate-400">There are no citizen reopen requests in this status category.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Complaint ID</th>
                  <th className="py-3.5 px-4">Citizen Reason</th>
                  <th className="py-3.5 px-4">Citizen Evidence</th>
                  <th className="py-3.5 px-4">Requested Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-amber-400">
                      {r.complaintId?.complaintId || 'FMR-COMPLAINT'}
                    </td>
                    <td className="py-3.5 px-4 text-white max-w-xs truncate">{r.reason}</td>
                    <td className="py-3.5 px-4">
                      {r.imageUrl ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Photo Provided</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No Photo</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/municipality/reopen-requests/${r._id}`}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-semibold text-[11px] transition-all"
                      >
                        Inspect & Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReopenRequestsPage;
