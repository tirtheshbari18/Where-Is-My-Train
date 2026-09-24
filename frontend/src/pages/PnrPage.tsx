import React, { useState } from 'react';
import {
  Ticket,
  Search,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { railwayApi, PnrStatus } from '../api/railwayApi.js';

export const PnrPage: React.FC = () => {
  const [pnr, setPnr] = useState('');
  const [pnrData, setPnrData] = useState<PnrStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [officialUrl, setOfficialUrl] = useState(
    'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html'
  );
  const [complianceNotice, setComplianceNotice] = useState<string | null>(null);

  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPnr = pnr.trim();
    if (!/^\d{10}$/.test(cleanPnr)) {
      setError('Please enter a valid 10-digit Indian Railways PNR number.');
      return;
    }

    setLoading(true);
    setError(null);
    setPnrData(null);

    try {
      const res = await railwayApi.getPnrStatus(cleanPnr);
      setPnrData(res.data);
      if (res.officialPortalUrl) setOfficialUrl(res.officialPortalUrl);
      if (res.complianceNotice) setComplianceNotice(res.complianceNotice);
    } catch (err: any) {
      setError(err.message || 'Unable to check PNR status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Ticket className="w-7 h-7 text-amber-400" />
          <span>PNR Status & Journey Confirmation</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inquire 10-digit Passenger Name Record (PNR) status via authorized Indian Railways gateway.
        </p>
      </div>

      {/* Authorized Data Compliance Alert */}
      <div className="glass-panel rounded-2xl p-4 border border-blue-500/30 text-xs text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-white">Compliance & Transparency Policy</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {complianceNotice || 'In compliance with Indian Railways and CRIS guidelines, live PNR status requires authorized ticketing integration. When running in development mode, standard sandbox responses are provided alongside direct access to the official IRCTC/CRIS verification portal.'}
          </p>
        </div>
      </div>

      {/* PNR Input Box */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <form onSubmit={handlePnrSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Enter 10-Digit PNR Number
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={10}
                value={pnr}
                onChange={(e) => setPnr(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 8421098765"
                className="w-full bg-slate-950 text-white font-mono font-bold text-lg rounded-2xl pl-12 pr-4 py-3.5 border border-slate-700 focus:border-amber-500 focus:outline-none tracking-widest"
              />
              <Ticket className="w-5 h-5 text-amber-400 absolute left-4 top-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check PNR Status</span>
                </>
              )}
            </button>

            <a
              href={officialUrl}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <span>Official IRCTC Enquiry</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </form>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PNR Results Card */}
      {pnrData && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                PNR Number
              </span>
              <span className="font-mono text-2xl font-black text-amber-400 tracking-wider">
                {pnrData.pnr}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Chart Status</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {pnrData.chartStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Train</span>
              <span className="font-bold text-white">
                {pnrData.trainNumber} - {pnrData.trainName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Date of Journey</span>
              <span className="font-mono text-white font-medium">{pnrData.dateOfJourney}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">From ➔ To</span>
              <span className="text-white font-medium">
                {pnrData.fromStation} ➔ {pnrData.toStation}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Class</span>
              <span className="text-white font-medium">{pnrData.reservationClass}</span>
            </div>
          </div>

          {/* Passenger Table */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Passenger Booking Status</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2">Passenger</th>
                    <th className="py-2">Booking Status</th>
                    <th className="py-2">Current Status</th>
                    <th className="py-2">Coach / Berth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pnrData.passengers.map((p) => (
                    <tr key={p.passengerNumber}>
                      <td className="py-3 font-semibold text-white">
                        Passenger {p.passengerNumber}
                      </td>
                      <td className="py-3 text-slate-300 font-mono">
                        {p.bookingStatus}
                      </td>
                      <td className="py-3 font-mono font-bold text-emerald-400">
                        {p.currentStatus}
                      </td>
                      <td className="py-3 font-mono text-amber-300">
                        {p.coach ? `${p.coach} / ${p.berth} (${p.berthType})` : 'To be charted'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance notice */}
          {pnrData.notice && (
            <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{pnrData.notice}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
