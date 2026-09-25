// frontend/src/components/common/Header.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Train,
  Menu,
  Mic,
  Moon,
  Sun,
  MapPin,
  Bus,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';
import { SideDrawer } from './SideDrawer.js';
import { VoiceSearchModal } from './VoiceSearchModal.js';
import { LanguageSelector } from './LanguageSelector.js';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState(() => {
    return localStorage.getItem('wimt_selected_city') || 'Mumbai';
  });

  const activeMode = searchParams.get('mode') || 'express';

  const handleModeChange = (mode: string) => {
    if (location.pathname === '/') {
      setSearchParams({ mode });
    } else {
      navigate(`/?mode=${mode}`);
    }
  };

  const handleCityChange = (city: string) => {
    setCurrentCity(city);
    localStorage.setItem('wimt_selected_city', city);
  };

  const modes = [
    { id: 'express', label: 'EXPRESS', icon: Train },
    { id: 'locals', label: 'LOCALS', icon: Train },
    { id: 'metro', label: 'METRO', icon: Train },
    { id: 'bus', label: 'BUS', icon: Bus },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0A58CA] dark:bg-slate-900 text-white shadow-md transition-colors duration-200">
        {/* Main Top Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Hamburger & Brand */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 -ml-1 text-white hover:bg-white/10 rounded-xl transition active:scale-95"
                aria-label="Open navigation drawer"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white text-[#0A58CA] flex items-center justify-center shadow-md font-black">
                  <Train className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="font-black text-base sm:text-lg tracking-tight leading-none text-white">
                    WHERE IS MY TRAIN
                  </div>
                  <div className="text-[10px] text-blue-100 dark:text-blue-300 font-semibold tracking-wider uppercase mt-0.5">
                    Live Indian Railways & Transit
                  </div>
                </div>
              </Link>
            </div>

            {/* Right: Actions (Voice, City, Theme, Language) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* City Pill */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-700/60 dark:bg-slate-800 text-blue-100 hover:text-white text-xs font-semibold border border-blue-400/30 dark:border-slate-700 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentCity}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Voice Search Button */}
              <button
                onClick={() => setVoiceOpen(true)}
                className="p-2 text-white hover:bg-white/10 rounded-xl transition active:scale-95"
                title="Voice Search"
                aria-label="Voice search"
              >
                <Mic className="w-5 h-5 text-amber-300 animate-pulse" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-white hover:bg-white/10 rounded-xl transition active:scale-95"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-300" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-100" />
                )}
              </button>

              {/* Language Selector */}
              <div className="hidden md:block">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Transport Mode Tabs (Express, Locals, Metro, Bus) */}
        <div className="bg-[#0848a6] dark:bg-slate-950 border-t border-blue-400/20 dark:border-slate-800 px-2 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-around sm:justify-start sm:gap-4 overflow-x-auto no-scrollbar">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = activeMode.toLowerCase() === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`flex items-center gap-1.5 py-2.5 px-3 sm:px-4 text-xs font-black tracking-wider uppercase transition-all border-b-2 whitespace-nowrap ${
                    isSelected
                      ? 'border-amber-300 text-amber-300 bg-white/5'
                      : 'border-transparent text-blue-100/80 dark:text-slate-400 hover:text-white hover:border-blue-300/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}

            {/* Master Routes Link */}
            <Link
              to="/routes"
              className="ml-auto hidden sm:flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-700/60 dark:bg-slate-800 text-amber-300 hover:text-white text-xs font-bold border border-amber-400/40 transition"
              title="Indian Railways Master Routes & Corridors"
            >
              <span>Corridor Routes</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hamburger Drawer Modal */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentCity={currentCity}
        onCityChange={handleCityChange}
      />

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onVoiceResult={(query) => {
          navigate(`/search?q=${encodeURIComponent(query)}`);
        }}
      />
    </>
  );
};
