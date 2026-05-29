import React, { useState } from 'react';
import { AlertTriangle, Send, X, CheckCircle2 } from 'lucide-react';
import { respondToWarning, type Warning } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const WarningModal: React.FC<{ warnings: Warning[]; onClose: () => void }> = ({ warnings, onClose }) => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const handleRespond = async (warningId: string) => {
    if (!responses[warningId]?.trim() || !user.id) return;
    await respondToWarning(user.id, warningId, responses[warningId].trim());
    setSubmitted(prev => ({ ...prev, [warningId]: true }));
  };

  if (warnings.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white">Varningar</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {warnings.map(w => (
            <div key={w.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-200 leading-relaxed">{w.message}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">{w.createdAt.split('T')[0]}</p>
                </div>
              </div>

              {w.response ? (
                <div className="mt-3 pl-7">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Ditt svar
                    </div>
                    <p className="text-sm text-zinc-300">{w.response}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{w.respondedAt?.split('T')[0]}</p>
                  </div>
                </div>
              ) : submitted[w.id] ? (
                <div className="mt-3 pl-7">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Skickat
                  </div>
                </div>
              ) : (
                <div className="mt-3 pl-7">
                  <textarea
                    value={responses[w.id] || ''}
                    onChange={e => setResponses(prev => ({ ...prev, [w.id]: e.target.value }))}
                    placeholder="Skriv ditt svar..."
                    rows={2}
                    className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
                  />
                  <button
                    onClick={() => handleRespond(w.id)}
                    disabled={!responses[w.id]?.trim()}
                    className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    Svara
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
