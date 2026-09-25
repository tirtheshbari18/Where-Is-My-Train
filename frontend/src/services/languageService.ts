import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';
import te from '../locales/te.json';
import bn from '../locales/bn.json';
import ta from '../locales/ta.json';
import kn from '../locales/kn.json';
import ml from '../locales/ml.json';

export type SupportedLocale = 'en' | 'hi' | 'mr' | 'te' | 'bn' | 'ta' | 'kn' | 'ml';

export interface LanguageOption {
  code: SupportedLocale;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

const dictionaries: Record<SupportedLocale, Record<string, string>> = {
  en,
  hi,
  mr,
  te,
  bn,
  ta,
  kn,
  ml,
};

const STORAGE_KEY = 'wimt_language_v1';

export class LanguageService {
  private currentLocale: SupportedLocale = 'en';
  private listeners: Array<(locale: SupportedLocale) => void> = [];

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (saved && dictionaries[saved]) {
        this.currentLocale = saved;
      }
    } catch {
      this.currentLocale = 'en';
    }
  }

  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  setLocale(locale: SupportedLocale): void {
    if (dictionaries[locale]) {
      this.currentLocale = locale;
      try {
        localStorage.setItem(STORAGE_KEY, locale);
      } catch {
        // LocalStorage fallback
      }
      this.listeners.forEach((listener) => listener(locale));
    }
  }

  subscribe(listener: (locale: SupportedLocale) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  t(key: string, fallback?: string): string {
    const dict = dictionaries[this.currentLocale] || dictionaries.en;
    const underscoreKey = key.replace(/\./g, '_');
    const lastPart = key.includes('.') ? key.split('.').pop()! : key;

    // 1. Current locale lookup
    if (dict) {
      if (dict[key]) return dict[key];
      if (dict[underscoreKey]) return dict[underscoreKey];
      if (dict[lastPart]) return dict[lastPart];
    }

    // 2. English dictionary fallback
    const enDict = dictionaries.en;
    if (enDict) {
      if (enDict[key]) return enDict[key];
      if (enDict[underscoreKey]) return enDict[underscoreKey];
      if (enDict[lastPart]) return enDict[lastPart];
    }

    if (fallback) return fallback;
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }
}

export const languageService = new LanguageService();
