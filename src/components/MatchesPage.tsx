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
import { useOpenTeamDetails } from './TeamDetailsContext';

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

interface FilterDef {
  id: MatchFilterId;
  label: string;
  icon: IconDefinition;
  description: string;
}

// Lista única e ordenada — exibida no bottom sheet de "Filtros".
const ALL_FILTERS: FilterDef[] = [
  { id: 'all',      label: 'Todos',       icon: icons.calendar,  description: 'Toda a Copa' },
  { id: 'today',    label: 'Hoje',        icon: icons.today,     description: 'Jogos de hoje' },
  { id: 'live',     label: 'Ao vivo',     icon: icons.live,      description: 'Em andamento agora' },
  { id: 'upcoming', label: 'Próximos',    icon: icons.upcoming,  description: 'Ainda não jogados' },
  { id: 'finished', label: 'Finalizados', icon: icons.qualified, description: 'Com resultado' },
  { id: 'pending',  label: 'Pendentes',   icon: icons.pending,   description: 'Sem placar preenchido' },
  { id: 'past',     label: 'Realizados',  icon: icons.past,      description: 'Passaram do horário' },
];

const FILTER_BY_ID = Object.fromEntries(ALL_FILTERS.map((f) => [f.id, f])) as Record<MatchFilterId, FilterDef>;

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

  // -------- Bottom sheet de filtros --------
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const activeFilter = FILTER_BY_ID[filter];

  // -------- Clique no nome da seleção → abre o histórico/trajetória --------
  const openTeam = useOpenTeamDetails();

  return (
    <section className="space-y-4 animate-slide-up" ref={containerRef}>
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">Jogos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Próximas partidas, jogos do dia, resultados finalizados e pendentes — tudo em um só lugar.
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="text-xs text-slate-500">
            {sorted.length} jogo{sorted.length === 1 ? '' : 's'} no filtro atual
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
            <Icon icon={icons.clock} className="text-[9px]" />
            Horários de Brasília
          </span>
        </div>
      </header>

      {/* ============== FILTRO — botão único que abre bottom sheet ============== */}
      {/*
        Um único botão grande (com o filtro ativo + contador) abre o bottom
        sheet de filtros. Solução "Opção A" — claríssima no mobile, sem texto
        cortado, sem scroll horizontal. No desktop ganha mais espaço mas
        mantém a mesma identidade visual.
      */}
      <button
        type="button"
        onClick={() => setFilterSheetOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={filterSheetOpen}
        className="
          w-full flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3
          rounded-2xl border border-brand-500/30
          bg-gradient-to-br from-brand-500/10 via-white/60 to-white/30
          dark:from-brand-500/15 dark:via-slate-900/50 dark:to-slate-900/30
          backdrop-blur-md
          hover:shadow-glow active:scale-[.99]
          focus:outline-none focus:ring-2 focus:ring-brand-400/40
          transition-all
        "
      >
        <span className="
          shrink-0 inline-flex items-center justify-center
          w-9 h-9 sm:w-10 sm:h-10 rounded-xl
          bg-gradient-to-br from-brand-600 to-brand-400 text-white
          shadow-glow
        ">
          <Icon icon={activeFilter.icon} className="text-base" />
        </span>
        <div className="flex-1 text-left min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-brand-700 dark:text-brand-300 font-bold">
            Filtro atual
          </div>
          <div className="font-display tracking-wider text-base sm:text-lg leading-tight truncate">
            {activeFilter.label}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {counts[filter]} jogo{counts[filter] === 1 ? '' : 's'} · {activeFilter.description}
          </div>
        </div>
        <Icon icon={icons.chevronRight} className="text-slate-400 rotate-90 shrink-0" />
      </button>

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
                    onTeamClick={openTeam}
                    isHighlighted={(item.match as { id: string }).id === highlightedMatchId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={ALL_FILTERS}
        counts={counts}
        current={filter}
        onPick={(id) => { onFilterChange(id); setFilterSheetOpen(false); }}
      />
    </section>
  );
}

function cssEscape(s: string): string {
  return s.replace(/"/g, '\\"');
}

// ---------------------------------------------------------------------------
// Bottom sheet de filtros (portalizado em document.body).
// Mostra TODOS os filtros listados como linhas (ícone · label · descrição · contador).
// ---------------------------------------------------------------------------

function FilterSheet({
  open, onClose, filters, counts, current, onPick,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterDef[];
  counts: Record<MatchFilterId, number>;
  current: MatchFilterId;
  onPick: (id: MatchFilterId) => void;
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
      aria-label="Filtros de jogos"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full sm:max-w-md
          rounded-t-3xl sm:rounded-2xl
          border border-white/60 dark:border-white/5
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          shadow-[0_30px_80px_-20px_rgba(11,27,58,0.5)]
          animate-sheet-up sm:animate-pop-in
          max-h-[85vh] flex flex-col
        "
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle no mobile */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5" aria-hidden />

        <header className="px-5 pt-3 sm:pt-4 pb-2 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-brand-700 dark:text-brand-300 font-bold">
              Filtros de jogos
            </div>
            <h3 className="font-display tracking-wider text-lg">Escolha um filtro</h3>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Icon icon={icons.close} />
          </button>
        </header>

        <ul className="px-2 sm:px-3 pt-2 pb-3 flex-1 overflow-y-auto space-y-1">
          {filters.map((f) => {
            const isActive = current === f.id;
            const count = counts[f.id];
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onPick(f.id)}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-w-0 text-left',
                    isActive
                      ? 'bg-gradient-to-r from-brand-500/20 via-brand-500/10 to-transparent ring-1 ring-brand-500/40'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60',
                  ].join(' ')}
                  aria-pressed={isActive}
                >
                  <span className={[
                    'shrink-0 w-9 h-9 rounded-xl inline-flex items-center justify-center',
                    isActive
                      ? 'bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-glow'
                      : 'bg-slate-200/70 dark:bg-slate-800/70 text-brand-700 dark:text-brand-300',
                  ].join(' ')}>
                    <Icon icon={f.icon} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={[
                      'font-semibold text-sm leading-tight',
                      isActive ? 'text-brand-800 dark:text-brand-200' : 'text-slate-800 dark:text-slate-100',
                    ].join(' ')}>
                      {f.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                      {f.description}
                    </div>
                  </div>
                  <span className={[
                    'shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 leading-none',
                    isActive
                      ? 'bg-brand-500/25 text-brand-800 dark:text-brand-200'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                  ].join(' ')}>
                    {count}
                  </span>
                  {isActive && (
                    <Icon icon={icons.qualified} className="text-brand-500 shrink-0 text-base" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <footer
          className="px-3 pb-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60"
        >
          <button type="button" className="btn-primary w-full" onClick={onClose}>
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
