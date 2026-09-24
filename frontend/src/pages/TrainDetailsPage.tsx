import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  MapPin,
  Heart,
  Share2,
  RefreshCw,
  Layers,
  Map as MapIcon,
  Compass,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  railwayApi,
  TrainStop,
  RunningStatus,
  TrainCoachComposition,
} from '../api/railwayApi.js';
import { DelayBadge } from '../components/trains/DelayBadge.js';
import { LiveIndicator } from '../components/trains/LiveIndicator.js';
import { DataFreshnessNotice } from '../components/trains/DataFreshnessNotice.js';
import { RailwayTimeline } from '../components/trains/RailwayTimeline.js';
import { CoachPosition } from '../components/trains/CoachPosition.js';
import { RailfanView } from '../components/trains/RailfanView.js';
import { LiveMap } from '../components/map/LiveMap.js';
import { storage } from '../utils/storage.js';

export const TrainDetailsPage: React.FC = () => {
  const { number } = useParams<{ number: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'timeline';

  const [train, setTrain] = useState<any>(null);
  const [status, setStatus] = useState<RunningStatus | null>(null);
  const [coaches, setCoaches] = useState<TrainCoachComposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [staleWarning, setStaleWarning] = useState<string | undefined>();
  const [isStale, setIsStale] = useState(false);

  const fetchTrainData = async (isManualRefresh = false) => {
    if (!number) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const trainData = await railwayApi.getTrain(number);
      setTrain(trainData);
      setIsFav(storage.isFavourite('TRAIN', trainData.trainNumber));

      // Fetch running status
      try {
        const statusRes = await railwayApi.getRunningStatus(number);
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
      } catch {
        // Coaches optional
      }
    } catch (err: any) {
      setError(err.message || 'Train not found');
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
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${train?.trainNumber} ${train?.trainName} Live Status`,
        text: `Live tracking Indian Railways train ${train?.trainNumber} ${train?.trainName}. Checked on Where Is My Train!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tracking link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-amber-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-semibold">Retrieving train schedule & live tracking feed...</span>
      </div>
    );
  }

  if (error || !train) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel rounded-3xl p-8 border border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Train Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            We could not find train number "{number}" in the database or upstream provider.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/search"
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Search Train Directory
            </Link>
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-medium text-xs"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const schedule: TrainStop[] = train.schedule || [];
  const currentIndex = status?.currentStationTimelineIndex ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Train Header Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {train.trainNumber}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {train.trainType}
              </span>
              {train.zone && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {train.zone} Railway
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-white">
              {train.trainName}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium pt-1">
              <span className="text-amber-400 font-bold">{train.sourceName} ({train.sourceCode})</span>
              <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-amber-400 font-bold">{train.destinationName} ({train.destinationCode})</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono">{train.distanceKm} km</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTrainData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-white transition"
              title="Refresh Live Status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-white transition"
              title="Share Train Status"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFav}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-red-400 transition"
              title={isFav ? 'Remove from Favourites' : 'Add to Favourites'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'text-red-500 fill-red-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Running Status Spotlight Card */}
        {status ? (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
              {/* Col 1: Status & Delay */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Current Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                    {status.status}
                  </span>
                  <DelayBadge delayMinutes={status.delayMinutes} status={status.status} />
                </div>
                <LiveIndicator
                  positionType={status.positionType}
                  lastReportedStationName={status.lastReportedStation?.name}
                />
              </div>

              {/* Col 2: Last Reported Station */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Last Reported Station
                </span>
                <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{status.lastReportedStation?.name || 'In-transit'}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Platform: {status.lastReportedStation?.platform || 'TBD'} • Passed at {status.lastReportedStation?.actualDeparture || '--:--'}
                </div>
              </div>

              {/* Col 3: Next Approaching Station */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Next Approaching Stop
                </span>
                <div className="text-base font-bold text-amber-300 font-mono">
                  {status.nextStation?.name || 'Destination'}
                </div>
                <div className="text-xs text-slate-400">
                  Expected: <strong className="text-white">{status.nextStation?.expectedArrival || '--:--'}</strong> ({status.nextStation?.distanceRemainingKm ?? 0} km away)
                </div>
              </div>

              {/* Col 4: Expected Destination Arrival */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Destination Arrival
                </span>
                <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>{status.expectedArrivalAtDestination}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Delay at destination: +{status.delayMinutes}m
                </div>
              </div>
            </div>

            {/* Live Journey Chain: Previous -> Last Reported -> Next -> Destination */}
            <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs overflow-x-auto gap-2">
              <div className="text-center shrink-0">
                <span className="text-[10px] text-slate-500 block">Previous</span>
                <span className="font-bold text-slate-300">{status.previousStation?.name || train.sourceName}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="text-center shrink-0 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block font-semibold">Current Reported Station</span>
                <span className="font-extrabold text-white">{status.lastReportedStation?.name || 'In-transit'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="text-center shrink-0">
                <span className="text-[10px] text-blue-400 block font-semibold">Next Stop</span>
                <span className="font-bold text-white">{status.nextStation?.name || 'Terminus'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="text-center shrink-0">
                <span className="text-[10px] text-slate-500 block">Terminus</span>
                <span className="font-bold text-slate-300">{train.destinationName}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-xl text-xs text-slate-400">
            Live running status is not currently available for this train. Showing scheduled timetable below.
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800 max-w-xl">
        <button
          onClick={() => setSearchParams({ tab: 'timeline' })}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'timeline'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timeline</span>
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'map' })}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'map'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Live Map</span>
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'coaches' })}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'coaches'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Coaches</span>
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'railfan' })}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'railfan'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Railfan</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'timeline' && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Station Stops & Route Timetable</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {schedule.length} Stations
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Stops with scheduled halts, platforms, and real-time delay clearance
              </p>
            </div>
          </div>

          <RailwayTimeline
            stops={schedule}
            currentIndex={currentIndex}
            delayMinutes={status?.delayMinutes || 0}
          />
        </div>
      )}

      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-amber-400" />
              <span>Interactive India Railway Route Map</span>
            </h2>
            <span className="text-xs text-slate-400">
              Tracking {train.trainNumber} {train.trainName}
            </span>
          </div>

          <LiveMap
            stops={schedule}
            status={status}
            trainName={train.trainName}
            trainNumber={train.trainNumber}
          />
        </div>
      )}

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
  );
};
