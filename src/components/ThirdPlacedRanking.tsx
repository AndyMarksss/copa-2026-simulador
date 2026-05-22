import React from 'react';
import type { TournamentState } from '../types';
import { computeThirdPlacedRanking } from '../logic/thirdPlaced';
import { teamById } from '../data/groups';
import { Badge } from './Badge';
import { Flag } from './Flag';

interface ThirdPlacedRankingProps {
  state: TournamentState;
}

export function ThirdPlacedRanking({ state }: ThirdPlacedRankingProps) {
  const result = computeThirdPlacedRanking(state.groups, state.manualTiebreakers);

  return (
    <section className="card card-pad">
      <header className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-display tracking-wider text-2xl">Ranking dos 3º Colocados</h3>
        <span className="text-xs text-slate-500">
          {result.allGroupsComplete ? '8 melhores classificados' : 'Atualiza ao fim de cada grupo'}
        </span>
      </header>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-500">
              <th className="text-left py-1">#</th>
              <th className="text-left py-1">Seleção</th>
              <th className="text-center py-1">Gr.</th>
              <th className="text-center py-1">P</th>
              <th className="text-center py-1">SG</th>
              <th className="text-center py-1">GP</th>
              <th className="text-left py-1 pl-2">Situação</th>
            </tr>
          </thead>
          <tbody>
            {result.ranking.map((entry) => {
              const team = teamById(state.groups, entry.teamId)!;
              const inTop8 = entry.rank <= 8;
              return (
                <tr
                  key={entry.teamId}
                  className={[
                    'border-t border-slate-200/60 dark:border-slate-800/60',
                    inTop8 ? 'bg-sky-500/5' : 'opacity-70',
                  ].join(' ')}
                >
                  <td className="py-1.5 pr-2 font-semibold text-slate-500">{entry.rank}</td>
                  <td className="py-1.5">
                    <span className="flex items-center gap-2">
                      <Flag team={team} size="sm" />
                      <span className="font-semibold">{team.name}</span>
                    </span>
                  </td>
                  <td className="text-center font-mono">{entry.groupId}</td>
                  <td className="text-center font-bold">{entry.points}</td>
                  <td className="text-center">
                    {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                  </td>
                  <td className="text-center">{entry.goalsFor}</td>
                  <td className="pl-2">
                    {result.allGroupsComplete ? (
                      inTop8 ? <Badge variant="melhor-terceiro" /> : <Badge variant="eliminado" />
                    ) : (
                      <Badge variant="em-disputa" />
                    )}
                  </td>
                </tr>
              );
            })}
            {result.ranking.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-sm text-slate-500">
                  Os 3º colocados aparecerão aqui assim que houver jogos preenchidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
