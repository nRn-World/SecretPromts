import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Link, Mail, Send, Sparkles, User, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { submitApplication } from '../firebase/firestore';

type ApplicationStatus = 'idle' | 'sending' | 'success' | 'error';

const APPLICATION_EMAIL = 'bynrnworld@gmail.com';

export const AuthorApplication: React.FC = () => {
  const { t } = useLanguage();
  const { user, isGuest } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName !== 'Guest' ? user.displayName : '');
  const [contactEmail, setContactEmail] = useState(user.email || '');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('idle');
  const [message, setMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  const resetForm = () => {
    setPortfolioUrl('');
    setExperience('');
    setMotivation('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!displayName.trim() || !contactEmail.trim() || !experience.trim() || !motivation.trim()) {
      setStatus('error');
      setMessage(t('authorRequiredError'));
      return;
    }

    setStatus('sending');
    setMessage('');

    try {
      await submitApplication({
        uid: isGuest ? undefined : user.id,
        displayName: displayName.trim(),
        contactEmail: contactEmail.trim(),
        portfolioUrl: portfolioUrl.trim(),
        experience: experience.trim(),
        motivation: motivation.trim(),
        status: 'pending',
      });

      setStatus('success');
      setMessage('Ansökan skickad! Admin kommer att granska den.');
      resetForm();
    } catch (error) {
      console.error('Author application failed', error);
      setStatus('error');
      setMessage('Något gick fel. Försök igen senare.');
    }
  };

  if (isDismissed) {
    return (
      <section id="become-author" className="border-t border-zinc-800/50 bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl shadow-purple-950/10 backdrop-blur-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 text-amber-300 ring-1 ring-white/10">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-300">{t('authorBadge')}</p>
              <h3 className="text-base font-black text-white">{t('authorFormTitle')}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(false)}
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-pink-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-pink-500/20 transition hover:from-amber-400 hover:to-pink-500"
          >
            {t('becomeAuthor')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="become-author" className="relative overflow-hidden border-t border-zinc-800/50 bg-zinc-950 py-16 sm:py-20">
      <div className="absolute left-1/2 top-0 h-72 w-[540px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[110px]" />
      <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t('authorBadge')}</span>
          </div>

          <h2 className="max-w-xl text-3xl font-black tracking-tight text-white sm:text-4xl">
            {t('authorTitle')} <span className="text-gradient">SecretPrompts</span>
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {t('authorDescription')}
          </p>

          <div className="mt-8 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span>{t('authorPointEmail', { email: APPLICATION_EMAIL })}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span>{t('authorPointCreators')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span>{t('authorPointPortfolio')}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-purple-950/20 backdrop-blur-md sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white">{t('authorFormTitle')}</h3>
              <p className="mt-1 text-xs text-zinc-400">
                {t('authorFormSubtitle')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 text-amber-300 ring-1 ring-white/10">
                <Send className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                aria-label={t('authorClose')}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-200">
                <User className="h-3.5 w-3.5 text-purple-400" />
                {t('displayName')} <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={t('displayNamePlaceholder')}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500/60"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">{t('displayNameHelp')}</p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-200">
                <Mail className="h-3.5 w-3.5 text-purple-400" />
                {t('contactEmail')} <span className="text-pink-400">*</span>
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder={t('contactEmailPlaceholder')}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500/60"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">{t('contactEmailHelp')}</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-200">
              <Link className="h-3.5 w-3.5 text-amber-400" />
              {t('portfolioUrl')} <span className="text-zinc-500 normal-case">({t('optional')})</span>
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(event) => setPortfolioUrl(event.target.value)}
              placeholder={t('portfolioPlaceholder')}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/60"
            />
            <p className="mt-1.5 text-[11px] text-zinc-500">{t('portfolioHelp')}</p>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-200">
              {t('experienceLabel')} <span className="text-pink-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              placeholder={t('experiencePlaceholder')}
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500/60"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-200">
              {t('motivationLabel')} <span className="text-pink-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={motivation}
              onChange={(event) => setMotivation(event.target.value)}
              placeholder={t('motivationPlaceholder')}
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500/60"
            />
          </div>

          {message && (
            <div className={`mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs font-medium ${status === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
              {status === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href={`mailto:${APPLICATION_EMAIL}`} className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-300">
              {t('authorMailFallback')}
            </a>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-pink-500/20 transition hover:from-amber-400 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {status === 'sending' ? t('authorSending') : t('authorSubmit')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};