import type { GroupId, Match, Team } from '../types';

// ----------------------------------------------------------------------------
// Geração de confrontos da fase de grupos.
//
// Em um grupo de 4 seleções (A, B, C, D), são 6 jogos em formato round-robin.
// Ordem espelhada do calendário oficial da FIFA:
//   Rodada 1: A x B,  C x D
//   Rodada 2: A x C,  D x B
//   Rodada 3: D x A,  B x C
// ----------------------------------------------------------------------------

const ROUND_ROBIN_PAIRS: Array<[number, number]> = [
  [0, 1], [2, 3], // rodada 1
  [0, 2], [3, 1], // rodada 2
  [3, 0], [1, 2], // rodada 3
];

export function generateGroupFixtures(groupId: GroupId, teams: Team[]): Match[] {
  return ROUND_ROBIN_PAIRS.map(([i, j], index) => ({
    id: `G-${groupId}-${index + 1}`,
    groupId,
    homeTeamId: teams[i].id,
    awayTeamId: teams[j].id,
    homeScore: null,
    awayScore: null,
  }));
}

export function matchIsPlayed(match: Match): boolean {
  return (
    match.homeScore !== null &&
    match.awayScore !== null &&
    Number.isFinite(match.homeScore) &&
    Number.isFinite(match.awayScore)
  );
}
