import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Check, XCircle, Clock, Shield, UserCheck, AlertTriangle,
  Send, Mail, Search, Ban, Crown, Eye, Users, Megaphone
} from 'lucide-react';
import {
  subscribeApplications, updateApplicationStatus, subscribeAllUsers,
  blockUser, unblockUser, subscribeBlockedEmails, sendWarning, sendWarningToAllUsers,
  type AuthorApplication, type UserProfile, type Warning
} from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';

type Tab = 'applications' | 'users' | 'blocked' | 'warnings';

const PERIODS = [
  { value: '1month', label: '1 månad' },
  { value: '5months', label: '5 månader' },
  { value: '1year', label: '1 år' },
  { value: 'forever', label: 'Tillsvidare' },
] as const;

const warningResponseLabel = (w: Warning): { text: string; tone: 'ok' | 'no' | 'legacy' | 'pending' } => {
  if (w.response === 'accepted') return { text: 'Godkände meddelandet', tone: 'ok' };
  if (w.response === 'rejected') return { text: 'Godkände inte', tone: 'no' };
  if (typeof (w as Warning & { response?: unknown }).response === 'string' && (w as { response: string }).response) {
    return { text: (w as { response: string }).response, tone: 'legacy' };
  }
  return { text: 'Väntar på svar', tone: 'pending' };
};

const getPeriodEnd = (period: string): string | null => {
  if (period === 'forever') return null;
  const now = new Date();
  switch (period) {
    case '1month': now.setMonth(now.getMonth() + 1); break;
    case '5months': now.setMonth(now.getMonth() + 5); break;
    case '1year': now.setFullYear(now.getFullYear() + 1); break;
  }
  return now.toISOString().split('T')[0];
};

