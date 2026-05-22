import type { GroupId, KnockoutMatch, Match } from '../types';

// ----------------------------------------------------------------------------
// Calendário de referência da Copa do Mundo FIFA 2026.
//
//   - As datas são plausíveis (Jun 11 – Jul 19 de 2026), mas servem apenas
//     como base para a seção "Próximas partidas". Para alterar/atualizar:
//     edite `GROUP_SCHEDULE` (fase de grupos) ou `KO_SCHEDULE` (mata-mata).
//
//   - Cada grupo joga 3 rodadas. Na rodada 3 os 2 jogos acontecem ao mesmo
//     tempo, conforme a tradição de Copas do Mundo.
// ----------------------------------------------------------------------------

interface RoundSlot {
  date: string;   // ISO yyyy-mm-dd
  times: [string, string]; // 2 jogos da rodada
  stadium?: [string, string];
  city?: [string, string];
}

interface GroupSchedule {
  round1: RoundSlot;
  round2: RoundSlot;
  round3: RoundSlot;
}

// Datas escolhidas para distribuir 12 grupos × 3 rodadas em ~16 dias.
const GROUP_SCHEDULE: Record<GroupId, GroupSchedule> = {
  A: {
    round1: { date: '2026-06-11', times: ['13:00', '16:00'], city: ['Cidade do México', 'Cidade do México'] },
    round2: { date: '2026-06-16', times: ['13:00', '16:00'] },
    round3: { date: '2026-06-22', times: ['17:00', '17:00'] },
  },
  B: {
    round1: { date: '2026-06-11', times: ['19:00', '22:00'], city: ['Toronto', 'Vancouver'] },
    round2: { date: '2026-06-17', times: ['13:00', '16:00'] },
    round3: { date: '2026-06-23', times: ['17:00', '17:00'] },
  },
  C: {
    round1: { date: '2026-06-12', times: ['13:00', '16:00'], city: ['Filadélfia', 'Atlanta'] },
    round2: { date: '2026-06-17', times: ['19:00', '22:00'] },
    round3: { date: '2026-06-23', times: ['21:00', '21:00'] },
  },
  D: {
    round1: { date: '2026-06-12', times: ['19:00', '22:00'], city: ['Boston', 'Miami'] },
    round2: { date: '2026-06-18', times: ['13:00', '16:00'] },
    round3: { date: '2026-06-24', times: ['17:00', '17:00'] },
  },
  E: {
    round1: { date: '2026-06-13', times: ['13:00', '16:00'], city: ['Dallas', 'Houston'] },
    round2: { date: '2026-06-18', times: ['19:00', '22:00'] },
    round3: { date: '2026-06-24', times: ['21:00', '21:00'] },
  },
  F: {
    round1: { date: '2026-06-13', times: ['19:00', '22:00'], city: ['Kansas City', 'Los Angeles'] },
    round2: { date: '2026-06-19', times: ['13:00', '16:00'] },
    round3: { date: '2026-06-25', times: ['17:00', '17:00'] },
  },
  G: {
    round1: { date: '2026-06-14', times: ['13:00', '16:00'], city: ['Seattle', 'São Francisco'] },
    round2: { date: '2026-06-19', times: ['19:00', '22:00'] },
    round3: { date: '2026-06-25', times: ['21:00', '21:00'] },
  },
  H: {
    round1: { date: '2026-06-14', times: ['19:00', '22:00'], city: ['Nova York', 'Nashville'] },
    round2: { date: '2026-06-20', times: ['13:00', '16:00'] },
    round3: { date: '2026-06-26', times: ['17:00', '17:00'] },
  },
  I: {
    round1: { date: '2026-06-15', times: ['13:00', '16:00'], city: ['Monterrey', 'Guadalajara'] },
    round2: { date: '2026-06-20', times: ['19:00', '22:00'] },
    round3: { date: '2026-06-26', times: ['21:00', '21:00'] },
  },
  J: {
    round1: { date: '2026-06-15', times: ['19:00', '22:00'], city: ['Toronto', 'Vancouver'] },
    round2: { date: '2026-06-21', times: ['13:00', '16:00'] },
    round3: { date: '2026-06-27', times: ['17:00', '17:00'] },
  },
  K: {
    round1: { date: '2026-06-16', times: ['19:00', '22:00'], city: ['Filadélfia', 'Atlanta'] },
    round2: { date: '2026-06-21', times: ['19:00', '22:00'] },
    round3: { date: '2026-06-27', times: ['21:00', '21:00'] },
  },
  L: {
    round1: { date: '2026-06-12', times: ['10:00', '13:00'], city: ['Cidade do México', 'Monterrey'] },
    round2: { date: '2026-06-18', times: ['10:00', '13:00'] },
    round3: { date: '2026-06-22', times: ['21:00', '21:00'] },
  },
};

