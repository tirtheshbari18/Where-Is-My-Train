import React, { useState } from 'react';
import { X, Layers, Info, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.js';

interface Coach {
  position: number;
  code: string;
  type: string;
  className: string;
  totalSeats?: number;
}

interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  coaches?: Coach[];
}

export const CoachModal: React.FC<CoachModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  coaches: propCoaches,
}) => {
  const { t } = useTranslation();
  const [selectedCoachIndex, setSelectedCoachIndex] = useState<number>(0);

  if (!isOpen) return null;

  // Realistic fallback coach rake if train-specific composition is not provided
  const coaches: Coach[] = propCoaches && propCoaches.length > 0 ? propCoaches : [
    { position: 1, code: 'ENG', type: 'Locomotive', className: 'WAP-7 Electric Loco' },
    { position: 2, code: 'SLR', type: 'Guard / Luggage', className: 'Seating cum Luggage Rake' },
    { position: 3, code: 'GEN', type: 'General', className: 'Unreserved Second Class (GS)', totalSeats: 100 },
    { position: 4, code: 'GEN', type: 'General', className: 'Unreserved Second Class (GS)', totalSeats: 100 },
    { position: 5, code: 'S1', type: 'Sleeper', className: 'Sleeper Class (SL)', totalSeats: 72 },
    { position: 6, code: 'S2', type: 'Sleeper', className: 'Sleeper Class (SL)', totalSeats: 72 },
    { position: 7, code: 'S3', type: 'Sleeper', className: 'Sleeper Class (SL)', totalSeats: 72 },
    { position: 8, code: 'S4', type: 'Sleeper', className: 'Sleeper Class (SL)', totalSeats: 72 },
    { position: 9, code: 'PC', type: 'Pantry Car', className: 'Hot Buffet Pantry' },
    { position: 10, code: 'B1', type: 'AC 3 Tier', className: 'AC 3 Tier (3A)', totalSeats: 64 },
    { position: 11, code: 'B2', type: 'AC 3 Tier', className: 'AC 3 Tier (3A)', totalSeats: 64 },
    { position: 12, code: 'B3', type: 'AC 3 Tier', className: 'AC 3 Tier (3A)', totalSeats: 64 },
    { position: 13, code: 'A1', type: 'AC 2 Tier', className: 'AC 2 Tier (2A)', totalSeats: 48 },
    { position: 14, code: 'A2', type: 'AC 2 Tier', className: 'AC 2 Tier (2A)', totalSeats: 48 },
    { position: 15, code: 'H1', type: 'AC First Class', className: 'AC First Class (1A)', totalSeats: 24 },
    { position: 16, code: 'GEN', type: 'General', className: 'Unreserved Second Class (GS)', totalSeats: 100 },
    { position: 17, code: 'EOG', type: 'End on Gen', className: 'End on Generation & Guard' },
  ];

  const selectedCoach = coaches[selectedCoachIndex] || coaches[0];

  const getCoachStyle = (type: string, isSelected: boolean) => {
    let base = 'cursor-pointer transition-all transform ';
    if (isSelected) {
      base += 'ring-2 ring-amber-400 scale-105 shadow-lg ';
    } else {
      base += 'opacity-85 hover:opacity-100 hover:scale-102 ';
    }

    if (type.includes('Loco') || type === 'Engine') {
      return base + 'bg-gradient-to-br from-red-600 to-amber-700 text-white';
    }
    if (type.includes('First') || type.includes('1A')) {
      return base + 'bg-gradient-to-br from-amber-600 to-yellow-500 text-slate-950 font-bold';
    }
    if (type.includes('2 Tier') || type.includes('2A')) {
      return base + 'bg-gradient-to-br from-purple-700 to-indigo-700 text-white';
    }
    if (type.includes('3 Tier') || type.includes('3A') || type.includes('Economy')) {
      return base + 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white';
    }
    if (type.includes('Sleeper') || type.includes('SL')) {
      return base + 'bg-gradient-to-br from-blue-700 to-cyan-700 text-white';
    }
    if (type.includes('Pantry')) {
      return base + 'bg-gradient-to-br from-orange-600 to-amber-600 text-white';
    }
    return base + 'bg-slate-800 text-slate-200 border border-slate-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{t('actions.coach')}</h3>
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

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Movement Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-800">
            <span className="font-semibold text-amber-400">← Front / Engine</span>
            <span className="text-[11px] text-slate-400">Tap any coach to view details</span>
            <span className="font-semibold text-slate-400">Rear / Guard →</span>
          </div>

          {/* Rake Horizontal Scroll */}
          <div className="overflow-x-auto pb-4 pt-1">
            <div className="flex items-center gap-2 min-w-max px-1">
              {coaches.map((c, idx) => {
                const isSelected = idx === selectedCoachIndex;
                const isLoco = c.type.includes('Loco') || c.type === 'Engine';
                return (
                  <div key={`${c.code}_${idx}`} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedCoachIndex(idx)}
                      className={`w-16 h-20 rounded-xl flex flex-col justify-between p-2 text-left ${getCoachStyle(
                        c.type,
                        isSelected
                      )}`}
                    >
                      <div className="text-[10px] opacity-75 font-mono">#{c.position}</div>
                      <div className="font-extrabold text-sm text-center font-mono tracking-wider">
                        {c.code}
                      </div>
                      <div className="text-[9px] text-center truncate font-medium">
                        {isLoco ? 'Loco' : c.type.replace('AC ', '')}
                      </div>
                    </button>
                    {idx < coaches.length - 1 && (
                      <div className="w-1.5 h-0.5 bg-slate-700 mx-0.5 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Coach Detailed Card */}
          {selectedCoach && (
            <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                    Coach #{selectedCoach.position} Details
                  </span>
                  <h4 className="text-lg font-extrabold text-white mt-0.5">
                    Coach Code: {selectedCoach.code}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-slate-200 border border-slate-700">
                    {selectedCoach.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Class Full Name</div>
                  <div className="text-white font-medium mt-0.5 truncate">{selectedCoach.className}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Position From Front</div>
                  <div className="text-white font-medium mt-0.5">{selectedCoach.position} of {coaches.length}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Total Capacity</div>
                  <div className="text-white font-medium mt-0.5">
                    {selectedCoach.totalSeats ? `${selectedCoach.totalSeats} Berths / Seats` : 'Loco / Luggage / Guard'}
                  </div>
                </div>
              </div>

              {/* Berth Type Reference Guide */}
              {selectedCoach.totalSeats && (
                <div className="pt-2 border-t border-slate-700/60">
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Typical Berth Layout for {selectedCoach.type}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px] text-center">
                    <span className="bg-slate-900/90 py-1 px-1.5 rounded text-slate-300">LB (Lower)</span>
                    <span className="bg-slate-900/90 py-1 px-1.5 rounded text-slate-300">MB (Middle)</span>
                    <span className="bg-slate-900/90 py-1 px-1.5 rounded text-slate-300">UB (Upper)</span>
                    <span className="bg-slate-900/90 py-1 px-1.5 rounded text-slate-300">SL (Side Lower)</span>
                    <span className="bg-slate-900/90 py-1 px-1.5 rounded text-slate-300">SU (Side Upper)</span>
                    {selectedCoach.type.includes('3') && (
                      <span className="bg-slate-900/90 py-1 px-1.5 rounded text-slate-300">SM (Side Middle)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footnote */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Standard Indian Railways rake composition. May vary in case of rake turnaround.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
