import React, { useEffect, useRef, useState } from 'react';
import { Mail, User, X, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { googleClientId, loadGoogleIdentityScript } from '../firebase/auth';

type AuthMode = 'login' | 'create';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    createAccount,
    loginWithEmail,
    completeGoogleSignIn,
    continueAsGuest,
  } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [messageKey, setMessageKey] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setGoogleReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !googleBtnRef.current) return;

        googleBtnRef.current.innerHTML = '';

        window.google!.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            setIsGoogleLoading(true);
            setMessageKey('');
            const result = await completeGoogleSignIn(response.credential);
            setIsGoogleLoading(false);
            setIsError(!result.ok);
            setMessageKey(result.message);
          },
        });

        window.google!.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          width: googleBtnRef.current.offsetWidth || 360,
        });

        if (!cancelled) setGoogleReady(true);
      } catch (error) {
        console.error('Google Identity Services init failed:', error);
        if (!cancelled) {
          setIsError(true);
          setMessageKey('authNetworkError');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthModalOpen, completeGoogleSignIn]);

  if (!isAuthModalOpen) return null;

  const showResult = (result: { ok: boolean; message: string }) => {
    setIsError(!result.ok);
    setMessageKey(result.message);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = mode === 'login'
      ? await loginWithEmail(email, password)
      : await createAccount(email, password, displayName);
    showResult(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-purple-950/30">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-300">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{t('authAccount')}</h2>
              <p className="text-xs text-zinc-500">SecretPrompts</p>
            </div>
          </div>
          <button onClick={() => setIsAuthModalOpen(false)} className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white" aria-label={t('cancel')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
            <button type="button" onClick={() => { setMode('login'); setMessageKey(''); }} className={`rounded-xl px-3 py-2 text-xs font-black transition ${mode === 'login' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
              {t('authLoginSubmit')}
            </button>
            <button type="button" onClick={() => { setMode('create'); setMessageKey(''); }} className={`rounded-xl px-3 py-2 text-xs font-black transition ${mode === 'create' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
              {t('authCreateSubmit')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-black text-white">
              {mode === 'login' ? t('authLoginTitle') : t('authCreateTitle')}
            </h3>

            {mode === 'create' && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-300">{t('authDisplayNameLabel')}</label>
                <input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t('authNamePlaceholder')} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500/60" />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-300">{t('authEmailLabel')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('authEmailPlaceholder')} autoComplete="off" className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-purple-500/60" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-300">Lösenord</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="new-password" className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-purple-500/60" />
              </div>
            </div>

            {messageKey && (
              <div className={`rounded-2xl border px-4 py-3 text-xs font-bold ${isError ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                {t(messageKey)}
              </div>
            )}

            <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-500/20 transition hover:from-purple-500 hover:to-pink-500">
              {mode === 'login' ? t('authLoginSubmit') : t('authCreateSubmit')}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[10px] font-bold uppercase text-zinc-500">eller</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <div className="relative h-12 w-full">
              <div
                className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-xs font-black text-white ${isGoogleLoading ? 'opacity-60' : ''}`}
                aria-hidden
              >
                {isGoogleLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                )}
                {isGoogleLoading ? t('authGoogleLoading') : t('authGoogle')}
              </div>
              <div
                ref={googleBtnRef}
                className={`absolute inset-0 overflow-hidden ${googleReady && !isGoogleLoading ? 'opacity-[0.01]' : 'pointer-events-none opacity-0'}`}
              />
            </div>

            <button type="button" onClick={continueAsGuest} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-black text-zinc-400 transition hover:text-white">
              {t('authGuestButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
