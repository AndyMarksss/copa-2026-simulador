import React from 'react';

export type TabId = 'dashboard' | 'groups' | 'r32' | 'bracket' | 'settings';

interface TabDef {
  id: TabId;
  label: string;
  short: string;
  icon: string;
}

export const TABS: TabDef[] = [
  { id: 'dashboard', label: 'Dashboard',         short: 'Início',   icon: '🏠' },
  { id: 'groups',    label: 'Fase de Grupos',    short: 'Grupos',   icon: '🥅' },
  { id: 'r32',       label: '16ª avos de Final', short: '16ª',      icon: '🎯' },
  { id: 'bracket',   label: 'Chaveamento Final', short: 'Chave',    icon: '🏆' },
  { id: 'settings',  label: 'Configurações',     short: 'Config',   icon: '⚙️' },
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
                <span aria-hidden className="text-base">{t.icon}</span>
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
// ---------------------------------------------------------------------------

export function BottomTabBar({ active, onChange }: TabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Navegação principal"
      className="
        lg:hidden fixed left-0 right-0 z-40
        px-3 pointer-events-none
      "
      style={{ bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="
          pointer-events-auto mx-auto max-w-2xl
          rounded-[22px] border border-white/55 dark:border-white/10
          bg-white/85 dark:bg-[#060c1a]/85 backdrop-blur-xl
          shadow-[0_18px_44px_-12px_rgba(11,27,58,0.30),0_-2px_18px_-12px_rgba(58,161,255,0.20)]
          px-1.5 py-1.5
          animate-bottom-nav-in
        "
      >
        <div className="grid grid-cols-5 gap-0.5">
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
                  'flex flex-col items-center justify-center gap-0.5',
                  'rounded-xl py-1.5 px-1 min-h-[52px]',
                  'text-[10px] font-semibold tracking-wide',
                  'transition-all active:scale-95',
                  isActive
                    ? 'text-white shadow-glow bg-gradient-to-br from-brand-600 to-brand-400'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60',
                ].join(' ')}
              >
                <span aria-hidden className="text-lg leading-none">{t.icon}</span>
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
