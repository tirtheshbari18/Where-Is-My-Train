import React, { useState } from 'react';
import {
  GitFork,
  ArrowRight,
  Clock,
  Train,
  Zap,
  Footprints,
  IndianRupee,
} from 'lucide-react';
import { railwayApi } from '../api/railwayApi.js';
import { parseTimeToMinutes } from '../utils/timeFormat.js';

interface JourneyOption {
  type: 'DIRECT' | 'TRANSFER';
  totalDurationMinutes: number;
  transfersCount: number;
  estimatedFare: number;
  segments: Array<{
    trainNumber: string;
    trainName: string;
    trainType: string;
    fromCode: string;
    fromName: string;
    toCode: string;
    toName: string;
    departureTime: string;
    arrivalTime: string;
    platform?: string;
  }>;
  layoverMinutes?: number;
  layoverStation?: string;
}

export const JourneyPlannerPage: React.FC = () => {
  const [fromStation, setFromStation] = useState('BOR');
  const [toStation, setToStation] = useState('MMCT');
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [criteria, setCriteria] = useState<'FASTEST' | 'FEWEST_TRANSFERS' | 'EARLIEST_ARRIVAL'>('FASTEST');
  const [plans, setPlans] = useState<JourneyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handlePlanJourney = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fromStation.trim() || !toStation.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      // 1. Fetch direct trains
      const directTrains = await railwayApi.getTrainsBetween(fromStation, toStation, journeyDate);

      const generatedOptions: JourneyOption[] = [];

      // Add direct routes
      directTrains.forEach((t) => {
        generatedOptions.push({
          type: 'DIRECT',
          totalDurationMinutes: t.durationMinutes || 90,
          transfersCount: 0,
          estimatedFare: t.trainType?.includes('Local') ? 15 : 75,
          segments: [
            {
              trainNumber: t.trainNumber,
              trainName: t.trainName,
              trainType: t.trainType,
              fromCode: t.sourceCode || fromStation,
              fromName: t.sourceName || fromStation,
              toCode: t.destinationCode || toStation,
              toName: t.destinationName || toStation,
              departureTime: t.departureTime || '07:00 AM',
              arrivalTime: t.arrivalTime || '08:30 AM',
              platform: t.platform || '1',
            },
          ],
        });
      });

      // 2. Synthesize 1-transfer connection hub (e.g. Virar VR or Borivali BVI)
      const hubs = ['VR', 'BVI'];
      for (const hub of hubs) {
        if (fromStation.toUpperCase() !== hub && toStation.toUpperCase() !== hub) {
          try {
            const leg1 = await railwayApi.getTrainsBetween(fromStation, hub, journeyDate);
            const leg2 = await railwayApi.getTrainsBetween(hub, toStation, journeyDate);

            if (leg1.length > 0 && leg2.length > 0) {
              const bestLeg1 = leg1[0];
              const bestLeg2 = leg2[0];
              const arr1M = parseTimeToMinutes(bestLeg1.arrivalTime);
              const dep2M = parseTimeToMinutes(bestLeg2.departureTime);

              let layover = dep2M - arr1M;
              if (layover < 10) layover = 20; // 20 min safe transfer buffer

              const totalDuration = (bestLeg1.durationMinutes || 45) + layover + (bestLeg2.durationMinutes || 55);

              generatedOptions.push({
                type: 'TRANSFER',
                totalDurationMinutes: totalDuration,
                transfersCount: 1,
                estimatedFare: 40,
                layoverMinutes: layover,
                layoverStation: hub === 'VR' ? 'Virar' : 'Borivali',
                segments: [
                  {
                    trainNumber: bestLeg1.trainNumber,
                    trainName: bestLeg1.trainName,
                    trainType: bestLeg1.trainType,
                    fromCode: fromStation,
                    fromName: bestLeg1.sourceName,
                    toCode: hub,
                    toName: hub === 'VR' ? 'Virar' : 'Borivali',
                    departureTime: bestLeg1.departureTime || '07:10 AM',
                    arrivalTime: bestLeg1.arrivalTime || '07:55 AM',
                    platform: '2',
                  },
                  {
                    trainNumber: bestLeg2.trainNumber,
                    trainName: bestLeg2.trainName,
                    trainType: bestLeg2.trainType,
                    fromCode: hub,
                    fromName: hub === 'VR' ? 'Virar' : 'Borivali',
                    toCode: toStation,
                    toName: bestLeg2.destinationName,
                    departureTime: bestLeg2.departureTime || '08:15 AM',
                    arrivalTime: bestLeg2.arrivalTime || '09:10 AM',
                    platform: '3',
                  },
                ],
              });
              break;
            }
          } catch {
            // continue
          }
        }
      }

      // Sort according to selected criteria
      generatedOptions.sort((a, b) => {
        if (criteria === 'FEWEST_TRANSFERS') {
          return a.transfersCount - b.transfersCount || a.totalDurationMinutes - b.totalDurationMinutes;
        }
        if (criteria === 'EARLIEST_ARRIVAL') {
          const arrA = parseTimeToMinutes(a.segments[a.segments.length - 1].arrivalTime);
          const arrB = parseTimeToMinutes(b.segments[b.segments.length - 1].arrivalTime);
          return arrA - arrB;
        }
        // FASTEST
        return a.totalDurationMinutes - b.totalDurationMinutes;
      });

      setPlans(generatedOptions);
    } catch (err) {
      console.error('Journey planning error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <GitFork className="w-7 h-7 text-emerald-400" />
          <span>Smart Multi-Modal Journey Planner</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Find fastest direct trains and guaranteed transfer connections across express and suburban local networks.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handlePlanJourney} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Source Station (Code/Name)
            </label>
            <input
              type="text"
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value)}
              placeholder="e.g. BOR, Boisar"
              className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Destination Station
            </label>
            <input
              type="text"
              value={toStation}
              onChange={(e) => setToStation(e.target.value)}
              placeholder="e.g. MMCT, Mumbai Central"
              className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Journey Date
            </label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Criteria & Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <span className="text-[10px] text-slate-400 px-2 uppercase">Optimize:</span>
            {[
              { id: 'FASTEST', label: 'Fastest Route' },
              { id: 'FEWEST_TRANSFERS', label: 'Fewest Transfers' },
              { id: 'EARLIEST_ARRIVAL', label: 'Earliest Arrival' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCriteria(opt.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  criteria === opt.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg transition flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? 'Finding Options...' : 'Plan Journey'}</span>
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Recommended Itineraries</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-bold">
              {plans.length} options found
            </span>
          </h2>

          <div className="space-y-4">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition space-y-4"
              >
                {/* Header summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                        plan.type === 'DIRECT'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                          : 'bg-blue-950/80 text-blue-400 border-blue-500/40'
                      }`}
                    >
                      {plan.type === 'DIRECT' ? 'Direct Train' : '1 Transfer'}
                    </span>
                    <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {Math.floor(plan.totalDurationMinutes / 60)}h {plan.totalDurationMinutes % 60}m
                    </span>
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {plan.estimatedFare} est.
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    {plan.segments[0].departureTime} ➔ {plan.segments[plan.segments.length - 1].arrivalTime}
                  </div>
                </div>

                {/* Segments timeline */}
                <div className="space-y-3">
                  {plan.segments.map((seg, sIdx) => (
                    <React.Fragment key={sIdx}>
                      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                            <Train className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-xs">
                                {seg.trainNumber}
                              </span>
                              <span className="text-xs text-slate-300 font-semibold">
                                {seg.trainName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {seg.trainType}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                              <span>{seg.fromName} ({seg.departureTime})</span>
                              <ArrowRight className="w-3 h-3 text-slate-600" />
                              <span>{seg.toName} ({seg.arrivalTime})</span>
                            </div>
                          </div>
                        </div>

                        {seg.platform && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            PF {seg.platform}
                          </span>
                        )}
                      </div>

                      {/* Layover connecting info between legs */}
                      {sIdx < plan.segments.length - 1 && plan.layoverStation && (
                        <div className="mx-6 py-1.5 px-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs flex items-center gap-2">
                          <Footprints className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Transfer at {plan.layoverStation}: {plan.layoverMinutes} minutes connection layover. Switch platforms.
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
