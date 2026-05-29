import React, { useEffect, useState, useCallback } from 'react';
import {
  X, User, Heart, Sparkles, Grid3X3, UserPlus, UserCheck, UserMinus,
  Star, StarOff, Layers, Clock, Eye, ThumbsUp, Send
} from 'lucide-react';
import { usePrompts } from '../context/PromptContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getUserProfile, getUserPrompts, ensureUserProfile,
  sendFriendRequest, removeFriend, toggleFavoriteUser,
  subscribeUserProfile, acceptFriendRequest, declineFriendRequest,
  type UserProfile,
} from '../firebase/firestore';
import type { PromptItem } from '../data/initialPrompts';

type Tab = 'prompts' | 'favorites' | 'categories' | 'fav-creators' | 'friend-reqs';

const Avatar: React.FC<{ name: string; photoURL?: string; size?: 'sm' | 'lg' }> = ({
  name, photoURL, size = 'lg'
}) => {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const cls = size === 'lg'
    ? 'w-20 h-20 text-2xl'
    : 'w-8 h-8 text-xs';

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={`${cls} rounded-full object-cover ring-2 ring-purple-500/40`}
      />
    );
  }

  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-black text-white ring-2 ring-purple-500/40 shrink-0`}>
      {initials || <User className={size === 'lg' ? 'w-8 h-8' : 'w-4 h-4'} />}
    </div>
  );
};

const UserListItem: React.FC<{ uid: string, type: 'friend_req' | 'fav', onAccept?: () => void, onDecline?: () => void, onView?: () => void }> = ({ uid, type, onAccept, onDecline, onView }) => {
  const [u, setU] = useState<UserProfile | null>(null);
  useEffect(() => {
    getUserProfile(uid).then(setU);
  }, [uid]);
  if (!u) return <div className="h-16 bg-zinc-800/50 rounded-xl animate-pulse"></div>;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-800 gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={u.displayName} photoURL={u.photoURL} size="sm" />
        <span className="text-sm font-bold text-white">{u.displayName}</span>
      </div>
      {type === 'fav' ? (
        <button onClick={onView} className="text-xs px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-bold transition">Visa profil</button>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={onAccept} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs transition">Godkänn</button>
          <button onClick={onDecline} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg text-xs transition">Neka</button>
        </div>
      )}
    </div>
  );
};

const MiniPromptCard: React.FC<{ prompt: PromptItem; onClick: () => void }> = ({ prompt, onClick }) => (
  <button
    onClick={onClick}
    className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 transition-all hover:scale-[1.02] text-left w-full"
  >
    <div className="relative w-full pt-[60%] bg-zinc-950">
      <img
        src={prompt.imageUrl}
        alt={prompt.title}
        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-950/80 text-[9px] font-bold text-amber-400 border border-amber-400/20 flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5" />
        {prompt.model}
      </span>
    </div>
    <div className="p-2.5">
      <p className="text-xs font-bold text-white truncate">{prompt.title}</p>
      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
        <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" />{prompt.likesCount ?? 0}</span>
        <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{prompt.viewCount ?? 0}</span>
      </div>
    </div>
  </button>
);

export const UserProfileModal: React.FC = () => {
  const { selectedProfileUid } = usePrompts();
  if (!selectedProfileUid) return null;
  return <UserProfileModalInner selectedProfileUid={selectedProfileUid} />;
};

const UserProfileModalInner: React.FC<{ selectedProfileUid: string }> = ({ selectedProfileUid }) => {
  const { closeUserProfile, setSelectedPromptForDetail, prompts } = usePrompts();
  const { user, isGuest } = useAuth();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPrompts, setUserPrompts] = useState<PromptItem[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('prompts');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = !isGuest && user.id === selectedProfileUid;
  const isFriend = myProfile?.friends?.includes(selectedProfileUid ?? '') ?? false;
  const hasSentRequest = profile?.friendRequests?.includes(user.id ?? '') ?? false;
  const isFavUser = myProfile?.favoriteUsers?.includes(selectedProfileUid ?? '') ?? false;

  // Load viewed profile
  useEffect(() => {
    if (!selectedProfileUid) return;
    setLoading(true);
    setActiveTab('prompts');

    const unsub = subscribeUserProfile(selectedProfileUid, (p) => {
      setProfile(p);
      setLoading(false);
    });

    getUserPrompts(selectedProfileUid).then(setUserPrompts);

    return unsub;
  }, [selectedProfileUid]);

  // Load own profile for social state
  useEffect(() => {
    if (isGuest || !user.id) return;
    const unsub = subscribeUserProfile(user.id, setMyProfile);
    return unsub;
  }, [user.id, isGuest]);

  const handleSendRequest = useCallback(async () => {
    if (!selectedProfileUid || !user.id || isGuest) return;
    setActionLoading(true);
    await sendFriendRequest(user.id, selectedProfileUid);
    setActionLoading(false);
  }, [selectedProfileUid, user.id, isGuest]);

  const handleRemoveFriend = useCallback(async () => {
    if (!selectedProfileUid || !user.id) return;
    setActionLoading(true);
    await removeFriend(user.id, selectedProfileUid);
    setActionLoading(false);
  }, [selectedProfileUid, user.id]);

  const handleToggleFavUser = useCallback(async () => {
    if (!selectedProfileUid || !user.id || isGuest) return;
    setActionLoading(true);
    await toggleFavoriteUser(user.id, selectedProfileUid, isFavUser);
    setActionLoading(false);
  }, [selectedProfileUid, user.id, isGuest, isFavUser]);

  const favPrompts = prompts.filter(p => p.isFavorite && p.authorId === selectedProfileUid);
  const profileCategories = profile?.createdCategories ?? [];

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-zinc-950/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={closeUserProfile}
    >
      <div
        className="relative w-full max-w-3xl bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header gradient bar ── */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-900/60 via-pink-900/30 to-transparent pointer-events-none" />

        {/* ── Close ── */}
        <button
          onClick={closeUserProfile}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Profile header ── */}
        <div className="relative px-6 pt-8 pb-4">
          {loading ? (
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-zinc-800 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          ) : profile ? (
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative">
                <Avatar name={profile.displayName} photoURL={profile.photoURL} size="lg" />
                {isFriend && (
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-zinc-900">
                    <UserCheck className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-white truncate">{profile.displayName}</h2>
                  {isFavUser && <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />}
                </div>
                {profile.bio && (
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed max-w-sm">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Grid3X3 className="w-3 h-3" />
                    {userPrompts.length} prompts
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    {profile.friends?.length ?? 0} vänner
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {profile.createdAt?.split('T')[0] ?? ''}
                  </span>
                </div>
              </div>

              {/* Social actions (only shown if NOT own profile) */}
              {!isOwnProfile && !isGuest && (
                <div className="flex items-center gap-2 shrink-0">
                  {/* Favourite user toggle */}
                  <button
                    onClick={handleToggleFavUser}
                    disabled={actionLoading}
                    title={isFavUser ? 'Ta bort från favoriter' : 'Lägg till som favorit'}
                    className={`p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-50 ${
                      isFavUser
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40'
                    }`}
                  >
                    {isFavUser ? <Star className="w-4 h-4 fill-amber-400" /> : <Star className="w-4 h-4" />}
                  </button>

                  {/* Friend action */}
                  {isFriend ? (
                    <button
                      onClick={handleRemoveFriend}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-red-900/30 border border-zinc-700 hover:border-red-500/40 text-zinc-300 hover:text-red-400 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>Vän</span>
                    </button>
                  ) : hasSentRequest ? (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-300 text-sm font-bold cursor-default"
                    >
                      <Send className="w-4 h-4" />
                      <span>Förfrågan skickad</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSendRequest}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold shadow-lg shadow-pink-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Lägg till vän</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Användaren hittades inte</p>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-zinc-800 px-6 mt-2 overflow-x-auto scrollbar-hide">
          {([
            { key: 'prompts', label: 'Skapade prompts', icon: Grid3X3, count: userPrompts.length, show: true },
            { key: 'favorites', label: 'Favoriter', icon: Heart, count: favPrompts.length, show: true },
            { key: 'categories', label: 'Kategorier', icon: Layers, count: profileCategories.length, show: true },
            { key: 'fav-creators', label: 'Favoritskapare', icon: Star, count: profile?.favoriteUsers?.length ?? 0, show: isOwnProfile },
            { key: 'friend-reqs', label: 'Vänförfrågningar', icon: UserPlus, count: profile?.friendRequests?.length ?? 0, show: isOwnProfile },
          ] as const).filter(t => t.show).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
                activeTab === tab.key
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab.key ? 'bg-purple-500/30 text-purple-300' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-zinc-800 animate-pulse">
                  <div className="w-full pt-[60%]" />
                  <div className="p-2.5 space-y-1">
                    <div className="h-3 w-3/4 bg-zinc-700 rounded" />
                    <div className="h-2 w-1/2 bg-zinc-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'prompts' ? (
            userPrompts.length === 0 ? (
              <EmptyState icon={Grid3X3} label="Inga skapade prompts ännu" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userPrompts.map(p => (
                  <MiniPromptCard
                    key={p.id}
                    prompt={p}
                    onClick={() => { setSelectedPromptForDetail(p); closeUserProfile(); }}
                  />
                ))}
              </div>
            )
          ) : activeTab === 'favorites' ? (
            favPrompts.length === 0 ? (
              <EmptyState icon={Heart} label="Inga favorit-prompts att visa" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {favPrompts.map(p => (
                  <MiniPromptCard
                    key={p.id}
                    prompt={p}
                    onClick={() => { setSelectedPromptForDetail(p); closeUserProfile(); }}
                  />
                ))}
              </div>
            )
          ) : activeTab === 'categories' ? (
            profileCategories.length === 0 ? (
              <EmptyState icon={Layers} label="Inga egna kategorier skapade" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileCategories.map(cat => (
                  <span
                    key={cat}
                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-semibold rounded-xl"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )
          ) : activeTab === 'fav-creators' ? (
            !profile?.favoriteUsers?.length ? (
              <EmptyState icon={Star} label="Du har inga favoritskapare än. Tryck på hjärtat vid en skapare för att lägga till!" />
            ) : (
              <div className="space-y-3">
                {profile.favoriteUsers.map(uid => (
                  <UserListItem
                    key={uid}
                    uid={uid}
                    type="fav"
                    onView={() => { closeUserProfile(); setTimeout(() => openUserProfile(uid), 50); }}
                  />
                ))}
              </div>
            )
          ) : activeTab === 'friend-reqs' ? (
            !profile?.friendRequests?.length ? (
              <EmptyState icon={UserPlus} label="Inga väntande vänförfrågningar." />
            ) : (
              <div className="space-y-3">
                {profile.friendRequests.map(uid => (
                  <UserListItem
                    key={uid}
                    uid={uid}
                    type="friend_req"
                    onAccept={async () => {
                      setActionLoading(true);
                      await acceptFriendRequest(user.id!, uid);
                      setActionLoading(false);
                    }}
                    onDecline={async () => {
                      setActionLoading(true);
                      await declineFriendRequest(user.id!, uid);
                      setActionLoading(false);
                    }}
                  />
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ icon: React.FC<any>; label: string }> = ({ icon: Icon, label }) => (
  <div className="text-center py-12 text-zinc-600">
    <Icon className="w-10 h-10 mx-auto mb-3 opacity-30" />
    <p className="text-sm">{label}</p>
  </div>
);
