import type {
  Group,
  GroupId,
  KnockoutMatch,
  SlotId,
  Standing,
  ThirdPlacedEntry,
} from '../types';
import { computeGroupStandings } from './standings';
import { computeThirdPlacedRanking } from './thirdPlaced';
import { applyKnockoutSchedule } from '../data/schedule';

// ----------------------------------------------------------------------------
// Lógica da fase eliminatória:
//   - Resolução dos slots simbólicos (1A, 2C, 3#1, W:M01, L:M29 …)
//   - Decisão do vencedor (tempo normal → prorrogação → pênaltis → manual)
//   - Propagação para a próxima fase
// ----------------------------------------------------------------------------

export interface KnockoutResolverInput {
  groups: Group[];
  matches: KnockoutMatch[];
  manualOrder: Record<string, number>;
}

interface GroupResolvedStandings {
  groupId: GroupId;
  standings: Standing[];
  complete: boolean;
}

function resolveGroupsContext(groups: Group[], manualOrder: Record<string, number>) {
  const byGroup = new Map<GroupId, GroupResolvedStandings>();
  for (const g of groups) {
    const standings = computeGroupStandings(g, manualOrder);
    const complete = g.matches.every(
      (m) => m.homeScore !== null && m.awayScore !== null,
    );
    byGroup.set(g.id, { groupId: g.id, standings, complete });
  }
  return byGroup;
}

// ----------------------------------------------------------------------------
// Resolução dos 8 melhores terceiros para os slots "3#1".."3#8".
//
// Atualmente o ranking simples é usado: o melhor terceiro vai para o slot
// 3#1, o segundo melhor para 3#2, e assim por diante.
//
// → Caso a FIFA publique uma tabela específica (como a UEFA faz na Euro), basta
//   substituir a implementação desta função SEM tocar no restante do código.
// ----------------------------------------------------------------------------
export function resolveThirdPlacedSlots(
  ranking: ThirdPlacedEntry[],
): Record<string, string> {
  const map: Record<string, string> = {};
  const qualified = ranking.filter((e) => e.qualified);
  qualified.forEach((entry, idx) => {
    map[`3#${idx + 1}`] = entry.teamId;
  });
  return map;
}

function resolveSlot(
  slot: SlotId,
  groupStandings: Map<GroupId, GroupResolvedStandings>,
  thirdsMap: Record<string, string>,
  matchesById: Map<string, KnockoutMatch>,
): string | null {
  if (/^[12][A-L]$/.test(slot)) {
    const pos = slot[0] === '1' ? 0 : 1;
    const gid = slot[1] as GroupId;
    const ctx = groupStandings.get(gid);
    if (!ctx || !ctx.complete) return null;
    const s = ctx.standings[pos];
    return s ? s.teamId : null;
  }
  if (slot.startsWith('3#')) return thirdsMap[slot] ?? null;
  if (slot.startsWith('W:') || slot.startsWith('L:')) {
    const matchId = slot.slice(2);
    const m = matchesById.get(matchId);
    if (!m) return null;
    return slot[0] === 'W' ? m.winnerTeamId : m.loserTeamId;
  }
  return null;
}

// ----------------------------------------------------------------------------
// Funções utilitárias requisitadas explicitamente.
// Permitem que componentes/visualizações decidam vencedor sem depender do
// recálculo global da chave.
// ----------------------------------------------------------------------------

export function getNormalTimeWinner(m: KnockoutMatch): string | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return m.homeTeamId;
  if (m.awayScore > m.homeScore) return m.awayTeamId;
  return null;
}

export function getExtraTimeWinner(m: KnockoutMatch): string | null {
  if (m.homeExtra === null || m.awayExtra === null) return null;
  if (m.homeScore === null || m.awayScore === null) return null;
  const h = m.homeScore + m.homeExtra;
  const a = m.awayScore + m.awayExtra;
  if (h > a) return m.homeTeamId;
  if (a > h) return m.awayTeamId;
  return null;
}

export function getPenaltyWinner(m: KnockoutMatch): string | null {
  if (m.homePens === null || m.awayPens === null) return null;
  if (m.homePens > m.awayPens) return m.homeTeamId;
  if (m.awayPens > m.homePens) return m.awayTeamId;
  return null;
}

export function needsExtraTime(m: KnockoutMatch): boolean {
  return (
    m.homeScore !== null &&
    m.awayScore !== null &&
    m.homeScore === m.awayScore
  );
}

export function needsPenalties(m: KnockoutMatch): boolean {
  if (!needsExtraTime(m)) return false;
  if (m.homeExtra === null || m.awayExtra === null) return false;
  const h = (m.homeScore ?? 0) + m.homeExtra;
  const a = (m.awayScore ?? 0) + m.awayExtra;
  return h === a;
}

