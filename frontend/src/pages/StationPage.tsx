import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Wifi,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Heart,
  RefreshCw,
  Loader2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  railwayApi,
  StationLocation,
  LiveStationBoard,
  LiveStationTrain,
} from '../api/railwayApi.js';
import { DelayBadge } from '../components/trains/DelayBadge.js';
import { storage } from '../utils/storage.js';

export const StationPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [station, setStation] = useState<StationLocation | null>(null);
  const [liveBoard, setLiveBoard] = useState<LiveStationBoard | null>(null);
  const [activeBoard, setActiveBoard] = useState<'arrivals' | 'departures'>('departures');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  const fetchStationData = async (isManual = false) => {
    if (!code) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const stationData = await railwayApi.getStation(code);
      setStation(stationData);
      setIsFav(storage.isFavourite('STATION', stationData.code));

      try {
        const boardData = await railwayApi.getLiveStation(code, 4);
        setLiveBoard(boardData);
      } catch (err: any) {
        console.warn('Live station board error:', err);
      }
    } catch (err: any) {
      setError(err.message || 'Station not found');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStationData();
  }, [code]);

  const toggleFav = () => {
    if (!station) return;
    if (isFav) {
      storage.removeFavourite('STATION', station.code);
      setIsFav(false);
    } else {
      storage.addFavourite({
        type: 'STATION',
        codeOrNumber: station.code,
        title: `${station.name} (${station.code})`,
        subtitle: `${station.zone || 'IR'} • ${station.state || 'India'}`,
      });
      setIsFav(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-amber-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-semibold">Loading station platform data & timetable...</span>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel rounded-3xl p-8 border border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Station Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            Station code "{code}" does not exist in our Indian Railways database.
          </p>
          <Link
            to="/live-station"
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Explore Stations Directory
          </Link>
        </div>
      </div>
    );
  }

  const trainsList =
    activeBoard === 'arrivals'
      ? liveBoard?.arrivals || []
      : liveBoard?.departures || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Station Header Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-extrabold text-xl shrink-0">
              {station.code}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {station.name}
                </span>
                {station.zone && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold border border-slate-700">
                    {station.zone} Zone
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {station.division && `Division: ${station.division} • `}
                {station.state && `State: ${station.state} • `}
                Category: {station.category || 'NSG-1'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStationData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-white transition"
              title="Refresh Live Station"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
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

        {/* Facilities Row */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>{station.numberOfPlatforms} Operational Platforms</span>
          </div>
          {station.wifiAvailable && (
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 text-emerald-400">
              <Wifi className="w-4 h-4" />
              <span>RailWire Free High-Speed WiFi</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>Geo: {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Live Station Board (Departures & Arrivals) */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveBoard('departures')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeBoard === 'departures'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Live Departures ({liveBoard?.departures.length ?? 0})</span>
            </button>
            <button
              onClick={() => setActiveBoard('arrivals')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeBoard === 'arrivals'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Live Arrivals ({liveBoard?.arrivals.length ?? 0})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Last Updated: {liveBoard?.lastUpdated || 'Recent'}</span>
          </div>
        </div>

        {/* Train List Board Table */}
        <div className="space-y-3">
          {trainsList.length > 0 ? (
            trainsList.map((item: LiveStationTrain) => (
              <div
                key={`${item.trainNumber}_${item.scheduledTime}`}
                className="bg-slate-900/60 hover:bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center font-mono shrink-0">
                    <span className="text-lg font-bold text-white block">
                      {item.scheduledTime}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      Scheduled
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {item.trainNumber}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {item.trainType}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-semibold">
                        PF {item.platform}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1">
                      {item.trainName}
                    </h4>

                    <div className="text-xs text-slate-400 mt-0.5">
                      {item.sourceName} ➔ {item.destinationName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DelayBadge delayMinutes={item.delayMinutes} status={item.status} />
                  <Link
                    to={`/train/${item.trainNumber}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    title="Track Train"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No upcoming {activeBoard} scheduled in the next 4 hours window at this station.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
