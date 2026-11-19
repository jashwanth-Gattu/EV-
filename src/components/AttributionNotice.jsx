// src/components/AttributionNotice.jsx
import React from 'react';
import { X, ShieldCheck, Heart, ExternalLink, Zap, Info } from 'lucide-react';

export default function AttributionNotice({ isOpen, onClose, ocmConfigured, dataSource }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">About ChargeNEat Hyderabad</h3>
              <p className="text-xs text-slate-400">100% Free & Open-Source Powered</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Required Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-amber-300 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Important Community Notice:</strong>
            Charger data is community-sourced and may be outdated. Always verify availability before traveling to a charging station.
          </div>
        </div>

        {/* Zero-Paid-API Guarantee */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Free APIs & Services Used:
          </h4>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-2">
              <div>
                <strong className="text-slate-100 block">OpenStreetMap (OSM) & Leaflet</strong>
                <p className="text-slate-400 text-[11px]">
                  Map tiles, routing directions, and Overpass API for restaurants & chargers.
                </p>
              </div>
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 shrink-0 text-[11px]"
              >
                ODbL <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-2">
              <div>
                <strong className="text-slate-100 block">Open Charge Map (OCM)</strong>
                <p className="text-slate-400 text-[11px]">
                  Global registry of electric vehicle charging locations.
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    ocmConfigured
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {ocmConfigured ? '✓ Free API Key Active' : 'Overpass Fallback Active'}
                  </span>
                </div>
              </div>
              <a
                href="https://openchargemap.org/site/develop/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 shrink-0 text-[11px]"
              >
                Sign Up <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-2">
              <div>
                <strong className="text-slate-100 block">Nominatim (OSM Geocoding)</strong>
                <p className="text-slate-400 text-[11px]">
                  Free geocoding search strictly bounded to the Hyderabad metropolitan region.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Rate-limited & Cached
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Active Source: <strong className="text-emerald-400">{dataSource || 'OpenStreetMap'}</strong></span>
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
