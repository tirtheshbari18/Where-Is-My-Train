// Frontend Station Code Resolver
// Handles user typing station codes (BOR), formatted autocomplete (Boisar (BOR)), or station names.

const KNOWN_MAP: Record<string, string> = {
  'BOISAR': 'BOR',
  'DAHANU ROAD': 'DRD',
  'DAHANU': 'DRD',
  'DAHANU RD': 'DRD',
  'DAHANU RD.': 'DRD',
  'VANGAON': 'VGN',
  'BORIVALI': 'BVI',
  'MUMBAI CENTRAL': 'MMCT',
  'MUMBAI': 'MMCT',
  'CHURCHGATE': 'CCG',
  'DADAR': 'DDR',
  'BANDRA': 'BDTS',
  'BANDRA TERMINUS': 'BDTS',
  'ANDHERI': 'ADH',
  'VIRAR': 'VR',
  'VASAI ROAD': 'BSR',
  'VASAI': 'BSR',
  'PALGHAR': 'PLG',
  'KELVE ROAD': 'KLV',
  'KELVE': 'KLV',
  'SAPHALE': 'SAH',
  'VAITARNA': 'VTN',
  'UMROLI': 'UOI',
  'GHOLVAD': 'GVD',
  'BORDI ROAD': 'BRRD',
  'BORDI': 'BRRD',
  'SANJAN': 'SJN',
  'UMARGAM ROAD': 'UBR',
  'UMARGAM': 'UBR',
  'BHILAD': 'BLD',
  'VAPI': 'VAPI',
  'VALSAD': 'BL',
  'SURAT': 'ST',
  'AHMEDABAD': 'ADI',
  'VADODARA': 'BRC',
  'BARODA': 'BRC',
  'NEW DELHI': 'NDLS',
  'DELHI': 'NDLS',
  'HOWRAH': 'HWH',
  'KOLKATA': 'HWH',
  'MGR CHENNAI CENTRAL': 'MAS',
  'CHENNAI CENTRAL': 'MAS',
  'CHENNAI': 'MAS',
  'KSR BENGALURU': 'SBC',
  'BENGALURU': 'SBC',
  'BANGALORE': 'SBC',
  'LUCKNOW': 'LJN',
  'LUCKNOW JUNCTION': 'LJN',
  'KANPUR': 'CNB',
  'KANPUR CENTRAL': 'CNB',
  'KASGANJ': 'KSJ',
  'VARANASI': 'BSB',
};

const CODE_TO_NAME: Record<string, string> = {
  'BOR': 'Boisar',
  'DRD': 'Dahanu Road',
  'VGN': 'Vangaon',
  'BVI': 'Borivali',
  'MMCT': 'Mumbai Central',
  'CCG': 'Churchgate',
  'DDR': 'Dadar',
  'BDTS': 'Bandra Terminus',
  'ADH': 'Andheri',
  'VR': 'Virar',
  'BSR': 'Vasai Road',
  'PLG': 'Palghar',
  'KLV': 'Kelve Road',
  'SAH': 'Saphale',
  'VTN': 'Vaitarna',
  'UOI': 'Umroli',
  'GVD': 'Gholvad',
  'BRRD': 'Bordi Road',
  'SJN': 'Sanjan',
  'UBR': 'Umargam Road',
  'BLD': 'Bhilad',
  'VAPI': 'Vapi',
  'BL': 'Valsad',
  'ST': 'Surat',
  'ADI': 'Ahmedabad Junction',
  'BRC': 'Vadodara Junction',
  'NDLS': 'New Delhi',
  'HWH': 'Howrah Junction',
  'MAS': 'MGR Chennai Central',
  'SBC': 'KSR Bengaluru',
  'LJN': 'Lucknow Junction',
  'CNB': 'Kanpur Central',
  'KSJ': 'Kasganj Junction',
  'BSB': 'Varanasi Junction',
};

export function extractStationCode(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. Extract from parentheses e.g. "Boisar (BOR)" -> "BOR"
  const parenMatch = trimmed.match(/\(([A-Za-z0-9]{2,6})\)/);
  if (parenMatch) {
    return parenMatch[1].toUpperCase();
  }

  // 2. Extract from hyphen separator e.g. "Boisar - BOR" or "BOR - Boisar"
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map((p) => p.trim());
    for (const part of parts) {
      const codeCandidate = part.toUpperCase();
      if (/^[A-Z]{2,6}$/.test(codeCandidate) && (CODE_TO_NAME[codeCandidate] || codeCandidate.length <= 4)) {
        return codeCandidate;
      }
    }
  }

  // 3. Normalize common station suffixes
  let cleaned = trimmed
    .replace(/\s+(Station|Junction|Jn\.?|Terminus|Term\.?|Central)$/i, '')
    .trim()
    .toUpperCase();

  if (KNOWN_MAP[cleaned]) {
    return KNOWN_MAP[cleaned];
  }

  const rawUpper = trimmed.toUpperCase();
  if (KNOWN_MAP[rawUpper]) {
    return KNOWN_MAP[rawUpper];
  }

  // If already a 2-5 letter code matching known names or standard format
  if (/^[A-Z0-9]{2,6}$/.test(rawUpper)) {
    return rawUpper;
  }

  return rawUpper;
}

export function getStationNameByCode(code?: string): string {
  if (!code) return '';
  const clean = code.toUpperCase().trim();
  return CODE_TO_NAME[clean] || clean;
}

