import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  languageService,
  SupportedLocale,
  SUPPORTED_LANGUAGES,
  LanguageOption,
} from '../services/languageService.js';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  languages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(
    languageService.getLocale()
  );

  useEffect(() => {
    const unsubscribe = languageService.subscribe((newLocale) => {
      setLocaleState(newLocale);
    });
    return unsubscribe;
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    languageService.setLocale(newLocale);
  };

  const t = (key: string, fallback?: string) => {
    return languageService.t(key, fallback);
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
