import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { UserCheck, Shield, Camera, FileText, CheckCircle, Clock } from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* Header Banner */}
      <div className="editorial-panel p-8 border border-[#e5e5e0] bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="frame-box text-sm">F</div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="font-serif text-3xl font-bold tracking-[0.15em] uppercase text-neutral-900">
                  {user?.name}
                </h1>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5 border border-neutral-300 text-neutral-600 bg-[#f9f8f6]">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-light mt-1">
                {user?.email} • {user?.phone || 'No phone registered'}
              </p>
            </div>
          </div>

          <Link 
            id="link-new-report"
            to="/citizen/report"
            className="editorial-btn text-xs flex items-center space-x-2"
          >
            <Camera className="w-4 h-4 mr-1" />
            <span>NEW DAMAGE REPORT</span>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="editorial-card p-6 border border-[#e5e5e0]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">TOTAL REPORTS</span>
            <FileText className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="font-serif text-4xl font-bold text-neutral-900 tracking-wider">0</p>
          <p className="text-xs text-neutral-500 font-light mt-1">Filed civic road complaints</p>
        </div>

        <div className="editorial-card p-6 border border-[#e5e5e0]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">IN PROGRESS</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="font-serif text-4xl font-bold text-neutral-900 tracking-wider">0</p>
          <p className="text-xs text-neutral-500 font-light mt-1">Under municipal repair</p>
        </div>

        <div className="editorial-card p-6 border border-[#e5e5e0]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">RESOLVED</span>
            <CheckCircle className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="font-serif text-4xl font-bold text-neutral-900 tracking-wider">0</p>
          <p className="text-xs text-neutral-500 font-light mt-1">Verified road repairs</p>
        </div>
      </div>

      {/* Portal Status Panel */}
      <div className="editorial-panel p-8 text-center space-y-3 border border-[#e5e5e0]">
        <p className="font-script-accent text-2xl text-neutral-500">Infrastructure Intelligence</p>
        <h3 className="font-serif text-2xl font-bold tracking-[0.2em] uppercase text-neutral-900">
          CITIZEN REPORTING ENGINE ACTIVE
        </h3>
        <div className="line-divider max-w-xs mx-auto">❖</div>
        <p className="text-xs text-neutral-600 font-light max-w-xl mx-auto leading-relaxed">
          Submit road damage reports with high-resolution images, GPS metadata extraction, and real-time municipal status updates.
        </p>
      </div>
    </div>
  );
};

export default CitizenDashboard;
