import React from 'react';
import type { Team } from '../types';

// ----------------------------------------------------------------------------
// Componente Flag — usa flag-icons (SVG) com fallback para emoji e iniciais.
//
//   <Flag code="br" />            → bandeira do Brasil
//   <Flag code="gb-sct" />        → bandeira da Escócia
//   <Flag team={team} />          → atalho com fallback automático
//
// Tamanhos pré-definidos (sm, md, lg, xl) preservam a proporção 4:3.
// ----------------------------------------------------------------------------

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-5 h-[15px]  rounded-[2px]',
  md: 'w-7 h-[21px]  rounded-sm',
  lg: 'w-10 h-[30px] rounded',
  xl: 'w-16 h-12     rounded-md',
};

interface FlagProps {
  code?: string | null;
  fallbackEmoji?: string;
  fallbackText?: string;
  team?: Team;
  size?: Size;
  className?: string;
  title?: string;
}

export function Flag({
  code,
  fallbackEmoji,
  fallbackText,
  team,
  size = 'md',
  className = '',
  title,
}: FlagProps) {
  const flagCode = (code ?? team?.flagCode ?? '').toLowerCase().trim();
  const emoji = fallbackEmoji ?? team?.flag ?? '';
  const text = fallbackText ?? team?.code ?? '';
  const sizeCls = SIZE_CLASSES[size];

  if (flagCode) {
    return (
      <span
        title={title ?? team?.name}
        className={[
          'fi inline-block shadow-sm ring-1 ring-black/10 dark:ring-white/10',
          `fi-${flagCode}`,
          sizeCls,
          className,
        ].join(' ')}
        aria-label={team?.name ?? flagCode}
        role="img"
      />
    );
  }

  if (emoji) {
    const fontSize =
      size === 'sm' ? 'text-base'
        : size === 'md' ? 'text-xl'
          : size === 'lg' ? 'text-3xl'
            : 'text-4xl';
    return (
      <span
        title={title}
        className={`inline-block leading-none ${fontSize} ${className}`}
        aria-label={team?.name}
        role="img"
      >
        {emoji}
      </span>
    );
  }

  return (
    <span
      title={title}
      className={[
        'inline-flex items-center justify-center font-bold text-[10px] tracking-tight',
        'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
        sizeCls,
        className,
      ].join(' ')}
    >
      {text.slice(0, 3).toUpperCase()}
    </span>
  );
}
