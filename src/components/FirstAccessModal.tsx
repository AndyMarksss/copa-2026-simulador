import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { HowToUseHeader, HowToUseSteps } from './HowToUseSteps';
import { useInstallPWA } from '../hooks/useInstallPWA';
import { useToast } from './Toast';

// ---------------------------------------------------------------------------
// Modal de boas-vindas / primeiro acesso — versão WIZARD (2 etapas):
//
//   Etapa 1: "Como usar" (5 passos)
//             → botões: [Ver depois]    [Avançar]
//
//   Etapa 2: "Instalar aplicativo"
//             → botões: [Voltar]   [Pular instalação] [Instalar/Começar]
//
// Layout: header fixo (com indicador) + conteúdo rolável + footer fixo.
// Isso evita um modal gigante no mobile e isola visualmente cada etapa.
// ---------------------------------------------------------------------------

interface FirstAccessModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 1 | 2;

export function FirstAccessModal({ open, onClose }: FirstAccessModalProps) {
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState<Step>(1);

  // Integração com o PWA — botão de instalação aparece quando disponível.
  const { canInstall, isInstalled, installApp } = useInstallPWA();
  const toast = useToast();

  // Reseta para a etapa 1 sempre que o modal abre (incluindo reabertura via
  // "Ver instruções novamente" nas Configurações).
  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  // Trava o scroll do fundo enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // ESC fecha o modal e persiste a flag.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Foco no botão primário a cada troca de etapa.
  useEffect(() => {
    if (open) {
      previousFocusRef.current = (document.activeElement as HTMLElement) ?? null;
      const t = window.setTimeout(() => primaryBtnRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    } else {
      previousFocusRef.current?.focus?.();
    }
  }, [open, step]);

  if (!open) return null;

  // -------------------- handlers --------------------
  const handleAdvance = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleInstall = async () => {
    const outcome = await installApp();
    if (outcome === 'accepted') {
      toast.show({
        variant: 'success',
        title: 'Aplicativo instalado!',
        description: 'A caderneta foi adicionada à sua tela inicial.',
      });
      onClose();
    } else if (outcome === 'dismissed') {
      toast.show({
        variant: 'info',
        title: 'Instalação cancelada',
        description: 'Você pode instalar a qualquer momento depois.',
      });
    }
  };

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
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-2xl
          rounded-2xl border border-white/60 dark:border-white/5
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          ring-1 ring-brand-400/30 dark:ring-brand-400/20
          shadow-[0_30px_80px_-20px_rgba(11,27,58,0.5)]
          max-h-[88vh] flex flex-col relative animate-pop-in
        "
      >
        {/* ============== HEADER FIXO ============== */}
        <header className="shrink-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 relative">
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

          <div className="text-[10px] uppercase tracking-widest text-brand-700 dark:text-brand-300 font-bold pr-10 mb-2">
            Bem-vindo à Copa do Mundo 2026
          </div>

          <StepIndicator current={step} />
        </header>

        {/* ============== CONTEÚDO COM SCROLL INTERNO ============== */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4">
          {/* key={step} → remonta + dispara animate-fade-in a cada troca */}
          <div key={step} className="animate-fade-in">
            {step === 1 ? <StepOne /> : <StepTwo isInstalled={isInstalled} />}
          </div>
        </div>

        {/* ============== FOOTER FIXO ============== */}
        <footer
          className="
            shrink-0 px-5 sm:px-6 py-3
            border-t border-slate-200/60 dark:border-slate-800/60
            bg-white/80 dark:bg-slate-900/80 backdrop-blur
            rounded-b-2xl
          "
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          {step === 1 ? (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Ver depois
              </button>
              <button
                ref={primaryBtnRef}
                type="button"
                className="btn-primary"
                onClick={handleAdvance}
              >
                Avançar
                <Icon icon={icons.arrowRight} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={handleBack}
              >
                <Icon icon={icons.arrowRight} className="rotate-180" />
                Voltar
              </button>

              <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                <button type="button" className="btn-ghost" onClick={onClose}>
                  Pular instalação
                </button>
                {canInstall && !isInstalled ? (
                  <button
                    ref={primaryBtnRef}
                    type="button"
                    className="btn-primary"
                    onClick={handleInstall}
                  >
                    <Icon icon={icons.mobile} />
                    Instalar no celular
                  </button>
                ) : (
                  <button
                    ref={primaryBtnRef}
                    type="button"
                    className="btn-primary"
                    onClick={onClose}
                  >
                    Começar
                    <Icon icon={icons.arrowRight} />
                  </button>
                )}
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Indicador "Etapa X de 2" + dois pontos
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
      <span>Etapa {current} de 2</span>
      <span className="flex gap-1.5 items-center" aria-hidden>
        <span
          className={[
            'block h-2 rounded-full transition-all',
            current === 1
              ? 'w-6 bg-gradient-to-r from-brand-600 to-brand-400'
              : 'w-2 bg-slate-300 dark:bg-slate-700',
          ].join(' ')}
        />
        <span
          className={[
            'block h-2 rounded-full transition-all',
            current === 2
              ? 'w-6 bg-gradient-to-r from-brand-600 to-brand-400'
              : 'w-2 bg-slate-300 dark:bg-slate-700',
          ].join(' ')}
        />
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conteúdo da etapa 1: Como usar (reutiliza HowToUseHeader + HowToUseSteps)
// ---------------------------------------------------------------------------

function StepOne() {
  return (
    <section>
      <div id="first-access-title">
        <HowToUseHeader />
      </div>
      <HowToUseSteps />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Conteúdo da etapa 2: Instalar aplicativo
// ---------------------------------------------------------------------------

function StepTwo({ isInstalled }: { isInstalled: boolean }) {
  return (
    <section>
      <header className="flex items-center gap-2 mb-3">
        <Icon icon={icons.install} className="text-2xl text-brand-500" />
        <div>
          <h3 id="first-access-title" className="font-display tracking-wider text-xl leading-none">
            Instalar aplicativo
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Acesse mais rápido, como se fosse um app nativo.
          </p>
        </div>
      </header>

      <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
        Instale a caderneta no celular para acessar mais rápido, como se fosse um aplicativo.
      </p>

      {isInstalled ? (
        <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <Icon icon={icons.qualified} className="mt-0.5 shrink-0" />
          <span>Aplicativo já instalado. Tudo pronto!</span>
        </div>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-snug">
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
      )}

      {!isInstalled && (
        <p className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Icon icon={icons.info} className="text-brand-500" />
          Você pode instalar depois pela aba <strong>Configurações</strong>.
        </p>
      )}
    </section>
  );
}