export const AdminDashboardInner: React.FC<{
  onClose: () => void;
  initialPendingCount?: number;
}> = ({ onClose, initialPendingCount = 0 }) => {
  const { user } = useAuth();
  const { openUserProfile } = usePrompts();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [applications, setApplications] = useState<AuthorApplication[]>([]);
  const [applicationsError, setApplicationsError] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [blockedEmails, setBlockedEmails] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Warning modal state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningTarget, setWarningTarget] = useState<UserProfile | null>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  useEffect(() => {
    setApplicationsError(false);
    const unsubApps = subscribeApplications(setApplications, () => setApplicationsError(true));
    const unsubUsers = subscribeAllUsers(setUsers);
    const unsubBlocked = subscribeBlockedEmails(setBlockedEmails);
    return () => { unsubApps(); unsubUsers(); unsubBlocked(); };
  }, []);

  const handleAccept = async (app: AuthorApplication, period: '1month' | '5months' | '1year' | 'forever') => {
    if (!app.id) return;
    setActionLoading(app.id);
    await updateApplicationStatus(app.id, 'accepted', app.uid, period);
    setActionLoading(null);
  };

  const handleReject = async (app: AuthorApplication) => {
    if (!app.id) return;
    setActionLoading(app.id);
    await updateApplicationStatus(app.id, 'rejected', app.uid);
    setActionLoading(null);
  };

  const handleBlock = async (uid: string, email?: string) => {
    if (!email) return;
    await blockUser(uid, email);
  };

  const handleUnblock = async (email: string, uid?: string) => {
    await unblockUser(email, uid);
  };

  const handleSendWarning = async () => {
    if (!warningTarget || !warningMessage.trim()) return;
    await sendWarning(warningTarget.uid, warningMessage.trim());
    setShowWarningModal(false);
    setWarningTarget(null);
    setWarningMessage('');
  };

  const handleBroadcastWarning = async () => {
    if (!broadcastMessage.trim()) return;
    setBroadcastLoading(true);
    setBroadcastResult(null);
    try {
      const count = await sendWarningToAllUsers(broadcastMessage.trim());
      setBroadcastResult(t('adminBroadcastSuccess').replace('{count}', String(count)));
      setBroadcastMessage('');
    } catch (e) {
      console.error(e);
      setBroadcastResult(t('adminBroadcastError'));
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleViewProfile = (uid: string) => {
    onClose();
    openUserProfile(uid);
  };

  const pendingApps = applications.filter(a => a.status === 'pending');
  const warningsNeedingReview = users.reduce(
    (n, u) => n + (u.warnings?.filter(w => !w.response).length ?? 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-panel-title"
    >
      <div
        className="relative flex h-[min(90dvh,880px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 id="admin-panel-title" className="text-lg font-black text-white sm:text-xl">Admin Panel</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 overflow-x-auto border-b border-zinc-800 px-4 scrollbar-hide sm:px-6">
          {([
            { key: 'applications', label: 'Become an Author', icon: Crown, count: pendingApps.length },
            { key: 'users', label: 'Användare', icon: Users, count: users.length },
            { key: 'blocked', label: 'Blockerade', icon: Ban, count: blockedEmails.length },
            { key: 'warnings', label: 'Varningar', icon: AlertTriangle, count: warningsNeedingReview },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px shrink-0 ${
                activeTab === tab.key ? 'border-amber-400 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {applicationsError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                  Kunde inte ladda ansökningar. Kontrollera Firestore-regler för samlingen <code className="text-red-200">applications</code> så att admin kan läsa dokument.
                </div>
              )}
              {!applicationsError && pendingApps.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3">
                  <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-sm font-bold text-amber-100">
                    {pendingApps.length} ny{pendingApps.length === 1 ? '' : 'a'} &quot;Become an Author&quot;-ansökning{pendingApps.length === 1 ? '' : 'ar'} väntar på granskning
                  </p>
                </div>
              )}
              {applications.length === 0 && !applicationsError ? (
                <p className="text-center text-zinc-500 py-8">
                  {initialPendingCount > 0
                    ? 'Laddar ansökningar...'
                    : 'Inga Become an Author-ansökningar ännu'}
                </p>
              ) : applications.length > 0 ? (
                applications.map(app => (
                  <div key={app.id} className={`rounded-2xl border p-5 ${
                    app.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' :
                    app.status === 'accepted' ? 'border-emerald-500/30 bg-emerald-500/5' :
                    'border-red-500/30 bg-red-500/5'
                  }`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white">{app.displayName}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            app.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {app.status === 'pending' ? 'Väntar' : app.status === 'accepted' ? 'Godkänd' : 'Nekad'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-zinc-400">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.contactEmail}</span>
                          {app.portfolioUrl && <span>{app.portfolioUrl}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{app.createdAt?.split('T')[0]}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {app.exampleImageUrl && (
                            <div>
                              <p className="text-[11px] font-bold text-zinc-500 uppercase mb-2">Exempelbild</p>
                              <a
                                href={app.exampleImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block max-w-xs overflow-hidden rounded-xl border border-zinc-700"
                              >
                                <img
                                  src={app.exampleImageUrl}
                                  alt="Exempel"
                                  className="max-h-48 w-full object-cover"
                                />
                              </a>
                            </div>
                          )}
                          <div>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase">Erfarenhet</p>
                            <p className="text-sm text-zinc-300 mt-0.5">{app.experience}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase">Motivation</p>
                            <p className="text-sm text-zinc-300 mt-0.5">{app.motivation}</p>
                          </div>
                        </div>
                      </div>

                      {app.status === 'pending' && (
                        <div className="shrink-0 w-full sm:w-auto">
                          <p className="text-xs font-bold text-zinc-400 mb-2">Godkänn med period:</p>
                          <div className="flex flex-wrap gap-2">
                            {PERIODS.map(p => (
                              <button
                                key={p.value}
                                onClick={() => handleAccept(app, p.value)}
                                disabled={actionLoading === app.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                {p.label}
                              </button>
                            ))}
                            <button
                              onClick={() => handleReject(app)}
                              disabled={actionLoading === app.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-bold transition disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" />
                              Neka
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="mb-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">{t('adminBroadcastTitle')}</h3>
                </div>
                <p className="mb-3 text-xs text-zinc-400">{t('adminBroadcastHint')}</p>
                <textarea
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder={t('adminBroadcastPlaceholder')}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBroadcastWarning}
                    disabled={broadcastLoading || !broadcastMessage.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {broadcastLoading ? t('adminBroadcastSending') : t('adminBroadcastSend')}
                  </button>
                  {broadcastResult && (
                    <p className="text-xs text-zinc-400">{broadcastResult}</p>
                  )}
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Sök användare..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div className="space-y-3">
                {users
                  .filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.uid?.includes(searchQuery) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(u => (
                    <div key={u.uid} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {u.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm truncate">{u.displayName}</span>
                            {u.isAuthor && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            {u.isBlocked && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Blockerad</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                            {u.email && <span className="text-zinc-400">{u.email}</span>}
                            <span>{u.uid?.slice(0, 12)}...</span>
                            {u.authorExpiresAt && (
                              <span className="text-amber-400/70">Utgår: {u.authorExpiresAt.split('T')[0]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleViewProfile(u.uid)}
                          className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-purple-400 transition"
                          title={t('adminViewProfile')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setWarningTarget(u); setShowWarningModal(true); }}
                          className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-amber-400 transition"
                          title={t('adminSendWarning')}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                        {!u.isBlocked ? (
                          <button
                            onClick={() => handleBlock(u.uid, u.email)}
                            className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-red-400 transition"
                            title="Blockera"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(u.email!, u.uid)}
                            className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-emerald-400 transition"
                            title="Avblockera"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-3">
              {blockedEmails.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">Inga blockerade konton</p>
              ) : (
                blockedEmails.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <Ban className="w-4 h-4 text-red-400" />
                      <div>
                        <span className="text-sm font-bold text-white">{b.email}</span>
                        <p className="text-[11px] text-zinc-500">Blockerad: {b.blockedAt?.split('T')[0]}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(b.email, b.uid)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition"
                    >
                      <UserCheck className="w-3 h-3" />
                      Avblockera
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="space-y-4">
              {users.filter(u => u.warnings && u.warnings.length > 0).length === 0 ? (
                <p className="text-center text-zinc-500 py-8">Inga varningar skickade</p>
              ) : (
                users.filter(u => u.warnings && u.warnings.length > 0).map(u => (
                  <div key={u.uid} className="rounded-2xl border border-zinc-800 bg-zinc-800/30 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white text-sm">{u.displayName}</span>
                      <span className="text-xs text-zinc-500">({u.warnings?.length} varningar)</span>
                    </div>
                    <div className="space-y-3">
                      {u.warnings?.map(w => (
                        <div key={w.id} className="pl-4 border-l-2 border-amber-500/30">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-zinc-300">{w.message}</p>
                            <span className="text-[10px] text-zinc-600 shrink-0">{w.createdAt.split('T')[0]}</span>
                          </div>
                          {(() => {
                            const r = warningResponseLabel(w);
                            if (r.tone === 'pending') {
                              return <p className="mt-2 text-xs italic text-zinc-500">{r.text}</p>;
                            }
                            return (
                              <div
                                className={`mt-2 rounded-xl border p-3 ${
                                  r.tone === 'ok'
                                    ? 'border-emerald-500/20 bg-emerald-500/10'
                                    : r.tone === 'no'
                                      ? 'border-red-500/20 bg-red-500/10'
                                      : 'border-zinc-700 bg-zinc-800/50'
                                }`}
                              >
                                <p
                                  className={`text-[11px] font-bold uppercase ${
                                    r.tone === 'ok'
                                      ? 'text-emerald-400'
                                      : r.tone === 'no'
                                        ? 'text-red-400'
                                        : 'text-zinc-400'
                                  }`}
                                >
                                  {u.displayName}: {r.text}
                                </p>
                                {w.responseNote && (
                                  <div className="mt-2 rounded-lg border border-zinc-700/60 bg-zinc-950/40 p-2.5">
                                    <p className="text-[10px] font-bold uppercase text-zinc-500">
                                      {t('warningUserReply')}
                                    </p>
                                    <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{w.responseNote}</p>
                                  </div>
                                )}
                                {w.respondedAt && (
                                  <p className="mt-1 text-[10px] text-zinc-600">{w.respondedAt.split('T')[0]}</p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Warning Modal */}
        {showWarningModal && warningTarget && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowWarningModal(false)}>
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white">Skicka varning till {warningTarget.displayName}</h3>
              </div>
              <textarea
                value={warningMessage}
                onChange={e => setWarningMessage(e.target.value)}
                placeholder="Skriv varningsmeddelande..."
                rows={4}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setShowWarningModal(false); setWarningMessage(''); }} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition">Avbryt</button>
                <button onClick={handleSendWarning} disabled={!warningMessage.trim()} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition disabled:opacity-50">
                  <Send className="w-3 h-3" />
                  Skicka varning
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Renders admin panel in a full-screen portal (not clipped by header). */
export const AdminDashboardModal: React.FC<{
  onClose: () => void;
  initialPendingCount?: number;
}> = (props) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(<AdminDashboardInner {...props} />, document.body);
};

export const AdminDashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  return isOpen ? <AdminDashboardModal onClose={() => setIsOpen(false)} /> : null;
};

export const useAdminDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  return { isOpen, toggle, AdminPanel: AdminDashboardInner };
};