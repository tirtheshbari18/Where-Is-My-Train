import React, { useState } from 'react';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.js';
import { SupportedLocale } from '../../services/languageService.js';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { locale, setLocale, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-xl border transition ${
          compact
            ? 'p-2 bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            : 'px-3 py-1.5 bg-slate-900/90 border-slate-700 text-xs font-semibold text-slate-200 hover:border-amber-500'
        }`}
        title="Select Language"
        aria-label="Language Selector"
      >
        <Languages className="w-4 h-4 text-amber-400" />
        {!compact && (
          <>
            <span>{currentLang.nativeName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel border border-slate-700 shadow-2xl py-2 z-50">
            <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Choose Language (8 Indian Languages)
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code as SupportedLocale);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                    locale === lang.code
                      ? 'bg-amber-500/20 text-amber-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{lang.name}</span>
                  </div>
                  {locale === lang.code && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
