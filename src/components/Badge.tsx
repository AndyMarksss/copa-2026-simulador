import React from 'react';
import type { Standing } from '../types';

type Variant =
  | 'classificado'
  | 'melhor-terceiro'
  | 'em-disputa'
  | 'eliminado'
  | 'pendente'
  | 'campeao'
  | 'vice'
  | 'terceiro';

const STYLES: Record<Variant, string> = {
  classificado:     'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300',
  'melhor-terceiro':'bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300',
  'em-disputa':     'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300',
  eliminado:        'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300',
  pendente:         'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20 dark:text-slate-300',
  campeao:          'bg-yellow-400/20 text-yellow-700 ring-1 ring-yellow-400/40 dark:text-yellow-300',
  vice:             'bg-zinc-300/30 text-zinc-700 ring-1 ring-zinc-400/40 dark:text-zinc-200',
  terceiro:         'bg-orange-400/20 text-orange-700 ring-1 ring-orange-400/40 dark:text-orange-300',
};

const LABELS: Record<Variant, string> = {
  classificado:     'Classificado',
  'melhor-terceiro':'Melhor 3º',
  'em-disputa':     'Em disputa',
  eliminado:        'Eliminado',
  pendente:         'Pendente',
  campeao:          '🏆 Campeão',
  vice:             '🥈 Vice',
  terceiro:         '🥉 3º Lugar',
};

interface BadgeProps {
  variant: Variant;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`chip ${STYLES[variant]} ${className}`}>
      {children ?? LABELS[variant]}
    </span>
  );
}

export function statusVariant(status: Standing['status']): Variant {
  return status;
}
