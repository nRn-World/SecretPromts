import React, { useState } from 'react';
import { Plus, Heart, FolderGit2, Sparkles, User, LogOut, Bell, UserPlus, ThumbsUp, Shield, Crown, AlertTriangle } from 'lucide-react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import logoImg from '../../logo/SP-no-bg.png';
import { subscribeUserProfile, markNotificationsRead, type UserProfile } from '../firebase/firestore';
import { AdminDashboardInner } from './AdminDashboard';
import { WarningModal } from './WarningModal';


export const Header: React.FC = () => {
  const { t } = useLanguage();
  const { user, isGuest, setIsAuthModalOpen, logout } = useAuth();
  const { 
    activeTab, 
    setActiveTab, 
    setIsCreateModalOpen, 
    prompts,
    isAdmin,
    openUserProfile
  } = usePrompts();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const customCount = prompts.filter(p => p.isCustom).length;

  const [myProfile, setMyProfile] = React.useState<UserProfile | null>(null);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);

  React.useEffect(() => {
    if (isGuest || !user.id) return;
    const unsub = subscribeUserProfile(user.id, setMyProfile);
    return unsub;
  }, [user.id, isGuest]);

  React.useEffect(() => {
    if (isGuest && activeTab !== 'all') {
      setActiveTab('all');
    }
  }, [activeTab, isGuest, setActiveTab]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('all')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 p-0.5 shadow-lg shadow-purple-500/10">
              <div className="flex items-center justify-center w-full h-full bg-zinc-950 rounded-[10px] overflow-hidden p-1">
                <img src={logoImg} alt="SecretPrompts Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-white animate-shimmer bg-[length:200%_100%]">
                  SecretPrompts
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">{t('brandSubtitle')}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1.5 rounded-full border border-zinc-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('gallery')}</span>
              <span className="bg-zinc-950/40 text-[10px] px-1.5 py-0.2 rounded-full border border-white/10">
                {prompts.length}
              </span>
            </button>

            {!isGuest && (
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'favorites'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
                <span>{t('favorites')}</span>
              </button>
            )}

            {!isGuest && (
              <button
                onClick={() => setActiveTab('my-creations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'my-creations'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>{t('myPrompts')}</span>
                {customCount > 0 && (
                  <span className="bg-zinc-950/40 text-[10px] px-1.5 py-0.2 rounded-full border border-white/10">
                    {customCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />

            {/* Notifications */}
            {!isGuest && (
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (!isNotifOpen && myProfile?.notifications?.some(n => !n.read)) {
                      markNotificationsRead(user.id!, myProfile.notifications);
                    }
                  }}
                  className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <Bell className="w-5 h-5" />
                  {((myProfile?.friendRequests?.length || 0) + (myProfile?.notifications?.filter(n => !n.read).length || 0)) > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-zinc-950"></span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50">
                    <div className="p-3 border-b border-zinc-800">
                      <h3 className="text-sm font-bold text-white">Aviseringar</h3>
                    </div>
                    {((myProfile?.notifications?.length || 0) === 0 && (myProfile?.friendRequests?.length || 0) === 0) ? (
                      <div className="p-4 text-center text-xs text-zinc-500">Inga nya händelser</div>
                    ) : (
                      <div className="flex flex-col">
                        {myProfile?.friendRequests?.map(req => (
                          <div key={req} className="p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors flex gap-3 items-center cursor-pointer" onClick={() => { setIsNotifOpen(false); openUserProfile(user.id!); }}>
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                              <UserPlus className="w-4 h-4" />
                            </div>
                            <div className="text-xs text-zinc-300">
                              <span className="font-bold text-white">Någon</span> skickade en vänförfrågan till dig! Klicka för att hantera.
                            </div>
                          </div>
                        ))}
                        {[...(myProfile?.notifications || [])].reverse().map(n => (
                          <div key={n.id} className="p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors flex gap-3 items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              n.type === 'like' ? 'bg-pink-500/20 text-pink-400' :
                              n.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                              n.type === 'author_granted' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {n.type === 'like' ? <ThumbsUp className="w-4 h-4" /> :
                               n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                               n.type === 'author_granted' ? <Crown className="w-4 h-4" /> :
                               <User className="w-4 h-4" />}
                            </div>
                            <div className="text-xs text-zinc-300">
                              {n.type === 'like' ? (
                                <><span className="font-bold text-white">{n.fromName}</span> gillade din prompt "{n.promptTitle}".</>
                              ) : n.type === 'warning' ? (
                                <span><span className="font-bold text-amber-400">Varning!</span> Admin har skickat ett meddelande till dig. <button onClick={() => { setIsNotifOpen(false); setShowWarningModal(true); }} className="text-purple-400 hover:underline">Klicka för att svara.</button></span>
                              ) : n.type === 'author_granted' ? (
                                <span><span className="font-bold text-emerald-400">Grattis!</span> Du har blivit godkänd som skapare!</span>
                              ) : (
                                <><span className="font-bold text-white">{n.fromName}</span> {n.type === 'friend_request_accepted' ? 'accepterade din vänförfrågan' : ''}</>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950 px-2 py-1.5">
              <button
                onClick={() => isGuest ? setIsAuthModalOpen(true) : openUserProfile(user.id!)}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-zinc-300 transition hover:text-white"
                title={isGuest ? t('authGuest') : `${t('authSignedInAs')} ${user.email} (Klicka för din profil)`}
              >
                <User className="h-3.5 w-3.5 text-purple-400" />
                <span className="hidden xl:inline max-w-[120px] truncate">
                  {isGuest ? t('authGuest') : user.displayName}
                </span>
              </button>
              {!isGuest && (
                <button
                  onClick={logout}
                  className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                  title={t('authLogout')}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setShowAdminPanel(true)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition" title="Admin Panel">
                  <Shield className="w-3 h-3" />
                  Admin
                </button>
              )}
            </div>

            {!isAdmin && (
              <a
                href="#become-author"
                className="hidden lg:flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3.5 py-2.5 text-xs font-bold text-purple-300 transition-colors hover:bg-purple-500/20 hover:text-white"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('becomeAuthor')}</span>
              </a>
            )}

            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-pink-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">{t('saveNewPrompt')}</span>
                <span className="sm:hidden">{t('saveShort')}</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between gap-1 py-2 border-t border-zinc-800/60">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${
              activeTab === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('gallery')}</span>
          </button>
          {!isGuest && (
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'favorites' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>{t('favorites')}</span>
            </button>
          )}
          {!isGuest && (
            <button
              onClick={() => setActiveTab('my-creations')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'my-creations' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>{t('myPrompts')}</span>
            </button>
          )}
        </div>

      </div>
      {showAdminPanel && isAdmin && <AdminDashboardInner onClose={() => setShowAdminPanel(false)} />}
      {showWarningModal && myProfile?.warnings && myProfile.warnings.length > 0 && (
        <WarningModal warnings={myProfile.warnings} onClose={() => setShowWarningModal(false)} />
      )}
    </header>
  );
};
