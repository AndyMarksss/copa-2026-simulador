import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { HowToUseHeader, HowToUseSteps } from './HowToUseSteps';

// ---------------------------------------------------------------------------
// Modal de boas-vindas / primeiro acesso.
//
//   • Aparece automaticamente quando o usuário ainda não viu as instruções
//     (controlado por `useFirstAccessModal`).
//   • Reusa o conteúdo da seção "Como usar" via `<HowToUseSteps />`.
//   • Fecha ao clicar em "Começar", "Ver depois", no X, no backdrop, ou ESC.
// ---------------------------------------------------------------------------

interface FirstAccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function FirstAccessModal({ open, onClose }: FirstAccessModalProps) {
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Trava o scroll do fundo enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // ESC fecha o modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Foco inicial no botão "Começar" + restaura foco ao fechar.
  useEffect(() => {
    if (open) {
      previousFocusRef.current = (document.activeElement as HTMLElement) ?? null;
      // Espera o render para garantir que o ref está pronto.
      const t = window.setTimeout(() => primaryBtnRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    } else {
      previousFocusRef.current?.focus?.();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-access-title"
      onClick={onClose}
      className="
        fixed inset-0 z-50
        flex items-end sm:items-center justify-center
        bg-slate-900/70 dark:bg-black/70 backdrop-blur-sm
        p-3 sm:p-4
        animate-fade-in
      "
    >
      {/* Conteúdo — clique dentro NÃO fecha (stopPropagation). */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          card !p-5 sm:!p-6 w-full max-w-2xl
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          ring-1 ring-brand-400/30 dark:ring-brand-400/20
          shadow-[0_30px_80px_-20px_rgba(11,27,58,0.5)]
          max-h-[85vh] overflow-y-auto
          relative
          animate-pop-in
        "
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Botão de fechar (canto superior direito) */}
        <button
          type="button"
          aria-label="Fechar instruções"
          onClick={onClose}
          className="
            absolute top-3 right-3 w-9 h-9 rounded-full
            flex items-center justify-center
            text-slate-500 hover:text-slate-900 dark:hover:text-white
            hover:bg-slate-200 dark:hover:bg-slate-800
            transition-colors
          "
        >
          <Icon icon={icons.close} className="text-base" />
        </button>

        {/* Faixa decorativa de boas-vindas */}
        <div className="text-[10px] uppercase tracking-widest text-brand-700 dark:text-brand-300 font-bold pr-10 mb-1">
          Bem-vindo ao Simulador Copa 2026
        </div>

        {/* Cabeçalho + passos — vêm do mesmo componente que o Settings usa */}
        <div id="first-access-title">
          <HowToUseHeader />
        </div>
        <HowToUseSteps />

        {/* Frase de rodapé (opcional, conforme solicitado) */}
        <p className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Icon icon={icons.info} className="text-brand-500" />
          Você pode rever estas instruções depois em <strong>Configurações</strong>.
        </p>

        {/* Botões */}
        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Ver depois
          </button>
          <button
            ref={primaryBtnRef}
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            <Icon icon={icons.arrowRight} />
            Começar
          </button>
        </div>
      </div>
    </div>
  );
}
