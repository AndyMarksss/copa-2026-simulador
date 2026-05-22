import type { KnockoutMatch, Match } from '../types';

// ---------------------------------------------------------------------------
// Status temporal de uma partida.
//
//   • finished : já tem placar registrado
//   • live     : data/hora atual entre início e fim estimado, ainda sem placar
//   • upcoming : data/hora futura
//   • today    : data == hoje (combina com upcoming/live)
//   • past     : já passou da data/hora estimada e segue sem placar
//   • pending  : sem data registrada (não dá para classificar no tempo)
//
// A propriedade `primary` é a categoria mais relevante para exibir um único
// badge no card do jogo.
// ---------------------------------------------------------------------------

export type AnyMatch = Match | KnockoutMatch;

export type MatchStatusPrimary =
  | 'finished'
  | 'live'
  | 'today'
  | 'upcoming'
  | 'past'
  | 'pending';

export interface MatchStatus {
  isFinished: boolean;
  isLive: boolean;
  isToday: boolean;
  isUpcoming: boolean;
  isPast: boolean;
  isPending: boolean;
  primary: MatchStatusPrimary;
  startMs: number | null;
  endMs: number | null;
}

// Duração estimada em minutos por tipo de jogo
const DURATION_GROUP_MIN = 120;       // 2h
const DURATION_KNOCKOUT_MIN = 150;    // 2h30 (cobre prorrogação + pênaltis)

function isKnockoutMatch(m: AnyMatch): m is KnockoutMatch {
  return 'round' in m;
}

function isMatchFinished(m: AnyMatch): boolean {
  if (isKnockoutMatch(m)) {
    return m.winnerTeamId !== null;
  }
  return m.homeScore !== null && m.awayScore !== null;
}

function getStartAndEnd(m: AnyMatch): { start: number | null; end: number | null } {
  if (!m.date) return { start: null, end: null };
  const time = m.time ?? '00:00';
  const ts = new Date(`${m.date}T${time}:00`).getTime();
  if (Number.isNaN(ts)) return { start: null, end: null };
  const durMin = isKnockoutMatch(m) ? DURATION_KNOCKOUT_MIN : DURATION_GROUP_MIN;
  return { start: ts, end: ts + durMin * 60_000 };
}

export function getMatchStatus(m: AnyMatch, now: Date = new Date()): MatchStatus {
  const finished = isMatchFinished(m);
  const { start, end } = getStartAndEnd(m);
  const nowMs = now.getTime();

  let isLive = false;
  let isToday = false;
  let isUpcoming = false;
  let isPast = false;

  if (start !== null && end !== null) {
    isLive = !finished && start <= nowMs && nowMs <= end;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
    isToday = start >= todayStart && start < tomorrowStart;
    isUpcoming = !finished && start > nowMs;
    isPast = !finished && end < nowMs;
  }

  const isPending = !finished && (start === null);

  let primary: MatchStatusPrimary;
  if (finished) primary = 'finished';
  else if (isLive) primary = 'live';
  else if (isUpcoming && isToday) primary = 'today';
  else if (isUpcoming) primary = 'upcoming';
  else if (isPast) primary = 'past';
  else primary = 'pending';

  return {
    isFinished: finished,
    isLive, isToday, isUpcoming, isPast, isPending,
    primary,
    startMs: start, endMs: end,
  };
}

// ---------------------------------------------------------------------------
// Filtros disponíveis na aba "Jogos"
// ---------------------------------------------------------------------------

export type MatchFilterId =
  | 'all'
  | 'today'
  | 'live'
  | 'upcoming'
  | 'finished'
  | 'pending'
  | 'past';

export function matchesFilter(s: MatchStatus, filter: MatchFilterId): boolean {
  switch (filter) {
    case 'all':       return true;
    case 'today':     return s.isToday;
    case 'live':      return s.isLive;
    case 'upcoming':  return s.isUpcoming;
    case 'finished':  return s.isFinished;
    case 'pending':   return !s.isFinished;
    case 'past':      return s.isPast;
  }
}

// ---------------------------------------------------------------------------
// Texto humano do status primário
// ---------------------------------------------------------------------------

export const STATUS_LABELS: Record<MatchStatusPrimary, string> = {
  finished: 'Finalizado',
  live:     'Ao vivo',
  today:    'Hoje',
  upcoming: 'Próximo',
  past:     'Aguardando resultado',
  pending:  'Pendente',
};
