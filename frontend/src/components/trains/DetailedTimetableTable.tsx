import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Edit2,
  MapPin,
  Gauge,
  Mountain,
  Building,
} from 'lucide-react';
import { DetailedTimetableRow } from '../../api/railwayApi';

interface DetailedTimetableTableProps {
  rows: DetailedTimetableRow[];
  trainNumber: string;
  selectedStationCode?: string;
  onStationClick?: (stationCode: string) => void;
  onEditPlatform?: (stationCode: string, stationName: string, currentPlatform: string) => void;
}

type SortField =
  | 'sequence'
  | 'stationName'
  | 'arrival'
  | 'departure'
  | 'distanceKm'
  | 'speedKmH'
  | 'elevationMeters'
  | 'haltMinutes';

export const DetailedTimetableTable: React.FC<DetailedTimetableTableProps> = ({
  rows,
  trainNumber,
  selectedStationCode,
  onStationClick,
  onEditPlatform,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('sequence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');

  // Extract unique zones for filtering
  const uniqueZones = useMemo(() => {
    const set = new Set(rows.map((r) => r.zone).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  // Filtering and Sorting
  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const matchesSearch =
          row.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.stationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.address.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesZone = zoneFilter === 'ALL' || row.zone === zoneFilter;

        return matchesSearch && matchesZone;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [rows, searchTerm, zoneFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-1 items-center gap-2 bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-700">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search station name, code, division or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white px-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Zone Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 text-xs">
            <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">
                All Zones ({rows.length})
              </option>
              {uniqueZones.map((z) => (
                <option key={z} value={z} className="bg-slate-900">
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* View toggle (desktop / mobile) */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('auto')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'auto'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Responsive auto switch"
            >
              Auto
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Force Full Table"
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cards View"
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Showing count indicator & status */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{filteredRows.length}</strong> of{' '}
          {rows.length} stations • Train #{trainNumber}
        </span>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          ● Click any row to view station operations & timetable
        </span>
      </div>

      {/* DESKTOP / TABLE VIEW (Horizontal & Vertical Scrollable) */}
      <div
        className={`${
          viewMode === 'cards'
            ? 'hidden'
            : viewMode === 'auto'
            ? 'hidden md:block'
            : 'block'
        } overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md`}
      >
        <div className="overflow-x-auto overflow-y-auto max-h-[700px] scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            {/* Dark Technical Railway Table Header */}
            <thead className="sticky top-0 z-20 bg-slate-900 text-slate-200 uppercase text-[11px] font-bold tracking-wider shadow-sm select-none">
              <tr>
                <th
                  onClick={() => handleSort('sequence')}
                  className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-800 w-12 border-b border-slate-700"
                >
                  <div className="flex items-center justify-center gap-1">
                    #
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center border-b border-slate-700 w-14">
                  Track
                </th>
                <th className="py-3 px-2.5 border-b border-slate-700 w-16">Code</th>
                <th
                  onClick={() => handleSort('stationName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-800 border-b border-slate-700 min-w-[160px]"
                >
                  <div className="flex items-center gap-1">
                    Station Name
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center border-b border-slate-700 w-12">
                  X/O
                </th>
                <th className="py-3 px-2.5 border-b border-slate-700 min-w-[100px]">
                  Note
                </th>
                <th
                  onClick={() => handleSort('arrival')}
                  className="py-3 px-2.5 cursor-pointer hover:bg-slate-800 border-b border-slate-700 w-20"
                >
                  <div className="flex items-center gap-1">
                    Arrival
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2.5 border-b border-slate-700 w-20 text-slate-400">
                  Avg Arr
                </th>
                <th
                  onClick={() => handleSort('departure')}
                  className="py-3 px-2.5 cursor-pointer hover:bg-slate-800 border-b border-slate-700 w-20"
                >
                  <div className="flex items-center gap-1">
                    Departure
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2.5 border-b border-slate-700 w-20 text-slate-400">
                  Avg Dep
                </th>
                <th
                  onClick={() => handleSort('haltMinutes')}
                  className="py-3 px-2 text-center cursor-pointer hover:bg-slate-800 border-b border-slate-700 w-16"
                >
                  <div className="flex items-center justify-center gap-1">
                    Halt
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center border-b border-slate-700 w-24">
                  Platform
                </th>
                <th className="py-3 px-2 text-center border-b border-slate-700 w-12">
                  Day
                </th>
                <th
                  onClick={() => handleSort('distanceKm')}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-800 border-b border-slate-700 w-20"
                >
                  <div className="flex items-center justify-end gap-1">
                    KM
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('speedKmH')}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-800 border-b border-slate-700 w-20"
                >
                  <div className="flex items-center justify-end gap-1">
                    Speed
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('elevationMeters')}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-800 border-b border-slate-700 w-20"
                >
                  <div className="flex items-center justify-end gap-1">
                    Elev
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center border-b border-slate-700 w-14">
                  Zone
                </th>
                <th className="py-3 px-2.5 border-b border-slate-700 min-w-[90px]">
                  Division
                </th>
                <th className="py-3 px-3 border-b border-slate-700 min-w-[140px]">
                  Address / City
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredRows.map((row) => (
                <tr
                  key={`${row.sequence}-${row.stationCode}`}
                  onClick={() => onStationClick?.(row.stationCode)}
                  className={`cursor-pointer transition-colors group ${
                    selectedStationCode && selectedStationCode.toUpperCase() === row.stationCode.toUpperCase()
                      ? 'bg-blue-100/90 dark:bg-blue-950/80 border-l-4 border-blue-600'
                      : 'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  {/* # Sequence */}
                  <td className="py-3 px-2.5 text-center font-bold text-slate-500 dark:text-slate-400">
                    {row.sequence}
                  </td>

                  {/* Track Indicator */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        row.track === 'MAIN'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {row.track}
                    </span>
                  </td>

                  {/* Station Code with IndiaRailInfo-style green badge */}
                  <td className="py-3 px-2.5">
                    <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/80">
                      {row.stationCode}
                    </span>
                  </td>

                  {/* Station Name */}
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {row.stationName}
                  </td>

                  {/* X/O Indicator */}
                  <td className="py-3 px-2 text-center">
                    {row.xo === 'O' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white">
                        O
                      </span>
                    )}
                    {row.xo === 'X' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                        X
                      </span>
                    )}
                    {row.xo === '-' && <span className="text-slate-300 dark:text-slate-700">-</span>}
                  </td>

                  {/* Note */}
                  <td className="py-3 px-2.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-[130px] truncate">
                    {row.note}
                  </td>

                  {/* Arrival */}
                  <td className="py-3 px-2.5 font-bold font-mono text-slate-700 dark:text-slate-200">
                    {row.arrival}
                  </td>

                  {/* Avg Arrival */}
                  <td className="py-3 px-2.5 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                    {row.averageArrival}
                  </td>

                  {/* Departure */}
                  <td className="py-3 px-2.5 font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {row.departure}
                  </td>

                  {/* Avg Departure */}
                  <td className="py-3 px-2.5 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                    {row.averageDeparture}
                  </td>

                  {/* Halt */}
                  <td className="py-3 px-2 text-center font-mono">
                    {row.haltMinutes > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                        {row.haltMinutes}m
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">pass</span>
                    )}
                  </td>

                  {/* Platform with edit button */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                        PF {row.platform || '--'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPlatform?.(row.stationCode, row.stationName, row.platform);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Platform Number"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Day */}
                  <td className="py-3 px-2 text-center font-bold text-slate-600 dark:text-slate-400">
                    {row.dayCount}
                  </td>

                  {/* Distance (KM) */}
                  <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                    {row.distanceKm.toFixed(1)}
                  </td>

                  {/* Speed */}
                  <td className="py-3 px-2.5 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    {row.speedKmH} <span className="text-[10px] text-slate-400">km/h</span>
                  </td>

                  {/* Elevation */}
                  <td className="py-3 px-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {row.elevationMeters}m
                  </td>

                  {/* Zone */}
                  <td className="py-3 px-2 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {row.zone}
                    </span>
                  </td>

                  {/* Division */}
                  <td className="py-3 px-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                    {row.division}
                  </td>

                  {/* Address */}
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[150px]">
                    {row.address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div
        className={`${
          viewMode === 'table'
            ? 'hidden'
            : viewMode === 'auto'
            ? 'block md:hidden'
            : 'block'
        } space-y-3`}
      >
        {filteredRows.map((row) => (
          <div
            key={`card-${row.sequence}-${row.stationCode}`}
            onClick={() => onStationClick?.(row.stationCode)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {row.sequence}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded text-xs">
                      {row.stationCode}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {row.stationName}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{row.address}</p>
                </div>
              </div>

              {/* Platform badge with edit */}
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                  PF {row.platform || '--'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPlatform?.(row.stationCode, row.stationName, row.platform);
                  }}
                  className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Time Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Arrival
                </span>
                <p className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                  {row.arrival}
                </p>
                <span className="text-[9px] text-slate-400">Avg {row.averageArrival}</span>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-700 px-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Halt</span>
                <p className="font-mono font-bold text-xs text-amber-700 dark:text-amber-400">
                  {row.haltMinutes > 0 ? `${row.haltMinutes}m` : 'Pass'}
                </p>
                <span className="text-[9px] text-slate-400">Day {row.dayCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Departure
                </span>
                <p className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  {row.departure}
                </p>
                <span className="text-[9px] text-slate-400">Avg {row.averageDeparture}</span>
              </div>
            </div>

            {/* Operational details footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1 font-mono font-semibold">
                <MapPin className="w-3 h-3 text-slate-400" />
                {row.distanceKm.toFixed(1)} km
              </span>
              <span className="flex items-center gap-1 font-mono text-blue-600 dark:text-blue-400">
                <Gauge className="w-3 h-3" />
                {row.speedKmH} km/h
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Mountain className="w-3 h-3 text-slate-400" />
                {row.elevationMeters}m
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                {row.zone}/{row.division}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
