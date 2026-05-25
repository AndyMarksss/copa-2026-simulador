import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { TournamentState } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import type { TabId } from './AppTabs';
import type { NavigateFn } from '../App';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { formatLongDate } from '../data/schedule';
import {
  getMatchStatus,
  matchesFilter,
  type MatchFilterId,
  type MatchStatus,
} from '../logic/matchStatus';
import { MatchCard, type MatchItem } from './MatchCard';
import { teamById } from '../data/groups';

// ---------------------------------------------------------------------------
// Aba "Jogos" — usa MatchCard (variant="full") e oferece:
//
//   • Filtros principais como SEGMENTED CONTROL (Todos / Hoje / Próximos /
//     Finalizados) — grid 2x2 no mobile, linha única ≥sm.
//   • Botão "Mais filtros" que abre um bottom sheet (no mobile) ou popover
//     (no desktop) com filtros avançados (Ao vivo / Pendentes / Realizados).
//   • Cards mostram FASE primeiro, depois horário (regra de hierarquia).
//   • Clique no NOME da seleção → navega para Grupos com o grupo expandido
//     e a linha destacada.
// ---------------------------------------------------------------------------

interface MatchesPageProps {
  state: TournamentState;
  api: TournamentApi;
  filter: MatchFilterId;
  onFilterChange: (f: MatchFilterId) => void;
  onNavigate: NavigateFn;
  highlightedMatchId?: string | null;
  onClearHighlight?: () => void;
}

interface FilterDef { id: MatchFilterId; label: string; icon: IconDefinition; }

// Filtros principais (sempre visíveis como segmented control)
const PRIMARY_FILTERS: FilterDef[] = [
  { id: 'all',      label: 'Todos',       icon: icons.calendar },
  { id: 'today',    label: 'Hoje',        icon: icons.today },
  { id: 'upcoming', label: 'Próximos',    icon: icons.upcoming },
  { id: 'finished', label: 'Finalizados', icon: icons.qualified },
];

// Filtros avançados (escondidos atrás de "Mais filtros")
const SECONDARY_FILTERS: FilterDef[] = [
  { id: 'live',    label: 'Ao vivo',    icon: icons.live },
  { id: 'pending', label: 'Pendentes',  icon: icons.pending },
  { id: 'past',    label: 'Realizados', icon: icons.past },
];

function sortPriority(s: MatchStatus): number {
  if (s.isLive)                              return 0;
  if (s.isToday && !s.isFinished)            return 1;
  if (s.isUpcoming)                          return 2;
  if (!s.isFinished && s.startMs === null)   return 3;
  if (s.isPast && !s.isFinished)             return 4;
  if (s.isFinished)                          return 5;
  return 6;
}

