import React, { useState, useEffect } from 'react';
import { CheckCircle, Info, XCircle, AlertTriangle } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type: type || 'success' }]);

      // Remove after 3.2 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3200);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const Icon = {
          success: CheckCircle,
          info: Info,
          error: XCircle,
          warning: AlertTriangle,
        }[toast.type];

        const colors = {
          success: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20 shadow-emerald-500/5',
          info: 'border-blue-500/30 text-blue-400 bg-blue-950/20 shadow-blue-500/5',
          error: 'border-red-500/30 text-red-400 bg-red-950/20 shadow-red-500/5',
          warning: 'border-amber-500/30 text-amber-400 bg-amber-950/20 shadow-amber-500/5',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl border
              bg-zinc-950/90 text-zinc-100 shadow-2xl backdrop-blur-xl transition-all duration-300
              transform translate-y-0 scale-100 animate-fade-in-up ${colors}`}
            style={{
              animation: 'toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-semibold leading-snug">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
