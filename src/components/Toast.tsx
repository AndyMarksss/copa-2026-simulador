import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warn' | 'error';
}

interface ToastApi {
  show: (item: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback<ToastApi['show']>((item) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, ...item }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {items.map((i) => (
          <ToastCard key={i.id} item={i} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setOpen(false), 3800);
    return () => window.clearTimeout(t);
  }, []);

  const variantStyle =
    item.variant === 'warn'    ? 'bg-amber-500/95 text-amber-950'
    : item.variant === 'error' ? 'bg-rose-600/95 text-white'
    : item.variant === 'success' ? 'bg-emerald-600/95 text-white'
    : 'bg-slate-900/95 text-white dark:bg-white/95 dark:text-slate-900';

  return (
    <div
      className={[
        'pointer-events-auto rounded-xl shadow-glow px-3.5 py-2.5 backdrop-blur',
        'transition-all',
        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        variantStyle,
      ].join(' ')}
    >
      <div className="font-semibold text-sm">{item.title}</div>
      {item.description && (
        <div className="text-xs opacity-90 mt-0.5">{item.description}</div>
      )}
    </div>
  );
}
