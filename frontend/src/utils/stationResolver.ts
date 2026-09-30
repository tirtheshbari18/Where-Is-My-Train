// Frontend Station Code Resolver
// Handles user typing station codes (BOR), formatted autocomplete (Boisar (BOR)), or station names.

export function extractStationCode(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Extract from parentheses e.g. "Boisar (BOR)" -> "BOR"
  const parenMatch = trimmed.match(/\(([A-Za-z0-9]{2,6})\)/);
  if (parenMatch) {
    return parenMatch[1].toUpperCase();
  }

  // Common quick-mapping for key Mumbai - Gujarat Western Railway corridor stations
  const upper = trimmed.toUpperCase();
  const KNOWN_MAP: Record<string, string> = {
    'BOISAR': 'BOR',
    'DAHANU ROAD': 'DRD',
    'DAHANU': 'DRD',
    'VANGAON': 'VGN',
    'BORIVALI': 'BVI',
    'MUMBAI CENTRAL': 'MMCT',
    'CHURCHGATE': 'CCG',
    'DADAR': 'DDR',
    'BANDRA': 'BDTS',
    'ANDHERI': 'ADH',
    'VIRAR': 'VR',
    'VASAI ROAD': 'BSR',
    'PALGHAR': 'PLG',
    'SURAT': 'ST',
    'VALSAD': 'BL',
    'VAPI': 'VAPI',
    'AHMEDABAD': 'ADI',
    'VADODARA': 'BRC',
  };

  if (KNOWN_MAP[upper]) {
    return KNOWN_MAP[upper];
  }

  return upper;
}
