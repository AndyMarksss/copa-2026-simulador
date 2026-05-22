import type { KnockoutMatch, Match, Team } from '../types';

// ----------------------------------------------------------------------------
// Geração de placares "realistas" para a simulação rápida.
//
//   • Usa o ranking FIFA como aproximação de força. Se ambos os times não
//     tiverem ranking, distribui pesos equilibrados.
//   • Resultados favorecem placares comuns no futebol (0-0, 1-0, 1-1, 2-1…).
//   • Aceita um seed numérico opcional para tornar a simulação reproduzível.
//   • Para mata-mata, decide prorrogação e pênaltis automaticamente.
// ----------------------------------------------------------------------------

export type SimulationStage = 'group' | 'knockout';

interface ScoreOutcome {
  homeScore: number;
  awayScore: number;
  homeExtra: number | null;
  awayExtra: number | null;
  homePens:  number | null;
  awayPens:  number | null;
}

// PRNG simples (mulberry32). Determinístico para um dado seed.
function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Distribuição de placares "para o vencedor" e empates, em probabilidade
// cumulativa. Foi calibrada para se parecer com Copas reais (≈25% empates,
// ≈40% jogos de poucos gols, raros 4+).
const WINNER_SCORES: Array<[number, number, number]> = [
  // [casa, fora, peso]
  [1, 0, 22],
  [2, 0, 14],
  [2, 1, 18],
  [3, 0, 6],
  [3, 1, 8],
  [3, 2, 5],
  [4, 1, 3],
  [4, 2, 2],
  [5, 1, 1],
];

const DRAW_SCORES: Array<[number, number]> = [
  [0, 0], [1, 1], [1, 1], [1, 1], [2, 2],
];

function pickWeighted<T>(rand: () => number, items: Array<[T, number]>): T {
  const total = items.reduce((acc, [, w]) => acc + w, 0);
  let r = rand() * total;
  for (const [val, w] of items) {
    if ((r -= w) <= 0) return val;
  }
  return items[items.length - 1][0];
}

function strengthOf(team?: { fifaRank?: number }): number {
  if (!team || !team.fifaRank) return 30;
  // converte ranking (1 = melhor) em força (~0..1)
  return Math.max(0, 1 - (team.fifaRank - 1) / 100);
}

/**
 * Probabilidade de cada resultado: vitória da casa, empate, vitória do fora.
 * É uma função de força que mantém empates como evento comum.
 */
function outcomeProbabilities(strA: number, strB: number, drawBoost = 1): {
  pHome: number; pDraw: number; pAway: number;
} {
  const diff = strA - strB;                     // -1..1
  const baseHome = 0.42 + diff * 0.22;          // viés leve de mando
  const baseAway = 0.36 - diff * 0.22;
  const baseDraw = (1 - baseHome - baseAway) * drawBoost;
  const norm = baseHome + baseDraw + baseAway;
  return {
    pHome: Math.max(0, baseHome / norm),
    pDraw: Math.max(0, baseDraw / norm),
    pAway: Math.max(0, baseAway / norm),
  };
}

/**
 * Sorteia um placar para a fase de grupos / tempo regulamentar do mata-mata.
 */
function rollRegulation(rand: () => number, teamA?: Team, teamB?: Team): {
  homeScore: number; awayScore: number;
} {
  const strA = strengthOf(teamA);
  const strB = strengthOf(teamB);
  const probs = outcomeProbabilities(strA, strB);
  const r = rand();

  if (r < probs.pDraw) {
    const [a, b] = DRAW_SCORES[Math.floor(rand() * DRAW_SCORES.length)];
    return { homeScore: a, awayScore: b };
  }

  const homeWins = r < probs.pDraw + probs.pHome;
  const score = pickWeighted(rand, WINNER_SCORES.map((s) => [s, s[2]] as [[number, number, number], number]));
  if (homeWins) return { homeScore: score[0], awayScore: score[1] };
  return { homeScore: score[1], awayScore: score[0] };
}

/**
 * Simula uma partida da fase de grupos. Empates são permitidos.
 */
