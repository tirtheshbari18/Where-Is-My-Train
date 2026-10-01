import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ChevronsRight,
  ShieldAlert,
  Train,
  Clock,
  Layers,
  Filter,
  Search,
  ExternalLink,
  Activity,
  Droplets,
  Users,
  Repeat,
} from 'lucide-react';
import { TrainOperation } from '../../api/railwayApi.js';
import {
  getOperationMeta,
  extractUniqueOperationTypes,
  formatOperationType,
} from '../../utils/operationRegistry.js';

interface TrainOperationsViewProps {
  operations: TrainOperation[];
  trainNumber: string;
  trainName?: string;
  onStationClick?: (stationCode: string) => void;
  onOperationClick?: (operation: TrainOperation) => void;
}

export const TrainOperationsView: React.FC<TrainOperationsViewProps> = ({
  operations,
  trainNumber,
  trainName,
  onStationClick,
  onOperationClick,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamically extract all available operation types from source data (Section 32)
  const availableTypes = useMemo(() => {
    return extractUniqueOperationTypes(operations);
  }, [operations]);

  // Unique stations in this train's operations
  const stations = useMemo(() => {
    const map = new Map<string, string>();
    operations.forEach((op) => {
      map.set(op.stationCode, op.stationName);
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [operations]);

  // Search and Filter logic (Section 33)
  const filteredOperations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return operations.filter((op) => {
      // Type filter
      const matchesType =
        typeFilter === 'ALL' || op.type.toUpperCase() === typeFilter.toUpperCase();

      // Station filter
      const matchesStation =
        stationFilter === 'ALL' ||
        op.stationCode.toUpperCase() === stationFilter.toUpperCase();

      // Search box filter (Train number, Station, Other train, Operation type)
      const matchesSearch =
        !query ||
        op.trainNumber.toLowerCase().includes(query) ||
        op.otherTrainNumber.toLowerCase().includes(query) ||
        op.otherTrainName.toLowerCase().includes(query) ||
        op.stationCode.toLowerCase().includes(query) ||
        op.stationName.toLowerCase().includes(query) ||
        op.type.toLowerCase().includes(query) ||
        (op.label && op.label.toLowerCase().includes(query)) ||
        op.description.toLowerCase().includes(query);

      return matchesType && matchesStation && matchesSearch;
    });
  }, [operations, typeFilter, stationFilter, searchQuery]);

  // Group by station dynamically
  const groupedByStation = useMemo(() => {
    const groups: Record<string, { stationName: string; ops: TrainOperation[] }> = {};
    filteredOperations.forEach((op) => {
      if (!groups[op.stationCode]) {
        groups[op.stationCode] = { stationName: op.stationName, ops: [] };
      }
      groups[op.stationCode].ops.push(op);
    });
    return groups;
  }, [filteredOperations]);

  // Render icon based on iconType
  const renderOperationIcon = (iconType: string) => {
    switch (iconType) {
      case 'OVERTAKING':
        return <ChevronsRight className="w-4 h-4 text-emerald-500" />;
      case 'OVERTAKEN':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'PASSING':
        return <Train className="w-4 h-4 text-purple-500" />;
      case 'WATERING':
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case 'CREW':
        return <Users className="w-4 h-4 text-cyan-500" />;
      case 'LOCO':
        return <Repeat className="w-4 h-4 text-orange-500" />;
      case 'CROSSING':
      default:
        return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl border border-blue-800/60 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-200 border border-blue-400/40">
                INDIAN RAIL INFO OPERATIONS REGISTRY
              </span>
              <span className="text-xs text-blue-200/80">
                {operations.length} Total Verified Events
              </span>
            </div>
            <h2 className="text-xl font-black mt-1">Train Operations & Interactions</h2>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Scheduled crossings, overtakings, precedence, and operational lineups for #{trainNumber}{' '}
              {trainName ? `(${trainName})` : ''}.
            </p>
          </div>

          {/* Search & Station Filter Toolbar (Sections 32 & 33) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* Station dropdown */}
            <div className="relative">
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 bg-slate-950/80 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              >
                <option value="ALL">All Stations ({stations.length})</option>
                {stations.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Search Box (Section 33) */}
            <div className="w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search train, station, type..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-blue-400/40 rounded-xl text-xs text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Operation Filter Pills (Section 32) */}
        <div className="pt-2 border-t border-blue-800/60 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-blue-200 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-300" />
            <span>Types:</span>
          </span>
          {availableTypes.map((typeKey) => {
            const isSelected = typeFilter.toUpperCase() === typeKey.toUpperCase();
            const label = typeKey === 'ALL' ? `All (${operations.length})` : formatOperationType(typeKey);

            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => setTypeFilter(typeKey)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${isSelected
                    ? 'bg-blue-500 text-white shadow-md ring-2 ring-white/30'
                    : 'bg-blue-950/70 text-blue-200 hover:bg-blue-800/80 border border-blue-700/60'
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredOperations.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
            No Railway Operations Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No events match your current search query or filter. Try clearing filters or searching for another train number like &quot;12649&quot;.
          </p>
          {(searchQuery || typeFilter !== 'ALL' || stationFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setStationFilter('ALL');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Generic Dynamic Operations Rendering (Section 30 - NO SLICE(0, 3) LIMIT) */}
      <div className="space-y-6">
        {Object.entries(groupedByStation).map(([stationCode, group]) => (
          <div
            key={stationCode}
            className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-md overflow-hidden"
          >
            {/* Station Group Header */}
            <div
              onClick={() => onStationClick?.(stationCode)}
              className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-xs text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-md border-2 border-emerald-400 dark:border-emerald-700">
                  {stationCode}
                </span>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Station: {group.stationName}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {group.ops.length} Operational{' '}
                    {group.ops.length === 1 ? 'Interaction' : 'Interactions'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                <span>View Station Board</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* List of ALL Operations for this Station (Clickable to open Operation Details Panel) */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-4 space-y-2 sm:space-y-0">
              {group.ops.map((op) => {
                const meta = getOperationMeta(op.type);

                return (
                  <div
                    key={op.id}
                    onClick={() => onOperationClick?.(op)}
                    className="p-4 rounded-2xl hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Dynamic Operation Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black border ${meta.badgeClass}`}
                        >
                          {renderOperationIcon(meta.iconType)}
                          <span>{op.label || meta.label}</span>
                        </span>

                        <span className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Interacting Train: #{op.otherTrainNumber} - {op.otherTrainName}
                        </span>

                        {op.otherTrainRoute && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({op.otherTrainRoute})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {op.description}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
                        <span>Source: {op.source || 'Indian Rail Info'}</span>
                        {op.direction && (
                          <span>&bull; Direction: {op.direction}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {op.platform && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Layers className="w-3.5 h-3.5 text-amber-500" />
                          <span>PF {op.platform}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 font-mono font-black text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{op.scheduledTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
