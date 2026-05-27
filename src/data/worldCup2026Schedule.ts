import type { GroupId } from '../types';

// ----------------------------------------------------------------------------
// Calendário OFICIAL da Copa do Mundo FIFA 2026 (EUA · México · Canadá).
//
//   Fonte: calendário oficial da FIFA, conferido via NBC Sports
//   ("2026 FIFA World Cup Schedule: confirmed dates, times, stadiums")
//   e Wikipédia (sedes/estádios). 104 jogos · 11/jun a 19/jul/2026.
//
//   ── FUSO HORÁRIO ──────────────────────────────────────────────────────────
//   Todos os horários abaixo estão em HORÁRIO DE BRASÍLIA (BRT, UTC−3).
//   A fonte publica em horário do Leste dos EUA (ET = EDT, UTC−4 em jun/jul);
//   a conversão aplicada foi BRT = ET + 1 hora (com avanço de data quando o
//   horário ultrapassa a meia-noite). A interface exibe a etiqueta
//   "Horários de Brasília".
//
//   ── COMO É USADO ──────────────────────────────────────────────────────────
//   • OFFICIAL_GROUP_SCHEDULE: lista, por grupo, os 6 confrontos com a dupla
//     de seleções (ids), a rodada oficial (matchday), data, hora, cidade e
//     estádio. `applyGroupSchedule` (em schedule.ts) casa cada partida gerada
//     pelo round-robin com a entrada cujo PAR de seleções coincide — então os
//     metadados ficam corretos independentemente da ordem de geração.
//   • OFFICIAL_KO_SCHEDULE: mapeia os ids do chaveamento do projeto (M01–M32)
//     para data/hora/cidade/estádio oficiais. O nº oficial da FIFA é o id do
//     projeto + 72 (M01→M73 … M32→M104).
//
//   Para corrigir qualquer dado, edite SOMENTE este arquivo.
// ----------------------------------------------------------------------------

export interface OfficialGroupMatch {
  /** Par de seleções (ids do projeto), em qualquer ordem. */
  teams: [string, string];
  /** Rodada oficial (matchday) 1, 2 ou 3. */
  matchday: 1 | 2 | 3;
  date: string;     // ISO yyyy-mm-dd (horário de Brasília)
  time: string;     // HH:mm (horário de Brasília)
  city: string;
  stadium: string;
}

export interface OfficialKoSlot {
  date: string;
  time: string;
  city: string;
  stadium: string;
}

// ── Estádios e cidades (nomes oficiais / pt-BR consistente) ─────────────────
const AZTECA   = 'Estádio Azteca';
const AKRON    = 'Estádio Akron';
const BBVA     = 'Estádio BBVA';
const MERCEDES = 'Mercedes-Benz Stadium';
const METLIFE  = 'MetLife Stadium';
const ATT      = 'AT&T Stadium';
const NRG      = 'NRG Stadium';
const ARROWHEAD= 'Arrowhead Stadium';
const SOFI     = 'SoFi Stadium';
const HARDROCK = 'Hard Rock Stadium';
const LINCOLN  = 'Lincoln Financial Field';
const LEVIS    = "Levi's Stadium";
const LUMEN    = 'Lumen Field';
const GILLETTE = 'Gillette Stadium';
const BMO      = 'BMO Field';
const BCPLACE  = 'BC Place';

const CDMX   = 'Cidade do México';
const GDL    = 'Guadalajara';
const MTY    = 'Monterrey';
const ATL    = 'Atlanta';
const NYNJ   = 'Nova York/Nova Jersey';
const BOS    = 'Boston';
const PHI    = 'Filadélfia';
const MIA    = 'Miami';
const DAL    = 'Dallas';
const HOU    = 'Houston';
const KC     = 'Kansas City';
const LA     = 'Los Angeles';
const SF     = 'São Francisco';
const SEA    = 'Seattle';
const TOR    = 'Toronto';
const VAN    = 'Vancouver';

