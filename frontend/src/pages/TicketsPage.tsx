// frontend/src/pages/TicketsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  Trash2,
  Share2,
  Plus,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  Train,
  X,
  QrCode,
  Users,
} from 'lucide-react';
import { ticketService, SavedTicket } from '../services/ticketService.js';
import { TicketBookingCard } from '../components/tickets/TicketBookingCard.js';

export const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SavedTicket | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    ticketNumber: '',
    pnrNumber: '',
    trainNumber: '19417',
    trainName: 'Borivali - Vatva Express',
    sourceCode: 'BVI',
    sourceName: 'Borivali',
    destinationCode: 'DRD',
    destinationName: 'Dahanu Road',
    journeyDate: 'Tomorrow, 01:25 PM',
    departureTime: '01:25 PM',
    arrivalTime: '03:40 PM',
    passengerCount: 1,
    passengerName: 'Passenger 1',
    passengerAge: 25,
    coach: 'S2',
    berth: '34 (LB)',
    fare: 145,
    classType: 'Sleeper (SL)',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = () => {
    setTickets(ticketService.getTickets());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this ticket from your saved tickets?')) {
      ticketService.deleteTicket(id);
      loadTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket(null);
      }
    }
  };

  const handleShare = async (ticket: SavedTicket, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `🚆 Railway Ticket: ${ticket.trainNumber} ${ticket.trainName}\nTicket #: ${ticket.ticketNumber}${ticket.pnrNumber ? `\nPNR: ${ticket.pnrNumber}` : ''}\nRoute: ${ticket.sourceName} (${ticket.sourceCode}) ➔ ${ticket.destinationName} (${ticket.destinationCode})\nDate: ${ticket.journeyDate}\nStatus: ${ticket.status} | Class: ${ticket.classType}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket - ${ticket.trainNumber}`,
          text: shareText,
        });
      } catch (err) {
        console.log('Share canceled', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedId(ticket.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    ticketService.saveTicket({
      ticketNumber: formData.ticketNumber.trim() || `IR-${Math.floor(1000000 + Math.random() * 9000000)}`,
      pnrNumber: formData.pnrNumber.trim() || undefined,
      trainNumber: formData.trainNumber,
      trainName: formData.trainName,
      sourceCode: formData.sourceCode.toUpperCase(),
      sourceName: formData.sourceName,
      destinationCode: formData.destinationCode.toUpperCase(),
      destinationName: formData.destinationName,
      journeyDate: formData.journeyDate,
      departureTime: formData.departureTime,
      arrivalTime: formData.arrivalTime,
      passengerCount: Number(formData.passengerCount),
      passengers: [
        {
          name: formData.passengerName,
          age: Number(formData.passengerAge),
          gender: 'M',
          coach: formData.coach,
          berth: formData.berth,
          status: 'CNF',
        },
      ],
      fare: Number(formData.fare),
      classType: formData.classType,
      status: 'CONFIRMED',
    });
    setShowAddModal(false);
    loadTickets();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* 1. Ticket Booking on Confirmtkt (Section 20 & 21) */}
      <TicketBookingCard />

      {/* 2. Saved Offline Tickets Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TicketIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>My Saved Tickets</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access offline tickets, booking details, and journey credentials
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ticket</span>
          </button>
        </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
          <TicketIcon className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">No Tickets Saved Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
            Save your IRCTC e-tickets, suburban passes, or journey bookings here for quick offline access without network connection.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
            >
              {/* Top Banner / Bar */}
              <div className="bg-blue-600 dark:bg-blue-800 text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Train className="w-4 h-4" />
                  <span className="font-extrabold text-sm">{t.trainNumber}</span>
                  <span className="text-xs font-medium text-blue-100 truncate max-w-[200px] sm:max-w-xs">
                    {t.trainName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {t.isDemo && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                      Demo
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-200 font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{t.status}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">TICKET NUMBER</div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{t.ticketNumber}</div>
                  </div>
                  {t.pnrNumber && (
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">PNR NUMBER</div>
                      <div className="font-bold text-sm text-blue-600 dark:text-blue-400 font-mono">{t.pnrNumber}</div>
                    </div>
                  )}
                </div>

                {/* Stations & Time */}
                <div className="grid grid-cols-3 items-center py-2 border-t border-b border-slate-100 dark:border-slate-800 my-2">
                  <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">{t.sourceCode}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{t.sourceName}</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t.departureTime || 'Time not available'}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-medium">{t.classType}</span>
                    <div className="w-full flex items-center justify-center my-1">
                      <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700"></div>
                      <Train className="w-4 h-4 text-blue-500 mx-1" />
                      <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700"></div>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {t.passengerCount} {t.passengerCount === 1 ? 'Passenger' : 'Passengers'}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 dark:text-white">{t.destinationCode}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{t.destinationName}</div>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                      {t.arrivalTime || 'Time not available'}
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t.journeyDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleShare(t, e)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Share ticket"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(t.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Delete ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Indian Railways E-Ticket</span>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Train className="w-5 h-5" />
                  {selectedTicket.trainNumber} - {selectedTicket.trainName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-blue-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* QR Code & Status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <QrCode className="w-12 h-12 text-slate-900" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">TICKET REF</div>
                    <div className="font-black text-sm text-slate-800 dark:text-slate-100">{selectedTicket.ticketNumber}</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">● CONFIRMED</div>
                  </div>
                </div>
                {selectedTicket.pnrNumber && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-mono">PNR NUMBER</div>
                    <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                      {selectedTicket.pnrNumber}
                    </div>
                  </div>
                )}
              </div>

              {/* Station Route */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>Journey Date: {selectedTicket.journeyDate}</span>
                  <span>Class: {selectedTicket.classType}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="font-black text-lg text-slate-900 dark:text-white">{selectedTicket.sourceCode}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{selectedTicket.sourceName}</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Dep: {selectedTicket.departureTime || 'Not available'}
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <span className="text-[10px] text-slate-400">Direct Express</span>
                    <div className="w-16 h-0.5 bg-blue-500 my-1"></div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg text-slate-900 dark:text-white">{selectedTicket.destinationCode}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{selectedTicket.destinationName}</div>
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      Arr: {selectedTicket.arrivalTime || 'Not available'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Passenger Details
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedTicket.passengers.map((p, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {p.name}
                          {p.age ? ` (${p.age}, ${p.gender})` : ''}
                        </div>
                        <div className="text-slate-500">
                          Coach: <span className="font-semibold text-blue-600 dark:text-blue-400">{p.coach || 'Not available'}</span> | Berth:{' '}
                          <span className="font-semibold">{p.berth || 'Not available'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fare */}
              <div className="flex items-center justify-between text-xs p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="font-medium text-slate-600 dark:text-slate-400">Total Fare Paid</span>
                <span className="font-black text-base text-slate-900 dark:text-white">
                  {typeof selectedTicket.fare === 'number' ? `₹${selectedTicket.fare}` : 'Not available'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Link
                  to={`/train/${selectedTicket.trainNumber}`}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition"
                >
                  <Train className="w-4 h-4" />
                  Track Live Train
                </Link>
                <button
                  onClick={(e) => handleShare(selectedTicket, e)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <TicketIcon className="w-5 h-5" />
                Save New Ticket Locally
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-emerald-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Train Number</label>
                  <input
                    type="text"
                    required
                    value={formData.trainNumber}
                    onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Train Name</label>
                  <input
                    type="text"
                    required
                    value={formData.trainName}
                    onChange={(e) => setFormData({ ...formData, trainName: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Source (e.g. BOR)</label>
                  <input
                    type="text"
                    required
                    value={formData.sourceCode}
                    onChange={(e) => setFormData({ ...formData, sourceCode: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Destination (e.g. DRD)</label>
                  <input
                    type="text"
                    required
                    value={formData.destinationCode}
                    onChange={(e) => setFormData({ ...formData, destinationCode: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Departure Time</label>
                  <input
                    type="text"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Arrival Time</label>
                  <input
                    type="text"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Passenger Name</label>
                <input
                  type="text"
                  required
                  value={formData.passengerName}
                  onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Coach (e.g. S2, GEN)</label>
                  <input
                    type="text"
                    value={formData.coach}
                    onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Berth (e.g. 42 MB)</label>
                  <input
                    type="text"
                    value={formData.berth}
                    onChange={(e) => setFormData({ ...formData, berth: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Optional PNR (10 digits)</label>
                  <input
                    type="text"
                    value={formData.pnrNumber}
                    onChange={(e) => setFormData({ ...formData, pnrNumber: e.target.value })}
                    placeholder="8429104821"
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Fare (₹)</label>
                  <input
                    type="number"
                    value={formData.fare}
                    onChange={(e) => setFormData({ ...formData, fare: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition"
              >
                Save Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {copiedId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-in fade-in">
          Ticket details copied to clipboard!
        </div>
      )}
    </div>
  );
};
