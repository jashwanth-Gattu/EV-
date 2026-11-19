// src/components/Shortcuts.jsx
import React from 'react';
import { HYDERABAD_SHORTCUTS } from '../utils/geo.js';
import { MapPin } from 'lucide-react';

export default function Shortcuts({ activeShortcutId, onSelectShortcut }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 min-w-max px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-500" />
          Hotspots:
        </span>
        {HYDERABAD_SHORTCUTS.map(sc => {
          const isActive = activeShortcutId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectShortcut(sc)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap touch-manipulation flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-950'
                  : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
            >
              <span>{sc.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
