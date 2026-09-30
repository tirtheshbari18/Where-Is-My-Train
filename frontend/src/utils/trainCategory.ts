// Canonical train categories for WHERE IS MY TRAIN (frontend).
//
// Single source of truth for every category/filter UI in the app.
// Do NOT re-declare category lists in pages/components — import from here instead.

export const TRAIN_CATEGORIES = [
  'Fast Local',
  'Slow Local',
  'AC Local',
  'Local',
  'EMU',
  'MEMU',
  'DEMU',
  'Passenger',
  'Express',
  'Mail Express',
  'Daily Express',
  'Weekly Express',
  'Intercity Express',
  'Superfast',
  'Weekly Superfast',
  'Vande Bharat',
  'Rajdhani',
  'Shatabdi',
  'Jan Shatabdi',
  'Duronto',
  'Garib Rath',
  'Humsafar',
  'Tejas',
  'Antyodaya',
  'Double Decker',
  'Sampark Kranti',
  'Special',
] as const;

export type TrainCategory = (typeof TRAIN_CATEGORIES)[number];

/** Primary category filters from Master Prompt Section 9 */
export const PRIMARY_FILTER_CATEGORIES = [
  'ALL',
  'EXPRESS',
  'LOCALS',
  'SUPERFAST',
  'WEEKLY',
  'PASSENGER',
  'MEMU',
  'DEMU',
  'EMU',
  'VANDE BHARAT',
  'RAJDHANI',
  'SHATABDI',
  'DURONTO',
  'GARIB RATH',
  'HUMSAFAR',
  'TEJAS',
  'INTERCITY',
  'SPECIAL',
] as const;

/** Broader filter pills that intentionally group related specific categories. */
const CATEGORY_GROUPS: Record<string, TrainCategory[]> = {
  // Local section: Suburban/local services only (Section 8)
  Local: ['Fast Local', 'Slow Local', 'AC Local', 'Local', 'EMU', 'MEMU', 'DEMU'],
  // Express section: all non-local railway services (Section 7)
  Express: [
    'Express',
    'Mail Express',
    'Daily Express',
    'Weekly Express',
    'Intercity Express',
    'Superfast',
    'Weekly Superfast',
    'Vande Bharat',
    'Rajdhani',
    'Shatabdi',
    'Jan Shatabdi',
    'Duronto',
    'Garib Rath',
    'Humsafar',
    'Tejas',
    'Antyodaya',
    'Double Decker',
    'Sampark Kranti',
    'Special',
    'Passenger',
  ],
  Superfast: ['Superfast', 'Weekly Superfast'],
  Weekly: ['Weekly Express', 'Weekly Superfast'],
  Shatabdi: ['Shatabdi', 'Jan Shatabdi'],
  EMU: ['EMU'],
  MEMU: ['MEMU'],
  DEMU: ['DEMU'],
  'Fast Local': ['Fast Local'],
  'Slow Local': ['Slow Local'],
  'AC Local': ['AC Local'],
  Passenger: ['Passenger'],
  'Mail Express': ['Mail Express'],
  'Daily Express': ['Daily Express'],
  'Weekly Express': ['Weekly Express'],
  'Intercity Express': ['Intercity Express'],
  'Weekly Superfast': ['Weekly Superfast'],
  'Vande Bharat': ['Vande Bharat'],
  Rajdhani: ['Rajdhani'],
  'Jan Shatabdi': ['Jan Shatabdi'],
  Duronto: ['Duronto'],
  'Garib Rath': ['Garib Rath'],
  Humsafar: ['Humsafar'],
  Tejas: ['Tejas'],
  Antyodaya: ['Antyodaya'],
  'Double Decker': ['Double Decker'],
  'Sampark Kranti': ['Sampark Kranti'],
  Special: ['Special'],
};

const CANONICAL_BY_KEY: Record<string, TrainCategory> = TRAIN_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.toLowerCase().replace(/[\s_-]+/g, '')] = category;
    return acc;
  },
  {} as Record<string, TrainCategory>
);

/** Normalise any provider-supplied train type string into a canonical category. */
export function normalizeTrainCategory(raw?: string | null): TrainCategory | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (!key) return null;

  // Exact canonical match ("fastlocal" -> "Fast Local").
  const direct = CANONICAL_BY_KEY[key];
  if (direct) return direct;

  // Common provider and filter variants.
  const variants: Record<string, TrainCategory> = {
    locals: 'Local',
    local: 'Local',
    express: 'Express',
    mail: 'Mail Express',
    mailexpress: 'Mail Express',
    superfast: 'Superfast',
    mailsuperfast: 'Superfast',
    superfastexpress: 'Superfast',
    expresssuperfast: 'Superfast',
    weekly: 'Weekly Express',
    weeklyexpress: 'Weekly Express',
    weeklysuperfast: 'Weekly Superfast',
    intercity: 'Intercity Express',
    intercityexpress: 'Intercity Express',
    vandebharat: 'Vande Bharat',
    vandebharatexpress: 'Vande Bharat',
    rajdhani: 'Rajdhani',
    rajdhanisuperfast: 'Rajdhani',
    shatabdi: 'Shatabdi',
    shatabdiexpress: 'Shatabdi',
    janshatabdi: 'Jan Shatabdi',
    duronto: 'Duronto',
    durontoexpress: 'Duronto',
    garibrath: 'Garib Rath',
    humsafar: 'Humsafar',
    tejas: 'Tejas',
    antyodaya: 'Antyodaya',
    special: 'Special',
    passenger: 'Passenger',
    passenger_special: 'Passenger',
    passengerspecial: 'Passenger',
    suburb: 'Local',
    suburban: 'Local',
    emu: 'EMU',
    memu: 'MEMU',
    demu: 'DEMU',
  };
  if (variants[key]) return variants[key];

  // Last resort: a canonical category contained in the raw string
  // (e.g. "Fast Local (EMU)" -> "Fast Local").
  for (const category of TRAIN_CATEGORIES) {
    const compact = category.toLowerCase().replace(/[\s_-]+/g, '');
    if (key.includes(compact)) return category;
  }
  return null;
}

/**
 * Single category-matching rule reused by every filter in the app.
 * `selected` may be 'ALL' / 'All' to match everything.
 */
export function matchesCategory(trainType: string | undefined | null, selected: string): boolean {
  const sel = (selected || '').trim();
  if (!sel || sel.toUpperCase() === 'ALL') return true;

  const trainCategory = normalizeTrainCategory(trainType);
  if (!trainCategory) return false;

  const selKey = sel.toLowerCase().replace(/[\s_-]+/g, '');
  if (selKey === 'weekly') {
    return CATEGORY_GROUPS['Weekly'].includes(trainCategory);
  }

  const selectedCategory = normalizeTrainCategory(sel);
  if (!selectedCategory) return false;
  if (trainCategory === selectedCategory) return true;

  // Grouped pills ("Local", "Express", "Superfast", "Shatabdi", "Weekly") match their members.
  const group = CATEGORY_GROUPS[selectedCategory] || [];
  return group.includes(trainCategory);
}
