import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, CheckCircle2, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { respondToWarning, WARNING_RESPONSE_MAX_CHARS, type Warning } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const WarningModal: React.FC<{ warnings: Warning[]; onClose: () => void }> = ({ warnings, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [localWarnings, setLocalWarnings] = useState(warnings);
  const [replyNotes, setReplyNotes] = useState<Record<string, string>>({});

  const pending = localWarnings.filter(w => !w.response);

  const getReply = (warningId: string) =>
    (replyNotes[warningId] || '').slice(0, WARNING_RESPONSE_MAX_CHARS);

  const setReply = (warningId: string, value: string) => {
    setReplyNotes(prev => ({
      ...prev,
      [warningId]: value.slice(0, WARNING_RESPONSE_MAX_CHARS),
    }));
  };

  const handleRespond = async (warningId: string, accepted: boolean) => {
    if (!user.id) return;
    setActionLoading(warningId);
    const note = getReply(warningId);
    try {
      await respondToWarning(user.id, warningId, accepted, note);
      setLocalWarnings(prev =>
        prev.map(w =>
          w.id === warningId
            ? {
                ...w,
                response: accepted ? 'accepted' : 'rejected',
                responseNote: note,
                respondedAt: new Date().toISOString(),
              }
            : w
        )
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (localWarnings.length === 0) return null;

  const content = (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[min(85dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('warningModalTitle')}</h3>
              {pending.length > 0 && (
                <p className="text-xs text-amber-300/80">{t('warningModalSubtitle')}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {localWarnings.map(w => {
            const replyLen = getReply(w.id).length;
            const isPending = w.response !== 'accepted' && w.response !== 'rejected';

            return (
              <div key={w.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-zinc-200">{w.message}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{w.createdAt.split('T')[0]}</p>
                  </div>
                </div>

                {!isPending ? (
                  <div
                    className={`mt-3 rounded-xl border p-3 ${
                      w.response === 'accepted'
                        ? 'border-emerald-500/20 bg-emerald-500/10'
                        : 'border-red-500/20 bg-red-500/10'
                    }`}
                  >
                    <div
                      className={`mb-1 flex items-center gap-1.5 text-xs font-bold ${
                        w.response === 'accepted' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {w.response === 'accepted' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          {t('warningYouAccepted')}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          {t('warningYouRejected')}
                        </>
                      )}
                    </div>
                    {w.responseNote && (
                      <div className="mt-2 rounded-lg border border-zinc-700/50 bg-zinc-950/50 p-2.5">
                        <p className="text-[10px] font-bold uppercase text-zinc-500">{t('warningYourReply')}</p>
                        <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{w.responseNote}</p>
                      </div>
                    )}
                    {w.respondedAt && (
                      <p className="mt-2 text-[10px] text-zinc-600">{w.respondedAt.split('T')[0]}</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase text-zinc-400">
                        {t('warningReplyLabel')}
                      </label>
                      <textarea
                        value={getReply(w.id)}
                        onChange={e => setReply(w.id, e.target.value)}
                        placeholder={t('warningReplyPlaceholder')}
                        rows={3}
                        maxLength={WARNING_RESPONSE_MAX_CHARS}
                        className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
                      />
                      <p
                        className={`mt-1 text-right text-[10px] font-mono ${
                          replyLen >= WARNING_RESPONSE_MAX_CHARS ? 'text-amber-400' : 'text-zinc-600'
                        }`}
                      >
                        {t('warningReplyCharCount', {
                          current: String(replyLen),
                          max: String(WARNING_RESPONSE_MAX_CHARS),
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleRespond(w.id, true)}
                        disabled={actionLoading === w.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {t('warningAccept')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(w.id, false)}
                        disabled={actionLoading === w.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-400 ring-1 ring-red-500/30 transition hover:bg-red-500/30 disabled:opacity-50"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        {t('warningReject')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
