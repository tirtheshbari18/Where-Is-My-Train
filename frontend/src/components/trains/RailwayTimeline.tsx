import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Train,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  ExternalLink,
  RefreshCw,
  Gauge,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ShieldCheck,
  MapPin,
  Clock,
  Award,
} from 'lucide-react';
import {
  railwayApi,
  TrainStop,
  RouteSegment,
  PlatformUpdate,
  TrainOperation,
  RunningStatus,
} from '../../api/railwayApi.js';
import { platformVoteService, PlatformVoteResult } from '../../services/platformVoteService.js';
import { isDemoSource } from '../../services/trackingService.js';
import { useTranslation } from '../../context/LanguageContext.js';
import { LiveTrackingStatusBanner } from './LiveTrackingStatusBanner.js';
import { useInsideTrainSpeed } from '../../hooks/useInsideTrainSpeed.js';

interface Props {
  stops: TrainStop[];
  currentIndex: number;
  delayMinutes: number;
  trainNumber: string;
  trainName?: string;
  routeSegments?: RouteSegment[];
  platformUpdates?: PlatformUpdate[];
  trainOperations?: TrainOperation[];
  selectedStationCode?: string;
  status?: RunningStatus | null;
  onStationClick?: (
    stationCode: string,
    stationName: string,
    distanceKm: number,
    platform?: string | number
  ) => void;
  onEditPlatform?: (
    stationCode: string,
    stationName: string,
    currentPlatform: string
  ) => void;
  onNoIntermediateStations?: (
    fromStationName: string,
    fromStationCode: string,
    toStationName: string,
    toStationCode: string
  ) => void;
  onOperationClick?: (operation: TrainOperation) => void;
  onRefreshStatus?: () => void;
  isRefreshingStatus?: boolean;
  /** Controlled "Inside this train" state (owned by TrainDetailsPage so it survives tab switches). */
  insideTrain: boolean;
  onToggleInsideTrain: () => void;
  /** Journey start date (YYYY-MM-DD) used to label DAY dividers. */
  journeyDate?: string;
}

// Helper: Format 24-hr time '04:45' to '04:45 AM'
function formatDisplayTime(timeStr?: string): string {
  if (!timeStr || timeStr === '--' || timeStr === 'START' || timeStr === 'END') {
    return '--:--';
  }
  const clean = timeStr.trim();
  if (clean.includes('AM') || clean.includes('PM')) {
    return clean;
  }
  const parts = clean.split(':');
  if (parts.length < 2) return clean;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  if (isNaN(hours)) return clean;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' becomes '12'
  const paddedHours = String(hours).padStart(2, '0');
  return `${paddedHours}:${minutes} ${ampm}`;
}

// Helper: Add delay minutes to time string '04:45' -> '4:53 AM'
function getDelayedTime(timeStr: string | undefined, delayMinutes: number): string {
  if (!timeStr || timeStr === '--' || timeStr === 'START' || timeStr === 'END') {
    return '--:--';
  }
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return formatDisplayTime(timeStr);
  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return formatDisplayTime(timeStr);

  const totalMinutes = (hours * 60 + minutes + delayMinutes) % (24 * 60);
  const adjustedTotal = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;
  const newHours = Math.floor(adjustedTotal / 60);
  const newMinutes = adjustedTotal % 60;
  const paddedMinutes = newMinutes < 10 ? `0${newMinutes}` : `${newMinutes}`;
  return formatDisplayTime(`${newHours}:${paddedMinutes}`);
}