export function simulateGroupMatch(
  teamA: Team | undefined,
  teamB: Team | undefined,
  seed = Math.floor(Math.random() * 1e9),
): { homeScore: number; awayScore: number } {
  const rand = rng(seed);
  return rollRegulation(rand, teamA, teamB);
}

/**
 * Simula uma partida do mata-mata. Garante decisão (prorrogação/pênaltis).
 */
export function simulateKnockoutMatch(
  teamA: Team | undefined,
  teamB: Team | undefined,
  seed = Math.floor(Math.random() * 1e9),
): ScoreOutcome {
  const rand = rng(seed);
  // Reduzimos a chance de empate no tempo normal do mata-mata.
  const probs = outcomeProbabilities(strengthOf(teamA), strengthOf(teamB), 0.7);
  const r = rand();

  if (r < probs.pDraw) {
    // Empate no tempo normal → prorrogação
    const [hs, as] = DRAW_SCORES[Math.floor(rand() * DRAW_SCORES.length)];
    const extra = rollExtra(rand, teamA, teamB);
    if (extra.homeExtra === extra.awayExtra) {
      // → pênaltis
      const pens = rollPenalties(rand);
      return {
        homeScore: hs, awayScore: as,
        homeExtra: extra.homeExtra, awayExtra: extra.awayExtra,
        homePens: pens.home, awayPens: pens.away,
      };
    }
    return {
      homeScore: hs, awayScore: as,
      homeExtra: extra.homeExtra, awayExtra: extra.awayExtra,
      homePens: null, awayPens: null,
    };
  }

  // Vitória direta no tempo normal
  const homeWins = r < probs.pDraw + probs.pHome;
  const score = pickWeighted(rand, WINNER_SCORES.map((s) => [s, s[2]] as [[number, number, number], number]));
  const [h, a] = homeWins ? [score[0], score[1]] : [score[1], score[0]];
  return {
    homeScore: h, awayScore: a,
    homeExtra: null, awayExtra: null,
    homePens: null, awayPens: null,
  };
}

function rollExtra(rand: () => number, teamA?: Team, teamB?: Team): { homeExtra: number; awayExtra: number } {
  const probs = outcomeProbabilities(strengthOf(teamA), strengthOf(teamB), 1.2);
  const r = rand();
  if (r < probs.pDraw) return { homeExtra: 0, awayExtra: 0 };
  // Placares baixos na prorrogação
  const winner = r < probs.pDraw + probs.pHome ? 'home' : 'away';
  const goals = rand() < 0.7 ? 1 : 2;
  return winner === 'home' ? { homeExtra: goals, awayExtra: 0 } : { homeExtra: 0, awayExtra: goals };
}

function rollPenalties(rand: () => number): { home: number; away: number } {
  // Sequência típica termina em 5x3, 5x4, 4x3, 4x2, 6x5 …
  const possibilities: Array<[number, number, number]> = [
    [5, 4, 5], [5, 3, 4], [4, 3, 4], [4, 2, 3], [3, 2, 2], [6, 5, 2],
  ];
  const pick = pickWeighted(rand, possibilities.map((p) => [p, p[2]] as [[number, number, number], number]));
  const homeFirst = rand() < 0.5;
  return homeFirst ? { home: pick[0], away: pick[1] } : { home: pick[1], away: pick[0] };
}

// ----------------------------------------------------------------------------
// Aplicação em lote – usado pelo hook do torneio
// ----------------------------------------------------------------------------

export function simulatedGroupMatch(
  match: Match, home: Team | undefined, away: Team | undefined,
  seed: number,
): Match {
  const { homeScore, awayScore } = simulateGroupMatch(home, away, seed);
  return { ...match, homeScore, awayScore, source: 'simulated' };
}

export function simulatedKnockoutMatch(
  match: KnockoutMatch, home: Team | undefined, away: Team | undefined,
  seed: number,
): KnockoutMatch {
  const out = simulateKnockoutMatch(home, away, seed);
  return {
    ...match,
    homeScore: out.homeScore,
    awayScore: out.awayScore,
    homeExtra: out.homeExtra,
    awayExtra: out.awayExtra,
    homePens:  out.homePens,
    awayPens:  out.awayPens,
    source: 'simulated',
  };
}
