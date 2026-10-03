import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: '✓', cls: 'bg-secondary-600 text-white' },
  error: { icon: '⚠', cls: 'bg-accent-600 text-white' },
  info: { icon: 'ℹ', cls: 'bg-primary-700 text-white' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 4500) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, duration) => push('success', msg, duration),
    error: (msg, duration) => push('error', msg, duration),
    info: (msg, duration) => push('info', msg, duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const style = STYLES[t.type] || STYLES.info;
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-essential ${style.cls}`}
            >
              <span aria-hidden="true">{style.icon}</span>
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="opacity-80 hover:opacity-100">✕</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
