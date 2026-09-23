'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { uid } from '@/lib/utils';
import styles from './Toast.module.css';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Optional single action, e.g. "Undo" or "Retry". */
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'title' | 'tone'>> {
  id: string;
  description?: string;
  action?: ToastOptions['action'];
}

interface ToastContextValue {
  notify: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({ title, description, tone = 'info', action, duration = 4600 }: ToastOptions) => {
      const id = uid('toast');
      setToasts((current) => [...current.slice(-2), { id, title, description, tone, action }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Announced politely: these confirm actions the user just took. */}
      <div className={styles.viewport} role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <div key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`}>
              <Icon className={styles.icon} size={18} aria-hidden />
              <div className={styles.body}>
                <p className={styles.title}>{toast.title}</p>
                {toast.description ? <p className={styles.description}>{toast.description}</p> : null}
              </div>
              {toast.action ? (
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              ) : null}
              <button
                type="button"
                className={styles.close}
                onClick={() => dismiss(toast.id)}
                aria-label={`Dismiss: ${toast.title}`}
              >
                <X size={15} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