// ----------------------------------------------------------------------------
// Fase de grupos — 72 jogos
// ----------------------------------------------------------------------------

export const OFFICIAL_GROUP_SCHEDULE: Record<GroupId, OfficialGroupMatch[]> = {
  A: [
    { teams: ['MEX', 'RSA'], matchday: 1, date: '2026-06-11', time: '16:00', city: CDMX, stadium: AZTECA },
    { teams: ['KOR', 'CZE'], matchday: 1, date: '2026-06-11', time: '23:00', city: GDL,  stadium: AKRON },
    { teams: ['CZE', 'RSA'], matchday: 2, date: '2026-06-18', time: '13:00', city: ATL,  stadium: MERCEDES },
    { teams: ['MEX', 'KOR'], matchday: 2, date: '2026-06-18', time: '22:00', city: GDL,  stadium: AKRON },
    { teams: ['CZE', 'MEX'], matchday: 3, date: '2026-06-24', time: '22:00', city: CDMX, stadium: AZTECA },
    { teams: ['RSA', 'KOR'], matchday: 3, date: '2026-06-24', time: '22:00', city: MTY,  stadium: BBVA },
  ],
  B: [
    { teams: ['CAN', 'BIH'], matchday: 1, date: '2026-06-12', time: '16:00', city: TOR, stadium: BMO },
    { teams: ['QAT', 'SUI'], matchday: 1, date: '2026-06-13', time: '16:00', city: SF,  stadium: LEVIS },
    { teams: ['SUI', 'BIH'], matchday: 2, date: '2026-06-18', time: '16:00', city: LA,  stadium: SOFI },
    { teams: ['CAN', 'QAT'], matchday: 2, date: '2026-06-18', time: '19:00', city: VAN, stadium: BCPLACE },
    { teams: ['SUI', 'CAN'], matchday: 3, date: '2026-06-24', time: '16:00', city: VAN, stadium: BCPLACE },
    { teams: ['BIH', 'QAT'], matchday: 3, date: '2026-06-24', time: '16:00', city: SEA, stadium: LUMEN },
  ],
  C: [
    { teams: ['BRA', 'MAR'], matchday: 1, date: '2026-06-13', time: '19:00', city: NYNJ, stadium: METLIFE },
    { teams: ['HAI', 'SCO'], matchday: 1, date: '2026-06-13', time: '22:00', city: BOS,  stadium: GILLETTE },
    { teams: ['SCO', 'MAR'], matchday: 2, date: '2026-06-19', time: '19:00', city: BOS,  stadium: GILLETTE },
    { teams: ['BRA', 'HAI'], matchday: 2, date: '2026-06-19', time: '22:00', city: PHI,  stadium: LINCOLN },
    { teams: ['SCO', 'BRA'], matchday: 3, date: '2026-06-24', time: '19:00', city: MIA,  stadium: HARDROCK },
    { teams: ['MAR', 'HAI'], matchday: 3, date: '2026-06-24', time: '19:00', city: ATL,  stadium: MERCEDES },
  ],
  D: [
    { teams: ['USA', 'PAR'], matchday: 1, date: '2026-06-12', time: '22:00', city: LA,  stadium: SOFI },
    { teams: ['AUS', 'TUR'], matchday: 1, date: '2026-06-13', time: '01:00', city: VAN, stadium: BCPLACE },
    { teams: ['TUR', 'PAR'], matchday: 2, date: '2026-06-19', time: '01:00', city: SF,  stadium: LEVIS },
    { teams: ['USA', 'AUS'], matchday: 2, date: '2026-06-19', time: '16:00', city: SEA, stadium: LUMEN },
    { teams: ['TUR', 'USA'], matchday: 3, date: '2026-06-25', time: '23:00', city: LA,  stadium: SOFI },
    { teams: ['PAR', 'AUS'], matchday: 3, date: '2026-06-25', time: '23:00', city: SF,  stadium: LEVIS },
  ],
  E: [
    { teams: ['GER', 'CUW'], matchday: 1, date: '2026-06-14', time: '14:00', city: HOU, stadium: NRG },
    { teams: ['CIV', 'ECU'], matchday: 1, date: '2026-06-14', time: '20:00', city: PHI, stadium: LINCOLN },
    { teams: ['GER', 'CIV'], matchday: 2, date: '2026-06-20', time: '17:00', city: TOR, stadium: BMO },
    { teams: ['ECU', 'CUW'], matchday: 2, date: '2026-06-20', time: '21:00', city: KC,  stadium: ARROWHEAD },
    { teams: ['ECU', 'GER'], matchday: 3, date: '2026-06-25', time: '17:00', city: NYNJ, stadium: METLIFE },
    { teams: ['CUW', 'CIV'], matchday: 3, date: '2026-06-25', time: '17:00', city: PHI,  stadium: LINCOLN },
  ],
  F: [
    { teams: ['NED', 'JPN'], matchday: 1, date: '2026-06-14', time: '17:00', city: DAL, stadium: ATT },
    { teams: ['SWE', 'TUN'], matchday: 1, date: '2026-06-14', time: '23:00', city: MTY, stadium: BBVA },
    { teams: ['TUN', 'JPN'], matchday: 2, date: '2026-06-20', time: '01:00', city: MTY, stadium: BBVA },
    { teams: ['NED', 'SWE'], matchday: 2, date: '2026-06-20', time: '14:00', city: HOU, stadium: NRG },
    { teams: ['JPN', 'SWE'], matchday: 3, date: '2026-06-25', time: '20:00', city: DAL, stadium: ATT },
    { teams: ['TUN', 'NED'], matchday: 3, date: '2026-06-25', time: '20:00', city: KC,  stadium: ARROWHEAD },
  ],
  G: [
    { teams: ['BEL', 'EGY'], matchday: 1, date: '2026-06-15', time: '16:00', city: SEA, stadium: LUMEN },
    { teams: ['IRN', 'NZL'], matchday: 1, date: '2026-06-15', time: '22:00', city: LA,  stadium: SOFI },
    { teams: ['BEL', 'IRN'], matchday: 2, date: '2026-06-21', time: '16:00', city: LA,  stadium: SOFI },
    { teams: ['NZL', 'EGY'], matchday: 2, date: '2026-06-21', time: '22:00', city: VAN, stadium: BCPLACE },
    { teams: ['EGY', 'IRN'], matchday: 3, date: '2026-06-27', time: '00:00', city: SEA, stadium: LUMEN },
    { teams: ['NZL', 'BEL'], matchday: 3, date: '2026-06-27', time: '00:00', city: VAN, stadium: BCPLACE },
  ],
  H: [
    { teams: ['ESP', 'CPV'], matchday: 1, date: '2026-06-15', time: '13:00', city: ATL, stadium: MERCEDES },
    { teams: ['KSA', 'URU'], matchday: 1, date: '2026-06-15', time: '19:00', city: MIA, stadium: HARDROCK },
    { teams: ['ESP', 'KSA'], matchday: 2, date: '2026-06-21', time: '13:00', city: ATL, stadium: MERCEDES },
    { teams: ['URU', 'CPV'], matchday: 2, date: '2026-06-21', time: '19:00', city: MIA, stadium: HARDROCK },
    { teams: ['CPV', 'KSA'], matchday: 3, date: '2026-06-26', time: '21:00', city: HOU, stadium: NRG },
    { teams: ['URU', 'ESP'], matchday: 3, date: '2026-06-26', time: '21:00', city: GDL, stadium: AKRON },
  ],
  I: [
    { teams: ['FRA', 'SEN'], matchday: 1, date: '2026-06-16', time: '16:00', city: NYNJ, stadium: METLIFE },
    { teams: ['IRQ', 'NOR'], matchday: 1, date: '2026-06-16', time: '19:00', city: BOS,  stadium: GILLETTE },
    { teams: ['FRA', 'IRQ'], matchday: 2, date: '2026-06-22', time: '18:00', city: PHI,  stadium: LINCOLN },
    { teams: ['NOR', 'SEN'], matchday: 2, date: '2026-06-22', time: '21:00', city: NYNJ, stadium: METLIFE },
    { teams: ['NOR', 'FRA'], matchday: 3, date: '2026-06-26', time: '16:00', city: BOS,  stadium: GILLETTE },
    { teams: ['SEN', 'IRQ'], matchday: 3, date: '2026-06-26', time: '16:00', city: TOR,  stadium: BMO },
  ],
  J: [
    { teams: ['AUT', 'JOR'], matchday: 1, date: '2026-06-16', time: '01:00', city: SF,  stadium: LEVIS },
    { teams: ['ARG', 'ALG'], matchday: 1, date: '2026-06-16', time: '22:00', city: KC,  stadium: ARROWHEAD },
    { teams: ['ARG', 'AUT'], matchday: 2, date: '2026-06-22', time: '14:00', city: DAL, stadium: ATT },
    { teams: ['JOR', 'ALG'], matchday: 2, date: '2026-06-23', time: '00:00', city: SF,  stadium: LEVIS },
    { teams: ['ALG', 'AUT'], matchday: 3, date: '2026-06-27', time: '23:00', city: KC,  stadium: ARROWHEAD },
    { teams: ['JOR', 'ARG'], matchday: 3, date: '2026-06-27', time: '23:00', city: DAL, stadium: ATT },
  ],
  K: [
    { teams: ['POR', 'COD'], matchday: 1, date: '2026-06-17', time: '14:00', city: HOU,  stadium: NRG },
    { teams: ['UZB', 'COL'], matchday: 1, date: '2026-06-17', time: '23:00', city: CDMX, stadium: AZTECA },
    { teams: ['POR', 'UZB'], matchday: 2, date: '2026-06-23', time: '14:00', city: HOU,  stadium: NRG },
    { teams: ['COL', 'COD'], matchday: 2, date: '2026-06-23', time: '23:00', city: GDL,  stadium: AKRON },
    { teams: ['COL', 'POR'], matchday: 3, date: '2026-06-27', time: '20:30', city: MIA,  stadium: HARDROCK },
    { teams: ['COD', 'UZB'], matchday: 3, date: '2026-06-27', time: '20:30', city: ATL,  stadium: MERCEDES },
  ],
  L: [
    { teams: ['ENG', 'CRO'], matchday: 1, date: '2026-06-17', time: '17:00', city: DAL,  stadium: ATT },
    { teams: ['GHA', 'PAN'], matchday: 1, date: '2026-06-17', time: '20:00', city: TOR,  stadium: BMO },
    { teams: ['ENG', 'GHA'], matchday: 2, date: '2026-06-23', time: '17:00', city: BOS,  stadium: GILLETTE },
    { teams: ['PAN', 'CRO'], matchday: 2, date: '2026-06-23', time: '20:00', city: TOR,  stadium: BMO },
    { teams: ['PAN', 'ENG'], matchday: 3, date: '2026-06-27', time: '18:00', city: NYNJ, stadium: METLIFE },
    { teams: ['CRO', 'GHA'], matchday: 3, date: '2026-06-27', time: '18:00', city: PHI,  stadium: LINCOLN },
  ],
};

