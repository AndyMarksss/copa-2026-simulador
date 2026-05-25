import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { KnockoutMatch, Match, Team, TournamentState } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import type { TabId } from './AppTabs';
import { teamById } from '../data/groups';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { ScoreInput } from './ScoreInput';
import { formatLongDate } from '../data/schedule';
import { ROUND_LABELS } from '../data/knockoutBracket';
import {
  getMatchStatus,
  matchesFilter,
  type AnyMatch,
  type MatchFilterId,
  type MatchStatus,
} from '../logic/matchStatus';

// ---------------------------------------------------------------------------
// Aba "Jogos" — concentra próximas partidas, jogos do dia, finalizados,
// pendentes e realizados. Permite EDITAR placar diretamente em cada card.
//
//   • Filtros em chips: flex-wrap (sem scroll horizontal no mobile)
//   • Ordenação: ao vivo → hoje (não finalizado) → próximos → pendentes
//                → finalizados → past (passados sem placar)
//   • Edição inline: o card mostra/oculta inputs de placar.
//                    Para mata-mata, abre lógica de prorrogação/pênaltis
//                    automaticamente em caso de empate.
//   • Destaque: quando o usuário chega aqui via navegação contextual
//                    (clique em jogo no Dashboard), o card correspondente
//                    rola para o centro e ganha glow temporário.
// ---------------------------------------------------------------------------

interface MatchesPageProps {
  state: TournamentState;
  api: TournamentApi;
  filter: MatchFilterId;
  onFilterChange: (f: MatchFilterId) => void;
  onNavigate: (tab: TabId) => void;
  /** Quando preenchido, rola até o card e aplica animação de destaque. */
  highlightedMatchId?: string | null;
  /** Chamado após a animação de destaque terminar. */
  onClearHighlight?: () => void;
}

interface FilterDef { id: MatchFilterId; label: string; icon: IconDefinition; }

const FILTERS: FilterDef[] = [
  { id: 'all',      label: 'Todos',       icon: icons.calendar },
  { id: 'today',    label: 'Hoje',        icon: icons.today },
  { id: 'live',     label: 'Ao vivo',     icon: icons.live },
  { id: 'upcoming', label: 'Próximos',    icon: icons.upcoming },
  { id: 'finished', label: 'Finalizados', icon: icons.qualified },
  { id: 'pending',  label: 'Pendentes',   icon: icons.pending },
  { id: 'past',     label: 'Realizados',  icon: icons.past },
];

interface MatchItem {
  match: AnyMatch;
  type: 'group' | 'knockout';
  status: MatchStatus;
}

// Prioridade de ordenação (menor = mais alto na lista).
function sortPriority(s: MatchStatus): number {
  if (s.isLive)                       return 0;
  if (s.isToday && !s.isFinished)     return 1;
  if (s.isUpcoming)                   return 2;
  if (!s.isFinished && s.startMs === null) return 3; // pendentes sem data
  if (s.isPast && !s.isFinished)      return 4;      // passou sem resultado
  if (s.isFinished)                   return 5;
  return 6;
}

