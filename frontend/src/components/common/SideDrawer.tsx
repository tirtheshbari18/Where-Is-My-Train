import React, { useState } from 'react';
import {
  X,
  Train,
  RefreshCw,
  Globe,
  MapPin,
  Moon,
  Sun,
  Trash2,
  Settings,
  Share2,
  Star,
  AlertTriangle,
  Lightbulb,
  Bell,
  HelpCircle,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.js';
import { useTranslation } from '../../context/LanguageContext.js';
import { timetableService } from '../../services/timetableService.js';
import { searchHistoryService } from '../../services/searchHistoryService.js';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  onCityChange: (city: string) => void;
}

const SUPPORTED_CITIES = [
  'Mumbai',
  'Delhi',
  'Ahmedabad',
  'Surat',
  'Pune',
  'Bengaluru',
  'Chennai',
  'Kolkata',
  'Hyderabad',
];

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  currentCity,
  onCityChange,
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale } = useTranslation();

  // Dialog states inside drawer
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'ISSUE' | 'FEATURE'>('ISSUE');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [starRating, setStarRating] = useState(5);

  // Update Timetable State
  const [isUpdatingTimetable, setIsUpdatingTimetable] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatusText, setUpdateStatusText] = useState('');
  const [timetableUpdatedMsg, setTimetableUpdatedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateTimetable = async () => {
    setIsUpdatingTimetable(true);
    setUpdateProgress(0);
    setTimetableUpdatedMsg(null);

    await timetableService.updateTimetable((pct, text) => {
      setUpdateProgress(pct);
      setUpdateStatusText(text);
    });

    setIsUpdatingTimetable(false);
    setTimetableUpdatedMsg('Timetable updated few seconds ago');
    setTimeout(() => setTimetableUpdatedMsg(null), 4000);
  };

  const handleClearSearches = () => {
    searchHistoryService.clearAll();
    alert('Recent searches have been cleared.');
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Where Is My Train - Live Indian Railway & Transport Tracking',
          text: 'Check live train running status, local suburban trains, metro, and buses with Where Is My Train app!',
          url: window.location.origin,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      alert('Application link copied to clipboard!');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackText,
          rating: starRating,
        }),
      });
    } catch {
      // ignore
    }
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setFeedbackModalOpen(false);
      setFeedbackText('');
    }, 1500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 border-r border-slate-200 dark:border-slate-800">
        {/* Drawer Header with Blue Brand */}
        <div className="bg-[#0A58CA] p-5 text-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Train className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-black text-lg tracking-tight leading-tight">
                  WHERE IS MY TRAIN
                </h2>
                <p className="text-[10px] text-blue-200 font-medium tracking-wider uppercase">
                  Indian Railways & Transit
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current City Badge in Header */}
          <button
            onClick={() => setCityModalOpen(true)}
            className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium transition"
          >
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Current City: <strong className="text-white">{currentCity}</strong></span>
            </div>
            <span className="text-[10px] text-blue-200">Change ▼</span>
          </button>
        </div>

        {/* Timetable Update Progress Bar */}
        {isUpdatingTimetable && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900 text-xs space-y-1.5">
            <div className="flex justify-between font-semibold text-blue-800 dark:text-blue-300 text-[11px]">
              <span>{updateStatusText}</span>
              <span>{updateProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
          </div>
        )}

        {timetableUpdatedMsg && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center border-b border-emerald-200 dark:border-emerald-900 flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{timetableUpdatedMsg}</span>
          </div>
        )}

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 py-2">
          {/* Main Actions */}
          <div className="px-3 py-2 space-y-0.5">
            <button
              onClick={handleUpdateTimetable}
              disabled={isUpdatingTimetable}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${isUpdatingTimetable ? 'animate-spin' : ''}`} />
              <div className="flex-1">
                <div>Update Timetable</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  {timetableService.getLastUpdatedText()}
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                const nextLocale = locale === 'en' ? 'hi' : locale === 'hi' ? 'mr' : 'en';
                setLocale(nextLocale as any);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <Globe className="w-4 h-4 text-indigo-500" />
              <div className="flex-1">
                <div>Language</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  {locale === 'en' ? 'English (Tap for Hindi)' : locale === 'hi' ? 'हिंदी (Tap for Marathi)' : 'मराठी (Tap for English)'}
                </div>
              </div>
            </button>

            <button
              onClick={() => setCityModalOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <MapPin className="w-4 h-4 text-rose-500" />
              <div className="flex-1">
                <div>Change City</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">{currentCity}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
              <div className="flex-1">
                <div>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
              </div>
            </button>

            <button
              onClick={handleClearSearches}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <Trash2 className="w-4 h-4 text-amber-500" />
              <div className="flex-1">Clear Recent Searches</div>
            </button>
          </div>

          {/* Links & Information */}
          <div className="px-3 py-2 space-y-0.5">
            <button
              onClick={() => {
                navigate('/alerts');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <div className="flex-1">View All Alerts & Power Blocks</div>
            </button>

            <button
              onClick={() => {
                navigate('/settings');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <div className="flex-1">Settings</div>
            </button>

            <button
              onClick={handleShareApp}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <Share2 className="w-4 h-4 text-emerald-500" />
              <div className="flex-1">Share App</div>
            </button>

            <button
              onClick={() => setRatingModalOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <Star className="w-4 h-4 text-amber-400" />
              <div className="flex-1">Rate Us</div>
            </button>

            <button
              onClick={() => {
                setFeedbackType('ISSUE');
                setFeedbackModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <div className="flex-1">Report Issue</div>
            </button>

            <button
              onClick={() => {
                setFeedbackType('FEATURE');
                setFeedbackModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <div className="flex-1">Suggest a Feature</div>
            </button>

            <button
              onClick={() => {
                alert('HOW TO USE WHERE IS MY TRAIN:\n\n1. Select Mode: EXPRESS, LOCALS, METRO, or BUS at the top.\n2. Express: Enter Source & Destination stations and tap "FIND TRAINS".\n3. Track live running status, platforms, and auto-calculated delays.\n4. Enable "INSIDE THIS TRAIN" for priority trip progress.\n5. Use the Alarm button to set alerts before your arrival station.');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <div className="flex-1">How to Use This App</div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Where Is My Train v2.4.0 • Made with pride for Indian Commuters
        </div>
      </div>

      {/* City Selection Modal */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Select Your City / Region</span>
              </h3>
              <button onClick={() => setCityModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    onCityChange(city);
                    setCityModalOpen(false);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition ${
                    currentCity === city
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rate Us Modal */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Rate Where Is My Train</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              How would you rate your travel tracking experience?
            </p>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setStarRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                alert(`Thank you for rating us ${starRating} stars!`);
                setRatingModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
            >
              Submit Rating
            </button>
          </div>
        </div>
      )}

      {/* Feedback / Report Issue Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {feedbackType === 'ISSUE' ? 'Report an Issue' : 'Suggest a Feature'}
              </h3>
              <button onClick={() => setFeedbackModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={feedbackType === 'ISSUE' ? 'Describe what went wrong...' : 'Describe your feature idea...'}
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            {feedbackSuccess && (
              <div className="text-xs text-emerald-600 font-semibold text-center">
                ✓ Thank you! Feedback recorded.
              </div>
            )}
            <button
              onClick={handleSubmitFeedback}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
            >
              Send Feedback
            </button>
          </div>
        </div>
      )}
    </>
  );
};
