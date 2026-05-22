import type { Group, Standing, ThirdPlacedEntry } from '../types';
import { computeGroupStandings } from './standings';
import { matchIsPlayed } from './matches';

// ----------------------------------------------------------------------------
// Ranking dos terceiros colocados.
//   Critérios (na ordem solicitada):
//     1. Pontos
//     2. Saldo de gols geral
//     3. Gols marcados geral
//     4. Fair play
//     5. Ranking FIFA / desempate manual
//
//   Apenas os 8 melhores avançam para a fase eliminatória.
// ----------------------------------------------------------------------------

export interface ThirdsResult {
  ranking: ThirdPlacedEntry[];
  qualified: ThirdPlacedEntry[];   // top 8 (apenas quando todos os grupos terminaram)
  allGroupsComplete: boolean;
}

function compareThirds(a: ThirdPlacedEntry, b: ThirdPlacedEntry, manual: Record<string, number>): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  if (a.fairPlay !== b.fairPlay) return a.fairPlay - b.fairPlay;
  if (a.fifaRank !== b.fifaRank) return a.fifaRank - b.fifaRank;
  const ma = manual[a.teamId] ?? Number.POSITIVE_INFINITY;
  const mb = manual[b.teamId] ?? Number.POSITIVE_INFINITY;
  return ma - mb;
}

export function computeThirdPlacedRanking(
  groups: Group[],
  manualOrder: Record<string, number> = {},
): ThirdsResult {
  const entries: ThirdPlacedEntry[] = [];
  let allComplete = true;

  for (const g of groups) {
    const standings: Standing[] = computeGroupStandings(g, manualOrder);
    const third = standings[2];
    const totalMatchesInGroup = g.matches.length;
    const playedInGroup = g.matches.filter(matchIsPlayed).length;
    const groupComplete = playedInGroup === totalMatchesInGroup;
    if (!groupComplete) allComplete = false;
    if (!third) continue;

    entries.push({
      teamId: third.teamId,
      groupId: g.id,
      played: third.played,
      points: third.points,
      goalDifference: third.goalDifference,
      goalsFor: third.goalsFor,
      fairPlay: third.fairPlay,
      fifaRank: third.fifaRank,
      rank: 0,
      qualified: false,
    });
  }

  entries.sort((a, b) => compareThirds(a, b, manualOrder));
  entries.forEach((e, i) => {
    e.rank = i + 1;
    e.qualified = allComplete && i < 8;
  });

  return {
    ranking: entries,
    qualified: entries.filter((e) => e.qualified),
    allGroupsComplete: allComplete,
  };
}
