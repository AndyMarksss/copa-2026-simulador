import React from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Icon } from './Icon';
import { icons } from '../utils/icons';

export type TabId = 'dashboard' | 'matches' | 'groups' | 'r32' | 'bracket' | 'settings';

interface TabDef {
  id: TabId;
  label: string;
  short: string;
  icon: IconDefinition;
}

export const TABS: TabDef[] = [
  { id: 'dashboard', label: 'Início',             short: 'Início',  icon: icons.dashboard },
  { id: 'matches',   label: 'Jogos',              short: 'Jogos',   icon: icons.matches },
  { id: 'groups',    label: 'Fase de Grupos',     short: 'Grupos',  icon: icons.groups },
  { id: 'r32',       label: '16ª avos',           short: '16ª',     icon: icons.round32 },
  { id: 'bracket',   label: 'Chaveamento',        short: 'Chave',   icon: icons.bracket },
  { id: 'settings',  label: 'Configurações',      short: 'Config',  icon: icons.settings },
];

// ---------------------------------------------------------------------------
// Desktop: barra horizontal acima do conteúdo (apenas em lg+).
// ---------------------------------------------------------------------------

interface TabsProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export function DesktopTabs({ active, onChange }: TabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Seções do simulador"
      className="hidden lg:flex justify-start"
    >
      <div className="glass !rounded-full px-1.5 py-1.5 inline-flex max-w-full overflow-x-auto">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(t.id)}
                className={[
                  'tab !rounded-full',
                  isActive ? 'tab-active' : '',
                ].join(' ')}
              >
                <Icon icon={t.icon} className="text-base" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Mobile/tablet: barra inferior fixa (apenas em <lg).
// 6 itens em grid — fonte e área de toque ajustadas para caber confortável.
// ---------------------------------------------------------------------------

export function BottomTabBar({ active, onChange }: TabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Navegação principal"
      className="
        lg:hidden fixed left-0 right-0 z-40
        px-2 sm:px-3 pointer-events-none
      "
      style={{ bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="
          pointer-events-auto mx-auto max-w-2xl
          rounded-[22px] border border-white/55 dark:border-white/10
          bg-white/85 dark:bg-[#060c1a]/85 backdrop-blur-xl
          shadow-[0_18px_44px_-12px_rgba(11,27,58,0.30),0_-2px_18px_-12px_rgba(58,161,255,0.20)]
          px-1 py-1.5
          animate-bottom-nav-in
        "
      >
        <div className="grid grid-cols-6 gap-0.5">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                aria-label={t.label}
                onClick={() => onChange(t.id)}
                className={[
                  'flex flex-col items-center justify-center gap-1',
                  'rounded-xl py-1.5 px-0.5 min-h-[52px]',
                  'text-[9px] sm:text-[10px] font-semibold tracking-wide',
                  'transition-all active:scale-95',
                  isActive
                    ? 'text-white shadow-glow bg-gradient-to-br from-brand-600 to-brand-400'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60',
                ].join(' ')}
              >
                <Icon icon={t.icon} className="text-base sm:text-lg leading-none" />
                <span className="leading-none">{t.short}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Wrapper único — usado pelo App.
// ---------------------------------------------------------------------------

export function ResponsiveTabs({ active, onChange }: TabsProps) {
  return (
    <>
      <DesktopTabs active={active} onChange={onChange} />
      <BottomTabBar active={active} onChange={onChange} />
    </>
  );
}