/**
 * Aplica datas/horários aos 6 jogos do grupo conforme `GROUP_SCHEDULE`.
 *   Ordem dos confrontos gerada por generateGroupFixtures():
 *     [0,1] rodada 1 jogo A   [2,3] rodada 1 jogo B
 *     [4,5] rodada 2 jogo A   [6,7] rodada 2 jogo B
 *     [8,9] rodada 3 jogo A   [10,11] rodada 3 jogo B
 *   → Mas cada partida ocupa 1 índice no array → 6 partidas no total.
 */
export function applyGroupSchedule(groupId: GroupId, matches: Match[]): Match[] {
  const sched = GROUP_SCHEDULE[groupId];
  // 2 jogos por rodada → 6 jogos no total
  const rounds = [sched.round1, sched.round2, sched.round3];
  return matches.map((m, i) => {
    const roundIdx = Math.floor(i / 2); // 0,0,1,1,2,2
    const gameIdx = i % 2;              // 0,1
    const round = rounds[roundIdx];
    return {
      ...m,
      date: round.date,
      time: round.times[gameIdx],
      city: round.city?.[gameIdx],
      stage: `Grupo ${groupId} — Rodada ${roundIdx + 1}`,
    };
  });
}

// ----------------------------------------------------------------------------
// Calendário do mata-mata. Aplicado pelo recalculateKnockout() em knockout.ts.
// ----------------------------------------------------------------------------

interface KOSlot { date: string; time: string; }

export const KO_SCHEDULE: Record<string, KOSlot> = {
  // Rodada de 32 (28 de junho a 3 de julho)
  M01: { date: '2026-06-28', time: '13:00' },
  M02: { date: '2026-06-28', time: '17:00' },
  M03: { date: '2026-06-29', time: '13:00' },
  M04: { date: '2026-06-29', time: '17:00' },
  M05: { date: '2026-06-30', time: '13:00' },
  M06: { date: '2026-06-30', time: '17:00' },
  M07: { date: '2026-07-01', time: '13:00' },
  M08: { date: '2026-07-01', time: '17:00' },
  M09: { date: '2026-07-02', time: '13:00' },
  M10: { date: '2026-07-02', time: '17:00' },
  M11: { date: '2026-07-02', time: '21:00' },
  M12: { date: '2026-07-03', time: '13:00' },
  M13: { date: '2026-07-03', time: '17:00' },
  M14: { date: '2026-07-03', time: '21:00' },
  M15: { date: '2026-07-04', time: '13:00' },
  M16: { date: '2026-07-04', time: '17:00' },
  // Oitavas (4 a 7 de julho)
  M17: { date: '2026-07-05', time: '13:00' },
  M18: { date: '2026-07-05', time: '17:00' },
  M19: { date: '2026-07-06', time: '13:00' },
  M20: { date: '2026-07-06', time: '17:00' },
  M21: { date: '2026-07-07', time: '13:00' },
  M22: { date: '2026-07-07', time: '17:00' },
  M23: { date: '2026-07-08', time: '13:00' },
  M24: { date: '2026-07-08', time: '17:00' },
  // Quartas (9 a 11 de julho)
  M25: { date: '2026-07-09', time: '17:00' },
  M26: { date: '2026-07-09', time: '21:00' },
  M27: { date: '2026-07-11', time: '17:00' },
  M28: { date: '2026-07-11', time: '21:00' },
  // Semifinais
  M29: { date: '2026-07-14', time: '17:00' },
  M30: { date: '2026-07-15', time: '17:00' },
  // Disputa de 3º lugar
  M31: { date: '2026-07-18', time: '17:00' },
  // Final
  M32: { date: '2026-07-19', time: '16:00' },
};

export function applyKnockoutSchedule(matches: KnockoutMatch[]): KnockoutMatch[] {
  return matches.map((m) => {
    const slot = KO_SCHEDULE[m.id];
    if (!slot) return m;
    return { ...m, date: slot.date, time: slot.time };
  });
}

// ----------------------------------------------------------------------------
// Formatadores
// ----------------------------------------------------------------------------

const DAY_FMT = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function formatLongDate(iso?: string): string {
  if (!iso) return 'Data a definir';
  try {
    const d = new Date(iso + 'T00:00:00');
    const formatted = DAY_FMT.format(d);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return iso;
  }
}

export function compareSchedule(
  a: { date?: string; time?: string },
  b: { date?: string; time?: string },
): number {
  const da = a.date ?? '9999-12-31';
  const db = b.date ?? '9999-12-31';
  if (da !== db) return da.localeCompare(db);
  const ta = a.time ?? '99:99';
  const tb = b.time ?? '99:99';
  return ta.localeCompare(tb);
}
