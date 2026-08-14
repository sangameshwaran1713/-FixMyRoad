import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  ShieldAlert,
  Server,
  BarChart,
} from 'lucide-react';
import { getOperationalMetricsApi } from '../../services/operationsService';

const OperationsDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refreshIntervalRef = useRef(null);

  const fetchMetrics = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError('');

      const res = await getOperationalMetricsApi();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to inspect operational metrics.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(true);

    // Set 30 seconds auto-refresh interval
    refreshIntervalRef.current = setInterval(() => {
      fetchMetrics(false);
    }, 30000);

    // Cleanup interval timer on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'ONLINE':
      case 'READY':
      case 'CONFIGURED':
      case 'RUNNING':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DEGRADED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OFFLINE':
      case 'UNCONFIGURED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-purple-400 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading operations cockpit...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const health = data?.health || {};
  const config = data?.config || {};

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 bg-purple-950/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Super Admin Portal</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-7 h-7 text-purple-400" />
            <span>Operations & Observability Cockpit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tenant traffic logs, request durations, and microservice connectivity
          </p>
        </div>

        <button
          onClick={() => fetchMetrics(true)}
          className="p-3 rounded-xl glass-panel text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-xs font-bold">Refresh Now</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Uptime / Traffic metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total HTTP Requests</span>
          <p className="text-2xl font-black text-white">{metrics.totalRequests || 0}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Uptime</span>
          <p className="text-2xl font-black text-white">{metrics.uptimeSeconds || 0}s</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-1">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">Error Rate</span>
          <p className="text-2xl font-black text-rose-300">{metrics.errorRatePercent || 0}%</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/10 space-y-1">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">Avg Response Time</span>
          <p className="text-2xl font-black text-cyan-300">{metrics.averageResponseTimeMs || 0} ms</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Slow Requests (&gt;1s)</span>
          <p className="text-2xl font-black text-amber-300">{metrics.slowRequestsCount || 0}</p>
        </div>
      </div>

      {/* Grid: Dependencies status & Top Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dependency Microservices Health Status */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <Server className="w-5 h-5 text-purple-400" />
            <span>Dependency Status</span>
          </h2>

          <div className="space-y-4">
            {(health.services || []).map((srv) => (
              <div key={srv.service} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-200 block">{srv.service}</span>
                  {srv.latencyMs !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">Ping: {srv.latencyMs}ms</span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(srv.status)}`}>
                  {srv.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Endpoints & Performance Audit */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <BarChart className="w-5 h-5 text-purple-400" />
            <span>Top API Endpoints Performance</span>
          </h2>

          {metrics.topEndpoints?.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No HTTP requests logged in this session yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Endpoint Route</th>
                    <th className="py-2.5 px-3">Request Count</th>
                    <th className="py-2.5 px-3">Error Count</th>
                    <th className="py-2.5 px-3 text-right">Avg Response Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {metrics.topEndpoints?.map((ep) => (
                    <tr key={ep.endpoint} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-200">{ep.endpoint}</td>
                      <td className="py-2 px-3 font-mono text-cyan-400">{ep.requestCount}</td>
                      <td className="py-2 px-3 font-mono text-rose-400">{ep.errorCount}</td>
                      <td className="py-2 px-3 font-mono text-right text-emerald-400">{ep.avgDurationMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboardPage;
