// src/components/MapView.jsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { formatDistance, getFreeNavigationUrls } from '../utils/geo.js';
import { Layers, MapPin, Navigation, Zap } from 'lucide-react';

export default function MapView({
  chargers = [],
  selectedCharger = null,
  onSelectCharger,
  userLocation = null,
  searchCenter = null,
  nearbyRestaurants = [],
  onOpenRestaurantsList
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const foodMarkersLayerRef = useRef(null);
  const circleLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [mapStyle, setMapStyle] = useState('standard'); // 'standard' | 'dark'

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = searchCenter?.lat || 17.3850;
    const initialLng = searchCenter?.lng || 78.4867;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: true
    });

    // Custom zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Marker layers
    markersLayerRef.current = L.layerGroup().addTo(map);
    foodMarkersLayerRef.current = L.layerGroup().addTo(map);
    circleLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle tile layer changes (Pure OpenStreetMap tiles with optional dark CSS filter)
  const tileLayerRef = useRef(null);
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: mapStyle === 'dark' ? 'dark-osm-tiles' : ''
    }).addTo(map);
  }, [mapStyle]);

  // Handle User Location Radar Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 radar-pulse"></div>
            <div class="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map);

      userMarkerRef.current.bindPopup(`
        <div class="p-2 text-xs font-semibold text-slate-100">
          📍 You are here
        </div>
      `);
    }
  }, [userLocation]);

  // Center map when searchCenter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !searchCenter) return;

    map.flyTo([searchCenter.lat, searchCenter.lng], 13, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  }, [searchCenter]);

  // Update EV Charger Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    chargers.forEach(charger => {
      const isSelected = selectedCharger?.id === charger.id;
      const power = charger.maxPowerKW || 22;

      // Color coding based on power
      let pinColor = '#10b981'; // >= 50kW DC Fast (Emerald)
      let powerTag = `${power} kW`;
      if (power < 15) {
        pinColor = '#f59e0b'; // Standard 3.3 - 11 kW (Amber)
      } else if (power < 50) {
        pinColor = '#0ea5e9'; // Fast AC 22 kW (Sky)
      }

      const iconHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          ${isSelected ? '<div class="absolute -inset-1 rounded-full active-pin"></div>' : ''}
          <div style="background-color: ${pinColor};" class="w-8 h-8 rounded-full border-2 border-slate-900 shadow-xl flex items-center justify-center text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <div class="mt-0.5 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-[10px] font-bold text-white border border-slate-700 shadow-md whitespace-nowrap">
            ${powerTag}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-ev-pin',
        html: iconHtml,
        iconSize: [40, 48],
        iconAnchor: [20, 24],
        popupAnchor: [0, -26]
      });

      const marker = L.marker([charger.latitude, charger.longitude], {
        icon,
        zIndexOffset: isSelected ? 900 : Math.round(power)
      });

      // Marker Popup Content
      const connectorsText = (charger.connections || [])
        .map(c => `${c.type} (${c.powerKW}kW)`)
        .slice(0, 2)
        .join(', ') || 'Standard EV Plugs';

      const navUrls = getFreeNavigationUrls(
        charger.latitude,
        charger.longitude,
        charger.name,
        userLocation?.lat,
        userLocation?.lng
      );

      const popupHtml = `
        <div class="p-3.5 max-w-[260px] text-slate-100">
          <div class="flex items-start justify-between gap-1 mb-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              ${charger.maxPowerKW} kW • ${charger.access || 'Public'}
            </span>
            <span class="text-[11px] font-medium text-slate-400">
              ${formatDistance(charger.distanceKm)}
            </span>
          </div>

          <h3 class="font-bold text-sm text-white mb-0.5 leading-snug">
            ${charger.name}
          </h3>
          <p class="text-xs text-slate-400 mb-2">
            ${charger.operator}
          </p>

          <div class="text-[11px] text-slate-300 bg-slate-800/80 p-2 rounded-lg mb-3 border border-slate-700/60">
            <div class="font-medium text-slate-400 text-[10px] uppercase mb-0.5">Connectors:</div>
            ${connectorsText}
          </div>

          <div class="grid grid-cols-2 gap-1.5">
            <button
              id="popup-btn-food-${charger.id.replace(/[^a-zA-Z0-9]/g, '_')}"
              class="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs py-2 px-2.5 rounded-xl transition text-center shadow-sm"
            >
              🍽️ Food (500m)
            </button>
            <a
              href="${navUrls.osmDirectionsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-2 px-2.5 rounded-xl transition text-center border border-slate-700 flex items-center justify-center gap-1"
            >
              🧭 Navigate
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Handle marker click: select charger and pan
      marker.on('click', () => {
        onSelectCharger(charger);
      });

      marker.on('popupopen', () => {
        const btnId = `popup-btn-food-${charger.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.onclick = () => {
            onSelectCharger(charger);
            if (onOpenRestaurantsList) onOpenRestaurantsList();
          };
        }
      });

      layer.addLayer(marker);
    });
  }, [chargers, selectedCharger, userLocation]);

  // Update 500m radius circle around active charger
  useEffect(() => {
    const map = mapInstanceRef.current;
    const circleLayer = circleLayerRef.current;
    if (!map || !circleLayer) return;

    circleLayer.clearLayers();

    if (selectedCharger) {
      const circle = L.circle([selectedCharger.latitude, selectedCharger.longitude], {
        radius: 500, // 500 meters
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '5, 5'
      });
      circleLayer.addLayer(circle);

      // Smooth pan to active charger
      map.panTo([selectedCharger.latitude, selectedCharger.longitude], { animate: true });
    }
  }, [selectedCharger]);

  // Update Restaurant Markers within 500m on the map
  useEffect(() => {
    const layer = foodMarkersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (!selectedCharger || !nearbyRestaurants || nearbyRestaurants.length === 0) return;

    nearbyRestaurants.forEach(food => {
      const isCafe = food.amenity === 'cafe';
      const isFastFood = food.amenity === 'fast_food';
      const emoji = isCafe ? '☕' : isFastFood ? '🍔' : '🍽️';

      const foodIcon = L.divIcon({
        className: 'custom-food-pin',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 border border-slate-900 shadow-md text-xs hover:scale-125 transition-transform cursor-pointer">
            <span>${emoji}</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const navUrls = getFreeNavigationUrls(
        food.latitude,
        food.longitude,
        food.name,
        userLocation?.lat || selectedCharger.latitude,
        userLocation?.lng || selectedCharger.longitude
      );

      const marker = L.marker([food.latitude, food.longitude], {
        icon: foodIcon,
        zIndexOffset: 500
      });

      marker.bindPopup(`
        <div class="p-2.5 max-w-[200px] text-slate-100">
          <div class="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
            ${food.amenity.replace('_', ' ')} • ${food.distanceMeters}m
          </div>
          <h4 class="font-bold text-xs text-white mb-1 leading-snug">
            ${food.name}
          </h4>
          <p class="text-[11px] text-slate-300 mb-2">
            ${food.cuisine}
          </p>
          <a
            href="${navUrls.osmDirectionsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="block w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] py-1.5 px-2 rounded-lg text-center transition"
          >
            🧭 Directions (OSM)
          </a>
        </div>
      `);

      layer.addLayer(marker);
    });
  }, [nearbyRestaurants, selectedCharger, userLocation]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Style Toggle (Dark / Standard OSM) */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          onClick={() => setMapStyle(mapStyle === 'dark' ? 'standard' : 'dark')}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-medium shadow-lg backdrop-blur-md transition touch-manipulation"
          title="Toggle Map Style (Free OpenStreetMap / Carto Dark)"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="capitalize">{mapStyle} Map</span>
        </button>
      </div>

      {/* Active Selection Radius Badge */}
      {selectedCharger && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-slate-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span>Showing restaurants in <strong>500m</strong> circle</span>
        </div>
      )}
    </div>
  );
}
