// src/components/Header.jsx
import React from 'react';
import { Zap, Utensils, Navigation, Locate, Loader2, Info } from 'lucide-react';

export default function Header({
  onLocateUser,
  isLocating,
  dataSource,
  onOpenInfo
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* App Title & Branding */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Zap className="w-5 h-5 text-white fill-white" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-0.5 border border-slate-900">
              <Utensils className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg tracking-tight text-white flex items-center gap-1.5">
                Charge<span className="text-emerald-400">N</span>Eat
              </h1>
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Hyderabad
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              EV Chargers & Nearby Dining within 500m
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* GPS Locate Button */}
          <button
            onClick={onLocateUser}
            disabled={isLocating}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700/80 px-3 py-2 rounded-xl text-xs font-medium transition shadow-sm touch-manipulation"
            title="Locate my position in Hyderabad"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            ) : (
              <Locate className="w-4 h-4 text-emerald-400" />
            )}
            <span className="hidden xs:inline">
              {isLocating ? 'Locating...' : 'My Location'}
            </span>
          </button>

          {/* Info & Attribution modal button */}
          <button
            onClick={onOpenInfo}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700 touch-manipulation"
            title="About ChargeNEat Hyderabad & Free Data"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
