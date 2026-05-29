import React from 'react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { PromptCard } from './PromptCard';
import { Sparkles, Heart, FolderPlus } from 'lucide-react';

export const PromptGrid: React.FC = () => {
  const { filteredPrompts, activeTab, setIsCreateModalOpen, searchQuery, isAdmin } = usePrompts();
  const { t } = useLanguage();

  if (filteredPrompts.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto px-4">
        
        {activeTab === 'favorites' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{t('noFavoritesTitle')}</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {t('noFavoritesText')}
            </p>
          </div>
        )}

        {activeTab === 'my-creations' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <FolderPlus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{t('noCustomTitle')}</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {t('noCustomText')}
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 px-4 py-2 bg-gradient-to-r from-amber-500 to-pink-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {t('saveNewPrompt')}
              </button>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{t('noResultsTitle')}</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {t('noResultsText', { query: searchQuery })}
            </p>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map(prompt => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    </div>
  );
};
