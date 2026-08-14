import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Download,
  Clock,
  Star,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Activity,
  RotateCcw,
  Calendar,
  FileCode,
} from 'lucide-react';
import {
  getMunicipalityAnalyticsApi,
  downloadMunicipalityCSV,
  downloadMunicipalityJSON,
} from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';

const AnalyticsDashboardPage = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [error, setError] = useState('');

  // Date Range Controls
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadAnalytics = async (dateParams = {}) => {
    try {
      setLoading(true);
      setError('');

      const res = await getMunicipalityAnalyticsApi(dateParams);
      if (res.success && res.data?.analytics) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      setError(err.message || 'Failed to load analytics metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    loadAnalytics(params);
  };

  const handleResetFilter = () => {
    setFromDate('');
    setToDate('');
    loadAnalytics();
  };

  const handleExportCSV = async () => {
    try {
      setIsExportingCSV(true);
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      await downloadMunicipalityCSV(params);
    } catch (err) {
      setError(err.message || 'Failed to export CSV report.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExportingJSON(true);
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      await downloadMunicipalityJSON(params);
    } catch (err) {
      setError(err.message || 'Failed to export JSON report.');
    } finally {
      setIsExportingJSON(false);
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

  const total = analytics?.totalComplaints || 0;
  const resolutionRate = analytics?.resolutionRate || 0;
  const velocity = analytics?.resolutionMetrics || {};
  const reopen = analytics?.reopenMetrics || {};
  const satisfaction = analytics?.satisfactionMetrics || {};
  const verification = analytics?.citizenVerificationMetrics || {};
  const critical = analytics?.criticalMetrics || {};

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            to="/municipality/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Operations Center</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            <span>Municipal Analytics & Reporting</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time MongoDB aggregation metrics for your jurisdiction
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadAnalytics({ from: fromDate, to: toDate })}
            className="p-3 rounded-xl glass-panel text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExportingCSV}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isExportingCSV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>CSV Report</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={isExportingJSON}
            className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isExportingJSON ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
            <span>JSON Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <form onSubmit={handleApplyFilter} className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 font-semibold text-slate-300">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Date Range Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <label className="text-slate-400 font-medium">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <label className="text-slate-400 font-medium">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            Apply Filter
          </button>

          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-1.5 rounded-lg glass-panel text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-cyan-400 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading municipal analytics engine...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Level Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Complaints</span>
              <p className="text-2xl font-black text-white">{total}</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Resolution Rate</span>
              <p className="text-2xl font-black text-emerald-300">{resolutionRate}%</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/10 space-y-1">
              <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">Avg Turnaround</span>
              <p className="text-2xl font-black text-cyan-300">{velocity.averageResolutionHours || 0} hrs</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/10 space-y-1">
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">Median Turnaround</span>
              <p className="text-2xl font-black text-indigo-300">{velocity.medianResolutionHours || 0} hrs</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-1">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Satisfaction Rating</span>
              <p className="text-2xl font-black text-amber-400 flex items-center space-x-1">
                <span>{satisfaction.averageRating || 0}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-1">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">Critical Unresolved</span>
              <p className="text-2xl font-black text-rose-400">{critical.criticalUnresolved || 0}</p>
            </div>
          </div>

          {/* Grid: Defect Distribution & Severity Ratios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Defect Distribution Bar Chart */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-tight">Road Defect Distribution</h2>
                <span className="text-xs text-slate-400 font-mono">By Issue Type</span>
              </div>

              <div className="space-y-4">
                {analytics?.issueTypeDistribution.length === 0 ? (
                  <p className="text-xs text-slate-500">No complaint data available for this period.</p>
                ) : (
                  analytics?.issueTypeDistribution.map((item) => {
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <div key={item._id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{item._id}</span>
                          <span className="font-mono text-cyan-400 font-bold">
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Severity Ratios & Reopen Metrics */}
            <div className="space-y-8">
              {/* Severity Ratios */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
                <h2 className="text-lg font-bold text-white tracking-tight">Severity Classification Ratios</h2>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.keys(analytics?.severityDistribution || {}).map((sev) => {
                    const data = analytics.severityDistribution[sev];
                    return (
                      <div key={sev} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(sev)}`}>
                          {sev}
                        </span>
                        <p className="text-2xl font-black text-white pt-1">{data.count}</p>
                        <span className="text-[10px] text-slate-400 font-mono block">{data.percentage}% of total</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reopen Request Metrics */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-amber-950/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Reopen Request & Cycle Analytics</span>
                  </h2>

                  <span className="text-xs font-bold text-slate-300">Reopen Rate: {reopen.reopenRate}%</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs text-center">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">Pending</span>
                    <p className="text-lg font-black text-amber-400">{reopen.pendingReopenRequests}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">Accepted</span>
                    <p className="text-lg font-black text-emerald-400">{reopen.acceptedReopenRequests}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 font-semibold block">Rejected</span>
                    <p className="text-lg font-black text-rose-400">{reopen.rejectedReopenRequests}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboardPage;
