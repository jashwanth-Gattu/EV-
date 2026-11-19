// src/components/ChargerCard.jsx
import React from 'react';
import { Zap, Navigation, Utensils, MapPin, ChevronRight, Check } from 'lucide-react';
import { formatDistance, getFreeNavigationUrls } from '../utils/geo.js';

export default function ChargerCard({
  charger,
  isSelected,
  onSelect,
  onExploreFood,
  userLocation
}) {
  const power = charger.maxPowerKW || 22;
  const isFast = power >= 50;
  const isMid = power >= 22 && power < 50;

  const navUrls = getFreeNavigationUrls(
    charger.latitude,
    charger.longitude,
    charger.name,
    userLocation?.lat,
    userLocation?.lng
  );

  return (
    <div
      onClick={onSelect}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer touch-manipulation relative ${
        isSelected
          ? 'bg-slate-800/95 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
          : 'bg-slate-900/85 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header: Power Badge & Distance */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
              isFast
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : isMid
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}
          >
            <Zap className="w-3 h-3 fill-current" />
            {power} kW {isFast ? 'DC Fast' : 'AC'}
          </span>

          <span className="text-[10px] text-slate-400 font-medium bg-slate-800 px-1.5 py-0.5 rounded">
            {charger.access || 'Public'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>{formatDistance(charger.distanceKm)}</span>
        </div>
      </div>

      {/* Charger Name & Operator */}
      <h3 className="text-sm font-bold text-white leading-snug line-clamp-1 mb-0.5">
        {charger.name}
      </h3>
      <p className="text-xs text-slate-400 line-clamp-1 mb-2">
        {charger.operator}
      </p>

      {/* Connectors tag list */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {(charger.connections || []).slice(0, 3).map((conn, idx) => (
          <span
            key={idx}
            className="text-[10px] text-slate-300 bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 rounded-md"
          >
            {conn.type}
          </span>
        ))}
        {charger.connections?.length > 3 && (
          <span className="text-[10px] text-slate-400 px-1">
            +{charger.connections.length - 3} more
          </span>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExploreFood(charger);
          }}
          className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition shadow-sm"
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Nearby Food</span>
        </button>

        <a
          href={navUrls.osmDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 font-medium text-xs py-2 px-3 rounded-xl transition"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Navigate</span>
        </a>
      </div>
    </div>
  );
}
