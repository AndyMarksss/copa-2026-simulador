import type { Match, Standing } from '../types';
import { matchIsPlayed } from './matches';

// ----------------------------------------------------------------------------
// Critérios de desempate – fase de grupos
// (Ordem solicitada pelo cliente, alinhada à UEFA / atual proposta FIFA 2026)
//
//   1. Pontos
//   2. Confronto direto entre as equipes empatadas:
//        a) Pontos no confronto direto
//        b) Saldo de gols no confronto direto
//        c) Gols marcados no confronto direto
//   3. Saldo de gols geral
//   4. Gols marcados geral
//   5. Fair play (menos pontos disciplinares = melhor)
//   6. Ranking FIFA (menor = melhor)
//   7. Desempate manual (mapa fornecido pelo usuário)
//
// Implementado em funções pequenas para facilitar manutenção/ajuste futuro.
// ----------------------------------------------------------------------------

interface MiniStanding {
  teamId: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
}

function computeMiniLeague(teamIds: string[], allMatches: Match[]): Map<string, MiniStanding> {
  const ids = new Set(teamIds);
  const mini = new Map<string, MiniStanding>();
  teamIds.forEach((id) =>
    mini.set(id, { teamId: id, points: 0, goalDifference: 0, goalsFor: 0 }),
  );

  for (const m of allMatches) {
    if (!matchIsPlayed(m)) continue;
    if (!ids.has(m.homeTeamId) || !ids.has(m.awayTeamId)) continue;
    const h = mini.get(m.homeTeamId)!;
    const a = mini.get(m.awayTeamId)!;
    const hs = m.homeScore as number;
    const as = m.awayScore as number;
    h.goalsFor += hs;
    h.goalDifference += hs - as;
    a.goalsFor += as;
    a.goalDifference += as - hs;
    if (hs > as) h.points += 3;
    else if (hs < as) a.points += 3;
    else { h.points += 1; a.points += 1; }
  }
  return mini;
}

/**
 * Compara dois standings APENAS pelos critérios "globais" (após o head-to-head).
 * Retorna -1 se a vem antes de b, +1 se depois, 0 se ainda empatados.
 */
function compareOverall(a: Standing, b: Standing, manualOrder: Record<string, number>): number {
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  // Fair play: menor é melhor (a tem MENOS cartões → fica antes)
  if (a.fairPlay !== b.fairPlay) return a.fairPlay - b.fairPlay;
  // Ranking FIFA: menor número é melhor
  if (a.fifaRank !== b.fifaRank) return a.fifaRank - b.fifaRank;
  // Desempate manual (peso menor = melhor classificado)
  const ma = manualOrder[a.teamId] ?? Number.POSITIVE_INFINITY;
  const mb = manualOrder[b.teamId] ?? Number.POSITIVE_INFINITY;
  if (ma !== mb) return ma - mb;
  return 0;
}

/**
 * Aplica os critérios de desempate dentro de um grupo.
 * Recebe a tabela base (já com pontos/SG/GP calculados) e os jogos do grupo.
 */
export function applyGroupTiebreakers(
  standings: Standing[],
  matches: Match[],
  manualOrder: Record<string, number> = {},
): Standing[] {
  // 1) Ordenação primária por pontos
  const byPoints = [...standings].sort((a, b) => b.points - a.points);

  // 2) Agrupa em "buckets" por pontuação igual
  const buckets: Standing[][] = [];
  for (const s of byPoints) {
    const last = buckets[buckets.length - 1];
    if (last && last[0].points === s.points) last.push(s);
    else buckets.push([s]);
  }

  // 3) Resolve cada bucket recursivamente
  const result: Standing[] = [];
  for (const bucket of buckets) {
    result.push(...resolveTiedBucket(bucket, matches, manualOrder));
  }
  return result;
}

function resolveTiedBucket(
  bucket: Standing[],
  matches: Match[],
  manualOrder: Record<string, number>,
): Standing[] {
  if (bucket.length <= 1) return bucket;

  // Mini-liga entre os empatados
  const mini = computeMiniLeague(bucket.map((s) => s.teamId), matches);

  const sorted = [...bucket].sort((a, b) => {
    const ma = mini.get(a.teamId)!;
    const mb = mini.get(b.teamId)!;
    if (mb.points !== ma.points) return mb.points - ma.points;
    if (mb.goalDifference !== ma.goalDifference) return mb.goalDifference - ma.goalDifference;
    if (mb.goalsFor !== ma.goalsFor) return mb.goalsFor - ma.goalsFor;
    return compareOverall(a, b, manualOrder);
  });

  // Pode acontecer de o head-to-head dividir o bucket em sub-buckets ainda
  // empatados, especialmente quando 3+ times estão empatados e o head-to-head
  // separa 1 deles. Iteramos novamente nesses sub-buckets.
  const finalBuckets: Standing[][] = [];
  for (const s of sorted) {
    const last = finalBuckets[finalBuckets.length - 1];
    if (last) {
      const lastMini = mini.get(last[0].teamId)!;
      const curMini = mini.get(s.teamId)!;
      const sameMini =
        lastMini.points === curMini.points &&
        lastMini.goalDifference === curMini.goalDifference &&
        lastMini.goalsFor === curMini.goalsFor;
      if (sameMini && last[0].points === s.points) {
        last.push(s);
        continue;
      }
    }
    finalBuckets.push([s]);
  }

  // Se houver sub-bucket ainda empatado APÓS o head-to-head, aplicamos os
  // critérios globais (SG geral → GP geral → fair play → ranking → manual).
  return finalBuckets.flatMap((b) =>
    b.length <= 1 ? b : [...b].sort((x, y) => compareOverall(x, y, manualOrder)),
  );
}

/**
 * Detecta empates remanescentes que NÃO foram resolvíveis automaticamente.
 * Retorna pares de teamIds que continuam empatados em todos os critérios.
 */
export function detectUnresolvedTies(
  standings: Standing[],
  matches: Match[],
  manualOrder: Record<string, number> = {},
): string[][] {
  const groups: string[][] = [];
  for (let i = 0; i < standings.length - 1; i++) {
    const a = standings[i];
    const b = standings[i + 1];
    if (a.points !== b.points) continue;

    // Compara via head-to-head
    const mini = computeMiniLeague([a.teamId, b.teamId], matches);
    const ma = mini.get(a.teamId)!;
    const mb = mini.get(b.teamId)!;
    if (ma.points !== mb.points) continue;
    if (ma.goalDifference !== mb.goalDifference) continue;
    if (ma.goalsFor !== mb.goalsFor) continue;
    if (compareOverall(a, b, manualOrder) !== 0) continue;

    // Ambos absolutamente empatados — agrupar
    const last = groups[groups.length - 1];
    if (last && last[last.length - 1] === a.teamId) {
      last.push(b.teamId);
    } else {
      groups.push([a.teamId, b.teamId]);
    }
  }
  return groups;
}
