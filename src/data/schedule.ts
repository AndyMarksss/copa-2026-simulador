import type { GroupId, KnockoutMatch, Match } from '../types';
import {
  OFFICIAL_KO_SCHEDULE,
  findOfficialGroupMatch,
} from './worldCup2026Schedule';

// ----------------------------------------------------------------------------
// Calendário da Copa do Mundo FIFA 2026.
//
//   Os dados OFICIAIS (datas, horários, cidades, estádios) ficam centralizados
//   em `worldCup2026Schedule.ts`. Este arquivo apenas APLICA esses dados às
//   partidas geradas pelo projeto. Todos os horários estão em horário de
//   Brasília (BRT, UTC−3) — ver detalhes no arquivo de dados.
// ----------------------------------------------------------------------------

/**
 * Aplica data/hora/cidade/estádio/rodada oficiais a cada jogo do grupo.
 *
 * Em vez de mapear por posição no array (a ordem do round-robin do projeto NÃO
 * corresponde às rodadas oficiais da FIFA), casamos cada partida pelo PAR de
 * seleções — assim os metadados ficam corretos para cada confronto específico.
 * Ao final, ordenamos as partidas por data/hora para que a exibição em blocos
 * de "Rodada" (no GroupCard) reflita as rodadas oficiais (matchdays).
 *
 * Os ids das partidas (G-X-N) e a orientação mandante/visitante são preservados
 * — então placares salvos no localStorage continuam casando por id.
 */
export function applyGroupSchedule(groupId: GroupId, matches: Match[]): Match[] {
  const withMeta = matches.map((m) => {
    const official = findOfficialGroupMatch(groupId, m.homeTeamId, m.awayTeamId);
    if (!official) return m; // fallback defensivo — não deve ocorrer
    return {
      ...m,
      date: official.date,
      time: official.time,
      city: official.city,
      stadium: official.stadium,
      stage: `Grupo ${groupId} — Rodada ${official.matchday}`,
    };
  });

  // Ordena cronologicamente (data, depois hora) preservando ids/placares.
  return withMeta.sort(compareSchedule);
}

// ----------------------------------------------------------------------------
// Calendário do mata-mata. Aplicado pelo recalculateKnockout() em knockout.ts
// e na carga inicial (useTournament).
// ----------------------------------------------------------------------------

export function applyKnockoutSchedule(matches: KnockoutMatch[]): KnockoutMatch[] {
  return matches.map((m) => {
    const slot = OFFICIAL_KO_SCHEDULE[m.id];
    if (!slot) return m;
    return {
      ...m,
      date: slot.date,
      time: slot.time,
      city: slot.city,
      stadium: slot.stadium,
    };
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
