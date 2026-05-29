import React from 'react';
import { Search, Sparkles, Image as ImageIcon, Copy, Cpu } from 'lucide-react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';

export const Hero: React.FC = () => {
  const { searchQuery, setSearchQuery } = usePrompts();
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden py-12 md:py-20 border-b border-zinc-800/40">
      
      {/* Background ambient glowing shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[350px] h-[200px] bg-pink-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Intro Tag */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('heroBadge')}</span>
          </div>
        </div>

        {/* Main headline */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
            {t('heroTitleLine1')} <br />
            <span className="text-gradient">{t('heroTitleLine2')}</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-normal">
            {t('heroDescription')}
          </p>
        </div>

        {/* Live Search Input */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-60 transition duration-500" />
            <div className="relative flex items-center bg-zinc-950 rounded-xl border border-zinc-800 focus-within:border-zinc-700">
              <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-12 pr-4 py-4 bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-900 rounded"
                >
                  {t('clear')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Features badges */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{t('featureImageTitle')}</h4>
              <p className="text-[10px] text-zinc-400">{t('featureImageText')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{t('featureCopyTitle')}</h4>
              <p className="text-[10px] text-zinc-400">{t('featureCopyText')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{t('featureVariablesTitle')}</h4>
              <p className="text-[10px] text-zinc-400">{t('featureVariablesText')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{t('featureModelsTitle')}</h4>
              <p className="text-[10px] text-zinc-400">{t('featureModelsText')}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