/**
 * Vencedor consolidado de uma partida eliminatória.
 * Ordem de precedência:
 *   1. Decisão manual (override do usuário)
 *   2. Placar do tempo normal (se houver vencedor)
 *   3. Prorrogação (se preenchida)
 *   4. Pênaltis (se preenchidos)
 */
export function getKnockoutWinner(m: KnockoutMatch): {
  winner: string | null;
  loser: string | null;
} {
  if (!m.homeTeamId || !m.awayTeamId) return { winner: null, loser: null };

  if (m.manualWinnerTeamId) {
    const w = m.manualWinnerTeamId;
    if (w === m.homeTeamId) return { winner: m.homeTeamId, loser: m.awayTeamId };
    if (w === m.awayTeamId) return { winner: m.awayTeamId, loser: m.homeTeamId };
  }

  const normal = getNormalTimeWinner(m);
  if (normal && !needsExtraTime(m)) {
    return { winner: normal, loser: normal === m.homeTeamId ? m.awayTeamId : m.homeTeamId };
  }

  if (m.homeExtra !== null && m.awayExtra !== null) {
    const et = getExtraTimeWinner(m);
    if (et) return { winner: et, loser: et === m.homeTeamId ? m.awayTeamId : m.homeTeamId };
  }

  const pen = getPenaltyWinner(m);
  if (pen) return { winner: pen, loser: pen === m.homeTeamId ? m.awayTeamId : m.homeTeamId };

  return { winner: null, loser: null };
}

export function isKnockoutMatchResolved(m: KnockoutMatch): boolean {
  return getKnockoutWinner(m).winner !== null;
}

// Mantido por compatibilidade — apenas redireciona.
export const decideKnockoutWinner = getKnockoutWinner;

/**
 * Recalcula a chave inteira: propaga slots, identifica vencedores em cada
 * confronto e refaz a cadeia para frente.
 *
 * Se um placar anterior for alterado e gerar um confronto diferente nas fases
 * seguintes, esta função invalida os placares dos jogos afetados.
 */
export function recalculateKnockout(
  input: KnockoutResolverInput,
): { matches: KnockoutMatch[]; invalidatedIds: string[] } {
  const { groups, matches: original, manualOrder } = input;
  const groupCtx = resolveGroupsContext(groups, manualOrder);
  const thirdResult = computeThirdPlacedRanking(groups, manualOrder);
  const thirdsMap = resolveThirdPlacedSlots(thirdResult.ranking);

  const matches = original.map((m) => ({ ...m }));
  const byId = new Map(matches.map((m) => [m.id, m] as const));
  const invalidatedIds: string[] = [];

  for (const m of matches) {
    const prevHome = m.homeTeamId;
    const prevAway = m.awayTeamId;

    const newHome = resolveSlot(m.slotA, groupCtx, thirdsMap, byId);
    const newAway = resolveSlot(m.slotB, groupCtx, thirdsMap, byId);
    m.homeTeamId = newHome;
    m.awayTeamId = newAway;

    const teamsChanged =
      (prevHome !== newHome || prevAway !== newAway) &&
      (prevHome !== null || prevAway !== null);

    if (teamsChanged) {
      m.homeScore = null;
      m.awayScore = null;
      m.homeExtra = null;
      m.awayExtra = null;
      m.homePens = null;
      m.awayPens = null;
      m.manualWinnerTeamId = null;
      invalidatedIds.push(m.id);
    }

    if (!m.homeTeamId || !m.awayTeamId) {
      m.homeScore = null;
      m.awayScore = null;
      m.homeExtra = null;
      m.awayExtra = null;
      m.homePens = null;
      m.awayPens = null;
      m.winnerTeamId = null;
      m.loserTeamId = null;
      continue;
    }

    const { winner, loser } = getKnockoutWinner(m);
    m.winnerTeamId = winner;
    m.loserTeamId = loser;
  }

  return { matches: applyKnockoutSchedule(matches), invalidatedIds };
}

// ----------------------------------------------------------------------------
// Helper de exibição do placar compacto, usado em cards de mata-mata.
//   Ex.: "1 (0)" se houve prorrogação, ou "1" caso contrário.
//        Pênaltis aparecem no badge separado.
// ----------------------------------------------------------------------------

export function formatKnockoutScore(m: KnockoutMatch, side: 'home' | 'away'): {
  main: string;
  extra?: string;
  pens?: string;
} {
  const score = side === 'home' ? m.homeScore : m.awayScore;
  const extra = side === 'home' ? m.homeExtra : m.awayExtra;
  const pens  = side === 'home' ? m.homePens  : m.awayPens;
  return {
    main: score === null ? '–' : String(score),
    extra: extra === null ? undefined : `(${extra})`,
    pens:  pens === null ? undefined : `${pens}P`,
  };
}
