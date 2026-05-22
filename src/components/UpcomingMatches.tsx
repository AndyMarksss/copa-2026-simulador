import React, { useMemo, useState } from 'react';
import type { KnockoutMatch, Match, Team, TournamentState } from '../types';
import { matchIsPlayed } from '../logic/matches';
import { compareSchedule, formatLongDate } from '../data/schedule';
import { teamById } from '../data/groups';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { ROUND_LABELS } from '../data/knockoutBracket';

interface UpcomingMatchesProps {
  state: TournamentState;
}

interface PendingItem {
  key: string;
  date?: string;
  time?: string;
  stage: string;
  homeId?: string;
  awayId?: string;
  city?: string;
}

export function UpcomingMatches({ state }: UpcomingMatchesProps) {
  const [showAll, setShowAll] = useState(false);

  const items: PendingItem[] = useMemo(() => {
    const list: PendingItem[] = [];
    for (const g of state.groups) {
      for (const m of g.matches) {
        if (matchIsPlayed(m)) continue;
        list.push(itemFromGroupMatch(m));
      }
    }
    for (const m of state.knockout.matches) {
      const hasBoth = m.homeTeamId && m.awayTeamId;
      const resolved = m.winnerTeamId !== null;
      if (!hasBoth || resolved) continue;
      list.push(itemFromKnockoutMatch(m));
    }
    list.sort(compareSchedule);
    return list;
  }, [state]);

  const limit = showAll ? items.length : 8;
  const visible = items.slice(0, limit);

  // Agrupa por dia
  const dayGroups: Array<{ day: string; items: PendingItem[] }> = [];
  for (const item of visible) {
    const day = item.date ?? '__td__';
    const last = dayGroups[dayGroups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else dayGroups.push({ day, items: [item] });
  }

  return (
    <section className="card card-pad">
      <header className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-display tracking-wider text-xl sm:text-2xl flex items-center gap-2">
          <Icon icon={icons.calendar} className="text-brand-500" /> Próximas Partidas
        </h3>
        <span className="text-[11px] text-slate-500">
          {items.length === 0
            ? 'Tudo preenchido!'
            : `${items.length} jogo${items.length === 1 ? '' : 's'} pendente${items.length === 1 ? '' : 's'}`}
        </span>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Icon icon={icons.done} className="text-emerald-500" />
          Todos os jogos têm placares definidos. Confira o chaveamento final.
        </p>
      ) : (
        <div className="space-y-4">
          {dayGroups.map((group) => (
            <div key={group.day}>
              <div className="text-[11px] uppercase tracking-wider text-brand-700 dark:text-brand-300 font-bold pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60 mb-2">
                {group.day === '__td__' ? 'Data a definir' : formatLongDate(group.day)}
              </div>

              {/* Mobile/tablet: cards verticais legíveis. Desktop: lista compacta. */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {group.items.map((item) => (
                  <UpcomingCard key={item.key} item={item} state={state} />
                ))}
              </ul>
            </div>
          ))}

          {items.length > 8 && (
            <button
              type="button"
              className="btn-soft w-full"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Mostrar menos' : `Ver mais partidas (${items.length - 8})`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Card de uma partida.
//   • Mobile / tablet: layout vertical e respirado.
//   • Desktop (lg): layout em linha compacta (mantém a estética anterior).
// ---------------------------------------------------------------------------

function UpcomingCard({
  item, state,
}: {
  item: PendingItem;
  state: TournamentState;
}) {
  const home = item.homeId ? teamById(state.groups, item.homeId) : undefined;
  const away = item.awayId ? teamById(state.groups, item.awayId) : undefined;

  return (
    <li
      className="
        group rounded-xl border border-slate-200/60 dark:border-white/5
        bg-white/70 dark:bg-slate-900/40
        hover:border-brand-400/50 hover:shadow-soft
        transition-all overflow-hidden
      "
    >
      {/* --------- Mobile / tablet (< lg) --------- */}
      <div className="lg:hidden p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
          <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
            {item.time ?? '—'}
          </span>
          <span className="text-slate-400">·</span>
          <span className="font-bold text-brand-700 dark:text-brand-300">
            {item.stage}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <TeamLine team={home} align="left" />
          <span className="text-slate-400 font-bold shrink-0">×</span>
          <TeamLine team={away} align="right" />
        </div>

        {item.city && (
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <Icon icon={icons.location} />
            {item.city}
          </div>
        )}
      </div>

      {/* --------- Desktop (lg+) --------- */}
      <div
        className="
          hidden lg:grid items-center gap-3 py-2 px-3 text-sm
          grid-cols-[72px_240px_minmax(0,1fr)]
          xl:grid-cols-[80px_260px_minmax(0,1fr)]
        "
      >
        <span className="font-mono text-sm text-slate-500">{item.time ?? '—'}</span>
        <span className="text-[11px] uppercase font-bold tracking-wider text-brand-700 dark:text-brand-300">
          {item.stage}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
            <span className="truncate font-medium text-right">{home?.name ?? 'A definir'}</span>
            <Flag team={home} size="sm" />
          </span>
          <span className="text-slate-400 font-bold shrink-0">×</span>
          <span className="flex-1 flex items-center gap-1.5 min-w-0">
            <Flag team={away} size="sm" />
            <span className="truncate font-medium">{away?.name ?? 'A definir'}</span>
          </span>
        </div>
      </div>
    </li>
  );
}

function TeamLine({ team, align }: { team?: Team; align: 'left' | 'right' }) {
  const flag = <Flag team={team} size="md" />;
  const name = (
    <span className="font-semibold leading-snug break-words" title={team?.name}>
      {team?.name ?? 'A definir'}
    </span>
  );
  return (
    <div className={[
      'flex-1 min-w-0 flex items-center gap-2',
      align === 'right' ? 'flex-row-reverse text-right' : 'text-left',
    ].join(' ')}>
      {flag}
      {name}
    </div>
  );
}

function itemFromGroupMatch(m: Match): PendingItem {
  return {
    key: m.id, date: m.date, time: m.time,
    stage: m.stage ?? `Grupo ${m.groupId}`,
    homeId: m.homeTeamId, awayId: m.awayTeamId, city: m.city,
  };
}
function itemFromKnockoutMatch(m: KnockoutMatch): PendingItem {
  return {
    key: m.id, date: m.date, time: m.time,
    stage: ROUND_LABELS[m.round],
    homeId: m.homeTeamId ?? undefined, awayId: m.awayTeamId ?? undefined, city: m.city,
  };
}
