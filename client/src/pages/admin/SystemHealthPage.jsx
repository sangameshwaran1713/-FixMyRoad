import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Database, Cpu, HardDrive, RefreshCw, Loader2, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getSystemHealthApi } from '../../services/systemHealthService';

const SystemHealthPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getSystemHealthApi();
      if (res.success && res.data) {
        setHealthData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to inspect system health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'ONLINE':
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

  const services = healthData?.services || {};

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 bg-purple-950/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Super Admin Command Center</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-7 h-7 text-purple-400" />
            <span>Microservices System Health Inspector</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ping latencies and operational status monitoring
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="p-3 rounded-xl glass-panel text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer self-start md:self-auto"
          title="Refresh Health Status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-purple-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Inspecting microservice status & ping latencies...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall System Status Indicator */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Overall System Operational Status</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${getStatusBadge(healthData?.systemStatus)}`}>
              {healthData?.systemStatus}
            </span>
          </div>

          {/* Microservices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. MongoDB Database */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <Database className="w-5 h-5" />
                  <span>MongoDB Database</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(services.database?.status)}`}>
                  {services.database?.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <p className="text-slate-300">Driver Connection: <span className="font-semibold text-white">Active</span></p>
                <p className="text-slate-400">Database Ping: <span className="font-mono text-cyan-400">{services.database?.ping || 'OK'}</span></p>
              </div>
            </div>

            {/* 2. FastAPI YOLO AI Microservice */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                  <Cpu className="w-5 h-5" />
                  <span>FastAPI YOLO AI Microservice</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(services.aiService?.status)}`}>
                  {services.aiService?.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <p className="text-slate-300">Service Latency: <span className="font-mono text-purple-300">{services.aiService?.latencyMs || 'N/A'} ms</span></p>
                <p className="text-slate-400">Model Framework: <span className="font-semibold text-white">Ultralytics YOLOv8</span></p>
              </div>
            </div>

            {/* 3. Cloudinary Storage */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                  <HardDrive className="w-5 h-5" />
                  <span>Cloudinary Image Storage</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(services.storage?.status)}`}>
                  {services.storage?.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <p className="text-slate-300">Cloud Name: <span className="font-semibold text-white">{services.storage?.cloudName}</span></p>
                <p className="text-slate-400">Secure Protocol: <span className="font-semibold text-emerald-400">HTTPS CDN</span></p>
              </div>
            </div>

            {/* 4. Background Outbox Worker */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <Activity className="w-5 h-5" />
                  <span>Outbox Polling Worker</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(services.outboxProcessor?.status)}`}>
                  {services.outboxProcessor?.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <p className="text-slate-300">Poll Frequency: <span className="font-mono text-amber-400">10,000 ms</span></p>
                <p className="text-slate-400">Delivery Mode: <span className="font-semibold text-white">{services.outboxProcessor?.mode}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthPage;
