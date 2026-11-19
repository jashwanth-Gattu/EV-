// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header.jsx';
import Shortcuts from './components/Shortcuts.jsx';
import SearchBar from './components/SearchBar.jsx';
import FilterBar from './components/FilterBar.jsx';
import MapView from './components/MapView.jsx';
import ChargerCard from './components/ChargerCard.jsx';
import ChargerDetail from './components/ChargerDetail.jsx';
import AttributionNotice from './components/AttributionNotice.jsx';
import {
  HYDERABAD_CENTER,
  HYDERABAD_SHORTCUTS,
  isWithinHyderabad,
  formatDistance
} from './utils/geo.js';
import {
  Map,
  List,
  AlertCircle,
  Loader2,
  Zap,
  Utensils,
  RefreshCw,
  Info
} from 'lucide-react';

export default function App() {
  // Location states
  const [userLocation, setUserLocation] = useState(null);
  const [searchCenter, setSearchCenter] = useState(HYDERABAD_CENTER);
  const [activeShortcutId, setActiveShortcutId] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationAlert, setLocationAlert] = useState(null);

  // Filter states
  const [distanceKm, setDistanceKm] = useState(5);
  const [minPowerKW, setMinPowerKW] = useState(0); // 0 = any, 7, 22, 50
  const [onlyWithFood, setOnlyWithFood] = useState(false);

  // Data states
  const [chargers, setChargers] = useState([]);
  const [loadingChargers, setLoadingChargers] = useState(true);
  const [chargerError, setChargerError] = useState(null);
  const [dataSource, setDataSource] = useState('');
  const [ocmConfigured, setOcmConfigured] = useState(false);

  // Selection & Detail states
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurantCounts, setRestaurantCounts] = useState({}); // chargerId -> count

  // UI view state
  const [mobileTab, setMobileTab] = useState('map'); // 'map' | 'list'
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Check health and OCM config on mount
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        setOcmConfigured(Boolean(data.ocmConfigured));
      })
      .catch(() => {});
  }, []);

  /**
   * Geolocation Handler
   */
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationAlert('Geolocation is not supported by your browser. Defaulting to Hyderabad.');
      return;
    }

    setIsLocating(true);
    setLocationAlert(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

        if (isWithinHyderabad(latitude, longitude)) {
          const userPos = { lat: latitude, lng: longitude, name: 'My Location' };
          setUserLocation(userPos);
          setSearchCenter(userPos);
          setActiveShortcutId(null);
          setLocationAlert(null);
        } else {
          // Outside Hyderabad
          setUserLocation({ lat: latitude, lng: longitude, name: 'Outside Hyderabad' });
          setSearchCenter(HYDERABAD_CENTER);
          setLocationAlert(
            `You are outside Hyderabad (${latitude.toFixed(2)}, ${longitude.toFixed(2)}). Centering map on Hyderabad.`
          );
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied or error:', err.message);
        setSearchCenter(HYDERABAD_CENTER);
        setLocationAlert('Location access was denied or unavailable. Showing Hyderabad (17.3850, 78.4867).');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Request location on first load
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  /**
   * Fetch Chargers near searchCenter & distanceKm
   */
  const fetchChargers = useCallback(async (center, dist) => {
    setLoadingChargers(true);
    setChargerError(null);

    try {
      const res = await fetch(`/api/chargers?lat=${center.lat}&lng=${center.lng}&distance=${dist}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setChargers(data.chargers || []);
      setDataSource(data.source || 'OpenStreetMap');
    } catch (err) {
      console.error('Failed to load chargers:', err);
      setChargerError('Unable to load charging stations. Please check connection and retry.');
    } finally {
      setLoadingChargers(false);
    }
  }, []);

  useEffect(() => {
    if (searchCenter?.lat && searchCenter?.lng) {
      fetchChargers(searchCenter, distanceKm);
    }
  }, [searchCenter, distanceKm, fetchChargers]);

  /**
   * Fetch Restaurants when a charger is selected
   */
  const fetchRestaurantsForCharger = useCallback(async (charger) => {
    if (!charger) return;
    setLoadingRestaurants(true);
    try {
      const res = await fetch(`/api/restaurants?lat=${charger.latitude}&lng=${charger.longitude}&radius=500`);
      if (res.ok) {
        const data = await res.json();
        const restaurants = data.restaurants || [];
        setNearbyRestaurants(restaurants);
        setRestaurantCounts(prev => ({
          ...prev,
          [charger.id]: restaurants.length
        }));
      }
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      setNearbyRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  }, []);

  const handleSelectCharger = (charger) => {
    setSelectedCharger(charger);
    setIsDetailOpen(true);
    fetchRestaurantsForCharger(charger);
  };

  const handleSelectShortcut = (shortcut) => {
    setActiveShortcutId(shortcut.id);
    setSearchCenter({ lat: shortcut.lat, lng: shortcut.lng, name: shortcut.name });
    setSelectedCharger(null);
    setIsDetailOpen(false);
  };

  const handleSelectSearchResult = (location) => {
    setActiveShortcutId(null);
    setSearchCenter(location);
    setSelectedCharger(null);
    setIsDetailOpen(false);
  };

  /**
   * Filter chargers based on power & food toggle
   */
  const filteredChargers = useMemo(() => {
    return chargers.filter(c => {
      // Min power filter
      if (minPowerKW > 0 && (c.maxPowerKW || 0) < minPowerKW) {
        return false;
      }
      // "Only chargers with restaurant nearby" filter
      if (onlyWithFood) {
        // If count has been loaded and is 0, filter out
        const count = restaurantCounts[c.id];
        if (count !== undefined && count === 0) return false;
      }
      return true;
    });
  }, [chargers, minPowerKW, onlyWithFood, restaurantCounts]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Header */}
      <Header
        onLocateUser={requestUserLocation}
        isLocating={isLocating}
        dataSource={dataSource}
        onOpenInfo={() => setIsInfoOpen(true)}
      />

      {/* 2. Top Controls Bar: Search, Shortcuts, Distance & Filters */}
      <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-2.5 space-y-2 z-20 backdrop-blur-md shadow-md">
        {/* Search Input */}
        <SearchBar
          onSelectLocation={handleSelectSearchResult}
          placeholder="Search Hyderabad (e.g. Madhapur, Jubilee Hills, Charminar...)"
        />

        {/* Quick Area Shortcuts */}
        <Shortcuts
          activeShortcutId={activeShortcutId}
          onSelectShortcut={handleSelectShortcut}
        />

        {/* Filter Controls (Radius Slider, Min Power, Food Toggle) */}
        <FilterBar
          distanceKm={distanceKm}
          onChangeDistance={setDistanceKm}
          minPowerKW={minPowerKW}
          onChangeMinPower={setMinPowerKW}
          onlyWithFood={onlyWithFood}
          onToggleOnlyWithFood={() => setOnlyWithFood(!onlyWithFood)}
          chargerCount={filteredChargers.length}
        />

        {/* Location alert / Outside Hyderabad toast */}
        {locationAlert && (
          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-3 py-2 rounded-xl flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{locationAlert}</span>
            </div>
            <button
              onClick={() => setLocationAlert(null)}
              className="text-amber-300 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Body: Responsive Split (Desktop side-by-side, Mobile Tabs/Drawer) */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Map View Pane */}
        <div className={`flex-1 h-full relative ${mobileTab === 'list' ? 'hidden sm:block' : 'block'}`}>
          <MapView
            chargers={filteredChargers}
            selectedCharger={selectedCharger}
            onSelectCharger={handleSelectCharger}
            userLocation={userLocation}
            searchCenter={searchCenter}
            nearbyRestaurants={nearbyRestaurants}
            onOpenRestaurantsList={() => setIsDetailOpen(true)}
          />

          {/* Quick Floating Status Pill */}
          <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-lg">
              {loadingChargers ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>Loading EV chargers...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>
                    <strong className="text-white">{filteredChargers.length}</strong> chargers near{' '}
                    <strong className="text-emerald-300">{searchCenter.name || 'Hyderabad'}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel (Desktop) or Tab Pane (Mobile) */}
        <div
          className={`w-full sm:w-[420px] md:w-[460px] lg:w-[490px] h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 shrink-0 ${
            mobileTab === 'map' ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* If a charger is selected and detail is open */}
          {isDetailOpen && selectedCharger ? (
            <ChargerDetail
              charger={selectedCharger}
              onClose={() => {
                setIsDetailOpen(false);
                setSelectedCharger(null);
                setNearbyRestaurants([]);
              }}
              restaurants={nearbyRestaurants}
              isLoadingRestaurants={loadingRestaurants}
              userLocation={userLocation}
            />
          ) : (
            /* Chargers List */
            <div className="flex flex-col h-full">
              {/* List Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Nearby EV Chargers</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {filteredChargers.length}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Sorted by proximity to {searchCenter.name || 'current center'}
                  </p>
                </div>

                <button
                  onClick={() => fetchChargers(searchCenter, distanceKm)}
                  disabled={loadingChargers}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition touch-manipulation"
                  title="Refresh charger list"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingChargers ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {loadingChargers && (
                  <div className="space-y-3 py-4">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-800 animate-pulse space-y-2.5">
                        <div className="flex justify-between">
                          <div className="h-4 bg-slate-700 rounded w-1/3" />
                          <div className="h-4 bg-slate-700 rounded w-1/4" />
                        </div>
                        <div className="h-5 bg-slate-700 rounded w-2/3" />
                        <div className="h-3 bg-slate-700 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                )}

                {chargerError && (
                  <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 text-center space-y-2 text-rose-300">
                    <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
                    <p className="text-xs font-semibold">{chargerError}</p>
                    <button
                      onClick={() => fetchChargers(searchCenter, distanceKm)}
                      className="bg-rose-900/60 hover:bg-rose-800 text-white text-xs px-3 py-1.5 rounded-xl transition"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!loadingChargers && !chargerError && filteredChargers.length === 0 && (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-200">
                      No EV Chargers Found
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      No chargers found within {distanceKm} km with the current power filter. Try increasing the distance slider or choosing another hotspot.
                    </p>
                    <button
                      onClick={() => {
                        setDistanceKm(15);
                        setMinPowerKW(0);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition"
                    >
                      Expand Search to 15km
                    </button>
                  </div>
                )}

                {!loadingChargers && filteredChargers.map(charger => (
                  <ChargerCard
                    key={charger.id}
                    charger={charger}
                    isSelected={selectedCharger?.id === charger.id}
                    onSelect={() => handleSelectCharger(charger)}
                    onExploreFood={() => {
                      handleSelectCharger(charger);
                    }}
                    userLocation={userLocation}
                  />
                ))}
              </div>

              {/* Bottom Community Disclaimer */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Charger data is community-sourced and may be outdated.</span>
                <button
                  onClick={() => setIsInfoOpen(true)}
                  className="text-emerald-400 hover:underline shrink-0 ml-2"
                >
                  Credits
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Mobile Bottom Tab Bar (Switch Map / List) */}
      <nav className="sm:hidden bg-slate-900/95 border-t border-slate-800 px-6 py-2 flex items-center justify-around z-30 backdrop-blur-md">
        <button
          onClick={() => {
            setMobileTab('map');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition touch-manipulation ${
            mobileTab === 'map'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[11px]">Map View</span>
        </button>

        <button
          onClick={() => {
            setMobileTab('list');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition touch-manipulation relative ${
            mobileTab === 'list'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <List className="w-5 h-5" />
            {filteredChargers.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {filteredChargers.length}
              </span>
            )}
          </div>
          <span className="text-[11px]">Chargers List</span>
        </button>
      </nav>

      {/* 5. Attribution & Info Modal */}
      <AttributionNotice
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        ocmConfigured={ocmConfigured}
        dataSource={dataSource}
      />
    </div>
  );
}
