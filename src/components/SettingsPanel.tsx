import React, { useEffect, useRef } from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { TournamentApi } from '../hooks/useTournament';
import { downloadJson, uploadJson } from '../logic/storage';
import { useToast } from './Toast';
import { useInstallPWA } from '../hooks/useInstallPWA';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { HowToUseHeader, HowToUseSteps } from './HowToUseSteps';

interface SettingsPanelProps {
  api: TournamentApi;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  /** Reabre o modal de "Como usar" (sem apagar a flag do localStorage). */
  onShowInstructions?: () => void;
  /** Quando muda (>0), rola até e destaca a seção "Simulações rápidas". */
  highlightSimulationsNonce?: number;
}

export function SettingsPanel({
  api, theme, onToggleTheme, onShowInstructions, highlightSimulationsNonce = 0,
}: SettingsPanelProps) {
  const toast = useToast();
  const simulationsRef = useRef<HTMLDivElement | null>(null);
  const [simHighlighted, setSimHighlighted] = React.useState(false);

  // Rola até a seção de simulações e aplica o destaque temporário.
  useEffect(() => {
    if (!highlightSimulationsNonce) return;
    const t1 = window.setTimeout(() => {
      simulationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSimHighlighted(true);
    }, 80);
    const t2 = window.setTimeout(() => setSimHighlighted(false), 3000);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [highlightSimulationsNonce]);
  const { canInstall, isInstalled, installApp } = useInstallPWA();

  const onInstallClick = async () => {
    const outcome = await installApp();
    if (outcome === 'accepted') {
      toast.show({ variant: 'success', title: 'Aplicativo instalado!', description: 'A caderneta foi adicionada à sua tela inicial.' });
    } else if (outcome === 'dismissed') {
      toast.show({ variant: 'info', title: 'Instalação cancelada', description: 'Você pode instalar mais tarde a qualquer momento.' });
    }
  };

  const confirmAnd = (msg: string, fn: () => void) => () => {
    if (window.confirm(msg)) fn();
  };

  const onExport = () => {
    downloadJson(api.state, 'copa-2026.json');
    toast.show({ variant: 'success', title: 'JSON exportado', description: 'Arquivo salvo em downloads.' });
  };
  const onImport = async () => {
    try {
      const data = await uploadJson();
      api.importState(data);
      toast.show({ variant: 'success', title: 'JSON importado', description: 'Estado restaurado com sucesso.' });
    } catch (e) {
      console.error(e);
    }
  };

  const simReport = (kind: string) => (n: number) =>
    toast.show({
      variant: n > 0 ? 'success' : 'warn',
      title: n > 0 ? `${n} jogo(s) simulado(s) — ${kind}` : `Nada a simular em "${kind}"`,
      description: n === 0 ? 'Verifique se a fase anterior já está concluída.' : 'Resultados simulados ficam marcados como SIM.',
    });

  const onClearSimulated = () => {
    const removed = api.clearSimulatedOnly();
    toast.show({
      variant: removed > 0 ? 'info' : 'warn',
      title: removed > 0 ? `${removed} resultado(s) simulado(s) removido(s)` : 'Nenhum resultado simulado',
      description: removed > 0 ? 'Resultados manuais foram preservados.' : undefined,
    });
  };

  return (
    <section className="space-y-5 animate-slide-up">
      <header>
        <h2 className="section-title">Configurações</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aprenda como usar, gere simulações rápidas, importe/exporte resultados e personalize o tema.
        </p>
      </header>

      {/* 1. COMO USAR — conteúdo vem de HowToUseSteps, compartilhado com o
              FirstAccessModal para evitar duplicação. */}
      <section className="card card-pad bg-gradient-to-br from-brand-500/10 via-transparent to-brand-500/5 border-brand-500/25">
        <HowToUseHeader />
        <HowToUseSteps />

        {onShowInstructions && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end">
            <button
              type="button"
              className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 hover:underline inline-flex items-center gap-1"
              onClick={onShowInstructions}
            >
              <Icon icon={icons.howToUse} />
              Ver instruções novamente
            </button>
          </div>
        )}
      </section>

      {/* 2. INSTALAR APLICATIVO (PWA) */}
      <Card title="Instalar aplicativo" icon={icons.install}>
        {isInstalled ? (
          <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Icon icon={icons.qualified} className="text-emerald-500 mt-0.5" />
            <div>
              <div className="font-semibold">Aplicativo já instalado</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Você está usando a caderneta como app instalado — bom proveito!
              </p>
            </div>
          </div>
        ) : canInstall ? (
          <>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Instale a caderneta no seu celular ou desktop para abrir como aplicativo, com ícone próprio e funcionamento offline.
            </p>
            <button className="btn-primary w-full sm:w-auto" onClick={onInstallClick}>
              <Icon icon={icons.mobile} />
              Instalar no dispositivo
            </button>
          </>
        ) : (
          <div className="flex items-start gap-2 text-sm">
            <Icon icon={icons.info} className="text-brand-500 mt-0.5" />
            <div>
              <div className="font-semibold">Instalação via navegador</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No iPhone, abra no Safari e toque em <strong>Compartilhar → Adicionar à Tela de Início</strong>.
                No Android, use <strong>Chrome → menu ⋮ → Instalar aplicativo</strong>.
              </p>
            </div>
          </div>
        )}

        {/* --- DICA: Play Protect no Android --- */}
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
          <Icon icon={icons.warning} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="min-w-0 leading-snug">
            <div className="font-semibold">
              Aviso do Google Play Protect no Android?
            </div>
            <p className="mt-0.5">
              Se aparecer <em>"App de risco bloqueado"</em>, é uma checagem do sistema sobre PWAs em
              geral — não há risco real, pois a caderneta roda 100% no navegador. Toque em{' '}
              <strong>"Instalar assim mesmo"</strong> e depois em <strong>"Entendi"</strong> para concluir.
              Atualizar o Chrome para a versão mais recente também tende a remover esse aviso.
            </p>
          </div>
        </div>

        {/* --- DICA: ícone aparecendo esticado/desatualizado --- */}
        <div className="mt-2 rounded-lg border border-brand-500/25 bg-brand-500/10 p-2.5 flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
          <Icon icon={icons.info} className="text-brand-500 mt-0.5 shrink-0" />
          <div className="min-w-0 leading-snug">
            <div className="font-semibold">
              Ícone aparecendo esticado ou antigo?
            </div>
            <p className="mt-0.5">
              O Android e o iOS guardam o ícone no momento da instalação. Se você instalou antes
              de uma atualização visual, <strong>desinstale o app e instale de novo</strong> para
              receber o ícone proporcional mais recente.
            </p>
          </div>
        </div>
      </Card>

      {/* 3. SIMULAÇÕES RÁPIDAS */}
      <Card title="Simulações rápidas" icon={icons.simulation} cardRef={simulationsRef} highlighted={simHighlighted}>
        <p className="text-[11px] text-slate-500">
          Geram placares plausíveis baseados no ranking FIFA. Resultados manuais nunca são sobrescritos.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <button className="btn-primary" onClick={() => simReport('fase de grupos')(api.simulateGroups())}>
            <Icon icon={icons.simulateGroups} /> Simular fase de grupos
          </button>
          <button className="btn-soft" onClick={() => simReport('16ª avos')(api.simulateRound('R32'))}>
            <Icon icon={icons.simulateR32} /> Simular 16ª avos
          </button>
          <button className="btn-soft" onClick={() => simReport('oitavas')(api.simulateRound('R16'))}>
            <Icon icon={icons.simulateR16} /> Simular oitavas
          </button>
          <button className="btn-soft" onClick={() => simReport('quartas')(api.simulateRound('QF'))}>
            <Icon icon={icons.simulateQF} /> Simular quartas
          </button>
          <button className="btn-soft" onClick={() => simReport('semis + 3º + final')(api.simulateRound('SF') + api.simulateRound('3P') + api.simulateRound('F'))}>
            <Icon icon={icons.simulateSemiFinal} /> Simular semis + final
          </button>
          <button className="btn-gold" onClick={() => simReport('mata-mata completo')(api.simulateAllKnockout())}>
            <Icon icon={icons.simulateAll} /> Simular mata-mata completo
          </button>
        </div>
        <button className="btn-ghost w-full mt-1" onClick={onClearSimulated}>
          <Icon icon={icons.clean} /> Limpar apenas simulações (preserva manuais)
        </button>
      </Card>

      {/* 3. IMPORTAR / EXPORTAR */}
      <Card title="Importar / Exportar dados" icon={icons.export}>
        <div className="flex items-center justify-between text-sm">
          <span>Salvamento automático</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={api.autoSaveEnabled}
              onChange={api.toggleAutoSave}
            />
            <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-checked:bg-brand-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">
          Quando ativo, o estado é gravado no <code>localStorage</code> a cada alteração.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button className="btn-soft" onClick={onExport}>
            <Icon icon={icons.export} /> Exportar JSON
          </button>
          <button className="btn-soft" onClick={onImport}>
            <Icon icon={icons.import} /> Importar JSON
          </button>
        </div>
      </Card>

      {/* 4. LIMPEZA DE FASES */}
      <Card title="Limpeza de fases" icon={icons.clean}>
        <p className="text-[11px] text-slate-500">
          Reinicia placares de uma fase específica, mantendo as demais intactas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            className="btn-ghost"
            onClick={confirmAnd('Limpar TODOS os placares da fase de grupos?', api.clearGroups)}
          >
            <Icon icon={icons.clean} /> Limpar fase de grupos
          </button>
          <button
            className="btn-ghost"
            onClick={confirmAnd('Limpar TODOS os placares do mata-mata?', api.clearKnockout)}
          >
            <Icon icon={icons.clean} /> Limpar mata-mata
          </button>
        </div>
      </Card>

      {/* 5. RESETAR TORNEIO */}
      <Card title="Resetar torneio" icon={icons.reset}>
        <p className="text-[11px] text-slate-500">
          Apaga todos os placares e volta a caderneta ao estado inicial. Esta ação não pode ser desfeita.
        </p>
        <button
          className="btn-danger w-full"
          onClick={confirmAnd('Resetar todo o torneio? Esta ação não pode ser desfeita.', api.resetAll)}
        >
          <Icon icon={icons.reset} /> Resetar torneio inteiro
        </button>
      </Card>

      {/* 6. PREFERÊNCIAS */}
      <Card title="Preferências" icon={icons.theme}>
        <div className="flex items-center justify-between text-sm">
          <span>Tema visual</span>
          <button className="btn-ghost" onClick={onToggleTheme}>
            <Icon icon={theme === 'dark' ? icons.light : icons.dark} />
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          O tema é salvo individualmente no seu navegador.
        </p>
      </Card>

      <div className="card card-pad text-[11px] text-slate-500 leading-relaxed">
        <p>
          <strong className="text-slate-700 dark:text-slate-200">Sobre os dados:</strong> nada é
          enviado a nenhum servidor. Todos os placares, desempates manuais e o tema visual ficam
          armazenados apenas no <code>localStorage</code> deste navegador.
        </p>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Sub-componentes
// ----------------------------------------------------------------------------

function Card({
  title, icon, children, cardRef, highlighted,
}: {
  title: string;
  icon: IconDefinition;
  children: React.ReactNode;
  cardRef?: React.Ref<HTMLDivElement>;
  highlighted?: boolean;
}) {
  return (
    <div
      ref={cardRef}
      className={[
        'card card-pad flex flex-col gap-2 scroll-anchor',
        highlighted ? 'group-highlight' : '',
      ].join(' ')}
    >
      <h3 className="font-display tracking-wider text-lg flex items-center gap-2">
        <Icon icon={icon} className="text-brand-500" />
        {title}
      </h3>
      {children}
    </div>
  );
}

// `Step` foi movido para `HowToUseSteps.tsx` para ser compartilhado com o
// modal de primeiro acesso. Não há mais sub-componente Step local aqui.
