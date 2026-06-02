import React from 'react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { MODELS } from '../data/initialPrompts';
import { 
  Settings, Key, LogOut, Clock, ThumbsUp, Star, Sparkles, Users, 
  Layers, Cpu, RotateCcw 
} from 'lucide-react';
import { showToast } from './Toast';

const SORT_OPTIONS = [
  {
    key: 'newest',
    icon: Clock,
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    border: 'border-violet-500/60',
    labelKey: 'sortNewest',
  },
  {
    key: 'likes',
    icon: ThumbsUp,
    gradient: 'from-pink-500 to-rose-500',
    glowColor: 'rgba(236, 72, 153, 0.35)',
    border: 'border-pink-500/60',
    labelKey: 'sortLikes',
  },
  {
    key: 'favorites',
    icon: Star,
    gradient: 'from-amber-400 to-orange-500',
    glowColor: 'rgba(251, 191, 36, 0.35)',
    border: 'border-amber-400/60',
    labelKey: 'sortFavorites',
  },
  {
    key: 'top-users',
    icon: Users,
    gradient: 'from-cyan-400 to-blue-500',
    glowColor: 'rgba(34, 211, 238, 0.35)',
    border: 'border-cyan-400/60',
    labelKey: 'sortTopUsers',
  },
] as const;

const LOCAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    categories: 'Categories',
    models: 'AI Models',
    reset: 'Reset Filters',
    topUsers: 'Top Creators (Most Shared)',
  },
  sv: {
    categories: 'Kategorier',
    models: 'AI-Modeller',
    reset: 'Återställ filter',
    topUsers: 'Toppskapare (Flest delade)',
  },
  de: {
    categories: 'Kategorien',
    models: 'KI-Modelle',
    reset: 'Filter zurücksetzen',
    topUsers: 'Top-Ersteller (Am meisten geteilt)',
  },
  es: {
    categories: 'Categorías',
    models: 'Modelos de IA',
    reset: 'Restablecer filtros',
    topUsers: 'Creadores Top (Más compartidos)',
  },
  tr: {
    categories: 'Kategoriler',
    models: 'AI Modelleri',
    reset: 'Filtreleri Sıfırla',
    topUsers: 'En Çok Paylaşanlar',
  }
};

