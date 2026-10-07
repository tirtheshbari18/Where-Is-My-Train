import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, BellOff, AlertTriangle } from 'lucide-react';

export type AlarmTriggerOption = '10_KM' | '5_KM' | '2_KM' | 'NEXT_STATION';

interface DestinationAlarmProps {
  destinationName: string;
  destinationCode: string;
  distanceRemainingKm?: number | null;
  isNextStationDestination?: boolean;
  className?: string;
}

export const DestinationAlarm: React.FC<DestinationAlarmProps> = ({
  destinationName,
  destinationCode,
  distanceRemainingKm,
  isNextStationDestination = false,
  className = '',
}) => {
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [selectedOption, setSelectedOption] = useState<AlarmTriggerOption>('5_KM');
  const [hasTriggered, setHasTriggered] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play audio chime using browser Web Audio API
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const now = ctx.currentTime;
      // First beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second higher chime beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.2); // A5
      gain2.gain.setValueAtTime(0.4, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.6);

      // Hardware vibration if supported on Android / mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 400]);
      }
    } catch (e) {
      console.warn('Audio chime failed to play:', e);
    }
  };

  // Evaluate alarm condition
  useEffect(() => {
    if (!alarmEnabled || hasTriggered) return;

    let shouldTrigger = false;

    if (selectedOption === 'NEXT_STATION') {
      if (isNextStationDestination) {
        shouldTrigger = true;
      }
    } else if (distanceRemainingKm !== null && distanceRemainingKm !== undefined) {
      const thresholdKm =
        selectedOption === '10_KM' ? 10 : selectedOption === '5_KM' ? 5 : 2;
      if (distanceRemainingKm <= thresholdKm) {
        shouldTrigger = true;
      }
    }

    if (shouldTrigger) {
      setHasTriggered(true);
      if (!audioPlayed) {
        playChime();
        setAudioPlayed(true);
      }
    }
  }, [alarmEnabled, selectedOption, distanceRemainingKm, isNextStationDestination, hasTriggered, audioPlayed]);

  const handleToggle = () => {
    if (alarmEnabled) {
      setAlarmEnabled(false);
      setHasTriggered(false);
      setAudioPlayed(false);
    } else {
      setAlarmEnabled(true);
      setHasTriggered(false);
      setAudioPlayed(false);
      // Pre-test audio permission briefly
      playChime();
    }
  };

  const options: { id: AlarmTriggerOption; label: string; desc: string }[] = [
    { id: '10_KM', label: '10 km', desc: '10 km before reaching' },
    { id: '5_KM', label: '5 km', desc: '5 km before reaching' },
    { id: '2_KM', label: '2 km', desc: '2 km before reaching' },
    { id: 'NEXT_STATION', label: 'Next station', desc: 'When entering previous station' },
  ];

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        hasTriggered
          ? 'bg-amber-950/90 border-amber-500 shadow-xl shadow-amber-950/50'
          : alarmEnabled
          ? 'bg-slate-900/90 border-blue-500/60 shadow-lg'
          : 'bg-slate-900/50 border-slate-800'
      } ${className}`}
    >
      {/* Header and Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              hasTriggered
                ? 'bg-amber-500 text-slate-950 animate-bounce'
                : alarmEnabled
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {hasTriggered ? (
              <BellRing className="w-5 h-5" />
            ) : alarmEnabled ? (
              <Bell className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Alert Me Before Destination</span>
              {alarmEnabled && (
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Active
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">
              Wake up / prepare before arriving at {destinationName} ({destinationCode})
            </p>
          </div>
        </div>

        {/* Clear ON/OFF Switch */}
        <button
          type="button"
          onClick={handleToggle}
          role="switch"
          aria-checked={alarmEnabled}
          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
            alarmEnabled ? 'bg-blue-600' : 'bg-slate-700'
          }`}
        >
          <span className="sr-only">Toggle Destination Alarm</span>
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[9px] font-black uppercase ${
              alarmEnabled ? 'translate-x-7 text-blue-600' : 'translate-x-0 text-slate-500'
            }`}
          >
            {alarmEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Trigger Notification Banner if fired */}
      {hasTriggered && (
        <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/60 rounded-xl flex items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              DESTINATION REACHING SOON! Prepare to deboard at {destinationName}.
            </span>
          </div>
          <button
            onClick={() => {
              setHasTriggered(false);
              setAlarmEnabled(false);
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Threshold Selector Pills */}
      {alarmEnabled && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Ring chime when train is within:</span>
            {distanceRemainingKm !== null && distanceRemainingKm !== undefined && (
              <span className="text-blue-400 font-mono font-medium">
                {distanceRemainingKm.toFixed(1)} km away
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {options.map((opt) => {
              const active = selectedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedOption(opt.id);
                    setHasTriggered(false);
                  }}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition ${
                    active
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
