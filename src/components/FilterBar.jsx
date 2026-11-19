// src/components/FilterBar.jsx
import React, { useState } from 'react';
import { SlidersHorizontal, Zap, Utensils, ChevronDown, Check } from 'lucide-react';

export default function FilterBar({
  distanceKm,
  onChangeDistance,
  minPowerKW,
  onChangeMinPower,
  onlyWithFood,
  onToggleOnlyWithFood,
  chargerCount = 0
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const powerOptions = [
    { value: 0, label: 'Any Power' },
    { value: 7, label: '7 kW+ (Standard)' },
    { value: 22, label: '22 kW+ (Fast AC)' },
    { value: 50, label: '50 kW+ (Rapid DC)' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg backdrop-blur-md">
      {/* Top summary row / Mobile bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Radius Pill */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/60 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 shrink-0">
            <span className="text-emerald-400 font-bold">{distanceKm} km</span>
            <span className="text-slate-400">radius</span>
          </div>

          {/* Min Power Dropdown */}
          <div className="relative shrink-0">
            <select
              value={minPowerKW}
              onChange={(e) => onChangeMinPower(Number(e.target.value))}
              className="bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-medium pl-2.5 pr-7 py-1.5 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {powerOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick toggle for Food */}
          <button
            onClick={onToggleOnlyWithFood}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 border ${
              onlyWithFood
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950'
                : 'bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 border-slate-700/60'
            }`}
          >
            <Utensils className={`w-3.5 h-3.5 ${onlyWithFood ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Food nearby</span>
            {onlyWithFood && <Check className="w-3 h-3 text-amber-400 ml-0.5" />}
          </button>
        </div>

        {/* Expand / Adjust Slider Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-xl border transition text-xs font-medium shrink-0 ${
            isExpanded
              ? 'bg-slate-700 text-white border-slate-600'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
          }`}
          title="Adjust distance slider"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Slider Controls */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Search Distance:</span>
              <span className="text-emerald-400 font-bold">{distanceKm} km (up to 30 km)</span>
            </div>

            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={distanceKm}
              onChange={(e) => onChangeDistance(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />

            {/* Quick Distance Presets */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {[3, 5, 10, 15, 20, 30].map(val => (
                <button
                  key={val}
                  onClick={() => onChangeDistance(val)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                    distanceKm === val
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {val}km
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-xl">
            <span>Showing <strong className="text-emerald-400">{chargerCount}</strong> chargers in this range</span>
            <span>Restaurants checked within <strong>500m</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