export function MatchesPage({
  state, api, filter, onFilterChange, onNavigate,
  highlightedMatchId, onClearHighlight,
}: MatchesPageProps) {
  // Coleta TODOS os jogos (grupos + mata-mata) com seus status calculados.
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

  // Contagens para mostrar dentro dos chips de filtro.
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

  // Ordena: prioridade > cronologia.
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const pa = sortPriority(a.status);
      const pb = sortPriority(b.status);
      if (pa !== pb) return pa - pb;
      const as = a.status.startMs ?? Number.MAX_SAFE_INTEGER;
      const bs = b.status.startMs ?? Number.MAX_SAFE_INTEGER;
      if (pa <= 4) return as - bs;     // futuros/pendentes: cronológico asc
      return bs - as;                  // finalizados: mais recentes primeiro
    });
  }, [filtered]);

  // Agrupa por dia (YYYY-MM-DD) preservando a ordem.
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

  // -------- Destaque do card ao chegar via navegação contextual --------
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!highlightedMatchId || !containerRef.current) return;
    // Espera o próximo frame para garantir que o DOM já renderizou o card.
    const t1 = window.setTimeout(() => {
      const el = containerRef.current?.querySelector<HTMLElement>(
        `[data-match-id="${cssEscape(highlightedMatchId)}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);

    // Limpa o highlight depois que a animação termina (~2.6s).
    const t2 = window.setTimeout(() => onClearHighlight?.(), 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [highlightedMatchId, onClearHighlight]);

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

      {/* Filtros — chips com QUEBRA DE LINHA (sem scroll horizontal no mobile) */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
                'text-xs font-semibold whitespace-nowrap transition-all',
                isActive
                  ? 'text-white shadow-glow bg-gradient-to-r from-brand-600 to-brand-400'
                  : 'bg-white/70 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800/60',
              ].join(' ')}
            >
              <Icon icon={f.icon} className="text-xs" />
              {f.label}
              {count > 0 && (
                <span
                  className={[
                    'text-[10px] rounded-full px-1.5 py-0.5 leading-none',
                    isActive
                      ? 'bg-white/25'
                      : 'bg-slate-200/80 dark:bg-slate-800/80',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
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
                  <MatchListCard
                    key={(item.match as { id: string }).id}
                    item={item}
                    state={state}
                    api={api}
                    onNavigate={onNavigate}
                    isHighlighted={(item.match as { id: string }).id === highlightedMatchId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function cssEscape(s: string): string {
  // Subset suficiente para nossos IDs (alfanuméricos + "-" + ":").
  return s.replace(/"/g, '\\"');
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

// ---------------------------------------------------------------------------
// Card individual de jogo
// ---------------------------------------------------------------------------

interface MatchListCardProps {
  item: MatchItem;
  state: TournamentState;
  api: TournamentApi;
  onNavigate: (tab: TabId) => void;
  isHighlighted: boolean;
}

function MatchListCard({ item, state, api, onNavigate, isHighlighted }: MatchListCardProps) {
  const { match, type, status } = item;
  const isKO = type === 'knockout';
  const ko = isKO ? (match as KnockoutMatch) : null;
  const grp = !isKO ? (match as Match) : null;

  const homeId = isKO ? ko!.homeTeamId : grp!.homeTeamId;
  const awayId = isKO ? ko!.awayTeamId : grp!.awayTeamId;
  const home = teamById(state.groups, homeId);
  const away = teamById(state.groups, awayId);

  const stage = isKO ? ROUND_LABELS[ko!.round] : (grp!.stage ?? `Grupo ${grp!.groupId}`);
  const time = match.time ?? '—';

  const homeScore = match.homeScore ?? null;
  const awayScore = match.awayScore ?? null;
  const homePens = isKO ? ko!.homePens : null;
  const awayPens = isKO ? ko!.awayPens : null;
  const source = isKO ? ko!.source : grp!.source;

  // Quem foi o vencedor (apenas finalizados)
  const homeIsWinner = isKO
    ? ko!.winnerTeamId !== null && ko!.winnerTeamId === homeId
    : status.isFinished && homeScore !== null && awayScore !== null && homeScore > awayScore;
  const awayIsWinner = isKO
    ? ko!.winnerTeamId !== null && ko!.winnerTeamId === awayId
    : status.isFinished && homeScore !== null && awayScore !== null && awayScore > homeScore;

  // Navegação contextual
  const ctx = isKO
    ? (ko!.round === 'R32'
        ? { label: 'Ver nos 16ª avos', tab: 'r32' as TabId }
        : { label: 'Ver no chaveamento', tab: 'bracket' as TabId })
    : { label: 'Ver no grupo', tab: 'groups' as TabId };

  // Acento por status
  const accent =
    status.primary === 'live'     ? 'ring-2 ring-rose-400/40 border-rose-400/30' :
    status.primary === 'today'    ? 'ring-1 ring-brand-400/30 border-brand-400/30' :
    status.primary === 'finished' ? 'border-emerald-400/25' :
    status.primary === 'past'     ? 'border-amber-400/25' : '';

  // ------- Estado local de edição -------
  const [editing, setEditing] = useState(false);
  const editable = !!(homeId && awayId);

  return (
    <article
      data-match-id={(match as { id: string }).id}
      className={[
        'card card-compact !p-3 animate-fade-in flex flex-col gap-2 min-w-0',
        accent,
        isHighlighted ? 'match-highlight' : '',
      ].join(' ')}
    >
      <header className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon icon={icons.clock} className="text-slate-400" />
          <span className="font-mono text-slate-600 dark:text-slate-300">{time}</span>
          <span className="text-slate-400">·</span>
          <span className="font-bold text-brand-700 dark:text-brand-300 truncate">{stage}</span>
        </div>
        <StatusBadge status={status} source={source} />
      </header>

      <div className="flex items-center gap-2 text-sm min-w-0">
        <TeamLine team={home} align="left" winner={homeIsWinner} />
        <ScoreCenter
          finished={status.isFinished}
          homeScore={homeScore} awayScore={awayScore}
          homePens={homePens} awayPens={awayPens}
        />
        <TeamLine team={away} align="right" winner={awayIsWinner} />
      </div>

      {/* ---- Painel de edição inline ---- */}
      {editing && editable && (
        <ScoreEditor
          item={item}
          api={api}
          onDone={() => setEditing(false)}
        />
      )}

      <footer className="flex items-center justify-between text-[10px] text-slate-500 gap-2 min-w-0 flex-wrap">
        {match.city ? (
          <span className="flex items-center gap-1 min-w-0">
            <Icon icon={icons.location} />
            <span className="truncate">{match.city}</span>
          </span>
        ) : <span />}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {editable && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={[
                'inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 transition-colors',
                editing
                  ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
              aria-expanded={editing}
            >
              <Icon icon={editing ? icons.close : icons.simulation} />
              {editing
                ? 'Fechar'
                : (status.isFinished ? 'Editar placar' : 'Preencher placar')}
            </button>
          )}
          <button
            onClick={() => onNavigate(ctx.tab)}
            className="inline-flex items-center gap-1 text-brand-700 dark:text-brand-300 font-semibold hover:underline"
          >
            {ctx.label} <Icon icon={icons.chevronRight} />
          </button>
        </div>
      </footer>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Editor inline — preenche placar (grupo OU mata-mata).
//   Mata-mata: se houver empate no tempo normal, mostra prorrogação + pênaltis.
// ---------------------------------------------------------------------------

function ScoreEditor({
  item, api, onDone,
}: {
  item: MatchItem;
  api: TournamentApi;
  onDone: () => void;
}) {
  const { match, type } = item;
  const isKO = type === 'knockout';

  if (!isKO) {
    const m = match as Match;
    return (
      <div className="rounded-lg bg-slate-100/70 dark:bg-slate-800/40 px-2 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            Editar placar — fase de grupos
          </span>
          {m.source && (
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              {m.source === 'simulated' ? 'Simulado' : 'Manual'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <ScoreInput
            value={m.homeScore}
            onChange={(v) => api.setGroupMatchScore(m.groupId, m.id, v, m.awayScore)}
            ariaLabel="Placar mandante"
            size="md"
          />
          <span className="text-slate-400 text-sm font-bold">×</span>
          <ScoreInput
            value={m.awayScore}
            onChange={(v) => api.setGroupMatchScore(m.groupId, m.id, m.homeScore, v)}
            ariaLabel="Placar visitante"
            size="md"
          />
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            className="text-[10px] font-semibold text-rose-600 dark:text-rose-300 hover:underline"
            onClick={() => api.setGroupMatchScore(m.groupId, m.id, null, null)}
          >
            Limpar
          </button>
          <button
            type="button"
            className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 hover:underline"
            onClick={onDone}
          >
            Concluído
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Mata-mata ----------------
  const m = match as KnockoutMatch;
  const tied =
    m.homeScore !== null && m.awayScore !== null && m.homeScore === m.awayScore;
  const tiedAfterExtra =
    tied &&
    m.homeExtra !== null && m.awayExtra !== null &&
    (m.homeScore ?? 0) + m.homeExtra === (m.awayScore ?? 0) + m.awayExtra;

  return (
    <div className="rounded-lg bg-slate-100/70 dark:bg-slate-800/40 px-2 py-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Editar placar — mata-mata
        </span>
        {m.source && (
          <span className="text-[9px] font-bold text-slate-500 uppercase">
            {m.source === 'simulated' ? 'Simulado' : 'Manual'}
          </span>
        )}
      </div>

      {/* Tempo normal */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-500">Tempo normal</span>
        <div className="flex items-center justify-center gap-3">
          <ScoreInput
            value={m.homeScore}
            onChange={(v) => api.setKnockoutScore(m.id, 'home', v)}
            ariaLabel="Placar mandante (tempo normal)"
            size="md"
          />
          <span className="text-slate-400 text-sm font-bold">×</span>
          <ScoreInput
            value={m.awayScore}
            onChange={(v) => api.setKnockoutScore(m.id, 'away', v)}
            ariaLabel="Placar visitante (tempo normal)"
            size="md"
          />
        </div>
      </div>

      {/* Prorrogação */}
      {tied && (
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
            Prorrogação (gols adicionais)
          </span>
          <div className="flex items-center justify-center gap-3">
            <ScoreInput
              value={m.homeExtra}
              onChange={(v) => api.setKnockoutScore(m.id, 'homeExtra', v)}
              ariaLabel="Gols prorrogação mandante"
              size="md"
              tone="amber"
            />
            <span className="text-slate-400 text-sm font-bold">×</span>
            <ScoreInput
              value={m.awayExtra}
              onChange={(v) => api.setKnockoutScore(m.id, 'awayExtra', v)}
              ariaLabel="Gols prorrogação visitante"
              size="md"
              tone="amber"
            />
          </div>
        </div>
      )}

      {/* Pênaltis */}
      {tiedAfterExtra && (
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold">
            Pênaltis
          </span>
          <div className="flex items-center justify-center gap-3">
            <ScoreInput
              value={m.homePens}
              onChange={(v) => api.setKnockoutScore(m.id, 'homePens', v)}
              ariaLabel="Pênaltis mandante"
              size="md"
              tone="rose"
            />
            <span className="text-slate-400 text-sm font-bold">×</span>
            <ScoreInput
              value={m.awayPens}
              onChange={(v) => api.setKnockoutScore(m.id, 'awayPens', v)}
              ariaLabel="Pênaltis visitante"
              size="md"
              tone="rose"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          className="text-[10px] font-semibold text-rose-600 dark:text-rose-300 hover:underline"
          onClick={() => {
            api.setKnockoutScore(m.id, 'home', null);
            api.setKnockoutScore(m.id, 'away', null);
            api.setKnockoutScore(m.id, 'homeExtra', null);
            api.setKnockoutScore(m.id, 'awayExtra', null);
            api.setKnockoutScore(m.id, 'homePens', null);
            api.setKnockoutScore(m.id, 'awayPens', null);
          }}
        >
          Limpar
        </button>
        <button
          type="button"
          className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 hover:underline"
          onClick={onDone}
        >
          Concluído
        </button>
      </div>
    </div>
  );
}

function TeamLine({
  team, align, winner,
}: {
  team: Team | undefined;
  align: 'left' | 'right';
  winner: boolean;
}) {
  return (
    <div className={[
      'flex-1 min-w-0 flex items-center gap-1.5',
      align === 'right' ? 'flex-row-reverse text-right' : 'text-left',
      winner ? 'font-bold text-emerald-700 dark:text-emerald-300' : '',
    ].join(' ')}>
      <Flag team={team} size="sm" />
      <span className="truncate">{team?.name ?? 'A definir'}</span>
    </div>
  );
}

function ScoreCenter({
  finished, homeScore, awayScore, homePens, awayPens,
}: {
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
}) {
  if (finished && homeScore !== null && awayScore !== null) {
    return (
      <div className="flex flex-col items-center text-sm font-bold shrink-0 px-1.5">
        <span>{homeScore} <span className="text-slate-400 text-xs">×</span> {awayScore}</span>
        {homePens !== null && awayPens !== null && (
          <span className="text-[9px] font-semibold text-rose-500">({homePens}-{awayPens} pen)</span>
        )}
      </div>
    );
  }
  return (
    <span className="text-xs text-slate-400 font-bold shrink-0 px-1.5">×</span>
  );
}

// ---------------------------------------------------------------------------
// Badge de status (Hoje, Ao vivo, Finalizado, etc.)
// ---------------------------------------------------------------------------

function StatusBadge({
  status, source,
}: {
  status: MatchStatus;
  source?: 'manual' | 'simulated';
}) {
  if (status.primary === 'live') {
    return (
      <span className="chip bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30 shrink-0">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Ao vivo
      </span>
    );
  }
  if (status.primary === 'today') {
    return (
      <span className="chip bg-brand-500/15 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30 shrink-0">
        <Icon icon={icons.today} /> Hoje
      </span>
    );
  }
  if (status.primary === 'upcoming') {
    return (
      <span className="chip bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30 shrink-0">
        <Icon icon={icons.upcoming} /> Próximo
      </span>
    );
  }
  if (status.primary === 'finished') {
    return (
      <span className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 shrink-0">
        <Icon icon={icons.qualified} />
        Final
        {source === 'simulated' && <span className="text-[8px] uppercase opacity-70 ml-0.5">SIM</span>}
        {source === 'manual'    && <span className="text-[8px] uppercase opacity-70 ml-0.5">MAN</span>}
      </span>
    );
  }
  if (status.primary === 'past') {
    return (
      <span className="chip bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 shrink-0">
        <Icon icon={icons.warning} /> Aguardando
      </span>
    );
  }
  return (
    <span className="chip bg-slate-500/10 text-slate-500 dark:text-slate-300 ring-1 ring-slate-500/20 shrink-0">
      <Icon icon={icons.pending} /> Pendente
    </span>
  );
}
