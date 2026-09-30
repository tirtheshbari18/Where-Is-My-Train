import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { stationService } from '../../services/stationService.js';
import { StationLocation } from '../../api/railwayApi.js';
import { useRequestGuard } from '../../hooks/useRequestGuard.js';
import { extractStationCode } from '../../utils/stationResolver.js';

interface StationAutocompleteProps {
  value: string; // Station code or name
  placeholder?: string;
  label?: string;
  onChange: (code: string, station?: StationLocation) => void;
  className?: string;
}

export const StationAutocomplete: React.FC<StationAutocompleteProps> = ({
  value,
  placeholder = 'Station name or code (e.g. Boisar or BOR)...',
  label,
  onChange,
  className = '',
}) => {
  const [inputText, setInputText] = useState(value);
  const [suggestions, setSuggestions] = useState<StationLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced + versioned station search: only the latest keystroke updates the list.
  const searchGuard = useRequestGuard();
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
    const cleanCode = extractStationCode(value);
    stationService
      .getStation(cleanCode)
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

    // Notify parent immediately with resolved code
    const extracted = extractStationCode(text);
    if (extracted) {
      onChange(extracted);
    }

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
      }, 150);
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
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        const extracted = extractStationCode(inputText);
        if (extracted) onChange(extracted);
      }
      return;
    }

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
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else {
        const extracted = extractStationCode(inputText);
        if (extracted) onChange(extracted);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSuggestions([]);
    setIsOpen(false);
    onChange('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin className="w-4 h-4 text-blue-500 absolute left-3.5 top-3.5 pointer-events-none" />
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
                .catch(() => {});
            } else {
              setSuggestions(stationService.getPopularStations().slice(0, 8));
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition shadow-sm"
        />
        {inputText && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800">
          {suggestions.map((stn, idx) => {
            const isHighlighted = idx === highlightIndex;
            return (
              <button
                key={stn.code}
                type="button"
                onClick={() => handleSelect(stn)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs transition ${
                  isHighlighted
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-white'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {stn.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{stn.code}</span>
                      {stn.state && <span>&bull; {stn.state}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs">
                    {stn.code}
                  </span>
                  {stn.numberOfPlatforms ? (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {stn.numberOfPlatforms} Platforms
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
