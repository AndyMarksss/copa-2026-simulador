import type { Group, GroupId, Team } from '../types';
import { generateGroupFixtures } from '../logic/matches';
import { applyGroupSchedule } from './schedule';

// ----------------------------------------------------------------------------
// Dados iniciais dos 12 grupos da Copa do Mundo 2026.
//
//   flagCode usa o padrão da biblioteca flag-icons:
//     - ISO Alpha-2 (ex.: "br", "fr")
//     - Regiões do Reino Unido: "gb-eng", "gb-sct", "gb-wls", "gb-nir"
//
//   Para alterar nomes, bandeiras ou ranking, basta editar abaixo.
// ----------------------------------------------------------------------------

type TeamSeed = Omit<Team, 'groupId' | 'fairPlay'> & { fairPlay?: number };

const GROUP_SEED: Record<GroupId, TeamSeed[]> = {
  A: [
    { id: 'MEX', name: 'México',        code: 'MEX', flag: '🇲🇽', flagCode: 'mx', fifaRank: 19 },
    { id: 'RSA', name: 'África do Sul', code: 'RSA', flag: '🇿🇦', flagCode: 'za', fifaRank: 56 },
    { id: 'KOR', name: 'Coreia do Sul', code: 'KOR', flag: '🇰🇷', flagCode: 'kr', fifaRank: 22 },
    { id: 'CZE', name: 'Tchéquia',      code: 'CZE', flag: '🇨🇿', flagCode: 'cz', fifaRank: 36 },
  ],
  B: [
    { id: 'CAN', name: 'Canadá',                code: 'CAN', flag: '🇨🇦', flagCode: 'ca', fifaRank: 30 },
    { id: 'SUI', name: 'Suíça',                 code: 'SUI', flag: '🇨🇭', flagCode: 'ch', fifaRank: 18 },
    { id: 'QAT', name: 'Catar',                 code: 'QAT', flag: '🇶🇦', flagCode: 'qa', fifaRank: 53 },
    { id: 'BIH', name: 'Bósnia e Herzegovina',  code: 'BIH', flag: '🇧🇦', flagCode: 'ba', fifaRank: 67 },
  ],
  C: [
    { id: 'BRA', name: 'Brasil',   code: 'BRA', flag: '🇧🇷', flagCode: 'br',     fifaRank: 5  },
    { id: 'MAR', name: 'Marrocos', code: 'MAR', flag: '🇲🇦', flagCode: 'ma',     fifaRank: 14 },
    { id: 'SCO', name: 'Escócia',  code: 'SCO', flag: '🏴',   flagCode: 'gb-sct', fifaRank: 38 },
    { id: 'HAI', name: 'Haiti',    code: 'HAI', flag: '🇭🇹', flagCode: 'ht',     fifaRank: 82 },
  ],
  D: [
    { id: 'USA', name: 'Estados Unidos', code: 'USA', flag: '🇺🇸', flagCode: 'us', fifaRank: 16 },
    { id: 'PAR', name: 'Paraguai',       code: 'PAR', flag: '🇵🇾', flagCode: 'py', fifaRank: 43 },
    { id: 'AUS', name: 'Austrália',      code: 'AUS', flag: '🇦🇺', flagCode: 'au', fifaRank: 24 },
    { id: 'TUR', name: 'Turquia',        code: 'TUR', flag: '🇹🇷', flagCode: 'tr', fifaRank: 27 },
  ],
  E: [
    { id: 'GER', name: 'Alemanha',         code: 'GER', flag: '🇩🇪', flagCode: 'de', fifaRank: 9  },
    { id: 'ECU', name: 'Equador',          code: 'ECU', flag: '🇪🇨', flagCode: 'ec', fifaRank: 23 },
    { id: 'CIV', name: 'Costa do Marfim',  code: 'CIV', flag: '🇨🇮', flagCode: 'ci', fifaRank: 39 },
    { id: 'CUW', name: 'Curaçao',          code: 'CUW', flag: '🇨🇼', flagCode: 'cw', fifaRank: 88 },
  ],
  F: [
    { id: 'NED', name: 'Países Baixos', code: 'NED', flag: '🇳🇱', flagCode: 'nl', fifaRank: 7  },
    { id: 'JPN', name: 'Japão',         code: 'JPN', flag: '🇯🇵', flagCode: 'jp', fifaRank: 15 },
    { id: 'TUN', name: 'Tunísia',       code: 'TUN', flag: '🇹🇳', flagCode: 'tn', fifaRank: 48 },
    { id: 'SWE', name: 'Suécia',        code: 'SWE', flag: '🇸🇪', flagCode: 'se', fifaRank: 41 },
  ],
  G: [
    { id: 'BEL', name: 'Bélgica',        code: 'BEL', flag: '🇧🇪', flagCode: 'be', fifaRank: 8  },
    { id: 'IRN', name: 'Irã',            code: 'IRN', flag: '🇮🇷', flagCode: 'ir', fifaRank: 20 },
    { id: 'EGY', name: 'Egito',          code: 'EGY', flag: '🇪🇬', flagCode: 'eg', fifaRank: 33 },
    { id: 'NZL', name: 'Nova Zelândia',  code: 'NZL', flag: '🇳🇿', flagCode: 'nz', fifaRank: 86 },
  ],
  H: [
    { id: 'ESP', name: 'Espanha',          code: 'ESP', flag: '🇪🇸', flagCode: 'es', fifaRank: 3  },
    { id: 'URU', name: 'Uruguai',          code: 'URU', flag: '🇺🇾', flagCode: 'uy', fifaRank: 11 },
    { id: 'KSA', name: 'Arábia Saudita',   code: 'KSA', flag: '🇸🇦', flagCode: 'sa', fifaRank: 60 },
    { id: 'CPV', name: 'Cabo Verde',       code: 'CPV', flag: '🇨🇻', flagCode: 'cv', fifaRank: 73 },
  ],
  I: [
    { id: 'FRA', name: 'França',  code: 'FRA', flag: '🇫🇷', flagCode: 'fr', fifaRank: 2  },
    { id: 'SEN', name: 'Senegal', code: 'SEN', flag: '🇸🇳', flagCode: 'sn', fifaRank: 17 },
    { id: 'NOR', name: 'Noruega', code: 'NOR', flag: '🇳🇴', flagCode: 'no', fifaRank: 35 },
    { id: 'IRQ', name: 'Iraque',  code: 'IRQ', flag: '🇮🇶', flagCode: 'iq', fifaRank: 58 },
  ],
  J: [
    { id: 'ARG', name: 'Argentina', code: 'ARG', flag: '🇦🇷', flagCode: 'ar', fifaRank: 1  },
    { id: 'AUT', name: 'Áustria',   code: 'AUT', flag: '🇦🇹', flagCode: 'at', fifaRank: 26 },
    { id: 'ALG', name: 'Argélia',   code: 'ALG', flag: '🇩🇿', flagCode: 'dz', fifaRank: 34 },
    { id: 'JOR', name: 'Jordânia',  code: 'JOR', flag: '🇯🇴', flagCode: 'jo', fifaRank: 64 },
  ],
  K: [
    { id: 'POR', name: 'Portugal',     code: 'POR', flag: '🇵🇹', flagCode: 'pt', fifaRank: 6  },
    { id: 'COL', name: 'Colômbia',     code: 'COL', flag: '🇨🇴', flagCode: 'co', fifaRank: 13 },
    { id: 'UZB', name: 'Uzbequistão',  code: 'UZB', flag: '🇺🇿', flagCode: 'uz', fifaRank: 57 },
    { id: 'COD', name: 'RD Congo',     code: 'COD', flag: '🇨🇩', flagCode: 'cd', fifaRank: 59 },
  ],
  L: [
    { id: 'ENG', name: 'Inglaterra', code: 'ENG', flag: '🏴', flagCode: 'gb-eng', fifaRank: 4  },
    { id: 'CRO', name: 'Croácia',    code: 'CRO', flag: '🇭🇷', flagCode: 'hr',    fifaRank: 10 },
    { id: 'PAN', name: 'Panamá',     code: 'PAN', flag: '🇵🇦', flagCode: 'pa',    fifaRank: 42 },
    { id: 'GHA', name: 'Gana',       code: 'GHA', flag: '🇬🇭', flagCode: 'gh',    fifaRank: 76 },
  ],
};

