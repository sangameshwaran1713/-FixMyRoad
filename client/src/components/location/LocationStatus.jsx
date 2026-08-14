import React from 'react';
import { MapPin, Navigation, AlertTriangle, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const LocationStatus = ({ status, accuracy, source, errorMessage }) => {
  if (status === 'detecting') {
    return (
      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>Detecting your GPS location with high accuracy...</span>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
        <div className="flex items-center space-x-2 font-semibold text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Location Permission Denied</span>
        </div>
        <p className="text-slate-300">
          Location permission was denied by your browser. Please enable location permissions or select your road issue position manually on the map below.
        </p>
      </div>
    );
  }

  if (status === 'unavailable' || status === 'timeout' || status === 'error') {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
        <div className="flex items-center space-x-2 font-semibold text-rose-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{status === 'timeout' ? 'GPS Request Timed Out' : 'Unable to Determine Location'}</span>
        </div>
        <p className="text-slate-300">{errorMessage || 'Could not fetch GPS location. Please pick location on the map.'}</p>
      </div>
    );
  }

  if (status === 'success') {
    const isLowAccuracy = accuracy && accuracy > 100;

    return (
      <div className="space-y-2">
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-white">Location Detected via {source === 'GPS' ? 'Browser GPS' : 'Map Pin'}</span>
          </div>
          {accuracy && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Accuracy: ~{Math.round(accuracy)}m
            </span>
          )}
        </div>

        {isLowAccuracy && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Your GPS accuracy is low (~{Math.round(accuracy)}m). Please verify or adjust the marker on the map below.</span>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default LocationStatus;
