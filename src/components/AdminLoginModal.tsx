import React, { useState } from 'react';
import { usePrompts } from '../context/PromptContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, ShieldAlert, Key } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { isAdminLoginOpen, setIsAdminLoginOpen } = usePrompts();
  const { loginAsAdmin, signUpAdmin } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  if (!isAdminLoginOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = mode === 'login'
      ? await loginAsAdmin(email, password)
      : await signUpAdmin(email, password, displayName);

    if (!result.ok) {
      setError(t(result.message));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
              <Key className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Admin Panel</h2>
          </div>
          <button onClick={() => setIsAdminLoginOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400 leading-relaxed">{t('adminInfo')}</p>
          </div>

          <div className="flex gap-1 rounded-xl bg-zinc-950 border border-zinc-800 p-1">
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${mode === 'login' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>Logga in</button>
            <button type="button" onClick={() => { setMode('create'); setError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${mode === 'create' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>Skapa konto</button>
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">Namn</label>
              <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ditt namn" className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono" />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">E-post</label>
            <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="off" className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">{t('adminPassword')}</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('adminPasswordPlaceholder')} autoComplete="new-password" className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono" />
            {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdminLoginOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800">{t('cancel')}</button>
            <button type="submit" className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg">
              {mode === 'login' ? t('login') : 'Skapa konto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
