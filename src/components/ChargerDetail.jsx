// src/components/ChargerDetail.jsx
import React, { useState } from 'react';
import {
  X,
  Zap,
  Utensils,
  Navigation,
  MapPin,
  Clock,
  ExternalLink,
  Coffee,
  Sandwich,
  Compass,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatDistance, estimateWalkTime, getFreeNavigationUrls } from '../utils/geo.js';

export default function ChargerDetail({
  charger,
  onClose,
  restaurants = [],
  isLoadingRestaurants = false,
  userLocation = null
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'restaurant' | 'cafe' | 'fast_food'

  if (!charger) return null;

  const power = charger.maxPowerKW || 22;
  const isFast = power >= 50;

  // Filter restaurants by amenity
  const filteredRestaurants = restaurants.filter(r => {
    if (filterType === 'all') return true;
    return r.amenity === filterType;
  });

  const chargerNav = getFreeNavigationUrls(
    charger.latitude,
    charger.longitude,
    charger.name,
    userLocation?.lat,
    userLocation?.lng
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl">
      {/* Drawer Grabber (Mobile) */}
      <div className="sm:hidden flex justify-center pt-2 pb-1 bg-slate-900">
        <div className="w-10 h-1 bg-slate-700 rounded-full" />
      </div>

      {/* Header */}
      <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex items-start justify-between gap-3 sticky top-0 z-10 backdrop-blur-md">
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                isFast
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
              }`}
            >
              <Zap className="w-3 h-3 fill-current" />
              {power} kW {isFast ? 'DC Fast' : 'AC'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded-md">
              {charger.access || 'Public'}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {formatDistance(charger.distanceKm)}
            </span>
          </div>

          <h2 className="text-base font-bold text-white leading-snug truncate">
            {charger.name}
          </h2>
          <p className="text-xs text-slate-400 truncate">
            {charger.operator} • {charger.address}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition touch-manipulation shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Charger Quick Actions & Connectors */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Connector Plugs:</span>
            <span className="text-slate-200 font-semibold">{charger.connections?.length || 1} available</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(charger.connections || []).map((conn, idx) => (
              <div
                key={idx}
                className="bg-slate-800/90 border border-slate-700/60 rounded-xl px-2.5 py-1 text-xs text-slate-200 flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>{conn.type}</span>
                <span className="font-bold text-emerald-400">{conn.powerKW}kW</span>
              </div>
            ))}
          </div>

          {/* Navigation to Charger */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={chargerNav.osmDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-md shadow-emerald-950/40"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route to Charger</span>
            </a>

            <a
              href={chargerNav.geoUri}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs py-2.5 px-3 rounded-xl transition"
            >
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Open in Geo App</span>
            </a>
          </div>
        </div>

        {/* Section: Food & Restaurants within 500m */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Utensils className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Restaurants Nearby
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    500m radius
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Walk & dine while your EV charges
                </p>
              </div>
            </div>

            {!isLoadingRestaurants && (
              <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-1 rounded-lg">
                {restaurants.length} places
              </span>
            )}
          </div>

          {/* Amenity Filter Tabs */}
          {restaurants.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'All Places' },
                { id: 'restaurant', label: 'Restaurants' },
                { id: 'cafe', label: 'Cafes & Tea' },
                { id: 'fast_food', label: 'Fast Food' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    filterType === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingRestaurants && (
            <div className="space-y-2.5 py-2">
              <div className="flex items-center justify-center gap-2 text-xs text-amber-400 py-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning OpenStreetMap for eateries within 500m...</span>
              </div>
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 animate-pulse space-y-2">
                  <div className="h-4 bg-slate-700/60 rounded w-2/3" />
                  <div className="h-3 bg-slate-700/40 rounded w-1/2" />
                  <div className="h-7 bg-slate-700/40 rounded w-1/3 mt-2" />
                </div>
              ))}
            </div>
          )}

          {/* No Restaurants Found */}
          {!isLoadingRestaurants && restaurants.length === 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-200">
                No restaurants mapped nearby.
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No dining places are currently recorded within 500 meters of this charger on OpenStreetMap.
              </p>
            </div>
          )}

          {/* Restaurants List */}
          {!isLoadingRestaurants && filteredRestaurants.length > 0 && (
            <div className="space-y-2.5">
              {filteredRestaurants.map((food) => {
                const nav = getFreeNavigationUrls(
                  food.latitude,
                  food.longitude,
                  food.name,
                  charger.latitude,
                  charger.longitude
                );

                const isCafe = food.amenity === 'cafe';
                const isFastFood = food.amenity === 'fast_food';

                return (
                  <div
                    key={food.id}
                    className="bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            isCafe
                              ? 'bg-amber-900/30 text-amber-300 border-amber-700/50'
                              : isFastFood
                              ? 'bg-orange-900/30 text-orange-300 border-orange-700/50'
                              : 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50'
                          }`}>
                            {food.amenity.replace('_', ' ')}
                          </span>

                          {food.isVegetarian && (
                            <span className="text-[10px] font-bold bg-green-950 text-green-400 border border-green-800/60 px-1.5 py-0.5 rounded">
                              Pure Veg
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-white truncate">
                          {food.name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {food.cuisine}
                        </p>
                      </div>

                      {/* Distance & walking time badge */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-amber-400">
                          {food.distanceMeters} m
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {estimateWalkTime(food.distanceMeters)}
                        </div>
                      </div>
                    </div>

                    {/* Restaurant Action Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-500 truncate max-w-[170px]">
                        {food.address || 'Around charger area'}
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={food.osmUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 transition"
                          title="View on OpenStreetMap"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>OSM</span>
                        </a>

                        <a
                          href={nav.osmDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition shadow-sm"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Navigate</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