export const GROUP_IDS: GroupId[] = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export function createInitialGroups(): Group[] {
  return GROUP_IDS.map((groupId) => {
    const teams: Team[] = GROUP_SEED[groupId].map((t) => ({
      ...t,
      groupId,
      fairPlay: t.fairPlay ?? 0,
    }));
    const matches = applyGroupSchedule(groupId, generateGroupFixtures(groupId, teams));
    return { id: groupId, teams, matches };
  });
}

export function getAllTeams(groups: Group[]): Team[] {
  return groups.flatMap((g) => g.teams);
}

export function teamById(groups: Group[], teamId: string | null | undefined): Team | undefined {
  if (!teamId) return undefined;
  for (const g of groups) {
    const t = g.teams.find((t) => t.id === teamId);
    if (t) return t;
  }
  return undefined;
}

/**
 * Combina dados de grupos salvos (localStorage) com os metadados atuais das
 * seleções definidos neste arquivo. Mantém placares e referências; refresca
 * nome/bandeira/ranking. Útil ao carregar dumps antigos.
 */
export function reconcileWithInitialMeta(savedGroups: Group[]): Group[] {
  const fresh = createInitialGroups();
  return fresh.map((freshGroup) => {
    const saved = savedGroups.find((g) => g.id === freshGroup.id);
    if (!saved) return freshGroup;
    return {
      ...freshGroup,
      // Preserva placares (e datas customizadas) por id de partida.
      matches: freshGroup.matches.map((m) => {
        const savedMatch = saved.matches.find((sm) => sm.id === m.id);
        if (!savedMatch) return m;
        return { ...m, homeScore: savedMatch.homeScore, awayScore: savedMatch.awayScore };
      }),
    };
  });
}
