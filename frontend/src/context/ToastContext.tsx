import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Floating Toast Portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4">
        {toasts.map((toast) => {
          let styleClass = 'bg-white text-slate-800 border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)]';
          let Icon = Info;
          let iconColor = 'text-sky-500';

          if (toast.type === 'success') {
            styleClass = 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.15)]';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-600';
          } else if (toast.type === 'error') {
            styleClass = 'bg-rose-50 text-rose-900 border-rose-200 shadow-[0_8px_30px_rgba(239,68,68,0.15)]';
            Icon = AlertCircle;
            iconColor = 'text-rose-600';
          } else if (toast.type === 'warning') {
            styleClass = 'bg-amber-50 text-amber-900 border-amber-200 shadow-[0_8px_30px_rgba(245,158,11,0.15)]';
            Icon = AlertTriangle;
            iconColor = 'text-amber-600';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-300 transform translate-y-0 ${styleClass}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
                <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
