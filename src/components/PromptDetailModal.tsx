import React, { useState, useEffect, useCallback } from 'react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { PromptItem } from '../data/initialPrompts';
import { X, Copy, Check, Heart, Sparkles, ExternalLink, Sliders, ThumbsUp, ChevronLeft, ChevronRight, User, UserPlus, UserCheck, UserMinus, Star } from 'lucide-react';
import {
  subscribeUserProfile, sendFriendRequest, removeFriend,
  toggleFavoriteUser, type UserProfile,
} from '../firebase/firestore';

export const PromptDetailModal: React.FC = () => {
  const { selectedPromptForDetail } = usePrompts();
  if (!selectedPromptForDetail) return null;
  return <PromptDetailModalInner prompt={selectedPromptForDetail} />;
};

const PromptDetailModalInner: React.FC<{ prompt: PromptItem }> = ({ prompt }) => {
  const { setSelectedPromptForDetail, toggleFavorite, toggleLike, openUserProfile } = usePrompts();
  const { t, categoryLabel, promptTitle, promptDescription, tagLabel } = useLanguage();
  const { isGuest, user, setIsAuthModalOpen } = useAuth();

  // Local state for customized variables
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Social state – current user's profile (for friend/fav status)
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    if (isGuest || !user.id) return;
    const unsub = subscribeUserProfile(user.id, setMyProfile);
    return unsub;
  }, [user.id, isGuest]);

  // Initialize variables when prompt changes
  useEffect(() => {
    if (prompt.variables) {
      const initial: Record<string, string> = {};
      prompt.variables.forEach(v => {
        initial[v.name] = v.defaultValue || '';
      });
      setVariableValues(initial);
    } else {
      setVariableValues({});
    }
    setCopied(false);
    setCurrentImageIdx(0);
  }, [prompt]);

  // Keyboard navigation
  const promptImages = prompt.images ?? [prompt.imageUrl];
  useEffect(() => {
    if (promptImages.length <= 1) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCurrentImageIdx(prev => prev === 0 ? promptImages.length - 1 : prev - 1);
      if (e.key === 'ArrowRight') setCurrentImageIdx(prev => (prev + 1) % promptImages.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [promptImages.length]);

  // Social helpers (declared before early return to satisfy the Rules of Hooks)
  const authorId = prompt.authorId;
  const isFavUser = !!(authorId && myProfile?.favoriteUsers?.includes(authorId));
  const isFriend  = !!(authorId && myProfile?.friends?.includes(authorId));
  const sentReq   = !!(authorId && prompt.authorId &&
    myProfile?.friendRequests !== undefined ? false : false); // placeholder – real state lives in UserProfileModal

  const handleToggleFavUser = useCallback(async () => {
    if (!authorId || isGuest || !user.id) return;
    setSocialLoading(true);
    await toggleFavoriteUser(user.id, authorId, isFavUser);
    setSocialLoading(false);
  }, [authorId, isGuest, user.id, isFavUser]);

  const handleFriendAction = useCallback(async () => {
    if (!authorId || isGuest || !user.id) return;
    setSocialLoading(true);
    if (isFriend) {
      await removeFriend(user.id, authorId);
    } else {
      await sendFriendRequest(user.id, authorId);
    }
    setSocialLoading(false);
  }, [authorId, isGuest, user.id, isFriend]);

  const displayTitle = promptTitle(prompt.id, prompt.title, prompt.isCustom);
  const displayDescription = promptDescription(prompt.id, prompt.description || '', prompt.isCustom);

  // Generate the live customized prompt text
  const getCustomizedPrompt = () => {
    let finalPrompt = prompt.promptText;
    if (!prompt.variables || prompt.variables.length === 0) {
      return finalPrompt;
    }

    prompt.variables.forEach(v => {
      const val = variableValues[v.name]?.trim();
      // Replace all occurrences of [name]
      const regex = new RegExp(`\\[${v.name}\\]`, 'g');
      finalPrompt = finalPrompt.replace(regex, val || `[${v.name}]`);
    });

    return finalPrompt;
  };

  const customizedPromptText = getCustomizedPrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(customizedPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4" onClick={() => setSelectedPromptForDetail(null)}>
      
      <div className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-fade-in flex flex-col lg:flex-row max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Absolute Close Button */}
        <button
          onClick={() => setSelectedPromptForDetail(null)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image Presentation */}
        <div className="lg:w-1/2 relative bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-hidden">
          <div className="relative w-full pt-[75%] lg:pt-[100%]">
            {promptImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={displayTitle}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${i === currentImageIdx ? 'opacity-100' : 'opacity-0'}`}
                draggable={false}
              />
            ))}
          </div>

          {/* Left/Right arrows */}
          {promptImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(prev => prev === 0 ? promptImages.length - 1 : prev - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-zinc-950/60 hover:bg-zinc-950/90 backdrop-blur-md border border-white/20 text-white transition-all active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(prev => (prev + 1) % promptImages.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-zinc-950/60 hover:bg-zinc-950/90 backdrop-blur-md border border-white/20 text-white transition-all active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Overlay Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none">
            <span className="px-3 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md text-xs font-bold text-zinc-200 border border-white/10 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {prompt.model}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md text-xs font-bold text-zinc-300 border border-white/10">
              AR {prompt.aspectRatio}
            </span>
          </div>

          {/* Image navigation dots */}
          {promptImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {promptImages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(i); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImageIdx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}

          {!isGuest && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <button
                onClick={() => {
                  const url = promptImages[currentImageIdx];
                  if (url.startsWith('data:')) {
                    fetch(url).then(r => r.blob()).then(blob => {
                      const blobUrl = URL.createObjectURL(blob);
                      window.open(blobUrl, '_blank');
                    });
                  } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="px-3 py-1.5 bg-zinc-950/80 hover:bg-zinc-950 backdrop-blur-md text-[11px] font-medium text-zinc-300 hover:text-white rounded-lg border border-white/10 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{t('openOriginalImage')}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLike(prompt.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-950/80 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90"
                  title={prompt.isLiked ? 'Ta bort gilla' : 'Gilla'}
                >
                  <ThumbsUp className={`w-4 h-4 ${prompt.isLiked ? 'fill-blue-500 text-blue-500' : 'text-zinc-300'}`} />
                  <span className="text-xs font-semibold">{prompt.likesCount ?? 0}</span>
                </button>
                <button
                  onClick={() => toggleFavorite(prompt.id)}
                  className="p-2 rounded-full bg-zinc-950/80 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90"
                  title={prompt.isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      prompt.isFavorite ? 'fill-pink-500 text-pink-500' : 'text-zinc-300'
                    }`} 
                  />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Details & Customizer */}
        <div className="lg:w-1/2 flex flex-col overflow-y-auto p-6 space-y-6">
          
          {/* Header info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded">
                {categoryLabel(prompt.category)}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {t('savedOn')} {prompt.createdAt}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white pr-8">
              {displayTitle}
            </h1>

            {!isGuest && displayDescription && (
              <p className="mt-2 text-sm text-zinc-400 font-normal leading-relaxed">
                {displayDescription}
              </p>
            )}

            {/* Creator row with social actions */}
            {prompt.authorId && prompt.authorName && (
              <div className="mt-3 flex items-center gap-2">

                {/* Name / profile button */}
                <button
                  onClick={() => openUserProfile(prompt.authorId!)}
                  className="group/creator flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-950/60 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/40 transition-all duration-200 cursor-pointer flex-1 min-w-0"
                  title={`Visa ${prompt.authorName}s profil`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-black text-white ring-1 ring-emerald-500/40 group-hover/creator:ring-emerald-400 group-hover/creator:scale-110 transition-all duration-200 shrink-0">
                    {prompt.authorPhotoURL
                      ? <img src={prompt.authorPhotoURL} alt={prompt.authorName} className="w-full h-full rounded-full object-cover" />
                      : (prompt.authorName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || <User className="w-3.5 h-3.5" />)
                    }
                  </div>
                  <div className="flex flex-col items-start leading-tight min-w-0">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Skapad av</span>
                    <span className="text-sm font-bold text-zinc-300 group-hover/creator:text-emerald-300 transition-colors duration-200 truncate">
                      <span className="group-hover/creator:[text-shadow:0_0_8px_#4ade80,0_0_20px_#4ade8080] transition-all duration-300">
                        {prompt.authorName}
                      </span>
                    </span>
                  </div>
                  <span className="ml-auto text-[10px] text-zinc-700 group-hover/creator:text-emerald-400 group-hover/creator:[text-shadow:0_0_6px_#4ade80] opacity-0 group-hover/creator:opacity-100 transition-all duration-200 font-semibold shrink-0">
                    Visa profil →
                  </span>
                </button>

                {/* Favourite-user button (heart) */}
                {!isGuest && (
                  <button
                    onClick={handleToggleFavUser}
                    disabled={socialLoading || user.id === prompt.authorId}
                    title={user.id === prompt.authorId ? 'Du kan inte lägga till dig själv som favorit' : (isFavUser ? 'Ta bort från favoriter' : 'Lägg till som favorit')}
                    className={`group/fav p-2.5 rounded-xl border transition-all duration-200 active:scale-90 disabled:opacity-40 shrink-0 ${
                      user.id === prompt.authorId
                        ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        : isFavUser
                        ? 'bg-pink-500/20 border-pink-500/40 text-pink-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-200 ${
                        user.id !== prompt.authorId ? 'group-hover/fav:scale-125' : ''
                      } ${
                        isFavUser ? 'fill-pink-400 [filter:drop-shadow(0_0_6px_#f472b6)]' : ''
                      }`}
                    />
                  </button>
                )}

                {/* Friend button */}
                {!isGuest && (
                  <button
                    onClick={handleFriendAction}
                    disabled={socialLoading || user.id === prompt.authorId}
                    title={user.id === prompt.authorId ? 'Du kan inte skicka vänförfrågan till dig själv' : (isFriend ? 'Ta bort vän' : 'Lägg till som vän')}
                    className={`group/friend p-2.5 rounded-xl border transition-all duration-200 active:scale-90 disabled:opacity-40 shrink-0 ${
                      user.id === prompt.authorId
                        ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        : isFriend
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10'
                    }`}
                  >
                    {isFriend
                      ? <UserCheck className={`w-4 h-4 [filter:drop-shadow(0_0_6px_#4ade80)] transition-all duration-200 ${user.id !== prompt.authorId ? 'group-hover/friend:scale-110' : ''}`} />
                      : <UserPlus  className={`w-4 h-4 transition-all duration-200 ${user.id !== prompt.authorId ? 'group-hover/friend:scale-110' : ''}`} />
                    }
                  </button>
                )}

              </div>
            )}

          </div>

          {isGuest && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
              <h3 className="text-sm font-black text-white">{t('guestLockedTitle')}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {t('guestLockedText')}
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-pink-500/20 transition hover:from-purple-500 hover:to-pink-500"
              >
                {t('guestLoginCta')}
              </button>
            </div>
          )}

          {/* Dynamic Variable Customizer Box */}
          {!isGuest && prompt.variables && prompt.variables.length > 0 && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
              
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <Sliders className="w-3.5 h-3.5" />
                <span>{t('customizeVariables')}</span>
              </div>

              <p className="text-xs text-zinc-400">
                {t('customizeVariablesHelp')}
              </p>

              <div className="space-y-2.5 pt-1">
                {prompt.variables.map((v) => (
                  <div key={v.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <label className="sm:w-1/3 text-xs font-mono font-bold text-zinc-300 truncate">
                      [{v.name}]
                    </label>
                    <input
                      type="text"
                      value={variableValues[v.name] ?? ''}
                      onChange={(e) => handleVariableChange(v.name, e.target.value)}
                      placeholder={v.defaultValue || t('writeVariable', { name: v.name })}
                      className="flex-1 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-700 font-medium"
                    />
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Final Prompt Output Box */}
          {!isGuest && (
          <div className="space-y-2">
            
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                {t('finalPrompt')}
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {customizedPromptText.length} {t('characters')}
              </span>
            </div>

            <div className="relative group">
              <textarea
                readOnly
                value={customizedPromptText}
                rows={5}
                className="w-full p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none resize-none selection:bg-purple-600 selection:text-white"
              />
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
                copied
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t('promptCopied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('copyCustomPrompt')}</span>
                </>
              )}
            </button>

          </div>
          )}

          {/* Negative Prompt if available */}
          {!isGuest && prompt.negativePrompt && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <label className="text-[11px] font-bold text-pink-500 uppercase tracking-wide block">
                {t('negativePromptAvoid')}
              </label>
              <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800/60 text-xs text-zinc-400 font-mono">
                {prompt.negativePrompt}
              </div>
            </div>
          )}

          {/* Tags & Metadata */}
          {!isGuest && (
          <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex flex-wrap gap-1">
              {prompt.tags.map(t => (
                <span key={t} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                  #{tagLabel(t)}
                </span>
              ))}
            </div>

            {prompt.seed && (
              <span className="text-[10px] text-zinc-500 font-mono">
                Seed: {prompt.seed}
              </span>
            )}

          </div>
          )}

        </div>

      </div>

    </div>
  );
};
