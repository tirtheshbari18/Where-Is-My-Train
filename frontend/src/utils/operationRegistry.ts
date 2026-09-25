/**
 * Dynamic Railway Operation Registry
 *
 * Implements a generic, open-ended operation architecture as required by sections 8, 9, 10, 30, 32.
 * Does NOT hardcode a 3-operation limit. Any source-defined operation type is dynamically
 * classified, labeled, and styled with high-contrast railway themes.
 */

export interface OperationMeta {
  type: string;
  label: string;
  badgeClass: string;
  borderClass: string;
  iconType:
    | 'CROSSING'
    | 'OVERTAKING'
    | 'OVERTAKEN'
    | 'PRECEDENCE'
    | 'PASSING'
    | 'WATERING'
    | 'CREW'
    | 'LOCO'
    | 'PLATFORM'
    | 'TECH'
    | 'PARALLEL'
    | 'ATTACH'
    | 'MEET'
    | 'GENERIC';
  category: string;
  description: string;
}

// Built-in style registry for known Indian Rail Info operational events
const KNOWN_OPERATIONS: Record<string, Partial<OperationMeta>> = {
  CROSSING: {
    label: 'Crossing',
    iconType: 'CROSSING',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700',
    borderClass: 'border-blue-400',
    category: 'Track Crossing',
    description: 'Scheduled dynamic crossing with another train on dual/multiple tracks.',
  },
  XING: {
    label: 'Crossing (Xing)',
    iconType: 'CROSSING',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700',
    borderClass: 'border-blue-400',
    category: 'Track Crossing',
    description: 'Crossing train meeting at station passing loops.',
  },
  OVERTAKING: {
    label: 'Overtaking (Leading)',
    iconType: 'OVERTAKING',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700',
    borderClass: 'border-emerald-400',
    category: 'Overtaking',
    description: 'This train overtakes another slower train held on loop line or adjacent track.',
  },
  OVERTAKEN: {
    label: 'Overtaken by',
    iconType: 'OVERTAKEN',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700',
    borderClass: 'border-rose-400',
    category: 'Overtaken',
    description: 'Another high-priority train overtakes this train while held at platform/loop.',
  },
  OVERTAKEN_BY: {
    label: 'Overtaken by',
    iconType: 'OVERTAKEN',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700',
    borderClass: 'border-rose-400',
    category: 'Overtaken',
    description: 'Higher priority rake overtakes this train at station yard.',
  },
  PRECEDENCE: {
    label: 'Precedence Given',
    iconType: 'PRECEDENCE',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700',
    borderClass: 'border-amber-400',
    category: 'Signalling Precedence',
    description: 'Given precedence over lower-priority freight, passenger, or commuter rake.',
  },
  PASSING: {
    label: 'Through Passing',
    iconType: 'PASSING',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700',
    borderClass: 'border-purple-400',
    category: 'Through Run',
    description: 'Non-stop high speed run on main line through platform or yard.',
  },
  PLATFORM_SHARING: {
    label: 'Platform Clearance',
    iconType: 'PLATFORM',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-700',
    borderClass: 'border-teal-400',
    category: 'Platform Operations',
    description: 'Track and platform clearance following departure of preceding rake.',
  },
  CREW_CHANGE: {
    label: 'Crew Change',
    iconType: 'CREW',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700',
    borderClass: 'border-cyan-400',
    category: 'Operational Crew',
    description: 'Driver and guard crew change between operating divisions.',
  },
  WATERING: {
    label: 'Carriage Watering',
    iconType: 'WATERING',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-700',
    borderClass: 'border-sky-400',
    category: 'Maintenance',
    description: 'Quick carriage water replenishment and mechanical underframe inspection.',
  },
  LOCO_REVERSAL: {
    label: 'Loco Reversal',
    iconType: 'LOCO',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700',
    borderClass: 'border-orange-400',
    category: 'Motive Power',
    description: 'Locomotive engine shunting and reversal to opposite train end.',
  },
  TECHNICAL_HALT: {
    label: 'Technical Halt',
    iconType: 'TECH',
    badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950/80 dark:text-yellow-300 dark:border-yellow-700',
    borderClass: 'border-yellow-400',
    category: 'Operations',
    description: 'Operational halt for section clearance, token exchange, or caution check.',
  },
  PARALLEL_RUN: {
    label: 'Parallel Run',
    iconType: 'PARALLEL',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700',
    borderClass: 'border-indigo-400',
    category: 'Multi-Track Movement',
    description: 'Simultaneous parallel movement on quadruple suburban trunk tracks.',
  },
  ATTACH_DETACH: {
    label: 'Rake Shunting / Turnaround',
    iconType: 'ATTACH',
    badgeClass: 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
    borderClass: 'border-zinc-400',
    category: 'Yard Operations',
    description: 'Coach attachment, slip coach detachment, or terminal maintenance turnaround.',
  },
  TRAIN_MEETING: {
    label: 'Train Meeting',
    iconType: 'MEET',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700',
    borderClass: 'border-emerald-400',
    category: 'Traffic Lineup',
    description: 'Coordinated meet at crossing station loop line.',
  },
};

/**
 * Format any raw operation type string into a readable label
 * e.g., 'CREW_CHANGE' -> 'Crew Change'
 */
export function formatOperationType(rawType: string): string {
  if (!rawType) return 'Operational Event';
  const upper = rawType.toUpperCase().trim();
  if (KNOWN_OPERATIONS[upper]?.label) {
    return KNOWN_OPERATIONS[upper]!.label!;
  }
  // Convert SNAKE_CASE or camelCase to Title Case
  return upper
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Dynamically resolves operation metadata without any hardcoded 3-operation limitation.
 * If the source data provides 10, 30, or 100 operation types, they will all render properly.
 */
export function getOperationMeta(rawType: string): OperationMeta {
  const upper = (rawType || 'OPERATION').toUpperCase().trim();
  const known = KNOWN_OPERATIONS[upper];

  if (known) {
    return {
      type: upper,
      label: known.label || formatOperationType(upper),
      badgeClass:
        known.badgeClass ||
        'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      borderClass: known.borderClass || 'border-slate-400',
      iconType: known.iconType || 'GENERIC',
      category: known.category || 'Operational Event',
      description: known.description || 'Verified railway operational event.',
    };
  }

  // Dynamic fallback for any newly discovered event type from the provider
  return {
    type: upper,
    label: formatOperationType(upper),
    badgeClass:
      'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800',
    borderClass: 'border-indigo-400',
    iconType: 'GENERIC',
    category: 'Source Defined Event',
    description: 'Operational movement reported by Indian Rail Info / railway authority.',
  };
}

/**
 * Extract all unique operation types from an array of operations dynamically
 */
export function extractUniqueOperationTypes(operations: { type: string }[]): string[] {
  const types = new Set<string>();
  operations.forEach((op) => {
    if (op.type) {
      types.add(op.type.toUpperCase().trim());
    }
  });
  return ['ALL', ...Array.from(types).sort()];
}