// Helper: Describe how long ago an ISO timestamp was, without inventing precision
function formatAgo(iso?: string): string {
  if (!iso) return 'Update time unknown';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Update time unknown';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 15) return 'Updated a few seconds ago';
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} hr ago`;
  return `Updated ${Math.round(hours / 24)} d ago`;
}

// Human-readable community verification state — always derived from real counts.
function verificationBadge(r: PlatformVoteResult | null): { label: string; className: string } {
  if (!r) {
    return { label: 'Loading…', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
  }
  if (!r.available) {
    return { label: 'Votes unavailable', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
  }
  switch (r.verificationStatus) {
    case 'VERIFIED':
      return {
        label: `Verified (${r.yesCount}/${r.totalVotes})`,
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      };
    case 'DISPUTED':
      return {
        label: `Disputed (${r.yesCount} yes / ${r.noCount} no)`,
        className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      };
    case 'INSUFFICIENT_VOTES':
      return {
        label: `Awaiting votes (${r.totalVotes} voted)`,
        className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      };
    default:
      return {
        label: 'Not yet verified (0 votes)',
        className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      };
  }
}

export const RailwayTimeline: React.FC<Props> = ({
  stops,
  currentIndex,
  delayMinutes,
  trainNumber,
  trainName: _trainName,
  routeSegments = [],
  platformUpdates = [],
  trainOperations = [],
  selectedStationCode,
  status,
  onStationClick,
  onEditPlatform,
  onNoIntermediateStations,
  onOperationClick,
  onRefreshStatus,
  isRefreshingStatus = false,
  insideTrain,
  onToggleInsideTrain,
  journeyDate,
}) => {
  const navigate = useNavigate();
  const { t: _t } = useTranslation();
  const currentTrainRef = useRef<HTMLDivElement | null>(null);
  const stationRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const trainLocationEnabled = insideTrain;

  // "INSIDE THIS TRAIN?" Feature (Section 7) — state is owned by TrainDetailsPage
  // so tracking also drives the auto-refresh interval there.

  // Community Platform Verification & Achievement Milestone (Sections 18 & 35)
  const currentStop = stops[currentIndex] || stops[0];
  const nextStop = currentIndex < stops.length - 1 ? stops[currentIndex + 1] : stops[stops.length - 1];
  const originStop = stops[0];
  const destStop = stops[stops.length - 1];
  const currentSpeed = status?.speedKmH ?? null;

  const [platformVoteResult, setPlatformVoteResult] = useState<PlatformVoteResult | null>(null);
  const [voteBusy, setVoteBusy] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Platform Contribution Achievement Modal & Toast
  const [achievementModal, setAchievementModal] = useState<{
    isOpen: boolean;
    contributionCount: number;
    ordinalText: string;
  } | null>(null);
  const [contributionToast, setContributionToast] = useState<string | null>(null);

  const triggerContributionMilestone = () => {
    const USER_CONTRIBUTIONS_KEY = 'wimt_user_contributions';
    const currentCount = parseInt(localStorage.getItem(USER_CONTRIBUTIONS_KEY) || '0', 10);
    const newCount = (isNaN(currentCount) ? 0 : currentCount) + 1;
    localStorage.setItem(USER_CONTRIBUTIONS_KEY, String(newCount));
    const s = ['th', 'st', 'nd', 'rd'];
    const v = newCount % 100;
    const ordinalText = `${newCount}${s[(v - 20) % 10] || s[v] || s[0]}`;
    setAchievementModal({
      isOpen: true,
      contributionCount: newCount,
      ordinalText,
    });
    setContributionToast("Thanks for your contribution. It'll help millions of passengers");
    setTimeout(() => {
      setContributionToast(null);
    }, 4500);
  };

  /**
   * Section 2, 19, 20 & 58: Small Circular Speed Indicator
   * Displays dynamic speed with small circle, bold number, and km/h underneath.
   * Smoothly animated, 0 km/h when stopped, -- km/h when unavailable.
   */
  const {
    speedKmH,
    speedText,
    permissionDenied,
    retryLocation,
  } = useInsideTrainSpeed({
    insideTrain,
    providerSpeedKmH: status?.speedKmH,
    trainStatus: status?.status,
  });

  const renderSpeedCircle = (size: 'normal' | 'large' = 'normal') => {
    return (
      <div
        className={`rounded-full bg-slate-900 border-2 border-emerald-400 shadow-xl flex flex-col items-center justify-center shrink-0 z-20 transition-all duration-300 select-none ${
          size === 'large'
            ? 'w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-emerald-500/20'
            : 'w-14 h-14 sm:w-16 sm:h-16 ring-2 ring-emerald-500/20'
        }`}
        title={`Train speed: ${speedText}`}
      >
        <span className="text-[10px] sm:text-xs text-emerald-400 leading-none">◯</span>
        <span className="text-base sm:text-xl font-black font-mono leading-none tracking-tight text-white mt-0.5">
          {speedKmH !== null ? speedKmH : '--'}
        </span>
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 leading-none mt-0.5">
          km/h
        </span>
      </div>
    );
  };

  useEffect(() => {
    if (!currentStop) return;
    let cancelled = false;
    platformVoteService
      .getVotes(trainNumber, currentStop.stationCode, currentStop.platform, journeyDate)
      .then((res) => {
        if (!cancelled) setPlatformVoteResult(res);
      })
      .catch(() => {
        /* vote totals are optional — keep whatever we had */
      });
    return () => {
      cancelled = true;
    };
  }, [trainNumber, currentStop?.stationCode, currentStop?.platform, journeyDate]);

  const handlePlatformVote = async (vote: 'YES' | 'NO' | 'NOT_SURE') => {
    if (!currentStop || voteBusy) return;
    setVoteBusy(true);
    setVoteError(null);
    try {
      const res = await platformVoteService.submitVote(
        trainNumber,
        currentStop.stationCode,
        currentStop.platform,
        vote,
        journeyDate
      );
      setPlatformVoteResult(res);
      if (vote === 'YES' || vote === 'NO') {
        triggerContributionMilestone();
      }
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : 'Your vote could not be saved.');
    } finally {
      setVoteBusy(false);
    }
  };

  // Compact platform verification popup opened from a "PF n ✎" badge
  const [votePopup, setVotePopup] = useState<{
    stationCode: string;
    stationName: string;
    platform?: string;
  } | null>(null);
  const [popupVotes, setPopupVotes] = useState<PlatformVoteResult | null>(null);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [popupBusy, setPopupBusy] = useState(false);
  const [isCorrectingPlatform, setIsCorrectingPlatform] = useState(false);
  const [platformCorrectionInput, setPlatformCorrectionInput] = useState('');

  useEffect(() => {
    if (!votePopup) {
      setIsCorrectingPlatform(false);
      setPlatformCorrectionInput('');
      return;
    }
    let cancelled = false;
    setPopupVotes(null);
    setPopupError(null);
    setIsCorrectingPlatform(false);
    setPlatformCorrectionInput(votePopup.platform || '');
    platformVoteService
      .getVotes(trainNumber, votePopup.stationCode, votePopup.platform, journeyDate)
      .then((res) => {
        if (!cancelled) setPopupVotes(res);
      })
      .catch(() => {
        if (!cancelled) setPopupVotes(null);
      });
    return () => {
      cancelled = true;
    };
  }, [trainNumber, votePopup?.stationCode, votePopup?.platform, journeyDate]);

  const handlePopupVote = async (vote: 'YES' | 'NO' | 'NOT_SURE') => {
    if (!votePopup || popupBusy) return;
    if (vote === 'NO') {
      setIsCorrectingPlatform(true);
      setPlatformCorrectionInput(votePopup.platform || '');
      return;
    }
    setPopupBusy(true);
    setPopupError(null);
    try {
      const res = await platformVoteService.submitVote(
        trainNumber,
        votePopup.stationCode,
        votePopup.platform,
        vote,
        journeyDate
      );
      setPopupVotes(res);
      if (vote === 'YES') {
        triggerContributionMilestone();
      }
      setVotePopup(null);
    } catch (err) {
      setPopupError(err instanceof Error ? err.message : 'Your vote could not be saved.');
    } finally {
      setPopupBusy(false);
    }
  };

  const handlePlatformCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!votePopup || popupBusy) return;
    const cleanPlatform = platformCorrectionInput.trim();
    if (!cleanPlatform) {
      setPopupError('Please enter a platform number.');
      return;
    }
    setPopupBusy(true);
    setPopupError(null);
    try {
      if (votePopup.platform) {
        await platformVoteService
          .submitVote(trainNumber, votePopup.stationCode, votePopup.platform, 'NO', journeyDate)
          .catch(() => {});
      }
      await platformVoteService
        .submitVote(trainNumber, votePopup.stationCode, cleanPlatform, 'YES', journeyDate)
        .catch(() => {});

      await railwayApi.savePlatformUpdate(trainNumber, {
        stationCode: votePopup.stationCode,
        stationName: votePopup.stationName,
        oldPlatform: votePopup.platform || '',
        newPlatform: cleanPlatform,
        source: 'User Platform Contribution',
      });

      onEditPlatform?.(votePopup.stationCode, votePopup.stationName, cleanPlatform);
      triggerContributionMilestone();
      setIsCorrectingPlatform(false);
      setVotePopup(null);
    } catch (err: any) {
      setPopupError(err.message || 'Your platform update could not be saved.');
    } finally {
      setPopupBusy(false);
    }
  };

  // 15. Single state: expandedSegmentId (only the selected segment should expand)
  const [expandedSegmentId, setExpandedSegmentId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Direct section without intermediate stations popup state
  const [emptyModalInfo, setEmptyModalInfo] = useState<{
    fromName: string;
    fromCode: string;
    toName: string;
    toCode: string;
  } | null>(null);

  // Auto-scroll to selected station or current train
  useEffect(() => {
    if (selectedStationCode && stationRefs.current[selectedStationCode.toUpperCase()]) {
      stationRefs.current[selectedStationCode.toUpperCase()]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    } else if (currentTrainRef.current && (trainLocationEnabled || insideTrain)) {
      currentTrainRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedStationCode, currentIndex, trainLocationEnabled, insideTrain]);

  // Find segment between two stops
  const getSegmentBetween = (fromCode: string, toCode: string): RouteSegment | undefined => {
    return routeSegments.find(
      (s) =>
        s.fromStationCode.toUpperCase() === fromCode.toUpperCase() &&
        s.toStationCode.toUpperCase() === toCode.toUpperCase()
    );
  };

  // Get ALL operations for a specific station (NO limit)
  const getOperationsForStation = (stationCode: string): TrainOperation[] => {
    return trainOperations.filter(
      (op) => op.stationCode.toUpperCase() === stationCode.toUpperCase()
    );
  };

  // 14 & 38. Single click/tap expands, double click/tap collapses
  const handleTrackConnectionClick = (
    fromCode: string,
    fromName: string,
    toCode: string,
    toName: string
  ) => {
    const key = `${fromCode}_${toCode}`;
    const now = Date.now();
    const last = lastTapRef.current;

    // Double tap / double click detection (within 350ms on same segment)
    if (last && last.id === key && now - last.time < 350) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapRef.current = null;
      // Double click collapses intermediate stations
      setExpandedSegmentId(null);
      return;
    }

    lastTapRef.current = { id: key, time: now };

    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
    }

    singleTapTimeoutRef.current = setTimeout(() => {
      // Single tap expands intermediate stations
      const segment = getSegmentBetween(fromCode, toCode);

      if (!segment || segment.intermediateCount === 0 || segment.intermediateStations.length === 0) {
        setEmptyModalInfo({ fromName, fromCode, toName, toCode });
        setExpandedSegmentId(key);
        if (onNoIntermediateStations) {
          onNoIntermediateStations(fromName, fromCode, toName, toCode);
        }
        return;
      }

      setExpandedSegmentId(key);
    }, 220);
  };

  const handleTrackConnectionDoubleClick = (
    _fromCode: string,
    _fromName: string,
    _toCode: string,
    _toName: string
  ) => {
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
    lastTapRef.current = null;
    setExpandedSegmentId(null);
  };

  const nextDistance = Math.max(
    1,
    (nextStop?.distanceFromSourceKm || 0) - (currentStop?.distanceFromSourceKm || 0)
  );
  const remainingDist = Math.max(
    0,
    (destStop?.distanceFromSourceKm || 0) - (currentStop?.distanceFromSourceKm || 0)
  );

  const getStatusBadge = () => {
    if (delayMinutes <= 0) {
      return {
        label: 'NO DELAY',
        sub: 'On Time',
        bg: 'bg-emerald-600 text-white',
        border: 'border-emerald-500',
      };
    }
    if (delayMinutes <= 15) {
      return {
        label: `+${delayMinutes} MIN DELAY`,
        sub: 'Minor Delay',
        bg: 'bg-amber-500 text-slate-950 font-black',
        border: 'border-amber-400',
      };
    }
    return {
      label: `+${delayMinutes} MIN DELAY`,
      sub: 'Delayed',
      bg: 'bg-red-600 text-white',
      border: 'border-red-500',
    };
  };

  const statusBadge = getStatusBadge();

  // Dynamic live-running headline (Section 4 & 10)
  const getLiveStatusHeadline = () => {
    if (!status || status.status === 'UNAVAILABLE' || status.status === 'NOT_STARTED') {
      return `Scheduled • Departs from ${stops[0]?.stationName || 'Source'}`;
    }
    const statusUpper = (status.status || '').toUpperCase();
    if (statusUpper === 'COMPLETED') {
      return `Arrived at ${destStop?.stationName || 'Terminus'}`;
    }

    const remainingKm = status.nextStation?.distanceRemainingKm;
    const targetNextStation = status.nextStation?.name || nextStop?.stationName;
    const lastReported =
      status.lastReportedStation?.name ||
      currentStop?.stationName ||
      stops[0]?.stationName ||
      'Station';

    // 1. [x] km to [Station]
    if (remainingKm != null && remainingKm > 0 && targetNextStation) {
      return `${remainingKm} km to ${targetNextStation}`;
    }

    // 2. Between [Station A] and [Station B]
    if (status.positionType === 'estimated' || status.positionType === 'gps') {
      const fromStn = lastReported;
      const toStn = targetNextStation || 'Next Station';
      return `Between ${fromStn} and ${toStn}`;
    }

    // 3. At / Arrived / Arriving / Departed
    if (statusUpper === 'ARRIVED') {
      return `Arrived at ${lastReported}`;
    }
    if (statusUpper === 'ARRIVING') {
      return `Arriving at ${targetNextStation || lastReported}`;
    }
    if (statusUpper === 'AT_STATION' || status.positionType === 'station') {
      return `At ${lastReported}`;
    }
    if (statusUpper === 'DEPARTED') {
      return `Departed ${lastReported}`;
    }

    return `Departed ${lastReported}`;
  };

  // Recent platform change alert if any
  const latestPlatformChange = platformUpdates[0];

  return (
    <div className="space-y-4">
      {/* Authoritative Live Tracking & Error Status Banner (Sections 10, 11, 34) */}
      <LiveTrackingStatusBanner
        status={status}
        onRetry={onRefreshStatus}
        isRetrying={isRefreshingStatus}
      />

      {/* ============================================================== */}
      {/* REAL-TIME STATUS CARD (Section 5)                              */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Route Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-amber-300" />
            <span className="font-black text-sm sm:text-base">
              {originStop?.stationName || 'Source'} → {destStop?.stationName || 'Destination'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {status ? (
              isDemoSource(status.source) || /demo|simulat/i.test(status.dataSourceConfidence || '') ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs">
                  Demo Data
                </span>
              ) : null
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Live data unavailable
              </span>
            )}
            {status?.updatedAt && (
              <span className="text-[11px] font-mono text-blue-100 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-200" />
                {formatAgo(status.updatedAt)}
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${statusBadge.bg}`}
            >
              {statusBadge.label}
            </span>
            {onRefreshStatus && (
              <button
                onClick={onRefreshStatus}
                disabled={isRefreshingStatus}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition active:scale-95"
                title="Refresh Status"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Next Stop */}
          <div className="flex items-start gap-3 pt-2 sm:pt-0">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Next Stop
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {nextStop?.stationName || destStop?.stationName}
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {nextDistance} km
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatDisplayTime(nextStop?.scheduledArrival || nextStop?.scheduledDeparture)}
                </span>
              </div>
            </div>
          </div>

          {/* To Reach Final Destination */}
          <div className="flex items-start gap-3 pt-3 sm:pt-0 sm:pl-4">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                To Reach Terminus
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {destStop?.stationName}
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {remainingDist} km
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatDisplayTime(destStop?.scheduledArrival)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 24. "INSIDE THIS TRAIN?" SLIDING TOGGLE CARD (Reference Design) */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                Inside this train?
              </span>
              {insideTrain && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Tracking active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Receive faster train updates
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={insideTrain}
              onClick={onToggleInsideTrain}
              className={`relative inline-flex h-7 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner items-center px-1 ${
                insideTrain ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title={`Inside this train is currently ${insideTrain ? 'ON' : 'OFF'}`}
            >
              <span
                className={`text-[10px] font-black uppercase text-white transition-opacity duration-200 ${
                  insideTrain ? 'ml-1 text-left opacity-100' : 'mr-1 ml-auto text-right opacity-90'
                }`}
              >
                {insideTrain ? 'ON' : 'OFF'}
              </span>
              <span
                className={`pointer-events-none absolute h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  insideTrain ? 'right-1' : 'left-1'
                }`}
              />
            </button>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Quick Map & Directions Links (Section 14) */}
        <div className="bg-slate-50/90 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate(`/map?train=${trainNumber}`)}
            className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition active:scale-98"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>View your journey in Map</span>
          </button>
          <a
            href={
              destStop?.latitude && destStop?.longitude
                ? `https://www.google.com/maps/dir/?api=1&destination=${destStop.latitude},${destStop.longitude}`
                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    (destStop?.stationName || 'Dahanu Road') + ' Railway Station'
                  )}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition active:scale-98"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>View directions in Google Maps</span>
          </a>
        </div>
      </div>

      {/* ============================================================== */}
      {/* COMMUNITY PLATFORM CONFIRMATION WIDGET (Section 12 & 47)       */}
      {/* ============================================================== */}
      {currentStop && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  {currentStop.platform
                    ? `Is "Platform ${currentStop.platform}" correct at ${currentStop.stationName}?`
                    : `Which platform does this train use at ${currentStop.stationName}?`}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Stops here most of the time
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${verificationBadge(
                platformVoteResult
              ).className}`}
            >
              {verificationBadge(platformVoteResult).label}
            </span>
          </div>

          {!currentStop.platform && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              No platform announced for this station yet — your vote will help confirm it.
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlatformVote('YES')}
              disabled={voteBusy}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                platformVoteResult?.userVoted === 'YES'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>YES</span>
            </button>
            <button
              onClick={() => handlePlatformVote('NO')}
              disabled={voteBusy}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                platformVoteResult?.userVoted === 'NO'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 hover:bg-red-100'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>NO</span>
            </button>
            <button
              onClick={() => handlePlatformVote('NOT_SURE')}
              disabled={voteBusy}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                platformVoteResult?.userVoted === 'NOT_SURE'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>NOT SURE</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <span>
              {platformVoteResult
                ? `${platformVoteResult.yesCount} yes • ${platformVoteResult.noCount} no • ${platformVoteResult.notSureCount} not sure`
                : 'Loading vote totals…'}
            </span>
            <span>
              {platformVoteResult?.lastUpdatedAt
                ? `Last updated ${new Date(platformVoteResult.lastUpdatedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'No community votes recorded yet'}
            </span>
          </div>

          {voteError && (
            <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">{voteError}</p>
          )}
        </div>
      )}

      {/* Platform Changed Alert Banner */}
      {latestPlatformChange && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/70 rounded-2xl flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                PLATFORM ANNOUNCEMENT UPDATE
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {latestPlatformChange.stationName} ({latestPlatformChange.stationCode}): Platform Changed from{' '}
                <span className="line-through text-amber-600 dark:text-amber-400">
                  Platform {latestPlatformChange.oldPlatform}
                </span>{' '}
                →{' '}
                <span className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                  Platform {latestPlatformChange.newPlatform}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Source: {latestPlatformChange.source} • Time:{' '}
                {new Date(latestPlatformChange.updatedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 18. Inside Train Sliding Toggle Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              insideTrain ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Train className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-wide">
              Inside Train
            </span>
            <span
              className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                insideTrain
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {insideTrain ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Sliding ON/OFF Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={insideTrain}
          onClick={onToggleInsideTrain}
          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
            insideTrain ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
          title={`Inside Train mode is currently ${insideTrain ? 'ON' : 'OFF'}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              insideTrain ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 59. INSIDE TRAIN HEADER (When ON) */}
      {insideTrain && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-2 border-blue-500/50 text-white shadow-xl animate-fade-in space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">Inside Train</span>
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  ● Live
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Live position tracking & telemetric speed monitoring active
              </p>
            </div>

            {/* Small circular speed indicator */}
            <div className="shrink-0">
              {renderSpeedCircle('large')}
            </div>
          </div>

          {/* 22. Location Permission Notice */}
          {permissionDenied && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Location permission is required to calculate live speed.</span>
              </div>
              <button
                type="button"
                onClick={retryLocation}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 transition active:scale-95"
              >
                Retry
              </button>
            </div>
          )}

          {/* Current & Next Station + Last updated */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Current:
              </span>
              <p className="font-extrabold text-white truncate">
                {status?.lastReportedStation?.name || currentStop?.stationName || 'Station'}{' '}
                <span className="text-cyan-300">
                  ({status?.lastReportedStation?.code || currentStop?.stationCode})
                </span>
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Next:
              </span>
              <p className="font-extrabold text-white truncate">
                {status?.nextStation?.name || nextStop?.stationName || 'Destination'}{' '}
                <span className="text-cyan-300">
                  ({status?.nextStation?.code || nextStop?.stationCode})
                </span>
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Last updated:
              </span>
              <p className="font-mono text-slate-300">
                {status?.updatedAt
                  ? new Date(status.updatedAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : 'Just now'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. VERTICAL RAILWAY TIMELINE (Continuous Blue Track Route)     */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-3 sm:p-5">
        {/* Dynamic Column Subheader (Section 4 & 5) */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          <div className="w-20 sm:w-24 text-right pr-2">Arrival</div>
          <div className="flex-1 text-center font-bold text-blue-900 dark:text-blue-300">
            Station & Railway Route
          </div>
          <div className="w-20 sm:w-24 text-left pl-2">Departure</div>
        </div>

        {/* Continuous Route Timeline Container */}
        <div className="relative">
          {stops.map((stop, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;
            const isOrigin = index === 0;
            const isDestination = index === stops.length - 1;

            const nextStationStop = stops[index + 1];

            // Delay calculations
            const stationDelay = isCurrent || isUpcoming ? delayMinutes : 0;
            const schedArr = isOrigin ? '--:--' : formatDisplayTime(stop.scheduledArrival);
            const schedDep = isDestination ? '--:--' : formatDisplayTime(stop.scheduledDeparture);

            // Actual times
            const actualArr = isOrigin
              ? '--:--'
              : stop.actualArrival
              ? formatDisplayTime(stop.actualArrival)
              : stationDelay > 0
              ? getDelayedTime(stop.scheduledArrival, stationDelay)
              : schedArr;

            const actualDep = isDestination
              ? '--:--'
              : stop.actualDeparture
              ? formatDisplayTime(stop.actualDeparture)
              : stationDelay > 0
              ? getDelayedTime(stop.scheduledDeparture, stationDelay)
              : schedDep;

            // Route segment to next station
            const segment = nextStationStop
              ? getSegmentBetween(stop.stationCode, nextStationStop.stationCode)
              : undefined;

            const segmentKey = nextStationStop
              ? `${stop.stationCode}_${nextStationStop.stationCode}`
              : '';
            const isSegmentExpanded = expandedSegmentId === segmentKey;
            const intermediateCount = segment?.intermediateCount || 0;

            // Effective platform (from user platform updates if edited).
            // No fabricated default: an unknown platform stays undefined and its badge is hidden.
            const userPlatform = platformUpdates.find(
              (p) => p.stationCode.toUpperCase() === stop.stationCode.toUpperCase()
            );
            const displayPlatform = userPlatform ? userPlatform.newPlatform : stop.platform;
            const isUserUpdatedPlatform = !!userPlatform;

            // DAY divider when the journey rolls over to the next calendar day
            const dayNum = stop.dayCount;
            const showDayDivider =
              !!dayNum && (index === 0 || dayNum !== stops[index - 1]?.dayCount);
            let dayLabel = '';
            if (showDayDivider && journeyDate) {
              const base = new Date(`${journeyDate.slice(0, 10)}T00:00:00`);
              if (!Number.isNaN(base.getTime())) {
                base.setDate(base.getDate() + (dayNum - 1));
                dayLabel = base.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
              }
            }

            // Operations at this station (Dynamic, NO limit!)
            const stationOps = getOperationsForStation(stop.stationCode);

            // Highlight state from timetable sync
            // Highlight state from timetable sync
            const isSelected =
              selectedStationCode?.toUpperCase() === stop.stationCode.toUpperCase();

            // Train between this station and next?
            const isTrainRunning = status?.status?.toUpperCase() === 'RUNNING';
            const isTrainBetweenHereAndNext =
              trainLocationEnabled &&
              isCurrent &&
              Boolean(nextStationStop) &&
              (isTrainRunning ||
                status?.positionType === 'estimated' ||
                status?.positionType === 'gps' ||
                (Boolean(status?.nextStation) &&
                  status?.nextStation?.code?.toUpperCase() === nextStationStop.stationCode.toUpperCase()) ||
                Boolean(status?.nextStation?.distanceRemainingKm));

            return (
              <React.Fragment key={`${stop.stationCode}_${stop.stopSequence}`}>
                {/* 22.5 DAY HEADER FOR MULTI-DAY JOURNEYS (3-Column Aligned Dark Header) */}
                {showDayDivider && (
                  <div className="my-2.5 overflow-hidden rounded-xl bg-slate-900 dark:bg-slate-950 text-white shadow-md border border-slate-800">
                    <div className="flex items-center justify-between py-2 px-2 sm:px-3 text-xs font-black tracking-wider uppercase">
                      <div className="w-20 sm:w-24 text-right pr-2 sm:pr-3 text-slate-400 font-bold">
                        Arrival
                      </div>
                      <div className="flex-1 text-center font-black text-amber-300 text-xs sm:text-sm tracking-wide">
                        Day {dayNum}{dayLabel ? ` - ${dayLabel}` : ''}
                      </div>
                      <div className="w-20 sm:w-24 text-left pl-2 sm:pl-3 text-slate-400 font-bold">
                        Departure
                      </div>
                    </div>
                  </div>
                )}

                {/* STATION ROW (3 COLUMNS: LEFT = ARRIVAL, CENTER = LINE & STATION, RIGHT = DEPARTURE) */}
                <div
                  id={`timeline-station-${stop.stationCode}`}
                  ref={(el) => {
                    stationRefs.current[stop.stationCode.toUpperCase()] = el;
                  }}
                  className={`flex items-start transition-all duration-200 py-2.5 rounded-xl ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500 shadow-sm'
                      : ''
                  }`}
                >
                  {/* LEFT COLUMN: ARRIVAL */}
                  <div className="w-20 sm:w-24 text-right pr-2 sm:pr-3 shrink-0 pt-0.5 select-none">
                    {/* Scheduled Arrival */}
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {schedArr}
                    </div>

                    {/* Actual Arrival */}
                    <div className="text-xs sm:text-sm font-extrabold font-mono mt-0.5">
                      {isOrigin ? (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                          Origin
                        </span>
                      ) : stationDelay > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-black">
                          {actualArr}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {actualArr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CENTER COLUMN: CONTINUOUS VERTICAL BLUE LINE + STATION NODE + STATION DETAILS */}
                  <div className="flex-1 relative flex items-start pl-1 sm:pl-2 min-w-0">
                    {/* Vertical Blue Railway Track passing through */}
                    <div
                      className={`absolute left-[13px] sm:left-[17px] w-1 sm:w-1.5 bg-blue-600 z-0 ${
                        isOrigin ? 'top-2 bottom-0' : isDestination ? 'top-0 h-4' : 'top-0 bottom-0'
                      }`}
                    />

                    {/* Station Node Marker directly on the blue line */}
                    <div className="relative z-10 shrink-0 mt-0.5">
                      {isCurrent && trainLocationEnabled ? (
                        // Bright Blue/Cyan highlight node with pulsing train icon
                        <div
                          ref={currentTrainRef}
                          className="w-7 h-7 sm:w-8 sm:h-8 -ml-1 sm:-ml-1.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-4 ring-blue-300 dark:ring-blue-900 animate-pulse"
                          title="Current Train Location"
                        >
                          <Train className="w-4 h-4 text-white" />
                        </div>
                      ) : isCompleted ? (
                        // Green node for departed/completed stations
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 -ml-0.5 sm:-ml-0.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 text-slate-950 flex items-center justify-center shadow-sm"
                          title="Departed"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                        </div>
                      ) : (
                        // Blue circular node for future stations
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 -ml-0.5 sm:-ml-0.5 rounded-full bg-white dark:bg-slate-900 border-[3px] border-blue-600 shadow-sm"
                          title="Scheduled Halt"
                        />
                      )}
                    </div>

                    {/* Station Details */}
                    <div className="ml-3 sm:ml-4 flex-1 min-w-0 pb-1">
                      {/* Station Name & Code */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            onStationClick?.(
                              stop.stationCode,
                              stop.stationName,
                              stop.distanceFromSourceKm,
                              displayPlatform
                            )
                          }
                          className="text-left font-black text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition underline-offset-2 hover:underline focus:outline-none"
                        >
                          {stop.stationName}
                        </button>

                        {/* GREEN Station Code Highlight */}
                        <span className="text-[11px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 shadow-2xs">
                          {stop.stationCode}
                        </span>
                      </div>

                      {/* Section 2 & 3: Current Train Position & Speed when train is stopped at this station */}
                      {isCurrent && trainLocationEnabled && !isTrainBetweenHereAndNext && (
                        <div className="mt-2 mb-1 flex items-center gap-3 p-2.5 rounded-2xl bg-blue-50/95 dark:bg-blue-950/80 border-2 border-blue-500/50 dark:border-blue-600/60 shadow-md animate-fade-in">
                          {renderSpeedCircle('normal')}
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                              <span>Current Train Location</span>
                            </span>
                            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                              At {stop.stationName} {displayPlatform ? `• Platform ${displayPlatform}` : ''}
                            </p>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatAgo(status?.updatedAt)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Distance & Platform Badge (Platform X ✎) */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {stop.distanceFromSourceKm} km
                        </span>
                        <span>•</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {displayPlatform ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCorrectingPlatform(false);
                                setPlatformCorrectionInput(String(displayPlatform));
                                setVotePopup({
                                  stationCode: stop.stationCode,
                                  stationName: stop.stationName,
                                  platform: String(displayPlatform),
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors shadow-2xs cursor-pointer"
                              title={`Platform ${displayPlatform} — Click to verify or edit`}
                            >
                              <span>Platform {displayPlatform}</span>
                              <span className="text-[10px] opacity-75">✎</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCorrectingPlatform(true);
                                setPlatformCorrectionInput('');
                                setVotePopup({
                                  stationCode: stop.stationCode,
                                  stationName: stop.stationName,
                                  platform: '',
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition"
                              title="Add platform number"
                            >
                              <span>Platform ?</span>
                              <span className="text-[10px] opacity-75">✎</span>
                            </button>
                          )}
                          {isUserUpdatedPlatform && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              User updated
                            </span>
                          )}
                        </div>

                        {stop.haltMinutes > 0 && (
                          <>
                            <span>•</span>
                            <span>{stop.haltMinutes}m halt</span>
                          </>
                        )}
                      </div>

                      {/* DYNAMIC RAILWAY OPERATIONS AT THIS STATION (NO slice limit!) */}
                      {stationOps.length > 0 && (
                        <div className="mt-2.5 flex flex-col gap-1.5">
                          {stationOps.map((op) => (
                            <button
                              key={op.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOperationClick?.(op);
                              }}
                              className="text-left p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center justify-between gap-2 shadow-2xs group"
                              title="Click for complete railway operation details"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                <span className="text-[11px] font-black text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                                  {op.label || op.type}
                                </span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                  {op.otherTrainNumber ? `#${op.otherTrainNumber} ${op.otherTrainName}` : op.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 shrink-0">
                                <span>{op.scheduledTime}</span>
                                <ExternalLink className="w-3 h-3 text-blue-500 opacity-60 group-hover:opacity-100" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: DEPARTURE */}
                  <div className="w-20 sm:w-24 text-left pl-2 sm:pl-3 shrink-0 pt-0.5 select-none">
                    {/* Scheduled Departure */}
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {schedDep}
                    </div>

                    {/* Actual Departure */}
                    <div className="text-xs sm:text-sm font-extrabold font-mono mt-0.5">
                      {isDestination ? (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                          Terminus
                        </span>
                      ) : stationDelay > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-black">
                          {actualDep}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {actualDep}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* TRACK SECTION BETWEEN STATION A AND STATION B */}
                {!isDestination && nextStationStop && (
                  <div className="relative flex items-stretch">
                    {/* Left blank column */}
                    <div className="w-20 sm:w-24 shrink-0" />

                    {/* Center Column: Continuous Blue Railway Line */}
                    <div className="flex-1 relative pl-1 sm:pl-2 py-2">
                      {/* Continuous Blue Vertical Track Line (Clickable single click to inspect intermediate stations, double click to collapse) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackConnectionClick(
                            stop.stationCode,
                            stop.stationName,
                            nextStationStop.stationCode,
                            nextStationStop.stationName
                          );
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleTrackConnectionDoubleClick(
                            stop.stationCode,
                            stop.stationName,
                            nextStationStop.stationCode,
                            nextStationStop.stationName
                          );
                        }}
                        className="absolute left-[10px] sm:left-[14px] top-0 bottom-0 w-4 sm:w-5 flex items-center justify-center cursor-pointer group/track z-10"
                        title={`Click to inspect intermediate stations between ${stop.stationName} and ${nextStationStop.stationName} (Double click to collapse)`}
                      >
                        <div className="w-1 sm:w-1.5 h-full bg-blue-600 group-hover/track:bg-cyan-400 group-hover/track:w-2 transition-all shadow-sm rounded-full" />
                      </div>

                      {/* 8. CURRENT TRAIN MARKER ON THE RAILWAY LINE (Between Stations) */}
                      {isTrainBetweenHereAndNext && (
                        <div
                          ref={currentTrainRef}
                          className="relative z-10 ml-6 sm:ml-8 my-3 p-3.5 sm:p-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 border-2 border-blue-400 rounded-2xl text-white shadow-xl animate-fade-in"
                        >
                          <div className="flex items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600/30 border border-blue-400/50 flex items-center justify-center shrink-0 text-white shadow-md">
                                <Train className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 animate-pulse" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                                  </span>
                                  <span>Train between stations</span>
                                </div>
                                <p className="text-xs sm:text-sm font-extrabold text-white mt-0.5 truncate">
                                  {stop.stationName} → {nextStationStop.stationName}
                                </p>
                                <span className="text-[10px] sm:text-[11px] text-blue-200/80">
                                  {status?.nextStation?.distanceRemainingKm !== undefined
                                    ? `${status.nextStation.distanceRemainingKm} km to ${nextStationStop.stationName} • `
                                    : ''}
                                  {formatAgo(status?.updatedAt)}
                                </span>
                              </div>
                            </div>

                            {/* 2. CIRCULAR SPEED INDICATOR */}
                            <div className="shrink-0 flex items-center">
                              {renderSpeedCircle('large')}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 13. & 14. CLICKABLE BLUE LINE & INTERMEDIATE STATIONS TOGGLE */}
                      <div className="relative z-10 ml-6 sm:ml-8 py-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleTrackConnectionClick(
                              stop.stationCode,
                              stop.stationName,
                              nextStationStop.stationCode,
                              nextStationStop.stationName
                            )
                          }
                          onDoubleClick={() =>
                            handleTrackConnectionDoubleClick(
                              stop.stationCode,
                              stop.stationName,
                              nextStationStop.stationCode,
                              nextStationStop.stationName
                            )
                          }
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black border transition-all active:scale-95 shadow-2xs ${
                            isSegmentExpanded
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-100 hover:border-blue-500'
                          }`}
                          title={`Click to inspect intermediate stations (Double click to collapse)`}
                        >
                          {intermediateCount > 0 ? (
                            isSegmentExpanded ? (
                              <>
                                <span>▲ Hide intermediate stations</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>▼ {intermediateCount} intermediate stations</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )
                          ) : (
                            <span>── Direct Track Section (Click to inspect) ──</span>
                          )}
                        </button>
                      </div>

                      {/* 16. NO INTERMEDIATE STATIONS MESSAGE (When expanded on zero intermediate stations) */}
                      {isSegmentExpanded && (!segment || !segment.intermediateStations || segment.intermediateStations.length === 0) && (
                        <div className="relative z-10 ml-6 sm:ml-8 mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 animate-fade-in flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <div>
                              <p className="font-extrabold">No intermediate stations available</p>
                              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                Direct railway track section between {stop.stationName} and {nextStationStop.stationName}.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedSegmentId(null)}
                            className="text-xs text-amber-800 dark:text-amber-300 hover:underline font-bold shrink-0 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* EXPANDED INTERMEDIATE STATIONS INSIDE TIMELINE (Section 13, 14, 16) */}
                      {isSegmentExpanded && segment && segment.intermediateStations && segment.intermediateStations.length > 0 && (
                        <div className="relative z-10 ml-6 sm:ml-8 mt-2 space-y-2 border-l-2 border-dashed border-slate-300 dark:border-slate-700 pl-3 py-2 bg-slate-50/70 dark:bg-slate-950/50 rounded-r-2xl animate-fade-in">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 pb-1 border-b border-slate-200 dark:border-slate-800">
                            <span>
                              Intermediate Stations ({segment.intermediateStations.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedSegmentId(null)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                            >
                              ▲ Hide intermediate stations
                            </button>
                          </div>

                          {segment.intermediateStations.map((istop, idx) => {
                            const isLast = idx === segment.intermediateStations.length - 1;
                            const istopOps = getOperationsForStation(istop.stationCode);
                            const istopPassed = index < currentIndex;

                            return (
                              <div
                                key={istop.stationCode}
                                onClick={() =>
                                  onStationClick?.(
                                    istop.stationCode,
                                    istop.stationName,
                                    istop.distanceFromSourceKm,
                                    istop.platform
                                  )
                                }
                                className={`p-3 rounded-xl border transition cursor-pointer shadow-2xs group ${
                                  istopPassed
                                    ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800/70 opacity-85 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                                    : 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-slate-400 text-xs font-bold">
                                      {isLast ? '└──' : '├──'}
                                    </span>
                                    <span className="font-mono font-black text-xs text-slate-700 bg-slate-200 dark:text-slate-300 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                                      {istop.stationCode}
                                    </span>
                                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {istop.stationName}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span
                                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        istopPassed
                                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                                      }`}
                                    >
                                      {istopPassed ? 'Passed' : 'Upcoming'}
                                    </span>
                                    {istop.haltMinutes > 0 ? (
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                                        {istop.haltMinutes}m halt
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        Pass Through
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Arrival / Departure times & Platform */}
                                {(() => {
                                  const hasArr = !!istop.scheduledArrival && istop.scheduledArrival !== '--' && istop.scheduledArrival !== 'START';
                                  const hasDep = !!istop.scheduledDeparture && istop.scheduledDeparture !== '--' && istop.scheduledDeparture !== 'END';
                                  return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                                      {hasArr && (
                                        <div>
                                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                                            Arrival
                                          </span>
                                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {formatDisplayTime(istop.scheduledArrival)}
                                          </span>
                                        </div>
                                      )}
                                      {hasDep && (
                                        <div>
                                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                                            Departure
                                          </span>
                                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {formatDisplayTime(istop.scheduledDeparture)}
                                          </span>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                                          Platform
                                        </span>
                                        {istop.platform ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setVotePopup({
                                                stationCode: istop.stationCode,
                                                stationName: istop.stationName,
                                                platform: istop.platform,
                                              });
                                            }}
                                            className="inline-flex items-center gap-1 font-mono font-bold text-xs text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
                                            title={`Verify platform ${istop.platform} at ${istop.stationName}`}
                                          >
                                            PF {istop.platform}
                                          </button>
                                        ) : (
                                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">
                                            Platform not available
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Halt / distance, and any genuinely supplied telemetry */}
                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span>
                                    {istop.haltMinutes > 0
                                      ? `${istop.haltMinutes}m halt`
                                      : 'Pass Through'}{' '}
                                    &bull; {istop.distanceFromSourceKm || '—'} km
                                  </span>
                                  {istop.speedKmH ? <span>{istop.speedKmH} km/h</span> : null}
                                  {istop.elevationMeters ? (
                                    <span>{istop.elevationMeters}m elevation</span>
                                  ) : null}
                                  {(istop.zone || istop.division) && (
                                    <span>
                                      {istop.zone || '—'} / {istop.division || '—'}
                                    </span>
                                  )}
                                </div>

                                {/* Intermediate Operations */}
                                {istopOps.length > 0 && (
                                  <div className="mt-2 pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                                    {istopOps.map((op) => (
                                      <button
                                        key={op.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOperationClick?.(op);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100"
                                      >
                                        <span>⚡ {op.label || op.type}: #{op.otherTrainNumber}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right blank column */}
                    <div className="w-20 sm:w-24 shrink-0" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 11. RUNNING STATUS PANEL (At Bottom of Timeline)                */}
      {/* ============================================================== */}
      <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl border-2 border-blue-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                RUNNING STATUS
              </span>
              <h3 className="text-sm sm:text-base font-black text-white">
                {getLiveStatusHeadline()}
              </h3>
              <p className="text-[11px] text-blue-200/80">
                {formatAgo(status?.updatedAt)} &bull; Train #{trainNumber}
              </p>
            </div>
          </div>

          {/* Refresh Button ↻ */}
          <button
            type="button"
            onClick={onRefreshStatus}
            disabled={isRefreshingStatus}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition shadow-md flex items-center gap-1.5 shrink-0"
            title="Refresh Live Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-800/80 text-xs">
          <div>
            <span className="text-blue-300 block text-[10px] font-bold">LAST PASSED</span>
            <span className="font-extrabold text-white truncate block">
              {currentStop?.stationName}
            </span>
          </div>
          <div>
            <span className="text-blue-300 block text-[10px] font-bold">NEXT STATION</span>
            <span className="font-extrabold text-white truncate block">
              {nextStop ? nextStop.stationName : 'Destination Reached'}
            </span>
          </div>
          <div>
            <span className="text-blue-300 block text-[10px] font-bold">DELAY STATUS</span>
            <span
              className={`font-black font-mono ${
                delayMinutes > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {delayMinutes > 0 ? `+${delayMinutes} min delay` : 'On Time'}
            </span>
          </div>
          <div>
            <span className="text-blue-300 block text-[10px] font-bold">CURRENT SPEED</span>
            <span className="font-mono font-bold text-cyan-300 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              {currentSpeed ? `${currentSpeed} km/h` : 'Speed unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* 22.4 POPUP MODAL: No intermediate stations present (Matching Reference Design) */}
      {emptyModalInfo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEmptyModalInfo(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Orange Notification Banner matching reference screenshot */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>No intermediate stations present</span>
              </div>
              <button
                type="button"
                onClick={() => setEmptyModalInfo(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                  <Train className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    No Intermediate Station
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    Direct Continuous Track Section
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 space-y-2">
                <p className="leading-relaxed">
                  There is <span className="font-black text-rose-600 dark:text-rose-400">no intermediate station present</span> between{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {emptyModalInfo.fromName} ({emptyModalInfo.fromCode})
                  </strong>{' '}
                  and{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {emptyModalInfo.toName} ({emptyModalInfo.toCode})
                  </strong>
                  .
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  This is an uninterrupted, continuous railway block section without any intervening passenger station, halt, or crossing loop.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEmptyModalInfo(null)}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/30"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 23.2 POPUP MODAL: Platform Confirmation Popup (Matching Reference Design) */}
      {votePopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Verify platform"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setVotePopup(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Is "Platform X" correct? [X] */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {votePopup.platform
                    ? `Is "Platform ${votePopup.platform}" correct?`
                    : `Which platform at ${votePopup.stationName}?`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {votePopup.stationName} ({votePopup.stationCode})
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                  Stops here most of the time
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVotePopup(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Correction Input OR Voting Options: Yes | No | Not sure */}
            {isCorrectingPlatform ? (
              <form onSubmit={handlePlatformCorrectionSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Correct Platform Number:
                  </label>
                  <input
                    type="text"
                    value={platformCorrectionInput}
                    onChange={(e) => setPlatformCorrectionInput(e.target.value)}
                    placeholder="e.g. 1, 2, 3A"
                    maxLength={10}
                    className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCorrectingPlatform(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={popupBusy || !platformCorrectionInput.trim()}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 transition shadow-sm"
                  >
                    {popupBusy ? 'Saving...' : 'Submit Platform'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePopupVote('YES')}
                  disabled={popupBusy}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                    popupVotes?.userVoted === 'YES'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handlePopupVote('NO')}
                  disabled={popupBusy}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                    popupVotes?.userVoted === 'NO'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 hover:bg-red-100'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  No
                </button>
                <button
                  type="button"
                  onClick={() => handlePopupVote('NOT_SURE')}
                  disabled={popupBusy}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                    popupVotes?.userVoted === 'NOT_SURE'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Not sure
                </button>
              </div>
            )}

            {/* Verification Status & Approval Summary matching Section 23.2 */}
            <div className="text-center py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                {popupVotes && popupVotes.totalVotes > 0
                  ? `${popupVotes.yesCount}/${popupVotes.totalVotes} people approved this`
                  : 'No confirmations yet'}
              </div>
              {popupVotes?.verificationStatus === 'DISPUTED' && (
                <div className="text-[11px] font-bold text-red-600 dark:text-red-400">
                  Platform information disputed
                </div>
              )}
              {popupVotes?.lastUpdatedAt && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  Last updated {new Date(popupVotes.lastUpdatedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>

            {popupError && (
              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 text-center">{popupError}</p>
            )}

            <button
              type="button"
              onClick={() => setVotePopup(null)}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Contribution Achievement Modal (Section 18 & 35) */}
      {achievementModal && achievementModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
              <Award className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Thank you!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Thank you for helping other travellers with your contribution
              </p>
            </div>
            <div className="py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50">
              <span className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                This is your {achievementModal.ordinalText} contribution
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAchievementModal(null)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition active:scale-95 uppercase tracking-wider"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Floating Contribution Toast (Section 18) */}
      {contributionToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 toast-enter">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{contributionToast}</span>
        </div>
      )}

      {/* Floating "Inside this train?" control for continuous timeline tracking */}
      <aside
        aria-label="Inside this train live tracking"
        className="fixed bottom-24 right-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full shadow-xl px-3.5 py-2 flex items-center gap-2.5 transition-all hover:shadow-2xl"
      >
        <div className="flex items-center gap-1.5">
          <Train className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">
            Inside this train?
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={insideTrain}
          onClick={onToggleInsideTrain}
          className={`relative inline-flex h-6 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none items-center px-1 shadow-inner ${
            insideTrain ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
          title={`Inside this train: ${insideTrain ? 'Yes (Active)' : 'No (Inactive)'}`}
        >
          <span
            className={`text-[9px] font-black uppercase text-white transition-opacity ${
              insideTrain ? 'ml-1 text-left opacity-100' : 'mr-1 ml-auto text-right opacity-90'
            }`}
          >
            {insideTrain ? 'Yes' : 'No'}
          </span>
          <span
            className={`pointer-events-none absolute h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
              insideTrain ? 'right-1' : 'left-1'
            }`}
          />
        </button>
      </aside>
    </div>
  );
};
