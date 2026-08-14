import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { UserCheck, Shield, Camera, FileText, CheckCircle, Clock } from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{user?.email} • {user?.phone || 'No phone provided'}</p>
            </div>
          </div>

          <Link 
            id="link-new-report"
            to="/citizen/report"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm transition-all flex items-center space-x-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]"
          >
            <Camera className="w-4 h-4" />
            <span>New Damage Report</span>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">0</p>
          <p className="text-xs text-slate-500 mt-1">Road damage reports filed</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">0</p>
          <p className="text-xs text-slate-500 mt-1">Pending municipal repair</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">0</p>
          <p className="text-xs text-slate-500 mt-1">Successfully repaired roads</p>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 text-center">
        <Shield className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Citizen Portal — Phase 4 Image Upload Active</h3>
        <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
          Click <strong className="text-white">"New Damage Report"</strong> to upload road damage photos using the Multer + Sharp + Cloudinary pipeline. AI classification and GPS mapping will be integrated in upcoming phases.
        </p>
      </div>
    </div>
  );
};

export default CitizenDashboard;
