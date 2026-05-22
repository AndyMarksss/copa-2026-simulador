import type { Group, Match, Standing, Team } from '../types';
import { matchIsPlayed } from './matches';
import { applyGroupTiebreakers } from './tiebreakers';

// ----------------------------------------------------------------------------
// Cálculo da tabela do grupo a partir dos jogos preenchidos.
// ----------------------------------------------------------------------------

export function emptyStanding(team: Team): Standing {
  return {
    teamId: team.id,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    fairPlay: team.fairPlay,
    fifaRank: team.fifaRank,
    position: 0,
    status: 'pendente',
  };
}

export function computeBaseStandings(teams: Team[], matches: Match[]): Standing[] {
  const map = new Map<string, Standing>();
  teams.forEach((t) => map.set(t.id, emptyStanding(t)));

  for (const m of matches) {
    if (!matchIsPlayed(m)) continue;
    const home = map.get(m.homeTeamId)!;
    const away = map.get(m.awayTeamId)!;
    const hs = m.homeScore as number;
    const as = m.awayScore as number;

    home.played += 1;
    away.played += 1;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (hs > as) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (hs < as) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return teams.map((t) => map.get(t.id)!);
}

export function computeGroupStandings(group: Group, manualOrder: Record<string, number> = {}): Standing[] {
  const base = computeBaseStandings(group.teams, group.matches);
  const sorted = applyGroupTiebreakers(base, group.matches, manualOrder);

  // Define status visual com base na posição.
  const totalPlayed = group.matches.filter(matchIsPlayed).length;
  const allPlayed = totalPlayed === group.matches.length;
  const anyPlayed = totalPlayed > 0;

  sorted.forEach((s, idx) => {
    s.position = idx + 1;
    if (!anyPlayed) {
      s.status = 'pendente';
    } else if (s.position <= 2) {
      s.status = 'classificado';
    } else if (s.position === 3) {
      s.status = allPlayed ? 'em-disputa' : 'em-disputa';
    } else {
      s.status = allPlayed ? 'eliminado' : 'pendente';
    }
  });

  return sorted;
}
