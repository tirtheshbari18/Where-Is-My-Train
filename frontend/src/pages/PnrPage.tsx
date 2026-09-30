import React, { useState } from 'react';
import {
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  Users,
  Loader2,
  AlertCircle,
  Train,
  BookmarkPlus,
  Mic,
  X,
} from 'lucide-react';
import { pnrService } from '../services/pnrService.js';
import { ticketService } from '../services/ticketService.js';
import { PnrStatus } from '../api/railwayApi.js';
import { useRequestGuard } from '../hooks/useRequestGuard.js';

export const PnrPage: React.FC = () => {
  const [pnr, setPnr] = useState('');
  const [pnrData, setPnrData] = useState<PnrStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const searchGuard = useRequestGuard();

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        const digits = spoken.replace(/\D/g, '').slice(0, 10);
        if (digits) {
          setPnr(digits);
          if (digits.length === 10) {
            handlePnrSearch(digits);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Voice input error:', err);
      setIsListening(false);
    }
  };

  const handlePnrSearch = async (targetPnr?: string) => {
    const cleanPnr = (targetPnr || pnr).trim();
    if (!/^\d{10}$/.test(cleanPnr)) {
      setError('Please enter a valid 10-digit Indian Railways PNR number.');
      return;
    }

    const reqId = searchGuard.next();
    setLoading(true);
    setError(null);
    setPnrData(null);
    setSavedSuccess(false);

    try {
      const data = await pnrService.getStatus(cleanPnr);
      if (!searchGuard.isCurrent(reqId)) return;
      setPnrData(data);
    } catch (err: any) {
      if (!searchGuard.isCurrent(reqId)) return;
      setError(err.message || 'Unable to check PNR status.');
    } finally {
      if (searchGuard.isCurrent(reqId)) setLoading(false);
    }
  };

  const handleSaveToTickets = () => {
    if (!pnrData) return;
    const sourceCode = pnrData.fromStation.match(/\(([^)]+)\)/)?.[1] || '';
    const destCode = pnrData.toStation.match(/\(([^)]+)\)/)?.[1] || '';
    const statuses = pnrData.passengers.map((p) => p.currentStatus.toUpperCase());
    const ticketStatus: 'CONFIRMED' | 'RAC' | 'WAITLISTED' =
      statuses.some((s) => s.includes('RAC')) && !statuses.every((s) => s.includes('CNF') || s.includes('CONFIRM'))
        ? 'RAC'
        : statuses.every((s) => s.includes('CNF') || s.includes('CONFIRM'))
        ? 'CONFIRMED'
        : 'WAITLISTED';

    // Only fields the PNR provider actually returned are stored — no invented
    // times, fares, ages or coaches are written into the user's ticket record.
    ticketService.saveTicket({
      ticketNumber: `IR-${pnrData.pnr}`,
      pnrNumber: pnrData.pnr,
      trainNumber: pnrData.trainNumber,
      trainName: pnrData.trainName,
      sourceCode,
      sourceName: pnrData.fromStation.replace(/\([^)]+\)/, '').trim(),
      destinationCode: destCode,
      destinationName: pnrData.toStation.replace(/\([^)]+\)/, '').trim(),
      journeyDate: pnrData.dateOfJourney,
      passengerCount: pnrData.passengers.length,
      passengers: pnrData.passengers.map((p) => ({
        name: `Passenger ${p.passengerNumber}`,
        coach: p.coach,
        berth: p.berth !== undefined ? String(p.berth) : undefined,
        status: p.currentStatus,
      })),
      classType: pnrData.reservationClass,
      status: ticketStatus,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <span>PNR Enquiry & Passenger Status</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Check live berth allocation, coach status, and chart preparation for Indian Railways
        </p>
      </div>

      {/* Compliance / Transparency Notice */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-blue-200 dark:border-blue-900/60 shadow-sm text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-slate-900 dark:text-white">
            Official Data Gateway & Transparent Sandboxing
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            In compliance with CRIS guidelines, sandbox simulation data is provided for testing while allowing direct linkout to the official Indian Railways PNR verification portal.
          </p>
        </div>
      </div>

      {/* PNR Search Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePnrSearch();
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Enter Your PNR No
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                maxLength={10}
                value={pnr}
                onChange={(e) => setPnr(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter Your PNR No (10 digits)"
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-lg rounded-xl pl-11 pr-20 py-3 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none tracking-widest"
              />
              <FileText className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <div className="absolute right-2.5 flex items-center gap-1">
                {pnr && (
                  <button
                    type="button"
                    onClick={() => setPnr('')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                    title="Clear PNR"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-lg transition ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={isListening ? 'Listening...' : 'Voice input'}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
            {isListening && (
              <p className="text-[11px] text-rose-500 font-bold mt-1 ml-1 animate-pulse">
                🎙️ Listening for PNR digits... Speak now
              </p>
            )}
          </div>

          {/* Quick Try Samples */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Sample PNRs (demo data):</span>
            {[
              { label: '2451234567 (19417 Borivali-Vatva)', pnr: '2451234567' },
              { label: '4829104821 (22956 Kutch SF)', pnr: '4829104821' },
            ].map((sample) => (
              <button
                key={sample.pnr}
                type="button"
                onClick={() => {
                  setPnr(sample.pnr);
                  handlePnrSearch(sample.pnr);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-semibold transition"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking IRCTC Gateway...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find PNR Status</span>
                </>
              )}
            </button>

            <a
              href="https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
            >
              <span>Official IRCTC Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PNR Search Results */}
      {pnrData && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          {/* Header Banner */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5 text-amber-300" />
              <div>
                <span className="font-extrabold text-sm">{pnrData.trainNumber} - {pnrData.trainName}</span>
                <div className="text-[11px] text-blue-100 font-mono">PNR: {pnrData.pnr}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                {pnrData.chartStatus}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Journey Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">From</span>
                <div className="font-black text-slate-800 dark:text-slate-200 mt-0.5">{pnrData.fromStation}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">To</span>
                <div className="font-black text-slate-800 dark:text-slate-200 mt-0.5">{pnrData.toStation}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Journey Date</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{pnrData.dateOfJourney}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Class</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{pnrData.reservationClass}</div>
              </div>
            </div>

            {/* Passenger List */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Passenger Booking Status</span>
              </h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {pnrData.passengers.map((p) => (
                  <div key={p.passengerNumber} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Passenger #{p.passengerNumber}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        Booking Status: <span className="font-mono">{p.bookingStatus}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        {p.currentStatus}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Coach: <span className="font-bold text-blue-600 dark:text-blue-400">{p.coach}</span> | Berth: <span className="font-bold">{p.berth}</span> ({p.berthType})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparency / Demo Notice */}
            {pnrData.notice && (
              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-300 dark:border-amber-800 leading-relaxed">
                {pnrData.notice}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveToTickets}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>{savedSuccess ? 'Saved to My Tickets!' : 'Save To My Tickets'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
