import React from 'react';
import { Globe2 } from 'lucide-react';
import { LANGUAGES, LanguageCode, useLanguage } from '../context/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white" title={t('language')}>
      <Globe2 className="h-4 w-4 text-purple-400" />
      <span className="hidden xl:inline">{t('language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="cursor-pointer bg-transparent text-xs font-black text-white outline-none"
        aria-label={t('language')}
      >
        {LANGUAGES.map(item => (
          <option key={item.code} value={item.code} className="bg-zinc-900 text-white">
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
};