import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { stationService } from '../../services/stationService.js';
import { StationLocation } from '../../api/railwayApi.js';
import { useRequestGuard } from '../../hooks/useRequestGuard.js';

interface StationAutocompleteProps {
  value: string; // Station code
  placeholder?: string;
  label?: string;
  onChange: (code: string, station?: StationLocation) => void;
  className?: string;
}

export const StationAutocomplete: React.FC<StationAutocompleteProps> = ({
  value,
  placeholder = 'Station name or code...',
  label,
  onChange,
  className = '',
}) => {
  const [inputText, setInputText] = useState(value);
  const [suggestions, setSuggestions] = useState<StationLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced + versioned station search: only the latest keystroke may update the list.
  const searchGuard = useRequestGuard();
  // Separate guard for external `value` -> input text synchronisation.
  const syncGuard = useRequestGuard();
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      searchGuard.invalidate();
      syncGuard.invalidate();
    };
  }, []);

  // Sync internal input when external value prop changes
  useEffect(() => {
    if (!value) {
      setInputText('');
      return;
    }
    const requestId = syncGuard.next();
    stationService
      .getStation(value)
      .then((stn) => {
        if (!syncGuard.isCurrent(requestId)) return;
        setInputText(stn ? `${stn.name} (${stn.code})` : value);
      })
      .catch(() => {
        if (syncGuard.isCurrent(requestId)) setInputText(value);
      });
  }, [value]);

  // Handle typing and fetch suggestions (debounced, race-safe)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    setHighlightIndex(-1);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (text.trim().length >= 1) {
      debounceRef.current = window.setTimeout(async () => {
        const requestId = searchGuard.next();
        try {
          const results = await stationService.searchStations(text);
          if (!searchGuard.isCurrent(requestId)) return;
          setSuggestions(results.slice(0, 8));
          setIsOpen(true);
        } catch {
          if (!searchGuard.isCurrent(requestId)) return;
          setSuggestions([]);
        }
      }, 200);
    } else {
      searchGuard.invalidate();
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stn: StationLocation) => {
    setInputText(`${stn.name} (${stn.code})`);
    onChange(stn.code, stn);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        handleSelect(suggestions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin className="w-4 h-4 text-blue-400 absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputText.trim()) {
              const requestId = searchGuard.next();
              stationService
                .searchStations(inputText)
                .then((res) => {
                  if (!searchGuard.isCurrent(requestId)) return;
                  setSuggestions(res.slice(0, 8));
                  setIsOpen(true);
                })
                .catch(() => {
                  /* keep current suggestions on failure */
                });
            } else {
              setSuggestions(stationService.getPopularStations().slice(0, 8));
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition"
        />
        {inputText && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto py-1 divide-y divide-slate-800">
          {suggestions.map((stn, idx) => {
            const isHighlighted = idx === highlightIndex;
            return (
              <button
                key={stn.code}
                type="button"
                onClick={() => handleSelect(stn)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition ${
                  isHighlighted ? 'bg-blue-600/20 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-white text-sm">
                    {stn.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {stn.state ? `${stn.state} &bull; ` : ''}
                    {stn.zone ? `Zone: ${stn.zone}` : 'Zone: Not available'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-xs">
                    {stn.code}
                  </span>
                  {stn.numberOfPlatforms && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {stn.numberOfPlatforms} PFs
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
