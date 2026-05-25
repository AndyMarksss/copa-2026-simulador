import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { HowToUseHeader, HowToUseSteps } from './HowToUseSteps';
import { useInstallPWA } from '../hooks/useInstallPWA';
import { useToast } from './Toast';

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

  // Integração com o PWA — botão de instalação aparece se o navegador suportar
  // o prompt nativo (beforeinstallprompt). O modal NÃO fecha sozinho ao
  // instalar; o feedback é dado por toast.
  const { canInstall, isInstalled, installApp } = useInstallPWA();
  const toast = useToast();

  const handleInstall = async () => {
    const outcome = await installApp();
    if (outcome === 'accepted') {
      toast.show({
        variant: 'success',
        title: 'Aplicativo instalado!',
        description: 'O simulador foi adicionado à sua tela inicial.',
      });
    } else if (outcome === 'dismissed') {
      toast.show({
        variant: 'info',
        title: 'Instalação cancelada',
        description: 'Você pode instalar a qualquer momento depois.',
      });
    }
  };

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

        {/* === NOVA SEÇÃO: INSTALAR APLICATIVO === */}
        <section className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <header className="flex items-center gap-2 mb-2">
            <Icon icon={icons.install} className="text-2xl text-brand-500" />
            <div>
              <h3 className="font-display tracking-wider text-xl leading-none">
                Instalar aplicativo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Acesse mais rápido, como se fosse um app nativo.
              </p>
            </div>
          </header>

          <p className="text-[12.5px] text-slate-600 dark:text-slate-300 leading-snug">
            Instale o simulador no celular para acessar mais rápido, como se fosse um aplicativo.
          </p>

          {isInstalled ? (
            <div className="mt-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 flex items-start gap-2 text-[12px] text-emerald-700 dark:text-emerald-300">
              <Icon icon={icons.qualified} className="mt-0.5 shrink-0" />
              <span>Aplicativo já instalado. Tudo pronto!</span>
            </div>
          ) : (
            <>
              {canInstall && (
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto mt-2.5"
                  onClick={handleInstall}
                >
                  <Icon icon={icons.mobile} />
                  Instalar no celular
                </button>
              )}

              <ul className="mt-2.5 space-y-1.5 text-[12px] text-slate-600 dark:text-slate-300 leading-snug">
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5 shrink-0 font-bold">•</span>
                  <span>
                    <strong>No iPhone</strong>, abra no Safari, toque em{' '}
                    <strong>Compartilhar</strong> e escolha{' '}
                    <strong>"Adicionar à Tela de Início"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5 shrink-0 font-bold">•</span>
                  <span>
                    <strong>No Android</strong>, abra no Chrome, toque no menu e escolha{' '}
                    <strong>"Instalar aplicativo"</strong> ou{' '}
                    <strong>"Adicionar à tela inicial"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5 shrink-0 font-bold">•</span>
                  <span>
                    Se o botão de instalação aparecer dentro do site, toque em{' '}
                    <strong>"Instalar no celular"</strong>.
                  </span>
                </li>
              </ul>
            </>
          )}
        </section>

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
