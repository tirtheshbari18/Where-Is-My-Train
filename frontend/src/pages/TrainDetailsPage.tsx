import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Heart,
  Share2,
  RefreshCw,
  Layers,
  Map as MapIcon,
  Compass,
  AlertCircle,
  Loader2,
  Bell,
  Calendar,
  MoreVertical,
  Check,
  Table as TableIcon,
  ArrowLeftRight,
} from 'lucide-react';
import {
  railwayApi,
  TrainStop,
  RunningStatus,
  TrainCoachComposition,
  RouteSegment,
  TrainOperation,
  DetailedTimetableRow,
  PlatformUpdate,
  RailwaySection,
  StationLocation,
} from '../api/railwayApi.js';
import { DataFreshnessNotice } from '../components/trains/DataFreshnessNotice.js';
import { RailwayTimeline } from '../components/trains/RailwayTimeline.js';
import { DetailedTimetableTable } from '../components/trains/DetailedTimetableTable.js';
import { TrainOperationsView } from '../components/trains/TrainOperationsView.js';
import { RailwayNetworkMap } from '../components/map/RailwayNetworkMap.js';
import { CoachPosition } from '../components/trains/CoachPosition.js';
import { RailfanView } from '../components/trains/RailfanView.js';
import { storage } from '../utils/storage.js';
import { useTranslation } from '../context/LanguageContext.js';
import { trackingService, TelemetryProgress } from '../services/trackingService.js';
import { offlineStorageService } from '../services/offlineStorageService.js';
import { AlarmModal } from '../components/modals/AlarmModal.js';
import { CoachModal } from '../components/modals/CoachModal.js';
import { StationDetailModal } from '../components/modals/StationDetailModal.js';
import { TrainNotRunningModal } from '../components/modals/TrainNotRunningModal.js';
import { NoIntermediateModal } from '../components/modals/NoIntermediateModal.js';
import { EditPlatformModal } from '../components/modals/EditPlatformModal.js';
import { OperationDetailModal } from '../components/modals/OperationDetailModal.js';

