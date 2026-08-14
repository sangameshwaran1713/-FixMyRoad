import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, AlertCircle, Cpu, MapPin, Building2, CheckCircle2, ArrowRight, Server } from 'lucide-react';
import { checkHealth } from '../services/api';
import axios from 'axios';

const LandingPage = () => {
  const navigate = useNavigate();
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', message: '' });
  const [aiHealth, setAiHealth] = useState({ status: 'checking', message: '' });

  useEffect(() => {
    // Check Backend API Health
    checkHealth()
      .then((data) => {
        setBackendHealth({ status: 'online', message: data.message });
      })
      .catch((err) => {
        setBackendHealth({ status: 'offline', message: err.message || 'Server unavailable' });
      });

    // Check AI Microservice Health
    axios.get('http://localhost:8000/health')
      .then((res) => {
        setAiHealth({ status: 'online', message: res.data.message });
      })
      .catch(() => {
        setAiHealth({ status: 'offline', message: 'AI Service offline' });
      });
  }, []);

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Report. Detect. Route. Repair.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          FixMyRoad
        </h1>

        <p className="text-xl sm:text-2xl text-slate-300 font-light max-w-2xl mx-auto">
          AI-powered road damage reporting platform.
        </p>

        {/* Hero CTA Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            id="btn-report-issue"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group cursor-pointer"
            onClick={() => navigate('/citizen/report')}
          >
            <Camera className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            <span>Report an Issue</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            id="btn-track-complaint"
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel text-slate-200 hover:text-white font-semibold text-lg border border-slate-700/80 hover:border-slate-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            onClick={() => navigate('/citizen/complaints')}
          >
            <Search className="w-5 h-5" />
            <span>Track Complaint</span>
          </button>
        </div>
      </div>

      {/* Feature Architecture Workflow Preview */}
      <div className="mt-20">
        <h2 className="text-center text-xs font-bold tracking-widest text-cyan-400 uppercase mb-8">
          How FixMyRoad Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Upload Image</h3>
            <p className="text-sm text-slate-400">Citizens snap and upload photos of damaged roads directly from any mobile or desktop browser.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. AI Detection</h3>
            <p className="text-sm text-slate-400">Computer vision model instantly classifies damage severity, pothole density, and structural cracks.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. GPS Mapping</h3>
            <p className="text-sm text-slate-400">GPS metadata pinpoints exact coordinates and maps responsible municipal jurisdiction boundaries.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">4. Auto Routing</h3>
            <p className="text-sm text-slate-400">Complaints are created and routed directly to municipal officers for tracking and resolution.</p>
          </div>
        </div>
      </div>

      {/* System Status Diagnostic Panel for Phase 1 */}
      <div className="mt-16 glass-panel rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center mb-4">
          <Server className="w-4 h-4 mr-2 text-cyan-400" />
          Phase 1 Architecture Status Monitor
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Backend API status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="text-xs font-medium text-slate-400">Node.js Express Server</p>
              <p className="text-sm font-semibold text-white mt-0.5">GET /api/health</p>
              <p className="text-xs text-slate-500 mt-1">{backendHealth.message || 'Waiting...'}</p>
            </div>
            <div>
              {backendHealth.status === 'online' ? (
                <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Online
                </span>
              ) : backendHealth.status === 'checking' ? (
                <span className="text-xs text-slate-400">Checking...</span>
              ) : (
                <span className="flex items-center text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Offline
                </span>
              )}
            </div>
          </div>

          {/* AI Service status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="text-xs font-medium text-slate-400">Python FastAPI AI Service</p>
              <p className="text-sm font-semibold text-white mt-0.5">GET /health</p>
              <p className="text-xs text-slate-500 mt-1">{aiHealth.message || 'Waiting...'}</p>
            </div>
            <div>
              {aiHealth.status === 'online' ? (
                <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Online
                </span>
              ) : aiHealth.status === 'checking' ? (
                <span className="text-xs text-slate-400">Checking...</span>
              ) : (
                <span className="flex items-center text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
