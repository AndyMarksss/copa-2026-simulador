// ----------------------------------------------------------------------------
// Tipos centrais do Simulador da Copa do Mundo 2026
// ----------------------------------------------------------------------------

export type GroupId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export interface Team {
  id: string;          // slug único (ex.: "BRA")
  name: string;        // nome para exibição
  code: string;        // código ISO de 3 letras
  flag: string;        // emoji da bandeira (fallback)
  flagCode: string;    // código flag-icons (ex.: "br", "gb-eng", "gb-sct")
  groupId: GroupId;
  fifaRank: number;    // ranking FIFA aproximado, usado como desempate final
  fairPlay: number;    // pontos de fair play (negativos = melhor); 0 por padrão
}

export type ResultSource = 'manual' | 'simulated';

export interface Match {
  id: string;
  groupId: GroupId;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  source?: ResultSource;
  // Agendamento opcional (utilizado pela seção "Próximas partidas").
  date?: string;       // ISO date, ex.: "2026-06-11"
  time?: string;       // HH:mm em horário local da sede
  stadium?: string;
  city?: string;
  stage?: string;      // ex.: "Grupo A — Rodada 1"
}

export interface Group {
  id: GroupId;
  teams: Team[];
  matches: Match[];
}

export interface Standing {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  fairPlay: number;
  fifaRank: number;
  position: number;
  status: 'classificado' | 'melhor-terceiro' | 'em-disputa' | 'eliminado' | 'pendente';
}

export interface ThirdPlacedEntry {
  teamId: string;
  groupId: GroupId;
  played: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  fairPlay: number;
  fifaRank: number;
  rank: number;        // 1..12
  qualified: boolean;  // top 8
}

// ----------------------------------------------------------------------------
// Fase eliminatória
// ----------------------------------------------------------------------------

export type KnockoutRound = 'R32' | 'R16' | 'QF' | 'SF' | '3P' | 'F';

// Identificador simbólico para a vaga no chaveamento.
// Pode ser:
//   - "1A" / "2A" / ... → vencedor / vice de um grupo
//   - "3#1" .. "3#8"    → melhor terceiro de rank N
//   - "W:M01" / "L:M29" → vencedor/perdedor de outra partida
export type SlotId = string;

export interface KnockoutMatch {
  id: string;                    // ex.: "M01"
  round: KnockoutRound;
  slotA: SlotId;
  slotB: SlotId;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  // Prorrogação (opcional). Se vazio, o placar regulamentar decide.
  homeExtra: number | null;
  awayExtra: number | null;
  // Pênaltis (opcional).
  homePens: number | null;
  awayPens: number | null;
  // Vencedor escolhido manualmente (sobrescreve a decisão automática).
  manualWinnerTeamId?: string | null;
  // Origem do resultado: preenchido manualmente ou via simulação.
  source?: ResultSource;
  winnerTeamId: string | null;
  loserTeamId: string | null;
  date?: string;
  time?: string;
  stadium?: string;
  city?: string;
}

export interface KnockoutBracket {
  matches: KnockoutMatch[];
}

// ----------------------------------------------------------------------------
// Estado completo do torneio (que vai para o localStorage)
// ----------------------------------------------------------------------------

export interface TournamentState {
  version: number;
  groups: Group[];                    // contém os jogos + placares preenchidos
  knockout: KnockoutBracket;
  manualTiebreakers: Record<string, number>; // mapeia teamId → ordem manual
}

export interface Warning {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}
