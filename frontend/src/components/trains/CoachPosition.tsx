import React from 'react';
import { TrainCoachComposition } from '../../api/railwayApi.js';
import { ShieldCheck, Info } from 'lucide-react';

interface Props {
  composition: TrainCoachComposition;
}

export const CoachPosition: React.FC<Props> = ({ composition }) => {
  const getCoachColor = (type: string) => {
    switch (type) {
      case 'Engine':
        return 'bg-gradient-to-r from-red-600 to-amber-600 text-white';
      case 'Executive Chair Car':
      case 'AC 1 Tier':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white';
      case 'AC Chair Car':
      case 'AC 2 Tier':
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white';
      case 'AC 3 Tier':
      case 'AC 3 Economy':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';
      case 'Sleeper':
        return 'bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 font-bold';
      case 'Guard / Luggage':
        return 'bg-slate-700 text-slate-200';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Rake Coach Composition</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {composition.coaches.length} Coaches
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Arranged in sequence from Locomotive (front) to Guard Van (rear)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Confidence:</span>
          <span className="text-emerald-400 font-semibold">{composition.confidence}</span>
        </div>
      </div>

      {/* Rake Diagram Scroll Container */}
      <div className="overflow-x-auto pb-4 pt-2">
        <div className="flex items-center gap-2 min-w-max">
          {composition.coaches.map((coach, index) => {
            const isEngine = coach.type === 'Engine';
            const isLast = index === composition.coaches.length - 1;

            return (
              <div key={`${coach.code}_${index}`} className="flex items-center">
                {/* Single Coach Box */}
                <div
                  className={`w-20 h-24 rounded-xl flex flex-col justify-between p-2 shadow-md transition hover:scale-105 ${getCoachColor(
                    coach.type
                  )}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono opacity-80">#{coach.position}</span>
                    {coach.hasPantry && (
                      <span className="text-[9px] px-1 rounded bg-black/40">🍴</span>
                    )}
                  </div>

                  <div className="text-center font-mono font-extrabold text-sm tracking-wider">
                    {coach.code}
                  </div>

                  <div className="text-[9px] text-center truncate opacity-90 font-medium">
                    {isEngine ? 'Locomotive' : coach.type.replace('AC ', '')}
                  </div>
                </div>

                {/* Coupling Link between coaches */}
                {!isLast && (
                  <div className="w-2 h-1 bg-slate-700 rounded-full mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Provenance Footnote */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Data Source: <strong className="text-slate-300">{composition.source}</strong></span>
        </div>
        <span className="text-slate-400">Platform coach indicators may vary due to operational rake reversals.</span>
      </div>
    </div>
  );
};
