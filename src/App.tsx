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
import { useTheme } from './hooks/useTheme';
import { useTournament } from './hooks/useTournament';
import { useFirstAccessModal } from './hooks/useFirstAccessModal';
import type { MatchFilterId } from './logic/matchStatus';
import { APP_VERSION_LABEL, APP_LAST_UPDATED, formatLastUpdated } from './config/appVersion';

export default function App() {
  const { theme, toggle } = useTheme();
  const api = useTournament();
  const [tab, setTab] = useState<TabId>('dashboard');
  const [matchFilter, setMatchFilter] = useState<MatchFilterId>('all');

  // Modal de primeiro acesso (com flag em localStorage).
  // O usuário também pode reabrir manualmente pela aba Configurações.
  const firstAccess = useFirstAccessModal();

  // Navegação central: muda aba e opcionalmente pré-seleciona o filtro de jogos.
  const navigate = useCallback(
    (next: TabId, options?: { matchFilter?: MatchFilterId }) => {
      setTab(next);
      if (options?.matchFilter) setMatchFilter(options.matchFilter);
      // Scroll-to-top suave ao trocar de aba.
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [],
  );

  return (
    <ToastProvider>
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
              />
            )}
            {tab === 'groups'    && <GroupStage api={api} />}
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
            <span>Simulador Copa do Mundo 2026</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
            <span className="font-mono text-brand-700 dark:text-brand-300 font-semibold">
              {APP_VERSION_LABEL}
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
            <span>Atualizado em {formatLastUpdated(APP_LAST_UPDATED)}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
            <span>
              por{' '}
              <a
                href="https://github.com/AndyMarksss/copa-2026-simulador"
                target="_blank" rel="noreferrer"
                className="font-semibold text-brand-700 dark:text-brand-300 hover:underline transition-colors"
              >
                AndyMarksss
              </a>
            </span>
          </footer>
        </main>

        {/* Modal de boas-vindas — aparece automaticamente no primeiro acesso */}
        <FirstAccessModal open={firstAccess.isOpen} onClose={firstAccess.close} />
      </div>
    </ToastProvider>
  );
}