export const Filters: React.FC = () => {
  const { t, language, categoryLabel } = useLanguage();
  const {
    sortBy,
    setSortBy,
    filteredPrompts,
    isAdmin,
    setIsManageCategoriesOpen,
    setIsAdminLoginOpen,
    logoutAdmin,
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedModel,
    setSelectedModel,
  } = usePrompts();

  // Settings translations fallback
  const lang = LOCAL_TRANSLATIONS[language] ? language : 'en';
  const txt = LOCAL_TRANSLATIONS[lang];

  const hasActiveFilters = selectedCategory !== 'Alla' || selectedModel !== 'Alla';
  const handleResetFilters = () => {
    setSelectedCategory('Alla');
    setSelectedModel('Alla');
    showToast(language === 'sv' ? 'Filter återställda!' : 'Filters reset!', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Redesigned Card Container */}
      <div className="relative bg-zinc-900/40 border border-zinc-800/80 backdrop-blur rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 md:gap-8 overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* ─── TOP SECTION: Results & Admin ─── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
          
          {/* Results badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-400">
              {t('showing')}{' '}
              <span className="font-extrabold text-white tabular-nums">
                {filteredPrompts.length}
              </span>{' '}
              {t('prompts')}
            </span>
          </div>

          {/* Admin actions */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setIsManageCategoriesOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold
                    bg-purple-950/50 text-purple-300 border border-purple-500/30 hover:border-purple-400/50
                    hover:bg-purple-900/60 hover:text-white transition-all duration-300 whitespace-nowrap shadow-sm shadow-purple-500/10"
                  title={t('manageCategoriesTitle')}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t('manageCategories')}</span>
                </button>

                <button
                  onClick={logoutAdmin}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold
                    bg-zinc-950/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700
                    hover:bg-rose-950/30 hover:text-rose-400 hover:border-rose-500/20 transition-all duration-300 whitespace-nowrap"
                  title={t('logoutAdminTitle')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logoutAdmin')}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold
                  bg-zinc-950/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700
                  hover:bg-zinc-900/60 hover:text-zinc-200 transition-all duration-300 whitespace-nowrap"
                title={t('adminLoginTitle')}
              >
                <Key className="w-3.5 h-3.5 text-zinc-500" />
                <span>Admin</span>
              </button>
            )}
          </div>

        </div>

        {/* ─── ROW 1: SORT BY ─── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-bold uppercase tracking-wider">{t('sortBy')}</span>
          </div>

          <div className="flex items-center gap-[10rem] flex-wrap">
            {SORT_OPTIONS.map(({ key, icon: Icon, gradient, glowColor, border, labelKey }) => {
              const active = sortBy === key;
              return (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`
                    relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-extrabold
                    border transition-all duration-300 select-none whitespace-nowrap shadow-sm
                    ${active
                      ? `bg-gradient-to-r ${gradient} ${border} text-white scale-105`
                      : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:text-white hover:bg-zinc-900/80'
                    }
                  `}
                  style={active ? {
                    boxShadow: `0 0 20px 2px ${glowColor}, 0 2px 8px rgba(0,0,0,0.4)`,
                  } : undefined}
                >
                  <Icon
                    className={`w-4 h-4 transition-all duration-300 ${
                      active ? 'text-white scale-110' : 'text-zinc-500'
                    }`}
                  />
                  <span>
                    {key === 'top-users' ? txt.topUsers : t(labelKey)}
                  </span>

                  {/* Animated ring on active */}
                  {active && (
                    <span
                      className={`absolute inset-0 rounded-2xl ring-1 ${border} opacity-40 animate-ping pointer-events-none`}
                      style={{ animationDuration: '2.5s' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── ROW 2: CATEGORIES (Filter pill selector) ─── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Layers className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-bold uppercase tracking-wider">{txt.categories}</span>
          </div>

          {/* All categories visible */}
          <div className="flex flex-wrap gap-2.5">
            {categories.map(cat => {
              const active = selectedCategory === cat;
              const label = categoryLabel(cat);
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    showToast(language === 'sv' ? `Filtrerar efter kategori: ${label}` : `Filtering by category: ${label}`, 'info');
                  }}
                  className={`
                    px-4.5 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-300 select-none whitespace-nowrap
                    ${active
                      ? 'bg-theme-gradient border-transparent text-white shadow-lg shadow-purple-500/10 scale-105'
                      : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:text-white hover:bg-zinc-900/80'
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── ROW 3: MODELS (Filter pill selector) ─── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Cpu className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-bold uppercase tracking-wider">{txt.models}</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Added "Alla" option for models */}
            <button
              onClick={() => {
                setSelectedModel('Alla');
              }}
              className={`
                px-4.5 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-300 select-none whitespace-nowrap
                ${selectedModel === 'Alla'
                  ? 'bg-theme-gradient border-transparent text-white shadow-lg shadow-purple-500/10 scale-105'
                  : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:text-white hover:bg-zinc-900/80'
                }
              `}
            >
              {language === 'sv' ? 'Alla modeller' : 'All models'}
            </button>

            {MODELS.map(model => {
              const active = selectedModel === model;
              return (
                <button
                  key={model}
                  onClick={() => {
                    setSelectedModel(model);
                    showToast(language === 'sv' ? `Filtrerar efter modell: ${model}` : `Filtering by model: ${model}`, 'info');
                  }}
                  className={`
                    px-4.5 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-300 select-none whitespace-nowrap
                    ${active
                      ? 'bg-theme-gradient border-transparent text-white shadow-lg shadow-purple-500/10 scale-105'
                      : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:text-white hover:bg-zinc-900/80'
                    }
                  `}
                >
                  {model}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── RESET FILTERS (Conditional bottom button) ─── */}
        {hasActiveFilters && (
          <div className="pt-2 flex justify-start">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 hover:border-zinc-700 text-xs font-bold text-zinc-400 hover:text-white transition-all duration-300 shadow-md active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{txt.reset}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
