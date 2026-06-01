import React, { useState, useEffect, useCallback } from 'react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { PromptItem } from '../data/initialPrompts';
import { 
  X, Copy, Check, Heart, Sparkles, ExternalLink, Sliders, ThumbsUp, 
  ChevronLeft, ChevronRight, User, UserPlus, UserCheck, Maximize2 
} from 'lucide-react';
import {
  subscribeUserProfile, sendFriendRequest, removeFriend,
  toggleFavoriteUser, type UserProfile,
} from '../firebase/firestore';
import { showToast } from './Toast';

// Tip 8: Predefined Suggestions for Variables
const PRESETS: Record<string, string[]> = {
  kön: ['mysterious hacker woman', 'cyberpunk warrior man', 'android assassin', 'neo-tokyo detective'],
  klädsel: ['iridescent tech-jacket', 'vintage leather trench coat', 'high-collar street kimono', 'sleek chrome exosuit'],
  omgivning: ['serene pine forest', 'misty neon alleyway', 'abandoned cyberpunk laboratory', 'futuristic penthouse'],
  accentfärg: ['indigo and emerald green', 'cyan and neon pink', 'molten gold and amber', 'electric blue'],
  djur: ['fluffy baby red panda', 'neon glow kitten', 'cybernetic red fox', 'cute chubby owl'],
  accessoar: ['yellow knitted beanie', 'sleek holographic visor', 'miniature jetpack', 'glowing collar'],
  symbol: ['infinity loop combined with a data stream', 'abstract geometric neural node', 'cybernetic digital lotus'],
  färger: ['electric blue and vibrant violet', 'hot pink and toxic yellow', 'rose gold and liquid silver'],
  företagsnamn: ['Nexus', 'Aether', 'Chronos', 'Genesis']
};

export const PromptDetailModal: React.FC = () => {
  const { selectedPromptForDetail } = usePrompts();
  if (!selectedPromptForDetail) return null;
  return <PromptDetailModalInner prompt={selectedPromptForDetail} />;
};

