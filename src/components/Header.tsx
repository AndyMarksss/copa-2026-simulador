import React from 'react';
import { WorldCupLogo } from './WorldCupLogo';
import { Icon } from './Icon';
import { icons } from '../utils/icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-xl
                 bg-white/65 dark:bg-[#060c1a]/70
                 border-b border-white/40 dark:border-white/5"
    >
      <div className="mx-auto max-w-[1500px] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/*
            Container "moldura" — fica praticamente invisível no tema claro
            mas no tema escuro adiciona um fundo translúcido + glow azul/dourado
            para destacar as áreas escuras da logo oficial da Copa 2026.
          */}
          <span
            className="
              shrink-0 inline-flex items-center justify-center
              rounded-xl
              dark:bg-white/[0.06] dark:ring-1 dark:ring-white/15 dark:backdrop-blur-md
              dark:px-1.5 dark:py-0.5
              dark:shadow-[0_0_22px_rgba(58,161,255,0.18),0_0_18px_rgba(212,175,55,0.10)]
              transition-all
            "
          >
            <span className="sm:hidden">
              <WorldCupLogo size={42} />
            </span>
            <span className="hidden sm:inline">
              <WorldCupLogo size={56} />
            </span>
          </span>

          <div className="min-w-0">
            <h1 className="font-display tracking-wider text-lg sm:text-2xl leading-none truncate">
              <span className="text-gradient-blue">
                <span className="sm:hidden">Copa 2026</span>
                <span className="hidden sm:inline">Copa do Mundo 2026</span>
              </span>
            </h1>
            <p className="hidden sm:block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 -mt-0.5 truncate">
              Simulador interativo — fase de grupos &amp; mata-mata
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Alternar tema"
          onClick={onToggleTheme}
          className="btn-ghost shrink-0 !px-2.5 sm:!px-3"
        >
          <Icon icon={theme === 'dark' ? icons.light : icons.dark} className="text-base" />
          <span className="hidden md:inline">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
        </button>
      </div>
    </header>
  );
}
