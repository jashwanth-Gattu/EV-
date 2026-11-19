// src/components/SearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';

export default function SearchBar({ onSelectLocation, placeholder = "Search Hyderabad (e.g. Madhapur, Jubilee Hills...)" }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search geocode error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when tapping outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelectLocation({
      name: item.name,
      lat: item.lat,
      lng: item.lng,
      displayName: item.displayName
    });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/80 transition shadow-inner"
        />

        {isLoading && (
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-3" />
        )}

        {!isLoading && query && (
          <button
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 absolute right-2.5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl shadow-black/80 z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800">
          {results.map((item) => (
            <button
              key={item.placeId || `${item.lat}_${item.lng}`}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 active:bg-slate-700 flex items-start gap-2.5 transition touch-manipulation"
            >
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-100 truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {item.displayName}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
