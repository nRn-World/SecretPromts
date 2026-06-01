import React, { useState, useEffect, useRef } from 'react';
import { PromptItem } from '../data/initialPrompts';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, ThumbsUp, Edit2, Trash2, User, Trophy, ShieldAlert, Award } from 'lucide-react';
import { showToast } from './Toast';

interface PromptCardProps {
  prompt: PromptItem;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  const { 
    toggleFavorite, 
    toggleLike, 
    setSelectedPromptForDetail, 
    incrementView, 
    isAdmin, 
    deletePrompt, 
    setEditingPrompt, 
    openUserProfile,
    prompts 
  } = usePrompts();
  const { t, promptTitle, categoryLabel, language } = useLanguage();
  const { isGuest } = useAuth();
  
  const displayTitle = promptTitle(prompt.id, prompt.title, prompt.isCustom);
  const promptImages = prompt.images ?? [prompt.imageUrl];
  const [visibleIdx, setVisibleIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tip 4: Shimmer loading state
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  // True random values per card mount (useRef so they don't change on re-render)
  const cardRand = useRef({
    intervalMs: 3200 + Math.random() * 1800,
    initialDelay: Math.random() * 3500,
    variantIdx: Math.floor(Math.random() * 5),
  }).current;

  const variants = [
    { out: { opacity: 0, scale: 0.95 }, in: { opacity: 1, scale: 1 }, duration: 1000, easing: 'ease-in-out' },
    { out: { opacity: 0, scale: 0.97, y: 2 }, in: { opacity: 1, scale: 1, y: 0 }, duration: 1200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    { out: { opacity: 0, scale: 0.95, x: -3 }, in: { opacity: 1, scale: 1, x: 0 }, duration: 800, easing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)' },
    { out: { opacity: 0, scale: 0.96, rotate: 2 }, in: { opacity: 1, scale: 1, rotate: 0 }, duration: 900, easing: 'ease-out' },
    { out: { opacity: 0, scale: 1.05 }, in: { opacity: 1, scale: 1 }, duration: 1100, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
  ];
  const variant = variants[cardRand.variantIdx];

  const imgStyle = (isVisible: boolean): React.CSSProperties => {
    const v = isVisible ? variant.in : variant.out;
    const t: React.CSSProperties = {
      opacity: v.opacity,
      transitionDuration: `${variant.duration}ms`,
      transitionTimingFunction: variant.easing,
    };
    t.transform = `scale(${v.scale})`;
    if ('x' in v && v.x !== undefined) t.transform += ` translateX(${v.x}px)`;
    if ('y' in v && v.y !== undefined) t.transform += ` translateY(${v.y}px)`;
    if ('rotate' in v && v.rotate !== undefined) t.transform += ` rotate(${v.rotate}deg)`;
    return t;
  };

  useEffect(() => {
    if (promptImages.length <= 1) return;
    const startTimeout = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setVisibleIdx(prev => (prev + 1) % promptImages.length);
      }, cardRand.intervalMs);
    }, cardRand.initialDelay);
    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [promptImages.length, cardRand.intervalMs, cardRand.initialDelay]);

