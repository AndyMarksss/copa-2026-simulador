import React, { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { ResponsiveTabs, type TabId } from './components/AppTabs';
import { Dashboard } from './components/Dashboard';
import { MatchesPage } from './components/MatchesPage';
import { GroupStage } from './components/GroupStage';
import { RoundOf32 } from './components/RoundOf32';
import { BracketView } from './components/BracketView';
import { SettingsPanel } from './components/SettingsPanel';
import { FirstAccessModal } from './components/FirstAccessModal';
import { ToastProvider } from './components/Toast';
import { TeamDetailsModal } from './components/TeamDetailsModal';
import { TeamDetailsProvider } from './components/TeamDetailsContext';
import { useTheme } from './hooks/useTheme';
import { useTournament } from './hooks/useTournament';
import { useFirstAccessModal } from './hooks/useFirstAccessModal';
import type { MatchFilterId } from './logic/matchStatus';
import type { GroupId } from './types';
import { APP_VERSION_LABEL, APP_LAST_UPDATED, formatLastUpdated } from './config/appVersion';

export interface NavigateOptions {
  matchFilter?: MatchFilterId;
  /** Quando informado, abre a aba `matches` e destaca o card desse jogo. */
  highlightMatchId?: string;
  /** Quando informado, abre a aba `groups`, expande e destaca o grupo. */
  highlightGroupId?: GroupId;
  /** Quando combinado com highlightGroupId, destaca também a linha da seleção. */
  highlightTeamId?: string;
}

export type NavigateFn = (next: TabId, options?: NavigateOptions) => void;

export default function App() {
  const { theme, toggle } = useTheme();
  const api = useTournament();
  const [tab, setTab] = useState<TabId>('dashboard');
  const [matchFilter, setMatchFilter] = useState<MatchFilterId>('all');
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null);
  const [highlightedGroupId, setHighlightedGroupId] = useState<GroupId | null>(null);
  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);
  // Histórico/trajetória da seleção — global, abre de qualquer aba via context.
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Modal de primeiro acesso (com flag em localStorage).
  // O usuário também pode reabrir manualmente pela aba Configurações.
  const firstAccess = useFirstAccessModal();

  // Navegação central: muda aba, opcionalmente pré-seleciona filtro/destaca
  // jogo (MatchesPage) ou grupo/seleção (GroupStage).
  const navigate = useCallback<NavigateFn>(
    (next, options) => {
      setTab(next);
      if (options?.matchFilter) setMatchFilter(options.matchFilter);
      const hasHighlight =
        !!(options?.highlightMatchId || options?.highlightGroupId || options?.highlightTeamId);

      if (options?.highlightMatchId !== undefined) {
        setHighlightedMatchId(null);
        requestAnimationFrame(() => setHighlightedMatchId(options.highlightMatchId ?? null));
      }
      if (options?.highlightGroupId !== undefined || options?.highlightTeamId !== undefined) {
        setHighlightedGroupId(null);
        setHighlightedTeamId(null);
        requestAnimationFrame(() => {
          setHighlightedGroupId(options.highlightGroupId ?? null);
          setHighlightedTeamId(options.highlightTeamId ?? null);
        });
      }

      if (typeof window !== 'undefined' && !hasHighlight) {
        // Scroll-to-top apenas quando não há destino específico para focar.
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [],
  );

  return (
    <ToastProvider>
      <TeamDetailsProvider open={setSelectedTeamId}>
      <div className="min-h-screen">
        <Header theme={theme} onToggleTheme={toggle} />
        <main className="mx-auto max-w-[1500px] px-4 sm:px-6 pt-3 lg:pt-4 main-pad-bottom space-y-4">
          <ResponsiveTabs active={tab} onChange={(id) => navigate(id)} />
          <div key={tab} className="animate-tab-pop">
            {tab === 'dashboard' && <Dashboard state={api.state} api={api} onNavigate={navigate} />}
            {tab === 'matches'   && (
              <MatchesPage
                state={api.state}
                api={api}
                filter={matchFilter}
                onFilterChange={setMatchFilter}
                onNavigate={(id) => navigate(id)}
                highlightedMatchId={highlightedMatchId}
                onClearHighlight={() => setHighlightedMatchId(null)}
              />
            )}
            {tab === 'groups'    && (
              <GroupStage
                api={api}
                highlightedGroupId={highlightedGroupId}
                highlightedTeamId={highlightedTeamId}
                onClearHighlight={() => {
                  setHighlightedGroupId(null);
                  setHighlightedTeamId(null);
                }}
              />
            )}
            {tab === 'r32'       && <RoundOf32 state={api.state} api={api} />}
            {tab === 'bracket'   && <BracketView state={api.state} api={api} />}
            {tab === 'settings'  && (
              <SettingsPanel
                api={api}
                theme={theme}
                onToggleTheme={toggle}
                onShowInstructions={firstAccess.open}
              />
            )}
          </div>

          {/* Rodapé com versionamento — visível em todas as telas */}
          <footer
            className="
              text-center text-[10px] sm:text-[11px] leading-relaxed
              text-slate-500 dark:text-slate-400
              pt-4 pb-2
              flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-0.5 flex-wrap
            "
          >
            <span>Copa do Mundo 2026 — Caderneta Interativa</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
            <span className="font-mono text-brand-700 dark:text-brand-300 font-semibold">
              {APP_VERSION_LABEL}
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
            <span>Atualizado em {formatLastUpdated(APP_LAST_UPDATED)}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
            <span>
              repositório no{' '}
              <a
                href="https://github.com/AndyMarksss/copa-2026-simulador"
                target="_blank" rel="noreferrer"
                className="font-semibold text-brand-700 dark:text-brand-300 hover:underline transition-colors"
              >
                GitHub
              </a>
            </span>
          </footer>
        </main>

        {/* Modal de boas-vindas — aparece automaticamente no primeiro acesso */}
        <FirstAccessModal open={firstAccess.isOpen} onClose={firstAccess.close} />

        {/* Histórico/trajetória da seleção — montado uma única vez no topo,
            portalizado em document.body para escapar de qualquer transform. */}
        <TeamDetailsModal
          state={api.state}
          teamId={selectedTeamId}
          onClose={() => setSelectedTeamId(null)}
          onNavigateToGroup={(groupId, tId) => {
            // Fecha o modal e navega para a aba Grupos com destaque no grupo
            // e na linha da seleção. O navigate já dispara a animação.
            setSelectedTeamId(null);
            navigate('groups', { highlightGroupId: groupId, highlightTeamId: tId });
          }}
        />
      </div>
      </TeamDetailsProvider>
    </ToastProvider>
  );
}
