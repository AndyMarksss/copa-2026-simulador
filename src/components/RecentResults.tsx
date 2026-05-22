import React, { useMemo } from 'react';
import type { Match, KnockoutMatch, TournamentState } from '../types';
import { matchIsPlayed } from '../logic/matches';
import { teamById } from '../data/groups';
import { ROUND_LABELS } from '../data/knockoutBracket';
import { compareSchedule } from '../data/schedule';
import { Flag } from './Flag';
import { Badge } from './Badge';
import { Icon } from './Icon';
import { icons } from '../utils/icons';

interface RecentResultsProps {
  state: TournamentState;
  limit?: number;
}

interface Row {
  key: string;
  date?: string;
  time?: string;
  stage: string;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  pensHome?: number | null;
  pensAway?: number | null;
  source?: 'manual' | 'simulated';
}

export function RecentResults({ state, limit = 6 }: RecentResultsProps) {
  const rows = useMemo<Row[]>(() => {
    const list: Row[] = [];
    for (const g of state.groups) {
      for (const m of g.matches) {
        if (!matchIsPlayed(m)) continue;
        list.push({
          key: m.id, date: m.date, time: m.time,
          stage: m.stage ?? `Grupo ${m.groupId}`,
          homeId: m.homeTeamId, awayId: m.awayTeamId,
          homeScore: m.homeScore, awayScore: m.awayScore,
          source: m.source,
        });
      }
    }
    for (const m of state.knockout.matches) {
      if (!m.winnerTeamId) continue;
      list.push({
        key: m.id, date: m.date, time: m.time,
        stage: ROUND_LABELS[m.round],
        homeId: m.homeTeamId!, awayId: m.awayTeamId!,
        homeScore: m.homeScore, awayScore: m.awayScore,
        pensHome: m.homePens, pensAway: m.awayPens,
        source: m.source,
      });
    }
    // mais recente primeiro = ordem cronológica descrescente
    list.sort((a, b) => -compareSchedule(a, b));
    return list.slice(0, limit);
  }, [state, limit]);

  if (rows.length === 0) {
    return (
      <section className="card card-pad">
        <h3 className="font-display tracking-wider text-2xl flex items-center gap-2">
          <Icon icon={icons.recent} className="text-brand-500" /> Últimos resultados
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          Preencha placares na fase de grupos ou simule uma rodada para começar.
        </p>
      </section>
    );
  }

  return (
    <section className="card card-pad">
      <header className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-display tracking-wider text-2xl flex items-center gap-2">
          <Icon icon={icons.recent} className="text-brand-500" /> Últimos resultados
        </h3>
      </header>
      <ul className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
        {rows.map((r) => {
          const home = teamById(state.groups, r.homeId);
          const away = teamById(state.groups, r.awayId);
          return (
            <li key={r.key} className="py-2 px-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 hover:bg-brand-500/5 rounded-md transition-colors">
              <div className="flex items-center justify-end gap-2 min-w-0">
                <span className="truncate font-medium text-sm">{home?.name ?? '?'}</span>
                <Flag team={home} size="sm" />
              </div>
              <div className="flex items-center gap-1.5 text-base font-bold">
                <span>{r.homeScore ?? '-'}</span>
                <span className="text-slate-400 text-xs">×</span>
                <span>{r.awayScore ?? '-'}</span>
                {(r.pensHome !== null && r.pensHome !== undefined) && (
                  <span className="text-[10px] font-semibold text-rose-500 ml-1">
                    ({r.pensHome}-{r.pensAway} pen)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Flag team={away} size="sm" />
                <span className="truncate font-medium text-sm">{away?.name ?? '?'}</span>
              </div>
              <div className="col-span-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                <span className="font-bold">{r.stage}</span>
                <span className="flex items-center gap-1.5">
                  {r.source === 'simulated' && <Badge variant="em-disputa">Simulado</Badge>}
                  {r.source === 'manual' && <span className="text-emerald-600 dark:text-emerald-400 normal-case">manual</span>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