  // Reset when prompt changes
  useEffect(() => {
    setVisibleIdx(0);
    setLoadedImages({});
  }, [prompt.id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('deletePromptConfirm', { title: displayTitle }))) {
      try {
        await deletePrompt(prompt.id);
        showToast(language === 'sv' ? 'Prompt raderad!' : 'Prompt deleted!', 'warning');
      } catch {
        alert('Kunde inte ta bort prompten');
      }
    }
  };

  // Tip 7: Creator Ranks & Profile Badges
  const getCreatorRank = () => {
    if (prompt.authorId === 'admin' || prompt.authorName === 'Admin' || prompt.authorId === 'user-mock-2') {
      return { label: 'Admin', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: ShieldAlert };
    }
    const authorPromptsCount = prompts.filter(p => p.authorId === prompt.authorId).length;
    if (authorPromptsCount >= 3) {
      return { label: language === 'sv' ? 'Toppskapare' : 'Top Creator', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Trophy };
    }
    return { label: language === 'sv' ? 'Medlem' : 'Member', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Award };
  };

  const rank = getCreatorRank();

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setSelectedPromptForDetail(prompt);
        incrementView(prompt.id);
      }}
      className="group relative flex flex-col bg-zinc-900 rounded-3xl border border-zinc-800/80 overflow-hidden glass-panel-hover cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative w-full pt-[75%] overflow-hidden bg-zinc-950">
        
        {/* Shimmer Skeleton (Tip 4) */}
        {promptImages.map((url, i) => (
          <React.Fragment key={i}>
            {!loadedImages[i] && i === visibleIdx && (
              <div className="absolute inset-0 animate-shimmer-bg z-10" />
            )}
            <img
              src={url}
              alt={displayTitle}
              onLoad={() => setLoadedImages(prev => ({ ...prev, [i]: true }))}
              className="absolute inset-0 w-full h-full object-contain transition-all"
              style={{ ...imgStyle(i === visibleIdx), zIndex: promptImages.length - i }}
              loading="lazy"
            />
          </React.Fragment>
        ))}

        {/* Top Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-20">
          {/* Left side: Model badge + admin actions */}
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md text-[10px] font-bold text-zinc-200 border border-white/10 tracking-wide flex items-center gap-1 shadow-md">
              <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
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
                showToast(
                  !prompt.isFavorite 
                    ? (language === 'sv' ? 'Tillagd i favoriter!' : 'Added to favorites!')
                    : (language === 'sv' ? 'Borttagen från favoriter!' : 'Removed from favorites!'),
                  'info'
                );
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
                showToast(
                  !prompt.isLiked 
                    ? (language === 'sv' ? 'Du gillade prompten!' : 'You liked the prompt!')
                    : (language === 'sv' ? 'Tog bort din gilla!' : 'Removed like!'),
                  'success'
                );
              }}
              className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 hover:bg-zinc-950 shadow-md"
              title={prompt.isLiked ? 'Ta bort gilla' : 'Gilla'}
            >
              <ThumbsUp className={`w-3 h-3 ${prompt.isLiked ? 'fill-blue-500 text-blue-500' : 'text-zinc-300'}`} />
              <span className="text-[10px] font-bold">{prompt.likesCount ?? 0}</span>
            </button>
          )}
        </div>

        {/* Image dots */}
        {promptImages.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none">
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
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-zinc-950/95 text-white text-[11px] font-extrabold py-2 px-3.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-2xl">
            <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            <span>{t('runAndCustomize')}</span>
          </div>
        </div>
      </div>

      {/* ─── NEW: Title & Info Section below the image (Tip 1) ─── */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-3 border-b border-zinc-800/40">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-black text-theme-accent tracking-widest bg-theme-accent/5 px-2 py-0.5 rounded border border-theme-accent/10">
              {categoryLabel(prompt.category)}
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-white group-hover:text-theme-accent transition-colors truncate">
            {displayTitle}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {prompt.description || 'Ingen beskrivning tillgänglig.'}
          </p>
        </div>
      </div>

      {/* Author badge below image (Tip 7 integrated) */}
      {prompt.authorId && prompt.authorName && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openUserProfile(prompt.authorId!);
          }}
          className="group/author flex items-center gap-2 px-4 py-3 hover:bg-theme-accent/5 border-t border-zinc-800/40 hover:border-theme-accent/20 transition-all duration-300 w-full text-left"
          title={`Visa ${prompt.authorName}s profil`}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-[9px] font-black text-white shrink-0 ring-1 ring-transparent group-hover/author:ring-theme-accent/70 group-hover/author:scale-110 transition-all duration-300 overflow-hidden"
          >
            {prompt.authorPhotoURL
              ? <img src={prompt.authorPhotoURL} alt={prompt.authorName} className="w-full h-full object-cover" />
              : (prompt.authorName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || <User className="w-3.5 h-3.5" />)
            }
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="text-[10px] text-zinc-400 group-hover/author:text-white transition-colors duration-200 truncate font-bold"
            >
              {prompt.authorName}
            </span>
            {/* Creator badge rank indicator */}
            <div className="flex items-center gap-1 mt-0.5">
              <rank.icon className="w-2.5 h-2.5 text-zinc-500" />
              <span className={`text-[8px] font-black tracking-wide uppercase px-1 py-0.2 rounded border ${rank.color}`}>
                {rank.label}
              </span>
            </div>
          </div>
          <span className="ml-auto text-[9px] text-zinc-600 group-hover/author:text-theme-accent transition-all duration-300 font-bold shrink-0">
            {language === 'sv' ? 'Visa profil →' : 'View profile →'}
          </span>
        </button>
      )}

    </div>
  );
};
