// Station Code & Name Resolver
// Transparently handles station code, full station name, or formatted "Name (CODE)" strings.
import { MOCK_STATIONS } from '../providers/mock/mockRailwayData.js';

export function resolveStationCode(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. If string matches "Station Name (CODE)", extract CODE
  const parenMatch = trimmed.match(/\(([A-Za-z0-9]{2,6})\)/);
  if (parenMatch) {
    return parenMatch[1].toUpperCase();
  }

  const upper = trimmed.toUpperCase();

  // 2. Exact match against known station codes (e.g. BOR, DRD, BVI, MMCT)
  const exactCode = MOCK_STATIONS.find((s) => s.code.toUpperCase() === upper);
  if (exactCode) {
    return exactCode.code;
  }

  // 3. Exact match against known station names
  const exactName = MOCK_STATIONS.find((s) => s.name.toUpperCase() === upper);
  if (exactName) {
    return exactName.code;
  }

  // 4. Fuzzy / partial match on name (e.g., "Boisar" matches "Boisar", "Dahanu Road" matches "Dahanu Road")
  const partialName = MOCK_STATIONS.find(
    (s) =>
      s.name.toUpperCase().startsWith(upper) ||
      upper.startsWith(s.name.toUpperCase()) ||
      s.name.toUpperCase().includes(upper)
  );
  if (partialName) {
    return partialName.code;
  }

  // Fallback: return cleaned uppercase token
  return upper;
}
