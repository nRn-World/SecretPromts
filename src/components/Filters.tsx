import React, { useMemo } from 'react';
import { MODELS } from '../data/initialPrompts';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { Layers, Tag, ArrowUpDown, Settings, Key, LogOut } from 'lucide-react';

export const Filters: React.FC = () => {
  const { t, categoryLabel, tagLabel } = useLanguage();
  const {
    prompts,
    selectedCategory,
    setSelectedCategory,
    selectedModel,
    setSelectedModel,
    selectedTag,
    setSelectedTag,
    sortBy,
    setSortBy,
    allTags,
    filteredPrompts,
    categories,
    isAdmin,
    setIsManageCategoriesOpen,
    setIsAdminLoginOpen,
    logoutAdmin
  } = usePrompts();

  // All unique models: predefined + any custom models used in prompts
  const allModels = useMemo(() => {
    const modelSet = new Set<string>();
    MODELS.forEach(m => modelSet.add(m));
    prompts.forEach(p => modelSet.add(p.model));
    return Array.from(modelSet).sort();
  }, [prompts]);

  return (
    <div className="py-6 border-b border-zinc-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Categories Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-md shadow-white/5 scale-105'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {categoryLabel(category)}
              </button>
            );
          })}

          {/* Admin Tools right inside category scrolling container */}
          <div className="flex items-center gap-1 ml-auto pl-2 border-l border-zinc-800">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setIsManageCategoriesOpen(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-purple-950/80 text-purple-300 border border-purple-500/20 hover:bg-purple-900 transition-colors whitespace-nowrap"
                  title={t('manageCategoriesTitle')}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('manageCategories')}</span>
                </button>
                <button
                  onClick={logoutAdmin}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
                  title={t('logoutAdminTitle')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('logoutAdmin')}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
                title={t('adminLoginTitle')}
              >
                <Key className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
          
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium hidden sm:inline">{t('model')}</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="Alla" className="bg-zinc-900 text-white">{t('allModels')}</option>
                {allModels.map(m => (
                  <option key={m} value={m} className="bg-zinc-900 text-white">{m}</option>
                ))}
              </select>
            </div>

            {/* Tag Selector */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline">{t('tag')}</span>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer max-w-[120px] sm:max-w-none truncate"
                >
                  <option value="Alla" className="bg-zinc-900 text-white">{t('allTags')}</option>
                  {allTags.map(t => (
                    <option key={t} value={t} className="bg-zinc-900 text-white">{tagLabel(t)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear filters trigger if any is set */}
            {(selectedCategory !== 'Alla' || selectedModel !== 'Alla' || selectedTag !== 'Alla') && (
              <button
                onClick={() => {
                  setSelectedCategory('Alla');
                  setSelectedModel('Alla');
                  setSelectedTag('Alla');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium px-1"
              >
                {t('resetFilters')}
              </button>
            )}

          </div>

          {/* Right side: Sort and Results Count */}
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            
            <div className="text-xs text-zinc-500 font-medium">
              {t('showing')} <span className="text-white font-bold">{filteredPrompts.length}</span> {t('prompts')}
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="popular" className="bg-zinc-900 text-white">{t('sortPopular')}</option>
                <option value="likes" className="bg-zinc-900 text-white">{t('sortLikes')}</option>
                <option value="newest" className="bg-zinc-900 text-white">{t('sortNewest')}</option>
                <option value="oldest" className="bg-zinc-900 text-white">{t('sortOldest')}</option>
                <option value="title" className="bg-zinc-900 text-white">{t('sortTitle')}</option>
              </select>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
