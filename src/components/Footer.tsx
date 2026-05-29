import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../../logo/SP-no-bg.png';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 p-0.5">
                <div className="flex items-center justify-center w-full h-full bg-zinc-950 rounded-[6px] overflow-hidden p-0.5">
                  <img src={logoImg} alt="SecretPrompts Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <span className="font-black text-base tracking-tight text-white">SecretPrompts</span>
            </div>
            
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              {t('footerDescription')}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('vaultSecure')}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('explore')}</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <a href="#galleriet" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">
                  {t('premiumAiGallery')}
                </a>
              </li>
              <li>
                <a href="#modeller" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">
                  {t('midjourneyPrompts')}
                </a>
              </li>
              <li>
                <a href="#dalle" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">
                  {t('dalleTemplates')}
                </a>
              </li>
              <li>
                <a href="#stablediffusion" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">
                  {t('stableDiffusion')}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('information')}</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <a href="#integritet" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">
                  {t('privacySecurity')}
                </a>
              </li>
              <li>
                <a href="#export" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">
                  {t('jsonExportImport')}
                </a>
              </li>
              <li>
                <a href="#anvandarvillkor" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">
                  {t('terms')}
                </a>
              </li>
              <li>
                <a href="#kontakt" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">
                  {t('helpSupport')}
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-zinc-500">
            &copy; {new Date().getFullYear()} SecretPrompts. {t('footerRights')}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <span>{t('builtWith')}</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>React &amp; Tailwind CSS</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