// ----------------------------------------------------------------------------
// Mata-mata — ids do projeto (M01–M32). Nº oficial FIFA = id do projeto + 72.
// ----------------------------------------------------------------------------

export const OFFICIAL_KO_SCHEDULE: Record<string, OfficialKoSlot> = {
  // Rodada de 32 (M73–M88) → projeto M01–M16
  M01: { date: '2026-06-28', time: '16:00', city: LA,   stadium: SOFI },
  M02: { date: '2026-06-29', time: '17:30', city: BOS,  stadium: GILLETTE },
  M03: { date: '2026-06-29', time: '22:00', city: MTY,  stadium: BBVA },
  M04: { date: '2026-06-29', time: '14:00', city: HOU,  stadium: NRG },
  M05: { date: '2026-06-30', time: '18:00', city: NYNJ, stadium: METLIFE },
  M06: { date: '2026-06-30', time: '14:00', city: DAL,  stadium: ATT },
  M07: { date: '2026-06-30', time: '22:00', city: CDMX, stadium: AZTECA },
  M08: { date: '2026-07-01', time: '13:00', city: ATL,  stadium: MERCEDES },
  M09: { date: '2026-07-01', time: '21:00', city: SF,   stadium: LEVIS },
  M10: { date: '2026-07-01', time: '17:00', city: SEA,  stadium: LUMEN },
  M11: { date: '2026-07-02', time: '20:00', city: TOR,  stadium: BMO },
  M12: { date: '2026-07-02', time: '16:00', city: LA,   stadium: SOFI },
  M13: { date: '2026-07-03', time: '00:00', city: VAN,  stadium: BCPLACE },
  M14: { date: '2026-07-03', time: '19:00', city: MIA,  stadium: HARDROCK },
  M15: { date: '2026-07-03', time: '22:30', city: KC,   stadium: ARROWHEAD },
  M16: { date: '2026-07-03', time: '15:00', city: DAL,  stadium: ATT },

  // Oitavas (M89–M96) → projeto M17–M24
  M17: { date: '2026-07-04', time: '18:00', city: PHI,  stadium: LINCOLN },
  M18: { date: '2026-07-04', time: '14:00', city: HOU,  stadium: NRG },
  M19: { date: '2026-07-05', time: '17:00', city: NYNJ, stadium: METLIFE },
  M20: { date: '2026-07-05', time: '21:00', city: CDMX, stadium: AZTECA },
  M21: { date: '2026-07-06', time: '16:00', city: DAL,  stadium: ATT },
  M22: { date: '2026-07-06', time: '21:00', city: SEA,  stadium: LUMEN },
  M23: { date: '2026-07-07', time: '13:00', city: ATL,  stadium: MERCEDES },
  M24: { date: '2026-07-07', time: '17:00', city: VAN,  stadium: BCPLACE },

  // Quartas (M97–M100) → projeto M25–M28
  M25: { date: '2026-07-09', time: '17:00', city: BOS,  stadium: GILLETTE },
  M26: { date: '2026-07-10', time: '16:00', city: LA,   stadium: SOFI },
  M27: { date: '2026-07-11', time: '18:00', city: MIA,  stadium: HARDROCK },
  M28: { date: '2026-07-11', time: '22:00', city: KC,   stadium: ARROWHEAD },

  // Semifinais (M101–M102) → projeto M29–M30
  M29: { date: '2026-07-14', time: '16:00', city: DAL,  stadium: ATT },
  M30: { date: '2026-07-15', time: '16:00', city: ATL,  stadium: MERCEDES },

  // Disputa de 3º lugar (M103) → projeto M31
  M31: { date: '2026-07-18', time: '18:00', city: MIA,  stadium: HARDROCK },

  // Final (M104) → projeto M32
  M32: { date: '2026-07-19', time: '16:00', city: NYNJ, stadium: METLIFE },
};

/** Casa um par de seleções (ids, qualquer ordem) com a entrada oficial do grupo. */
export function findOfficialGroupMatch(
  groupId: GroupId,
  teamA: string,
  teamB: string,
): OfficialGroupMatch | undefined {
  const list = OFFICIAL_GROUP_SCHEDULE[groupId];
  if (!list) return undefined;
  return list.find(
    (m) =>
      (m.teams[0] === teamA && m.teams[1] === teamB) ||
      (m.teams[0] === teamB && m.teams[1] === teamA),
  );
}
