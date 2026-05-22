import React, { useState } from 'react';
import { Header } from './components/Header';
import { ResponsiveTabs, type TabId } from './components/AppTabs';
import { Dashboard } from './components/Dashboard';
import { GroupStage } from './components/GroupStage';
import { RoundOf32 } from './components/RoundOf32';
import { BracketView } from './components/BracketView';
import { SettingsPanel } from './components/SettingsPanel';
import { ToastProvider } from './components/Toast';
import { useTheme } from './hooks/useTheme';
import { useTournament } from './hooks/useTournament';

export default function App() {
  const { theme, toggle } = useTheme();
  const api = useTournament();
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Header theme={theme} onToggleTheme={toggle} />
        <main className="mx-auto max-w-[1500px] px-4 sm:px-6 pt-3 lg:pt-4 main-pad-bottom space-y-4">
          <ResponsiveTabs active={tab} onChange={setTab} />
          <div key={tab} className="animate-tab-pop">
            {tab === 'dashboard' && <Dashboard state={api.state} api={api} />}
            {tab === 'groups'    && <GroupStage api={api} />}
            {tab === 'r32'       && <RoundOf32 state={api.state} api={api} />}
            {tab === 'bracket'   && <BracketView state={api.state} api={api} />}
            {tab === 'settings'  && (
              <SettingsPanel api={api} theme={theme} onToggleTheme={toggle} />
            )}
          </div>
          <footer className="hidden lg:block text-center text-[11px] text-slate-500 dark:text-slate-400 pt-4 pb-2">
            Simulador da Copa do Mundo FIFA 2026 · React + TypeScript + Tailwind · dados salvos
            localmente no seu navegador.
          </footer>
        </main>
      </div>
    </ToastProvider>
  );
}
