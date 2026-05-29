import React, { useState, useEffect, useRef } from 'react';
import { PromptItem } from '../data/initialPrompts';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, ThumbsUp, Edit2, Trash2, User } from 'lucide-react';

interface PromptCardProps {
  prompt: PromptItem;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  const { toggleFavorite, toggleLike, setSelectedPromptForDetail, incrementView, isAdmin, deletePrompt, setEditingPrompt, openUserProfile } = usePrompts();
  const { t, promptTitle } = useLanguage();
  const { isGuest } = useAuth();
  const displayTitle = promptTitle(prompt.id, prompt.title, prompt.isCustom);
  const promptImages = prompt.images ?? [prompt.imageUrl];
  const [visibleIdx, setVisibleIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (promptImages.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setVisibleIdx(prev => (prev + 1) % promptImages.length);
    }, 3500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [promptImages.length]);

  // Reset when prompt changes
  useEffect(() => {
    setVisibleIdx(0);
  }, [prompt.id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('deletePromptConfirm', { title: displayTitle }))) {
      try {
        await deletePrompt(prompt.id);
      } catch {
        alert('Kunde inte ta bort prompten');
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setSelectedPromptForDetail(prompt);
        incrementView(prompt.id);
      }}
      className="group relative flex flex-col bg-zinc-900 rounded-2xl border border-zinc-800/80 overflow-hidden glass-panel-hover cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative w-full pt-[75%] overflow-hidden bg-zinc-950">
        {promptImages.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={displayTitle}
            className={`absolute inset-0 w-full h-full object-contain transition-all duration-1000 ease-in-out ${
              i === visibleIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ zIndex: promptImages.length - i }}
            loading="lazy"
          />
        ))}

        {/* Top Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-20">
          {/* Left side: Model badge + admin actions */}
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md text-[10px] font-bold text-zinc-200 border border-white/10 tracking-wide flex items-center gap-1 shadow-md">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              {prompt.model}
            </span>
            {isAdmin && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPrompt(prompt);
                  }}
                  className="pointer-events-auto p-1.5 rounded-md bg-zinc-950/70 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-amber-400 transition-all"
                  title="Redigera prompt"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="pointer-events-auto p-1.5 rounded-md bg-zinc-950/70 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-red-400 transition-all"
                  title="Ta bort prompt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {!isGuest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(prompt.id);
              }}
              className="pointer-events-auto p-2 rounded-full bg-zinc-950/70 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90"
              title={prompt.isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  prompt.isFavorite ? 'fill-pink-500 text-pink-500' : 'text-zinc-300 hover:text-white'
                }`}
              />
            </button>
          )}
        </div>

        {/* Bottom Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <span className="px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md text-[10px] font-semibold text-zinc-300 border border-white/5">
            AR {prompt.aspectRatio}
          </span>
          {!isGuest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(prompt.id);
              }}
              className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 hover:bg-zinc-950"
              title={prompt.isLiked ? 'Ta bort gilla' : 'Gilla'}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${prompt.isLiked ? 'fill-blue-500 text-blue-500' : 'text-zinc-300'}`} />
              <span className="text-[10px] font-semibold">{prompt.likesCount ?? 0}</span>
            </button>
          )}
        </div>

        {/* Image dots */}
        {promptImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 -translate-y-8 flex gap-1 z-20 pointer-events-none">
            {promptImages.map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full transition-all duration-300 ${
                  i === visibleIdx ? 'bg-white w-2.5' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity flex items-center justify-center pointer-events-none z-10">
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-zinc-900/90 text-white text-xs font-bold py-1.5 px-3 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-xl">
            <span>{t('runAndCustomize')}</span>
          </div>
        </div>
      </div>

      {/* Author badge below image */}
      {prompt.authorId && prompt.authorName && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openUserProfile(prompt.authorId!);
          }}
          className="group/author flex items-center gap-2 px-3 py-2 hover:bg-emerald-500/10 border-t border-zinc-800/60 hover:border-emerald-500/30 transition-all duration-200 rounded-b-2xl w-full"
          title={`Visa ${prompt.authorName}s profil`}
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[8px] font-black text-white shrink-0 ring-1 ring-transparent group-hover/author:ring-emerald-400/70 group-hover/author:scale-110 transition-all duration-200"
            style={{ boxShadow: undefined }}
          >
            {prompt.authorPhotoURL
              ? <img src={prompt.authorPhotoURL} alt={prompt.authorName} className="w-full h-full rounded-full object-cover" />
              : (prompt.authorName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || <User className="w-3 h-3" />)
            }
          </div>
          <span
            className="text-[10px] text-zinc-500 group-hover/author:text-emerald-300 transition-colors duration-200 truncate font-semibold"
          >
            <span className="group-hover/author:[text-shadow:0_0_8px_#4ade80,0_0_18px_#4ade8066] transition-all duration-300">
              {prompt.authorName}
            </span>
          </span>
          <span className="ml-auto text-[9px] text-zinc-700 group-hover/author:text-emerald-400 group-hover/author:[text-shadow:0_0_6px_#4ade80] opacity-0 group-hover/author:opacity-100 transition-all duration-200 font-medium shrink-0">
            Visa profil →
          </span>
        </button>
      )}

    </div>
  );
};
