import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Megaphone, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  getAdminNews,
  getAdminNewsReaction,
  reactToAdminNews,
  type AdminNews,
  type AdminNewsReactionType,
} from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const AdminNewsModal: React.FC<{
  newsId: string;
  onClose: () => void;
}> = ({ newsId, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [news, setNews] = useState<AdminNews | null>(null);
  const [reaction, setReaction] = useState<AdminNewsReactionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!newsId || !user.id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getAdminNews(newsId), getAdminNewsReaction(newsId, user.id)]).then(([item, r]) => {
      if (!cancelled) {
        setNews(item);
        setReaction(r);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [newsId, user.id]);

  const handleReact = async (choice: AdminNewsReactionType) => {
    if (!user.id || submitting) return;
    setSubmitting(true);
    try {
      await reactToAdminNews(newsId, user.id, choice);
      setReaction(choice);
      const updated = await getAdminNews(newsId);
      if (updated) setNews(updated);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('adminNewsModalTitle')}</h3>
              <p className="text-xs text-zinc-500">{t('adminNewsModalSubtitle')}</p>
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

        <div className="p-5">
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500">{t('adminNewsLoading')}</div>
          ) : !news ? (
            <div className="py-8 text-center text-sm text-zinc-500">{t('adminNewsNotFound')}</div>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">{news.message}</p>
              <p className="mt-2 text-[11px] text-zinc-600">{news.createdAt.split('T')[0]}</p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleReact('like')}
                  disabled={submitting}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
                    reaction === 'like'
                      ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-400'
                      : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {t('adminNewsLike')}
                </button>
                <button
                  type="button"
                  onClick={() => handleReact('dislike')}
                  disabled={submitting}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
                    reaction === 'dislike'
                      ? 'bg-red-500 text-white ring-2 ring-red-400'
                      : 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/25'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  {t('adminNewsDislike')}
                </button>
              </div>

              {reaction && (
                <p className="mt-3 text-center text-xs text-zinc-500">{t('adminNewsThanks')}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