const PromptDetailModalInner: React.FC<{ prompt: PromptItem }> = ({ prompt }) => {
  const { setSelectedPromptForDetail, toggleFavorite, toggleLike, openUserProfile } = usePrompts();
  const { t, categoryLabel, promptTitle, promptDescription, tagLabel, language } = useLanguage();
  const { isGuest, user, setIsAuthModalOpen } = useAuth();

  // Local state for customized variables
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Tip 2: Copy Particles Burst State
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  // Tip 9: Fullscreen Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
    setParticles([]);
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

  // Social helpers
  const authorId = prompt.authorId;
  const isFavUser = !!(authorId && myProfile?.favoriteUsers?.includes(authorId));
  const isFriend  = !!(authorId && myProfile?.friends?.includes(authorId));

  const handleToggleFavUser = useCallback(async () => {
    if (!authorId || isGuest || !user.id) return;
    setSocialLoading(true);
    await toggleFavoriteUser(user.id, authorId, isFavUser);
    showToast(
      isFavUser 
        ? (language === 'sv' ? 'Borttagen från favoritförfattare!' : 'Removed from favorite creators!')
        : (language === 'sv' ? 'Tillagd i favoritförfattare!' : 'Added to favorite creators!'),
      'info'
    );
    setSocialLoading(false);
  }, [authorId, isGuest, user.id, isFavUser, language]);

  const handleFriendAction = useCallback(async () => {
    if (!authorId || isGuest || !user.id) return;
    setSocialLoading(true);
    if (isFriend) {
      await removeFriend(user.id, authorId);
      showToast(language === 'sv' ? 'Vän borttagen.' : 'Friend removed.', 'info');
    } else {
      await sendFriendRequest(user.id, authorId);
      showToast(language === 'sv' ? 'Vänförfrågan skickad!' : 'Friend request sent!', 'success');
    }
    setSocialLoading(false);
  }, [authorId, isGuest, user.id, isFriend, language]);

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
      const regex = new RegExp(`\\[${v.name}\\]`, 'g');
      finalPrompt = finalPrompt.replace(regex, val || `[${v.name}]`);
    });

    return finalPrompt;
  };

  const customizedPromptText = getCustomizedPrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(customizedPromptText);
    setCopied(true);
    showToast(language === 'sv' ? 'Prompt kopierad till urklipp!' : 'Prompt copied to clipboard!', 'success');

    // Trigger Tip 2 Copy Particles Burst
    const newParticles = Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * 360;
      const distance = 40 + Math.random() * 50;
      const rad = (angle * Math.PI) / 180;
      const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
      return {
        id: Math.random(),
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
    setParticles(newParticles);

    setTimeout(() => {
      setCopied(false);
      setParticles([]);
    }, 2000);

    if (!prompt.isLiked && !isGuest) {
      toggleLike(prompt.id);
    }
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4" onClick={() => setSelectedPromptForDetail(null)}>
      
      <div className="relative w-full max-w-5xl bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-fade-in flex flex-col lg:flex-row max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Absolute Close Button */}
        <button
          onClick={() => setSelectedPromptForDetail(null)}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white border border-white/10 transition-all duration-300 active:scale-95 shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image Presentation */}
        <div className="lg:w-1/2 relative bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-hidden group/image">
          
          {/* Click to open Lightbox trigger */}
          <div 
            onClick={() => setIsLightboxOpen(true)}
            className="relative w-full pt-[75%] lg:pt-[100%] cursor-zoom-in"
            title={language === 'sv' ? 'Klicka för fullskärm' : 'Click for fullscreen'}
          >
            {promptImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={displayTitle}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${i === currentImageIdx ? 'opacity-100' : 'opacity-0'}`}
                draggable={false}
              />
            ))}

            {/* Hover fullscreen helper */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
              <span className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950/90 border border-white/15 rounded-xl text-white text-xs font-bold shadow-2xl backdrop-blur-sm">
                <Maximize2 className="w-4 h-4 text-theme-accent" />
                <span>{language === 'sv' ? 'Klicka för fullskärm' : 'Click for fullscreen'}</span>
              </span>
            </div>
          </div>

          {/* Left/Right arrows */}
          {promptImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(prev => prev === 0 ? promptImages.length - 1 : prev - 1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-zinc-950/70 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(prev => (prev + 1) % promptImages.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-zinc-950/70 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Overlay Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none z-20">
            <span className="px-3 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md text-xs font-bold text-zinc-200 border border-white/10 flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {prompt.model}
            </span>
            <span className="px-2.5 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md text-xs font-bold text-zinc-300 border border-white/10 shadow-lg">
              AR {prompt.aspectRatio}
            </span>
          </div>

          {/* Image navigation dots */}
          {promptImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {promptImages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(i); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentImageIdx ? 'bg-white scale-125 w-4' : 'bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}

          {!isGuest && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20">
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
                className="px-3.5 py-2 bg-zinc-950/85 hover:bg-zinc-950 backdrop-blur-md text-[11px] font-bold text-zinc-300 hover:text-white rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors shadow-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t('openOriginalImage')}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    toggleLike(prompt.id);
                    showToast(
                      !prompt.isLiked 
                        ? (language === 'sv' ? 'Du gillade prompten!' : 'You liked the prompt!')
                        : (language === 'sv' ? 'Tog bort din gilla!' : 'Removed like!'),
                      'success'
                    );
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-950/85 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 shadow-lg"
                  title={prompt.isLiked ? 'Ta bort gilla' : 'Gilla'}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${prompt.isLiked ? 'fill-blue-500 text-blue-500' : 'text-zinc-300'}`} />
                  <span className="text-xs font-bold">{prompt.likesCount ?? 0}</span>
                </button>
                <button
                  onClick={() => {
                    toggleFavorite(prompt.id);
                    showToast(
                      !prompt.isFavorite 
                        ? (language === 'sv' ? 'Tillagd i favoriter!' : 'Added to favorites!')
                        : (language === 'sv' ? 'Borttagen från favoriter!' : 'Removed from favorites!'),
                      'info'
                    );
                  }}
                  className="p-2.5 rounded-full bg-zinc-950/85 hover:bg-zinc-950 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 shadow-lg"
                  title={prompt.isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                  <Heart 
                    className={`w-3.5 h-3.5 ${
                      prompt.isFavorite ? 'fill-pink-500 text-pink-500' : 'text-zinc-300'
                    }`} 
                  />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Details & Customizer */}
        <div className="lg:w-1/2 flex flex-col overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Header info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-theme-accent uppercase tracking-widest bg-theme-accent/5 border border-theme-accent/15 px-2 py-0.5 rounded">
                {categoryLabel(prompt.category)}
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">
                {t('savedOn')} {prompt.createdAt}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white pr-8">
              {displayTitle}
            </h1>

            {!isGuest && displayDescription && (
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                {displayDescription}
              </p>
            )}

            {/* Creator row with social actions */}
            {prompt.authorId && prompt.authorName && (
              <div className="mt-4 flex items-center gap-2">

                {/* Name / profile button */}
                <button
                  onClick={() => openUserProfile(prompt.authorId!)}
                  className="group/creator flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-zinc-950/60 hover:bg-theme-accent/5 border border-zinc-800/40 hover:border-theme-accent/30 transition-all duration-300 cursor-pointer flex-1 min-w-0"
                  title={`Visa ${prompt.authorName}s profil`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-[10px] font-black text-white group-hover/creator:scale-110 transition-all duration-300 shrink-0 overflow-hidden">
                    {prompt.authorPhotoURL
                      ? <img src={prompt.authorPhotoURL} alt={prompt.authorName} className="w-full h-full object-cover" />
                      : (prompt.authorName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || <User className="w-3.5 h-3.5" />)
                    }
                  </div>
                  <div className="flex flex-col items-start leading-tight min-w-0">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Skapad av</span>
                    <span className="text-xs font-extrabold text-zinc-300 group-hover/creator:text-white transition-colors duration-200 truncate">
                      {prompt.authorName}
                    </span>
                  </div>
                  <span className="ml-auto text-[9px] text-zinc-600 group-hover/creator:text-theme-accent transition-all duration-300 font-bold shrink-0">
                    {language === 'sv' ? 'Profil →' : 'Profile →'}
                  </span>
                </button>

                {/* Favourite-user button (heart) */}
                {!isGuest && (
                  <button
                    onClick={handleToggleFavUser}
                    disabled={socialLoading || user.id === prompt.authorId}
                    title={user.id === prompt.authorId ? 'Du kan inte lägga till dig själv som favorit' : (isFavUser ? 'Ta bort från favoriter' : 'Lägg till som favorit')}
                    className={`group/fav p-2.5 rounded-2xl border transition-all duration-300 active:scale-90 disabled:opacity-40 shrink-0 ${
                      user.id === prompt.authorId
                        ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        : isFavUser
                        ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-pink-400 hover:border-pink-500/30 hover:bg-pink-500/5'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${
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
                    className={`group/friend p-2.5 rounded-2xl border transition-all duration-300 active:scale-90 disabled:opacity-40 shrink-0 ${
                      user.id === prompt.authorId
                        ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        : isFriend
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                    }`}
                  >
                    {isFriend
                      ? <UserCheck className={`w-4 h-4 [filter:drop-shadow(0_0_6px_#4ade80)] transition-all duration-300 ${user.id !== prompt.authorId ? 'group-hover/friend:scale-110' : ''}`} />
                      : <UserPlus  className={`w-4 h-4 transition-all duration-300 ${user.id !== prompt.authorId ? 'group-hover/friend:scale-110' : ''}`} />
                    }
                  </button>
                )}

              </div>
            )}

          </div>

          {isGuest && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
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

          {/* Dynamic Variable Customizer Box with Preset suggestions (Tip 8) */}
          {!isGuest && prompt.variables && prompt.variables.length > 0 && (
            <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800 space-y-4">
              
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <Sliders className="w-3.5 h-3.5" />
                <span>{t('customizeVariables')}</span>
              </div>

              <p className="text-xs text-zinc-500 font-medium">
                {t('customizeVariablesHelp')}
              </p>

              <div className="space-y-4 pt-1">
                {prompt.variables.map((v) => {
                  const presets = PRESETS[v.name];
                  return (
                    <div key={v.name} className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                        <label className="sm:w-1/3 text-xs font-mono font-bold text-zinc-300 truncate">
                          [{v.name}]
                        </label>
                        <input
                          type="text"
                          value={variableValues[v.name] ?? ''}
                          onChange={(e) => handleVariableChange(v.name, e.target.value)}
                          placeholder={v.defaultValue || t('writeVariable', { name: v.name })}
                          className="flex-1 px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-850 text-xs text-white focus:outline-none focus:border-zinc-700 font-medium shadow-inner"
                        />
                      </div>
                      
                      {/* Presets Chips (Tip 8) */}
                      {presets && presets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 sm:pl-[33.3%]">
                          <span className="text-[8px] font-black text-zinc-650 uppercase tracking-wide mr-1 select-none">
                            {language === 'sv' ? 'Förslag:' : 'Presets:'}
                          </span>
                          {presets.map(pVal => (
                            <button
                              key={pVal}
                              type="button"
                              onClick={() => {
                                handleVariableChange(v.name, pVal);
                                showToast(language === 'sv' ? `Valde: "${pVal}"` : `Selected: "${pVal}"`, 'info');
                              }}
                              className={`text-[9px] px-2 py-0.5 rounded border font-bold transition-all duration-200 
                                ${variableValues[v.name] === pVal
                                  ? 'bg-theme-accent/20 border-theme-accent/40 text-theme-accent shadow-sm'
                                  : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                                }`}
                            >
                              {pVal}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Final Prompt Output Box with Confetti burst relative target (Tip 2) */}
          {!isGuest && (
            <div className="space-y-2">
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                  {t('finalPrompt')}
                </label>
                <span className="text-[10px] text-zinc-550 font-mono font-bold">
                  {customizedPromptText.length} {t('characters')}
                </span>
              </div>

              <div className="relative group">
                <textarea
                  readOnly
                  value={customizedPromptText}
                  rows={5}
                  className="w-full p-4 bg-zinc-950 rounded-2xl border border-zinc-850 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none resize-none leading-relaxed shadow-inner"
                />
              </div>

              {/* Copy Button Container with confetti relative layout */}
              <div className="relative">
                {/* TIP 2 Copied Particles Container */}
                {particles.length > 0 && (
                  <div className="absolute left-1/2 top-1/2 w-0 h-0 pointer-events-none z-30">
                    {particles.map(p => (
                      <span
                        key={p.id}
                        className="absolute w-2 h-2 rounded-full animate-particle pointer-events-none"
                        style={{
                          backgroundColor: p.color,
                          boxShadow: `0 0 6px ${p.color}`,
                          '--x': `${p.x}px`,
                          '--y': `${p.y}px`,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
                
                <button
                  onClick={handleCopy}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] cursor-pointer ${
                    copied
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-theme-gradient text-white shadow-purple-500/10'
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

            </div>
          )}

          {/* Negative Prompt */}
          {!isGuest && prompt.negativePrompt && (
            <div className="space-y-2 pt-3 border-t border-zinc-800/40">
              <label className="text-[11px] font-black text-pink-500 uppercase tracking-widest block">
                {t('negativePromptAvoid')}
              </label>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 text-xs text-zinc-400 font-mono leading-relaxed shadow-inner">
                {prompt.negativePrompt}
              </div>
            </div>
          )}

          {/* Tags & Metadata */}
          {!isGuest && (
            <div className="pt-3 border-t border-zinc-800/40 flex flex-wrap items-center justify-between gap-3">
              
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.map(t => (
                  <span key={t} className="text-[10px] font-bold bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-850 px-2.5 py-0.5 rounded-lg transition-colors">
                    #{tagLabel(t)}
                  </span>
                ))}
              </div>

              {prompt.seed && (
                <span className="text-[10px] text-zinc-550 font-mono font-bold">
                  Seed: {prompt.seed}
                </span>
              )}

            </div>
          )}

        </div>

      </div>

      {/* ─── TIP 9: Fullscreen Image Lightbox Overlay ─── */}
      {isLightboxOpen && (
        <div 
          onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex items-center justify-center cursor-zoom-out animate-fade-in"
        >
          <img
            src={promptImages[currentImageIdx]}
            alt={displayTitle}
            className="max-h-[92vh] max-w-[92vw] object-contain transition-all select-none drop-shadow-2xl"
            draggable={false}
          />
          
          {/* Close lightbox button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all duration-200 active:scale-95 shadow-2xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
};
