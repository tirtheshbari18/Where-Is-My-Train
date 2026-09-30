// frontend/src/components/tickets/TicketBookingCard.tsx
// Ticket Search & Booking Card on Confirmtkt (Requirements 20 & 21)

import React, { useState } from 'react';
import { ArrowUpDown, Calendar, ExternalLink, ShieldCheck, Ticket } from 'lucide-react';
import { StationAutocomplete } from '../common/StationAutocomplete.js';
import { ticketBookingService, SUPPORTED_QUOTAS } from '../../services/ticketBookingService.js';

export const TicketBookingCard: React.FC = () => {
  const [fromStation, setFromStation] = useState('BOR');
  const [toStation, setToStation] = useState('DRD');

  const todayIso = new Date().toISOString().split('T')[0];
  const [journeyDate, setJourneyDate] = useState(todayIso);
  const [quota, setQuota] = useState('GN');

  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleBookOnConfirmtkt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation || !toStation) {
      alert('Please select both Origin and Destination stations.');
      return;
    }
    ticketBookingService.openBooking(fromStation, toStation, journeyDate || todayIso, quota);
  };

  const formattedDateDisplay = () => {
    if (!journeyDate) return 'Select journey date';
    const d = new Date(journeyDate);
    if (isNaN(d.getTime())) return journeyDate;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              IRCTC TRAIN TICKET BOOKING
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Book Train Tickets
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => ticketBookingService.openMyBookings()}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Your tickets on Confirmtkt</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleBookOnConfirmtkt} className="space-y-4">
        {/* Stations Input with Swap */}
        <div className="space-y-3 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase tracking-wider">
              Origin Station
            </label>
            <StationAutocomplete
              label=""
              value={fromStation}
              placeholder="e.g. Boisar (BOR)"
              onChange={(code) => setFromStation(code)}
            />
          </div>

          <div className="flex justify-end -my-2 relative z-10 mr-4">
            <button
              type="button"
              onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md transition-transform active:rotate-180"
              aria-label="Swap stations"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          <div className="-mt-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase tracking-wider">
              Destination Station
            </label>
            <StationAutocomplete
              label=""
              value={toStation}
              placeholder="e.g. Dahanu Road (DRD)"
              onChange={(code) => setToStation(code)}
            />
          </div>
        </div>

        {/* Date & Quota Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Journey Date */}
          <div>
            <div className="flex items-center justify-between mb-1 ml-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Journey Date
              </label>
              {journeyDate && (
                <button
                  type="button"
                  onClick={() => setJourneyDate('')}
                  className="text-[10px] text-slate-400 hover:text-rose-500"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="date"
                  min={todayIso}
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setJourneyDate(todayIso)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0"
              >
                Today
              </button>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 ml-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formattedDateDisplay()}</span>
            </div>
          </div>

          {/* Quota Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase tracking-wider">
              Quota
            </label>
            <select
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {SUPPORTED_QUOTAS.map((q) => (
                <option key={q.code} value={q.code}>
                  {q.code} - {q.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 ml-1">
              {SUPPORTED_QUOTAS.find((q) => q.code === quota)?.description}
            </p>
          </div>
        </div>

        {/* Primary Booking Button: "Book tickets on Confirmtkt" */}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition tracking-wider uppercase"
        >
          <ExternalLink className="w-5 h-5" />
          <span>Book tickets on Confirmtkt</span>
        </button>

        <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>IRCTC Authorized Partner Booking & Instant Cancellation Refunds</span>
        </div>
      </form>
    </div>
  );
};
