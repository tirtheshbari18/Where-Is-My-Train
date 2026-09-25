import React, { useState, useEffect } from 'react';
import { X, Bell, Volume2, Trash2, Check, Clock, AlertTriangle } from 'lucide-react';
import { alarmService, StationAlarm } from '../../services/alarmService.js';
import { useTranslation } from '../../context/LanguageContext.js';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  stations: Array<{
    stationCode: string;
    stationName: string;
    arrivalTime?: string;
    departureTime?: string;
  }>;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  stations,
}) => {
  const { t } = useTranslation();
  const [selectedStationCode, setSelectedStationCode] = useState(
    stations[0]?.stationCode || ''
  );
  const [alarmType, setAlarmType] = useState<'arrival' | 'departure'>('arrival');
  const [leadMinutes, setLeadMinutes] = useState<number>(10);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [alarms, setAlarms] = useState<StationAlarm[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAlarms(alarmService.getAlarms(trainNumber));
      if (typeof Notification !== 'undefined') {
        setPermissionState(Notification.permission);
      }
    }
  }, [isOpen, trainNumber]);

  if (!isOpen) return null;

  const currentStation = stations.find((s) => s.stationCode === selectedStationCode) || stations[0];

  const handleTestChime = () => {
    alarmService.playRailwayChime();
  };

  const handleRequestPermission = async () => {
    const granted = await alarmService.requestPermission();
    setPermissionState(granted ? 'granted' : 'denied');
  };

  const handleSaveAlarm = () => {
    if (!currentStation) return;

    const scheduledTime =
      alarmType === 'arrival'
        ? currentStation.arrivalTime || currentStation.departureTime || '00:00'
        : currentStation.departureTime || currentStation.arrivalTime || '00:00';

    alarmService.setAlarm({
      trainNumber,
      trainName,
      stationCode: currentStation.stationCode,
      stationName: currentStation.stationName,
      alarmType,
      leadMinutes,
      isEnabled: true,
      scheduledTime,
    });

    setAlarms(alarmService.getAlarms(trainNumber));
    setSuccessMessage(`Alarm set for ${currentStation.stationName} (${leadMinutes}m before)!`);
    setTimeout(() => setSuccessMessage(null), 3500);

    // If permission not granted, prompt
    if (permissionState === 'default') {
      handleRequestPermission();
    }
  };

  const handleToggle = (id: string) => {
    alarmService.toggleAlarm(id);
    setAlarms(alarmService.getAlarms(trainNumber));
  };

  const handleDelete = (id: string) => {
    alarmService.deleteAlarm(id);
    setAlarms(alarmService.getAlarms(trainNumber));
  };

  const handleTestTrigger = (alarm: StationAlarm) => {
    alarmService.triggerNotification(alarm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{t('actions.alarm')}</h3>
              <p className="text-xs text-slate-400">
                {trainNumber} &bull; {trainName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Permission banner if needed */}
          {permissionState === 'denied' && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>Browser notifications are blocked. Audio chimes will still ring.</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Station Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Destination / Alert Station
            </label>
            <select
              value={selectedStationCode}
              onChange={(e) => setSelectedStationCode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {stations.map((s) => (
                <option key={s.stationCode} value={s.stationCode}>
                  {s.stationName} ({s.stationCode}) &bull; Arr: {s.arrivalTime || '--:--'} | Dep: {s.departureTime || '--:--'}
                </option>
              ))}
            </select>
          </div>

          {/* Alarm Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAlarmType('arrival')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                alarmType === 'arrival'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
              }`}
            >
              Arrival Alarm
            </button>
            <button
              type="button"
              onClick={() => setAlarmType('departure')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                alarmType === 'departure'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
              }`}
            >
              Departure Alarm
            </button>
          </div>

          {/* Lead Time Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notify Me
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { min: 0, label: 'At station' },
                { min: 5, label: '5m before' },
                { min: 10, label: '10m before' },
                { min: 15, label: '15m before' },
              ].map(({ min, label }) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setLeadMinutes(min)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition ${
                    leadMinutes === min
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSaveAlarm}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
            >
              <Bell className="w-4 h-4" />
              <span>Set Alarm</span>
            </button>
            <button
              onClick={handleTestChime}
              title="Test Railway Chime"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-medium transition"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Test Chime</span>
            </button>
          </div>

          {/* Existing Alarms List */}
          {alarms.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Active Alarms for this Train ({alarms.length})
              </h4>
              <div className="space-y-2">
                {alarms.map((al) => (
                  <div
                    key={al.id}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <div className="font-semibold text-white">
                          {al.stationName} ({al.stationCode})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {al.alarmType === 'arrival' ? 'Arrival' : 'Departure'} &bull;{' '}
                          {al.leadMinutes > 0 ? `${al.leadMinutes}m before` : 'Exact time'} &bull;{' '}
                          {al.scheduledTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestTrigger(al)}
                        title="Trigger preview"
                        className="text-[10px] text-slate-400 hover:text-amber-300 px-1.5 py-0.5 rounded bg-slate-700"
                      >
                        Ring
                      </button>
                      <button
                        onClick={() => handleToggle(al.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          al.isEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {al.isEnabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => handleDelete(al.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