export const TrainDetailsPage: React.FC = () => {
  const { number } = useParams<{ number: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeTab = searchParams.get('tab') || 'timeline';

  const [train, setTrain] = useState<any>(null);
  const [status, setStatus] = useState<RunningStatus | null>(null);
  const [coaches, setCoaches] = useState<TrainCoachComposition | null>(null);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [trainOperations, setTrainOperations] = useState<TrainOperation[]>([]);
  const [detailedTimetableRows, setDetailedTimetableRows] = useState<DetailedTimetableRow[]>([]);
  const [platformUpdates, setPlatformUpdates] = useState<PlatformUpdate[]>([]);
  const [networkMapData, setNetworkMapData] = useState<{
    sections: RailwaySection[];
    stations: StationLocation[];
    speedLimits: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [staleWarning, setStaleWarning] = useState<string | undefined>();
  const [isStale, setIsStale] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  // Selected date ISO string (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  const selectedDateObj = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);
  const isToday = useMemo(() => selectedDateStr === todayStr, [selectedDateStr, todayStr]);

  const formattedDateButtonLabel = useMemo(() => {
    if (isToday) return 'Today ▼';
    if (isNaN(selectedDateObj.getTime())) return 'Select Date ▼';
    const short = selectedDateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
    return `${short} ▼`;
  }, [isToday, selectedDateObj]);

  const formattedSubheader = useMemo(() => {
    if (isNaN(selectedDateObj.getTime())) return 'Day 1';
    const dayNameShort = selectedDateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
    });
    const dateFormatted = selectedDateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
    return `Day 1 - ${dateFormatted}, ${dayNameShort}`;
  }, [selectedDateObj]);

  // Modals state
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Train Not Running Modal state
  const [notRunningModalData, setNotRunningModalData] = useState<{
    isOpen: boolean;
    date: string;
    dayName: string;
    formattedDate: string;
  } | null>(null);

  // No Intermediate Stations Modal state
  const [noIntermediateModalData, setNoIntermediateModalData] = useState<{
    isOpen: boolean;
    fromName: string;
    fromCode: string;
    toName: string;
    toCode: string;
  } | null>(null);

  // Edit Platform Modal state
  const [editPlatformTarget, setEditPlatformTarget] = useState<{
    isOpen: boolean;
    code: string;
    name: string;
    currentPlatform: string;
  } | null>(null);

  // Selected Station for Station Detail modal
  const [selectedStationModal, setSelectedStationModal] = useState<{
    code: string;
    name: string;
    distanceKm?: number;
    platform?: string | number;
  } | null>(null);

  // Selected Operation for Operation Detail modal (Section 16)
  const [selectedOperation, setSelectedOperation] = useState<TrainOperation | null>(null);

  // Synchronized selected station code across Timeline and Detailed Table (Section 24)
  const [selectedStationCode, setSelectedStationCode] = useState<string | undefined>(undefined);

  // Check if train runs on selected date
  const checkTrainRunsOnDate = (trainData: any, dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNameShort = dayNames[d.getDay()];
    const dayNameLong = d.toLocaleDateString('en-IN', { weekday: 'long' });
    const formatted = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const isRunning =
      trainData.runningDays?.some((rd: string) =>
        rd.toUpperCase().startsWith(dayNameShort.toUpperCase().slice(0, 3))
      ) ?? true;

    return { isRunning, dayName: dayNameLong, formattedDate: formatted };
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    if (train) {
      const check = checkTrainRunsOnDate(train, dateStr);
      if (!check.isRunning) {
        setNotRunningModalData({
          isOpen: true,
          date: dateStr,
          dayName: check.dayName,
          formattedDate: check.formattedDate,
        });
      }
    }
  };

  const fetchTrainData = async (isManualRefresh = false) => {
    if (!number) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    // Check offline availability first if disconnected
    if (!offlineStorageService.isOnline()) {
      const cached = offlineStorageService.getCachedTrain(number);
      if (cached) {
        setTrain(cached);
        setIsFav(storage.isFavourite('TRAIN', cached.trainNumber));
        setIsOfflineData(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }

    try {
      const trainData = await railwayApi.getTrain(number);
      setTrain(trainData);
      setIsFav(storage.isFavourite('TRAIN', trainData.trainNumber));
      offlineStorageService.cacheTrain(trainData);
      setIsOfflineData(false);

      // Verify running days for current date on load
      const check = checkTrainRunsOnDate(trainData, selectedDateStr);
      if (!check.isRunning) {
        setNotRunningModalData({
          isOpen: true,
          date: selectedDateStr,
          dayName: check.dayName,
          formattedDate: check.formattedDate,
        });
      }

      // Fetch running status
      try {
        const statusRes = await railwayApi.getRunningStatus(number, selectedDateStr);
        setStatus(statusRes.status);
        setIsStale(statusRes.isStale);
        setStaleWarning(statusRes.staleWarning);
      } catch (err: any) {
        console.warn('Running status not available:', err);
      }

      // Fetch coaches
      try {
        const coachData = await railwayApi.getCoachComposition(number);
        setCoaches(coachData);
      } catch {}

      // Fetch intermediate stations
      try {
        const segments = await railwayApi.getIntermediateStations(number);
        setRouteSegments(segments);
      } catch (err) {
        console.warn('Intermediate stations not available:', err);
      }

      // Fetch train operations (crossings & overtakings)
      try {
        const ops = await railwayApi.getTrainOperations(number);
        setTrainOperations(ops);
      } catch (err) {
        console.warn('Train operations not available:', err);
      }

      // Fetch 19-column detailed timetable
      try {
        const rows = await railwayApi.getDetailedTimetable(number);
        setDetailedTimetableRows(rows);
      } catch (err) {
        console.warn('Detailed timetable not available:', err);
      }

      // Fetch platform updates
      try {
        const updates = await railwayApi.getPlatformUpdates(number);
        setPlatformUpdates(updates);
      } catch (err) {
        console.warn('Platform updates not available:', err);
      }

      // Fetch railway map data
      try {
        const mapData = await railwayApi.getRailwayMapData();
        setNetworkMapData(mapData);
      } catch (err) {
        console.warn('Railway map data not available:', err);
      }
    } catch (err: any) {
      const cached = offlineStorageService.getCachedTrain(number);
      if (cached) {
        setTrain(cached);
        setIsOfflineData(true);
      } else {
        setError(err.message || 'Train not found');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrainData();
  }, [number]);

  const toggleFav = () => {
    if (!train) return;
    if (isFav) {
      storage.removeFavourite('TRAIN', train.trainNumber);
      setIsFav(false);
    } else {
      storage.addFavourite({
        type: 'TRAIN',
        codeOrNumber: train.trainNumber,
        title: `${train.trainNumber} - ${train.trainName}`,
        subtitle: `${train.sourceCode} → ${train.destinationCode}`,
      });
      setIsFav(true);
    }
    setOptionsMenuOpen(false);
  };

  const handleShare = async () => {
    const text = `🚂 Train ${train?.trainNumber} - ${train?.trainName}\nFrom: ${train?.sourceName} (${train?.sourceCode})\nTo: ${train?.destinationName} (${train?.destinationCode})\nStatus: ${status?.status || 'Scheduled'} (${status?.delayMinutes ? `+${status.delayMinutes}m delay` : 'On Time'})\nTrack live: ${window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${train?.trainNumber} - ${train?.trainName} Live Status`,
          text,
          url: window.location.href,
        });
      } catch (e) {
        console.log('Share dismissed');
      }
    } else {
      await navigator.clipboard.writeText(text);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  const handleSavePlatform = async (newPlatform: string, source: string) => {
    if (!editPlatformTarget || !train) return;
    const saved = await railwayApi.savePlatformUpdate(train.trainNumber, {
      stationCode: editPlatformTarget.code,
      stationName: editPlatformTarget.name,
      oldPlatform: editPlatformTarget.currentPlatform,
      newPlatform,
      source,
    });
    setPlatformUpdates((prev) => [saved, ...prev]);

    // Refresh timetable rows to reflect change
    try {
      const updatedRows = await railwayApi.getDetailedTimetable(train.trainNumber);
      setDetailedTimetableRows(updatedRows);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-blue-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-semibold">Retrieving train timetable & live tracking telemetry...</span>
      </div>
    );
  }

  if (error || !train) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-red-950/40 border border-red-500/40 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Train Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">
          {error || `No railway record found matching train number "${number}". Please check the train number.`}
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </Link>
      </div>
    );
  }

  const schedule: TrainStop[] = train.schedule || train.stops || [];
  const currentIndex = status?.lastReportedStation
    ? Math.max(
        0,
        schedule.findIndex(
          (s) =>
            s.stationCode.toUpperCase() ===
            status.lastReportedStation?.code.toUpperCase()
        )
      )
    : 0;

  const progress: TelemetryProgress = trackingService.calculateProgress(
    schedule,
    status
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-28">
      {/* 1. TOP NAV / HEADER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl sticky top-0 z-30 border-b border-blue-800/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-blue-800/60 hover:bg-blue-700/80 active:scale-95 text-white transition shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  #{train.trainNumber}
                </span>
                <span className="text-xs uppercase font-bold text-blue-200 truncate">
                  {train.trainType}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black truncate leading-tight mt-0.5">
                {train.trainName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleFav}
              className={`p-2 rounded-xl transition ${
                isFav
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-blue-800/60 hover:bg-blue-700 text-slate-200'
              }`}
              title="Add to Favourites"
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => fetchTrainData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-blue-800/60 hover:bg-blue-700 text-white transition"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Quick Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setOptionsMenuOpen((prev) => !prev)}
                className="p-2 rounded-xl bg-blue-800/60 hover:bg-blue-700 text-white transition"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {optionsMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-slate-200 animate-scale-in">
                  <button
                    onClick={() => {
                      setIsAlarmModalOpen(true);
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Set Station Alarm</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCoachModalOpen(true);
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Coach Arrangement</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchParams({ tab: 'timetable' });
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <TableIcon className="w-4 h-4 text-emerald-400" />
                    <span>Detailed 19-Col Timetable</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchParams({ tab: 'map' });
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <MapIcon className="w-4 h-4 text-blue-400" />
                    <span>Interactive Railway Map</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. ROUNDED ACTION BUTTONS (Section 3) */}
        <div className="bg-blue-950/90 border-t border-blue-800/60 px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
            {/* [ Today ▼ ] Date Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDateDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-800/90 hover:bg-blue-700 text-white font-black text-xs border border-blue-400/50 shadow-sm transition active:scale-95 shrink-0"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-200" />
                <span>{formattedDateButtonLabel}</span>
              </button>

              {isDateDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 z-50 text-xs text-slate-200 animate-scale-in space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-xs">Select Travel Date</span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {train.runningDays?.length ? `Runs: ${train.runningDays.join(', ')}` : 'Daily'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'Yesterday', offset: -1 },
                      { label: 'Today', offset: 0 },
                      { label: 'Tomorrow', offset: 1 },
                    ].map(({ label, offset }) => {
                      const d = new Date();
                      d.setDate(d.getDate() + offset);
                      const iso = d.toISOString().split('T')[0];
                      const isSel = selectedDateStr === iso;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            handleDateSelect(iso);
                            setIsDateDropdownOpen(false);
                          }}
                          className={`py-1.5 px-2 rounded-xl text-center font-bold text-[11px] transition ${
                            isSel
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Pick Travel Date</label>
                    <input
                      type="date"
                      value={selectedDateStr}
                      onChange={(e) => {
                        handleDateSelect(e.target.value);
                        setIsDateDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subheader Action Buttons: [ Alarm ] [ Coach ] [ Share ] */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAlarmModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-800/90 hover:bg-blue-700 text-white font-bold text-xs border border-blue-400/50 shadow-sm transition active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('actions.alarm')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCoachModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-800/90 hover:bg-blue-700 text-white font-bold text-xs border border-blue-400/50 shadow-sm transition active:scale-95"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-300" />
                <span>{t('actions.coach')}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-800/90 hover:bg-blue-700 text-white font-bold text-xs border border-blue-400/50 shadow-sm transition active:scale-95"
              >
                {shareSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-blue-200" />
                )}
                <span>{shareSuccess ? 'Copied!' : t('actions.share')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. DYNAMIC ARRIVAL / DAY / DEPARTURE SUBHEADER (Section 4) */}
        <div className="bg-blue-900/95 text-white border-t border-blue-800/80 px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs sm:text-sm font-extrabold tracking-wide">
            <span className="w-24 text-left font-black tracking-wider uppercase text-blue-200">
              Arrival
            </span>
            <span className="flex-1 text-center font-black text-white bg-blue-800/70 py-1 px-3 rounded-lg border border-blue-700/70 shadow-2xs">
              {formattedSubheader}
            </span>
            <span className="w-24 text-right font-black tracking-wider uppercase text-blue-200">
              Departure
            </span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {isOfflineData && (
          <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-xl text-xs text-amber-300 flex items-center justify-between">
            <span>Viewing previously cached offline timetable. Live GPS/cell telemetry paused.</span>
            <span className="font-bold uppercase text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
              Offline Cache
            </span>
          </div>
        )}

        {/* Navigation Tabs Header */}
        <div className="flex rounded-2xl bg-slate-900 p-1.5 border border-slate-800 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setSearchParams({ tab: 'timeline' })}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'timetable' })}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'timetable'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Train Timetable</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'map' })}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Railway Map</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'operations' })}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'operations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Train Operations</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'coaches' })}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'coaches'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Coaches</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'railfan' })}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'railfan'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Railfan</span>
          </button>
        </div>

        {/* TAB 1: RUNNING STATUS & INTERACTIVE TIMELINE (With Detailed Timetable Below) */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <RailwayTimeline
              stops={schedule}
              currentIndex={currentIndex}
              delayMinutes={progress.delayMinutes}
              trainNumber={train.trainNumber}
              trainName={train.trainName}
              routeSegments={routeSegments}
              platformUpdates={platformUpdates}
              trainOperations={trainOperations}
              selectedStationCode={selectedStationCode}
              status={status}
              onRefreshStatus={() => fetchTrainData(true)}
              isRefreshingStatus={refreshing}
              onStationClick={(code, name, distanceKm, platform) => {
                setSelectedStationCode(code);
                setSelectedStationModal({
                  code,
                  name,
                  distanceKm,
                  platform,
                });
              }}
              onEditPlatform={(code, name, currentPlatform) => {
                setEditPlatformTarget({
                  isOpen: true,
                  code,
                  name,
                  currentPlatform: String(currentPlatform || ''),
                });
              }}
              onNoIntermediateStations={(fromName, fromCode, toName, toCode) => {
                setNoIntermediateModalData({
                  isOpen: true,
                  fromName,
                  fromCode,
                  toName,
                  toCode,
                });
              }}
              onOperationClick={(operation) => {
                setSelectedOperation(operation);
              }}
            />

            {/* 22. & 23. DETAILED TIMETABLE BELOW TIMELINE (Synchronized) */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-emerald-400" />
                    <span>Detailed Railway Timetable (19 Columns)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click any station row to highlight and synchronize with the visual timeline above.
                  </p>
                </div>
              </div>

              <DetailedTimetableTable
                rows={detailedTimetableRows}
                trainNumber={train.trainNumber}
                selectedStationCode={selectedStationCode}
                onStationClick={(stationCode) => {
                  setSelectedStationCode(stationCode);
                  const stop = schedule.find(
                    (s) => s.stationCode.toUpperCase() === stationCode.toUpperCase()
                  );
                  if (stop) {
                    setSelectedStationModal({
                      code: stationCode,
                      name: stop.stationName,
                      distanceKm: stop.distanceFromSourceKm,
                      platform: stop.platform,
                    });
                  }
                }}
                onEditPlatform={(code, name, currentPlatform) => {
                  setEditPlatformTarget({
                    isOpen: true,
                    code,
                    name,
                    currentPlatform,
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED 19-COLUMN TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl border border-blue-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-emerald-400" />
                  <span>Complete Indian Railway Station Timetable</span>
                </h2>
                <p className="text-xs text-blue-200 mt-0.5">
                  Official 19-column working timetable matching Indian Rail Info information architecture.
                </p>
              </div>
              <button
                onClick={() => setSearchParams({ tab: 'timeline' })}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Clock className="w-4 h-4" />
                <span>Switch to Visual Timeline</span>
              </button>
            </div>

            <DetailedTimetableTable
              rows={detailedTimetableRows}
              trainNumber={train.trainNumber}
              selectedStationCode={selectedStationCode}
              onStationClick={(stationCode) => {
                setSelectedStationCode(stationCode);
                const stop = schedule.find(
                  (s) => s.stationCode.toUpperCase() === stationCode.toUpperCase()
                );
                setSelectedStationModal({
                  code: stationCode,
                  name: stop?.stationName || stationCode,
                  distanceKm: stop?.distanceFromSourceKm,
                  platform: stop?.platform,
                });
              }}
              onEditPlatform={(code, name, currentPlatform) => {
                setEditPlatformTarget({
                  isOpen: true,
                  code,
                  name,
                  currentPlatform,
                });
              }}
            />
          </div>
        )}

        {/* TAB 3: RAILWAY NETWORK MAP WITH SPEED LIMITS */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl border border-slate-800 shadow-md">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-blue-400" />
                <span>Indian Railway Network & Section Speed Limits</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Interactive geospatial map showing track sections, maximum permitted speeds, zones, and real-time train corridor synchronization.
              </p>
            </div>

            <RailwayNetworkMap
              sections={networkMapData?.sections || []}
              stations={networkMapData?.stations || []}
              activeTrainStops={schedule}
              activeRunningStatus={status}
              trainNumber={train.trainNumber}
              trainName={train.trainName}
              trainLocationEnabled={true}
              onStationClick={(stationCode) => {
                setSelectedStationCode(stationCode);
                const stop = schedule.find(
                  (s) => s.stationCode.toUpperCase() === stationCode.toUpperCase()
                );
                setSelectedStationModal({
                  code: stationCode,
                  name: stop?.stationName || stationCode,
                  distanceKm: stop?.distanceFromSourceKm,
                  platform: stop?.platform,
                });
              }}
            />
          </div>
        )}

        {/* TAB 4: TRAIN OPERATIONS (CROSSINGS & OVERTAKINGS) */}
        {activeTab === 'operations' && (
          <TrainOperationsView
            operations={trainOperations}
            trainNumber={train.trainNumber}
            trainName={train.trainName}
            onStationClick={(stationCode) => {
              setSelectedStationCode(stationCode);
              const stop = schedule.find(
                (s) => s.stationCode.toUpperCase() === stationCode.toUpperCase()
              );
              setSelectedStationModal({
                code: stationCode,
                name: stop?.stationName || stationCode,
                distanceKm: stop?.distanceFromSourceKm,
                platform: stop?.platform,
              });
            }}
            onOperationClick={(operation) => {
              setSelectedOperation(operation);
            }}
          />
        )}

        {/* TAB 5: COACH LAYOUT VIEW */}
        {activeTab === 'coaches' && (
          <div>
            {coaches ? (
              <CoachPosition composition={coaches} />
            ) : (
              <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800 text-slate-400 text-xs">
                Coach composition information is not currently notified for this train rake.
              </div>
            )}
          </div>
        )}

        {/* TAB 6: RAILFAN TELEMETRY VIEW */}
        {activeTab === 'railfan' && status && (
          <RailfanView train={train} status={status} />
        )}

        {/* Data Source Provenance Notice */}
        {status && (
          <DataFreshnessNotice
            source={status.source}
            updatedAt={status.updatedAt}
            dataFreshnessText={status.dataFreshnessText}
            isStale={isStale}
            staleWarning={staleWarning}
            confidence={status.dataSourceConfidence}
          />
        )}
      </div>

      {/* MODALS */}
      {/* 1. Train Not Running Modal */}
      {notRunningModalData && (
        <TrainNotRunningModal
          isOpen={notRunningModalData.isOpen}
          onClose={() => setNotRunningModalData(null)}
          trainNumber={train.trainNumber}
          trainName={train.trainName}
          selectedDate={notRunningModalData.date}
          runningDays={train.runningDays || []}
        />
      )}

      {/* 2. No Intermediate Stations Modal */}
      {noIntermediateModalData && (
        <NoIntermediateModal
          isOpen={noIntermediateModalData.isOpen}
          onClose={() => setNoIntermediateModalData(null)}
          fromStationName={noIntermediateModalData.fromName}
          fromStationCode={noIntermediateModalData.fromCode}
          toStationName={noIntermediateModalData.toName}
          toStationCode={noIntermediateModalData.toCode}
        />
      )}

      {/* 3. Edit Platform Modal */}
      {editPlatformTarget && (
        <EditPlatformModal
          isOpen={editPlatformTarget.isOpen}
          onClose={() => setEditPlatformTarget(null)}
          trainNumber={train.trainNumber}
          stationCode={editPlatformTarget.code}
          stationName={editPlatformTarget.name}
          currentPlatform={editPlatformTarget.currentPlatform}
          onSave={handleSavePlatform}
        />
      )}

      {/* 4. Station Detail Modal */}
      {selectedStationModal && (
        <StationDetailModal
          isOpen={true}
          onClose={() => setSelectedStationModal(null)}
          stationCode={selectedStationModal.code}
          stationName={selectedStationModal.name}
          distanceKm={selectedStationModal.distanceKm}
          platform={selectedStationModal.platform}
          currentTrainNumber={train.trainNumber}
          currentTrainName={train.trainName}
          onOperationClick={(operation) => {
            setSelectedOperation(operation);
          }}
        />
      )}

      {/* 5. Operation Detail Modal (Section 16) */}
      {selectedOperation && (
        <OperationDetailModal
          isOpen={true}
          onClose={() => setSelectedOperation(null)}
          operation={selectedOperation}
          currentTrainNumber={train.trainNumber}
          currentTrainName={train.trainName}
        />
      )}

      {/* 5. Alarm Modal */}
      <AlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => setIsAlarmModalOpen(false)}
        trainNumber={train.trainNumber}
        trainName={train.trainName}
        stations={schedule}
      />

      {/* 6. Coach Modal */}
      <CoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        trainNumber={train.trainNumber}
        trainName={train.trainName}
      />
    </div>
  );
};