export function MatchesPage({
  state, api, filter, onFilterChange, onNavigate,
  highlightedMatchId, onClearHighlight,
}: MatchesPageProps) {
  const allItems = useMemo<MatchItem[]>(() => {
    const arr: MatchItem[] = [];
    const now = new Date();
    for (const g of state.groups) {
      for (const m of g.matches) arr.push({ match: m, type: 'group', status: getMatchStatus(m, now) });
    }
    for (const m of state.knockout.matches) {
      arr.push({ match: m, type: 'knockout', status: getMatchStatus(m, now) });
    }
    return arr;
  }, [state]);

  const counts = useMemo(() => {
    const c: Record<MatchFilterId, number> = {
      all: 0, today: 0, live: 0, upcoming: 0, finished: 0, pending: 0, past: 0,
    };
    for (const item of allItems) {
      c.all++;
      if (item.status.isToday)    c.today++;
      if (item.status.isLive)     c.live++;
      if (item.status.isUpcoming) c.upcoming++;
      if (item.status.isFinished) c.finished++;
      if (!item.status.isFinished) c.pending++;
      if (item.status.isPast)     c.past++;
    }
    return c;
  }, [allItems]);

  const filtered = useMemo(
    () => allItems.filter(({ status }) => matchesFilter(status, filter)),
    [allItems, filter],
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const pa = sortPriority(a.status);
      const pb = sortPriority(b.status);
      if (pa !== pb) return pa - pb;
      const as = a.status.startMs ?? Number.MAX_SAFE_INTEGER;
      const bs = b.status.startMs ?? Number.MAX_SAFE_INTEGER;
      if (pa <= 4) return as - bs;
      return bs - as;
    });
  }, [filtered]);

  const byDay = useMemo(() => {
    const out: Array<{ day: string; items: MatchItem[] }> = [];
    for (const item of sorted) {
      const day = item.match.date ?? '__nodate__';
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(item);
      else out.push({ day, items: [item] });
    }
    return out;
  }, [sorted]);

  // -------- Destaque ao chegar via navegação contextual --------
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!highlightedMatchId || !containerRef.current) return;
    const t1 = window.setTimeout(() => {
      const el = containerRef.current?.querySelector<HTMLElement>(
        `[data-match-id="${cssEscape(highlightedMatchId)}"]`,
      );
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    const t2 = window.setTimeout(() => onClearHighlight?.(), 2800);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [highlightedMatchId, onClearHighlight]);

  // -------- "Mais filtros" --------
  const [moreOpen, setMoreOpen] = useState(false);
  const activeSecondary = SECONDARY_FILTERS.find((f) => f.id === filter);

  // -------- Clique no nome da seleção → navega para Grupos --------
  const handleTeamClick = (teamId: string) => {
    const team = teamById(state.groups, teamId);
    if (!team) return;
    onNavigate('groups', { highlightGroupId: team.groupId, highlightTeamId: team.id });
  };

  return (
    <section className="space-y-4 animate-slide-up" ref={containerRef}>
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">Jogos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Próximas partidas, jogos do dia, resultados finalizados e pendentes — tudo em um só lugar.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {sorted.length} jogo{sorted.length === 1 ? '' : 's'} no filtro atual
        </div>
      </header>

      {/* ============== FILTROS ============== */}
      <div className="flex flex-col gap-2">
        {/* Segmented control — grid 2x2 mobile, 4 colunas em ≥sm */}
        <div
          role="tablist"
          aria-label="Filtros de jogos"
          className="
            grid grid-cols-2 sm:grid-cols-4 gap-1 p-1
            rounded-2xl border border-slate-200/60 dark:border-white/5
            bg-white/65 dark:bg-slate-900/40 backdrop-blur-md
          "
        >
          {PRIMARY_FILTERS.map((f) => {
            const isActive = filter === f.id;
            const count = counts[f.id];
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange(f.id)}
                className={[
                  'inline-flex items-center justify-center gap-1.5',
                  'rounded-xl px-2 py-2 text-xs sm:text-[13px] font-semibold transition-all',
                  isActive
                    ? 'text-white shadow-glow bg-gradient-to-br from-brand-600 to-brand-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60',
                ].join(' ')}
              >
                <Icon icon={f.icon} className="text-xs sm:text-sm" />
                <span>{f.label}</span>
                {count > 0 && (
                  <span
                    className={[
                      'text-[10px] rounded-full px-1.5 py-0.5 leading-none',
                      isActive ? 'bg-white/25' : 'bg-slate-200/80 dark:bg-slate-800/80',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mais filtros + atalho rápido para secundários */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
              activeSecondary
                ? 'text-white shadow-glow bg-gradient-to-r from-brand-600 to-brand-400'
                : 'bg-white/70 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800/60',
            ].join(' ')}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <Icon icon={icons.simulation} />
            {activeSecondary ? `Filtro: ${activeSecondary.label}` : 'Mais filtros'}
            {activeSecondary && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onFilterChange('all'); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onFilterChange('all');
                  }
                }}
                className="ml-1 rounded-full bg-white/30 hover:bg-white/50 w-4 h-4 inline-flex items-center justify-center"
                aria-label="Limpar filtro"
              >
                <Icon icon={icons.close} className="text-[10px]" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============== LISTA ============== */}
      {byDay.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-4">
          {byDay.map(({ day, items }) => (
            <section key={day}>
              <header className="text-[11px] uppercase tracking-wider text-brand-700 dark:text-brand-300 font-bold pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60 mb-2">
                {day === '__nodate__' ? 'Data a definir' : formatLongDate(day)}
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((item) => (
                  <MatchCard
                    key={(item.match as { id: string }).id}
                    variant="full"
                    item={item}
                    state={state}
                    api={api}
                    onNavigateContext={(tab: TabId) => onNavigate(tab)}
                    onTeamClick={handleTeamClick}
                    isHighlighted={(item.match as { id: string }).id === highlightedMatchId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <MoreFiltersSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        filters={SECONDARY_FILTERS}
        counts={counts}
        current={filter}
        onPick={(id) => { onFilterChange(id); setMoreOpen(false); }}
        onClear={() => { onFilterChange('all'); setMoreOpen(false); }}
      />
    </section>
  );
}

function cssEscape(s: string): string {
  return s.replace(/"/g, '\\"');
}

// ---------------------------------------------------------------------------
// Bottom sheet de filtros avançados (portalizado em document.body)
// ---------------------------------------------------------------------------

function MoreFiltersSheet({
  open, onClose, filters, counts, current, onPick, onClear,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterDef[];
  counts: Record<MatchFilterId, number>;
  current: MatchFilterId;
  onPick: (id: MatchFilterId) => void;
  onClear: () => void;
}) {
  // ESC + body lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const sheet = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mais filtros"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full sm:max-w-sm
          rounded-t-3xl sm:rounded-2xl
          border border-white/60 dark:border-white/5
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          shadow-[0_30px_80px_-20px_rgba(11,27,58,0.5)]
          animate-sheet-up sm:animate-pop-in
          max-h-[80vh] flex flex-col
        "
        style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom, 0px))' }}
      >
        <header className="px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="font-display tracking-wider text-lg">Mais filtros</h3>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Icon icon={icons.close} />
          </button>
        </header>

        <ul className="px-3 pb-3 flex-1 overflow-y-auto space-y-1">
          {filters.map((f) => {
            const isActive = current === f.id;
            const count = counts[f.id];
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onPick(f.id)}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                    isActive
                      ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200',
                  ].join(' ')}
                >
                  <Icon icon={f.icon} className="text-brand-500" />
                  <span className="flex-1 text-left font-semibold text-sm">{f.label}</span>
                  <span className={[
                    'text-[10px] rounded-full px-2 py-0.5 leading-none',
                    isActive ? 'bg-brand-500/30' : 'bg-slate-200 dark:bg-slate-800',
                  ].join(' ')}>
                    {count}
                  </span>
                  {isActive && <Icon icon={icons.qualified} className="text-brand-500" />}
                </button>
              </li>
            );
          })}
        </ul>

        <footer
          className="px-3 pb-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex gap-2"
        >
          <button type="button" className="btn-ghost flex-1" onClick={onClear}>
            <Icon icon={icons.clean} />
            Limpar filtro
          </button>
          <button type="button" className="btn-primary flex-1" onClick={onClose}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

// ---------------------------------------------------------------------------
// Estado vazio
// ---------------------------------------------------------------------------

function EmptyState({ filter }: { filter: MatchFilterId }) {
  const messages: Record<MatchFilterId, string> = {
    all:      'Nenhum jogo encontrado.',
    today:    'Nenhum jogo agendado para hoje.',
    live:     'Nenhum jogo em andamento agora.',
    upcoming: 'Não há jogos futuros pendentes.',
    finished: 'Nenhum resultado preenchido ainda.',
    pending:  'Não há jogos pendentes — tudo preenchido!',
    past:     'Nenhum jogo passou sem ter resultado.',
  };
  return (
    <div className="card card-pad text-sm text-slate-500 text-center py-8">
      <Icon icon={icons.calendar} className="text-3xl text-slate-400 mb-2" />
      <p>{messages[filter]}</p>
    </div>
  );
}
