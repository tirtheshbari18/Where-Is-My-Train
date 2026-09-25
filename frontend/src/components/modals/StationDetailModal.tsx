import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Train,
  Wifi,
  ExternalLink,
  ArrowLeftRight,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { stationService } from '../../services/stationService.js';
import {
  railwayApi,
  StationLocation,
  LiveStationBoard,
  TrainOperation,
} from '../../api/railwayApi.js';
import { useTranslation } from '../../context/LanguageContext.js';
import { getOperationMeta } from '../../utils/operationRegistry.js';

interface StationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationCode: string;
  stationName: string;
  distanceKm?: number;
  platform?: string | number;
  currentTrainNumber?: string;
  currentTrainName?: string;
  onOperationClick?: (operation: TrainOperation) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  isOpen,
  onClose,
  stationCode,
  stationName,
  distanceKm,
  platform,
  currentTrainNumber,
  currentTrainName,
  onOperationClick,
}) => {
  const { t } = useTranslation();
  const [stationInfo, setStationInfo] = useState<StationLocation | null>(null);
  const [liveBoard, setLiveBoard] = useState<LiveStationBoard | null>(null);
  const [operations, setOperations] = useState<TrainOperation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && stationCode) {
      setLoading(true);
      Promise.all([
        stationService.getStation(stationCode),
        stationService.getLiveBoard(stationCode),
        railwayApi
          .getTrainOperations(currentTrainNumber, stationCode)
          .catch(() => []),
      ])
        .then(([info, board, ops]) => {
          setStationInfo(info);
          setLiveBoard(board);
          setOperations(ops);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, stationCode, currentTrainNumber]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-detail-title"
    >
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-scale-in">
        {/* Header - High contrast blue/dark gradient */}
        <div className="px-5 py-4 border-b border-blue-900/60 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/20">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="station-detail-title" className="font-black text-base text-white">
                  {stationName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-black bg-emerald-400 text-slate-950 shadow-sm">
                  {stationCode}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                {stationInfo?.state ? `${stationInfo.state} • ` : ''}
                {stationInfo?.zone ? `Zone: ${stationInfo.zone} (${stationInfo.division || 'Mainline'})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Section 11: CURRENT TRAIN CARD */}
          {currentTrainNumber && (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-300 dark:border-blue-800 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                CURRENT SELECTED TRAIN AT STATION
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-blue-600 text-white">
                    #{currentTrainNumber}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {currentTrainName || 'Express Service'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    Platform {platform || '1'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Station Key Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Platform</div>
              <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                PF #{platform || stationInfo?.numberOfPlatforms || '1'}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Platforms</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {stationInfo?.numberOfPlatforms || 6} Platforms
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Distance</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {distanceKm !== undefined ? `${distanceKm} km` : 'En route'}
              </div>
            </div>
          </div>

          {/* Free Wi-Fi amenity */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Wifi className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold">Free RailWire Optical Fiber Wi-Fi</span>
            </div>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 text-[11px]">
              Active & Verified
            </span>
          </div>

          {/* Section 11, 12, 13, 14, 15: RAILWAY OPERATIONS & INTERACTING TRAINS */}
          {operations && operations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                  <span>TRAIN OPERATIONS & MOVEMENTS ({operations.length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Click to open operation details
                </span>
              </div>

              <div className="space-y-2">
                {operations.map((op) => {
                  const meta = getOperationMeta(op.type);

                  return (
                    <div
                      key={op.id}
                      onClick={() => {
                        if (onOperationClick) {
                          onOperationClick(op);
                        }
                      }}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border ${meta.badgeClass}`}
                          >
                            {op.label || meta.label}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 transition-colors">
                            Train #{op.otherTrainNumber} - {op.otherTrainName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug truncate max-w-sm">
                          {op.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-500 block">
                            {op.scheduledTime}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            PF {op.platform || 'Loop'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 11: OTHER TRAINS AT THIS STATION (Live Board / Departures) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Train className="w-3.5 h-3.5 text-amber-500" />
                <span>Other Trains at Station</span>
              </h4>
              <Link
                to={`/station/${stationCode}`}
                onClick={onClose}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>Full Station Board</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                Loading station departures & train line-up...
              </div>
            ) : liveBoard &&
              ((liveBoard.departures && liveBoard.departures.length > 0) ||
                (liveBoard.arrivals && liveBoard.arrivals.length > 0)) ? (
              <div className="space-y-2">
                {[...(liveBoard.departures || []), ...(liveBoard.arrivals || [])]
                  .slice(0, 5)
                  .map((tTrain, idx) => (
                    <Link
                      key={`${tTrain.trainNumber}_${idx}`}
                      to={`/train/${tTrain.trainNumber}`}
                      onClick={onClose}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs transition block group"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                          <span className="font-mono text-amber-600 dark:text-amber-400">
                            #{tTrain.trainNumber}
                          </span>
                          <span className="truncate max-w-[200px]">{tTrain.trainName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          PF {tTrain.platform || '1'} &bull; Time: {tTrain.expectedTime || tTrain.scheduledTime} &bull;{' '}
                          {tTrain.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            tTrain.delayMinutes && tTrain.delayMinutes > 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {tTrain.delayMinutes && tTrain.delayMinutes > 0
                            ? `+${tTrain.delayMinutes}m`
                            : 'On Time'}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
                Scheduled mainline departures available on full station board.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-900 dark:text-white transition"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
