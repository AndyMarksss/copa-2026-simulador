import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { KnockoutMatch, Team, TournamentState } from '../types';
import { teamById } from '../data/groups';
import { computeGroupStandings } from '../logic/standings';
import { computeThirdPlacedRanking } from '../logic/thirdPlaced';
import { ROUND_LABELS } from '../data/knockoutBracket';
import { matchIsPlayed } from '../logic/matches';
import { formatLongDate } from '../data/schedule';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';

// ---------------------------------------------------------------------------
// TeamDetailsModal — histórico e trajetória da seleção.
//
//   • PORTAL para document.body → escapa de qualquer ancestor com transform
//     (animações), garantindo que `position: fixed` ancore na viewport e
//     o modal apareça imediatamente visível (não no fim da página).
//   • Mobile (< sm): bottom sheet (slide-up, rounded-t-3xl, safe-area).
//   • ≥ sm: modal central (pop-in, rounded-2xl).
//   • Body scroll travado enquanto aberto.
// ---------------------------------------------------------------------------

interface TeamDetailsModalProps {
  state: TournamentState;
  teamId: string | null;
  onClose: () => void;
}

interface PlayedGame {
  matchId: string;
  date?: string;
  time?: string;
  stage: string;
  opponentId: string;
  scored: number;
  conceded: number;
  result: 'win' | 'draw' | 'loss';
  home: boolean;
}

interface UpcomingGroupGame {
  matchId: string;
  date?: string;
  time?: string;
  stage: string;
  opponentId: string;
  home: boolean;
  city?: string;
}

interface KnockoutAppearance {
  matchId: string;
  round: KnockoutMatch['round'];
  opponentId: string | null;
  date?: string;
  time?: string;
  status: 'pending' | 'won' | 'lost';
  scoreLine?: string;
}

export function TeamDetailsModal({ state, teamId, onClose }: TeamDetailsModalProps) {
  // ESC + scroll lock
  useEffect(() => {
    if (!teamId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [teamId, onClose]);

  const team = teamId ? teamById(state.groups, teamId) : undefined;
  const group = team ? state.groups.find((g) => g.id === team.groupId) : undefined;

  const standings = useMemo(
    () => (group ? computeGroupStandings(group, state.manualTiebreakers) : []),
    [group, state.manualTiebreakers],
  );
  const myStanding = useMemo(
    () => standings.find((s) => s.teamId === teamId) ?? null,
    [standings, teamId],
  );

  const thirdsResult = useMemo(
    () => computeThirdPlacedRanking(state.groups, state.manualTiebreakers),
    [state.groups, state.manualTiebreakers],
  );
  const thirdEntry = thirdsResult.ranking.find((e) => e.teamId === teamId) ?? null;

  const { groupPlayed, groupUpcoming } = useMemo(() => {
    const played: PlayedGame[] = [];
    const upcoming: UpcomingGroupGame[] = [];
    if (team && group) {
      for (const m of group.matches) {
        const involved = m.homeTeamId === team.id || m.awayTeamId === team.id;
        if (!involved) continue;
        const isHome = m.homeTeamId === team.id;
        const opponentId = isHome ? m.awayTeamId : m.homeTeamId;
        if (matchIsPlayed(m)) {
          const scored = (isHome ? m.homeScore : m.awayScore) as number;
          const conceded = (isHome ? m.awayScore : m.homeScore) as number;
          const result: PlayedGame['result'] =
            scored > conceded ? 'win' :
            scored < conceded ? 'loss' : 'draw';
          played.push({
            matchId: m.id,
            date: m.date, time: m.time,
            stage: m.stage ?? `Grupo ${m.groupId}`,
            opponentId, scored, conceded, result, home: isHome,
          });
        } else {
          upcoming.push({
            matchId: m.id,
            date: m.date, time: m.time,
            stage: m.stage ?? `Grupo ${m.groupId}`,
            opponentId, home: isHome, city: m.city,
          });
        }
      }
    }
    return { groupPlayed: played, groupUpcoming: upcoming };
  }, [team, group]);

  const koAppearances = useMemo<KnockoutAppearance[]>(() => {
    if (!team) return [];
    const arr: KnockoutAppearance[] = [];
    for (const m of state.knockout.matches) {
      const involved = m.homeTeamId === team.id || m.awayTeamId === team.id;
      if (!involved) continue;
      const isHome = m.homeTeamId === team.id;
      const opponentId = isHome ? m.awayTeamId : m.homeTeamId;
      let status: KnockoutAppearance['status'] = 'pending';
      if (m.winnerTeamId === team.id) status = 'won';
      else if (m.loserTeamId === team.id) status = 'lost';
      const scoreLine = (() => {
        if (m.homeScore === null || m.awayScore === null) return undefined;
        const myScore = isHome ? m.homeScore : m.awayScore;
        const oppScore = isHome ? m.awayScore : m.homeScore;
        const main = `${myScore} × ${oppScore}`;
        if (m.homePens !== null && m.awayPens !== null) {
          const myPens = isHome ? m.homePens : m.awayPens;
          const oppPens = isHome ? m.awayPens : m.homePens;
          return `${main} (${myPens}-${oppPens} pen)`;
        }
        return main;
      })();
      arr.push({
        matchId: m.id, round: m.round, opponentId,
        date: m.date, time: m.time,
        status, scoreLine,
      });
    }
    return arr;
  }, [state.knockout.matches, team]);

  const trajectory = useMemo(
    () => buildTrajectoryMessage(state, team, myStanding, thirdEntry, koAppearances),
    [state, team, myStanding, thirdEntry, koAppearances],
  );

  if (!team || typeof document === 'undefined') return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-modal-title"
      onClick={onClose}
      className="
        fixed inset-0 z-[9999]
        flex items-end sm:items-center justify-center
        bg-slate-900/70 dark:bg-black/70 backdrop-blur-sm
        p-0 sm:p-4
      "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full sm:max-w-2xl
          rounded-t-3xl sm:rounded-2xl
          border border-white/60 dark:border-white/5
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          ring-1 ring-brand-400/30 dark:ring-brand-400/20
          shadow-[0_30px_80px_-20px_rgba(11,27,58,0.5)]
          max-h-[88vh] sm:max-h-[85vh]
          flex flex-col relative
          animate-sheet-up sm:animate-pop-in
        "
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* "Pegador" do bottom sheet — apenas mobile */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5" aria-hidden />

        {/* ============== HEADER ============== */}
        <header className="shrink-0 px-4 sm:px-6 pt-3 sm:pt-5 pb-3 relative border-b border-slate-200/60 dark:border-slate-800/60">
          <button
            type="button"
            aria-label="Fechar histórico"
            onClick={onClose}
            className="
              absolute top-3 right-3 w-9 h-9 rounded-full
              flex items-center justify-center
              text-slate-500 hover:text-slate-900 dark:hover:text-white
              hover:bg-slate-200 dark:hover:bg-slate-800
              transition-colors
            "
          >
            <Icon icon={icons.close} className="text-base" />
          </button>

          <div className="text-[10px] uppercase tracking-widest text-brand-700 dark:text-brand-300 font-bold pr-10 mb-1">
            Trajetória na Copa
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <Flag team={team} size="xl" />
            <div className="min-w-0">
              <h3 id="team-modal-title" className="font-display tracking-wider text-2xl leading-tight truncate">
                {team.name}
              </h3>
              <div className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                <span>Grupo {team.groupId}</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-mono">FIFA {team.fifaRank}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ============== CONTEÚDO ============== */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-5">
          {myStanding && (
            <section>
              <SectionTitle icon={icons.groups} title="No grupo" />
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <StatBox label="Pos" value={`${myStanding.position}º`} highlight />
                <StatBox label="Pts" value={String(myStanding.points)} highlight />
                <StatBox label="J"   value={String(myStanding.played)} />
                <StatBox label="V"   value={String(myStanding.wins)}   tone="emerald" />
                <StatBox label="E"   value={String(myStanding.draws)}  tone="slate" />
                <StatBox label="D"   value={String(myStanding.losses)} tone="rose" />
                <StatBox label="GP"  value={String(myStanding.goalsFor)} />
                <StatBox label="GC"  value={String(myStanding.goalsAgainst)} />
                <StatBox
                  label="SG"
                  value={`${myStanding.goalDifference > 0 ? '+' : ''}${myStanding.goalDifference}`}
                  tone={myStanding.goalDifference > 0 ? 'emerald' : myStanding.goalDifference < 0 ? 'rose' : 'slate'}
                />
              </div>
              {trajectory.status && (
                <div className={[
                  'mt-3 rounded-lg px-3 py-2 text-sm flex items-start gap-2',
                  trajectory.tone === 'gold'    ? 'bg-yellow-400/15 text-yellow-800 dark:text-yellow-200 border border-yellow-400/30' :
                  trajectory.tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border border-emerald-500/25' :
                  trajectory.tone === 'amber'   ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/25' :
                  trajectory.tone === 'rose'    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-200 border border-rose-500/25' :
                                                  'bg-brand-500/10 text-brand-700 dark:text-brand-200 border border-brand-500/25',
                ].join(' ')}>
                  <Icon icon={trajectory.icon} className="mt-0.5 shrink-0" />
                  <span>{trajectory.status}</span>
                </div>
              )}
            </section>
          )}

          <section>
            <SectionTitle icon={icons.recent} title="Histórico de partidas" />
            {groupPlayed.length === 0 && koAppearances.filter((a) => a.status !== 'pending').length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma partida concluída ainda — comece a preencher placares para acompanhar.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {groupPlayed.map((g) => (
                  <MatchEntry
                    key={g.matchId}
                    state={state}
                    stage={g.stage}
                    date={g.date}
                    time={g.time}
                    opponentId={g.opponentId}
                    scoreLine={`${g.scored} × ${g.conceded}`}
                    home={g.home}
                    badge={
                      g.result === 'win'  ? { label: 'Vitória', tone: 'emerald' } :
                      g.result === 'loss' ? { label: 'Derrota', tone: 'rose' } :
                                            { label: 'Empate',  tone: 'slate' }
                    }
                  />
                ))}
                {koAppearances
                  .filter((a) => a.status !== 'pending')
                  .map((a) => (
                    <MatchEntry
                      key={a.matchId}
                      state={state}
                      stage={ROUND_LABELS[a.round]}
                      date={a.date}
                      time={a.time}
                      opponentId={a.opponentId}
                      scoreLine={a.scoreLine ?? '—'}
                      home={true}
                      badge={
                        a.status === 'won'
                          ? { label: 'Avançou', tone: 'emerald' }
                          : { label: 'Eliminada', tone: 'rose' }
                      }
                    />
                  ))}
              </ul>
            )}
          </section>

          {(groupUpcoming.length > 0 || koAppearances.some((a) => a.status === 'pending' && a.opponentId)) && (
            <section>
              <SectionTitle icon={icons.calendar} title="Próximos confrontos" />
              <ul className="space-y-1.5">
                {groupUpcoming.map((g) => (
                  <MatchEntry
                    key={g.matchId}
                    state={state}
                    stage={g.stage}
                    date={g.date}
                    time={g.time}
                    opponentId={g.opponentId}
                    scoreLine="vs"
                    home={g.home}
                    badge={{ label: 'A jogar', tone: 'brand' }}
                    secondaryInfo={g.city}
                  />
                ))}
                {koAppearances
                  .filter((a) => a.status === 'pending' && a.opponentId)
                  .map((a) => (
                    <MatchEntry
                      key={a.matchId}
                      state={state}
                      stage={ROUND_LABELS[a.round]}
                      date={a.date}
                      time={a.time}
                      opponentId={a.opponentId}
                      scoreLine="vs"
                      home={true}
                      badge={{ label: 'A jogar', tone: 'brand' }}
                    />
                  ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ---------------------------------------------------------------------------
// Mensagem contextual sobre a trajetória da seleção
// ---------------------------------------------------------------------------

interface TrajectoryMessage {
  status: string | null;
  tone: 'brand' | 'emerald' | 'amber' | 'rose' | 'gold';
  icon: typeof icons.qualified;
}

function buildTrajectoryMessage(
  state: TournamentState,
  team: Team | undefined,
  standing: ReturnType<typeof computeGroupStandings>[number] | null,
  thirdEntry: ReturnType<typeof computeThirdPlacedRanking>['ranking'][number] | null,
  koAppearances: KnockoutAppearance[],
): TrajectoryMessage {
  if (!team || !standing) return { status: null, tone: 'brand', icon: icons.info };

  const finalMatch = state.knockout.matches.find((m) => m.round === 'F');
  if (finalMatch?.winnerTeamId === team.id) {
    return {
      status: `${team.name} é campeã da Copa do Mundo 2026.`,
      tone: 'gold',
      icon: icons.champion,
    };
  }
  if (finalMatch?.loserTeamId === team.id) {
    return {
      status: `${team.name} é vice-campeã da Copa do Mundo 2026.`,
      tone: 'amber',
      icon: icons.award,
    };
  }
  const thirdMatch = state.knockout.matches.find((m) => m.round === '3P');
  if (thirdMatch?.winnerTeamId === team.id) {
    return {
      status: `${team.name} ficou em 3º lugar na Copa do Mundo 2026.`,
      tone: 'amber',
      icon: icons.thirdPlace,
    };
  }

  const lostIn = koAppearances.find((a) => a.status === 'lost');
  if (lostIn) {
    return {
      status: `Eliminada em ${ROUND_LABELS[lostIn.round]}.`,
      tone: 'rose',
      icon: icons.warning,
    };
  }
  const playingInRound = koAppearances
    .filter((a) => a.status === 'pending' && a.opponentId)
    .pop();
  if (playingInRound) {
    return {
      status: `Vai disputar ${ROUND_LABELS[playingInRound.round]}.`,
      tone: 'brand',
      icon: icons.bracket,
    };
  }

  const groupComplete = state.groups
    .find((g) => g.id === team.groupId)
    ?.matches.every(matchIsPlayed) ?? false;

  if (standing.position <= 2) {
    return {
      status: groupComplete
        ? `Classificada em ${standing.position}º no Grupo ${team.groupId}.`
        : `Em ${standing.position}º no Grupo ${team.groupId} — classificação direta no momento.`,
      tone: 'emerald',
      icon: icons.qualified,
    };
  }
  if (standing.position === 3) {
    if (thirdEntry?.qualified) {
      return {
        status: `Em 3º no Grupo ${team.groupId} — entre os 8 melhores terceiros, classificada.`,
        tone: 'emerald',
        icon: icons.thirdPlace,
      };
    }
    return {
      status: groupComplete
        ? `Em 3º no Grupo ${team.groupId} — fora dos 8 melhores terceiros.`
        : `Em 3º no Grupo ${team.groupId} — disputando uma das vagas de melhor terceiro.`,
      tone: groupComplete ? 'rose' : 'amber',
      icon: groupComplete ? icons.warning : icons.thirdPlace,
    };
  }

  return {
    status: groupComplete
      ? `Eliminada na fase de grupos (${standing.position}º do Grupo ${team.groupId}).`
      : `Em ${standing.position}º no Grupo ${team.groupId} — eliminação direta no momento.`,
    tone: groupComplete ? 'rose' : 'amber',
    icon: groupComplete ? icons.warning : icons.pending,
  };
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function SectionTitle({ icon, title }: { icon: typeof icons.info; title: string }) {
  return (
    <h4 className="font-display tracking-wider text-base flex items-center gap-2 mb-2">
      <Icon icon={icon} className="text-brand-500 text-sm" />
      {title}
    </h4>
  );
}

function StatBox({
  label, value, tone = 'slate', highlight,
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'emerald' | 'rose';
  highlight?: boolean;
}) {
  const toneCls =
    tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' :
    tone === 'rose'    ? 'text-rose-700 dark:text-rose-300' :
                         'text-slate-700 dark:text-slate-200';
  return (
    <div className={[
      'rounded-lg px-2 py-1.5 text-center',
      highlight
        ? 'bg-gradient-to-br from-brand-500/15 to-brand-500/5 border border-brand-500/30'
        : 'bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60',
    ].join(' ')}>
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-display tracking-wider text-lg leading-none ${toneCls}`}>{value}</div>
    </div>
  );
}

function MatchEntry({
  state, stage, date, time, opponentId, scoreLine, badge, home, secondaryInfo,
}: {
  state: TournamentState;
  stage: string;
  date?: string;
  time?: string;
  opponentId: string | null;
  scoreLine: string;
  badge: { label: string; tone: 'emerald' | 'rose' | 'slate' | 'brand' };
  home: boolean;
  secondaryInfo?: string;
}) {
  const opp = teamById(state.groups, opponentId);
  const badgeCls =
    badge.tone === 'emerald' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25' :
    badge.tone === 'rose'    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25' :
    badge.tone === 'brand'   ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/25' :
                               'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-1 ring-slate-500/20';
  return (
    <li className="rounded-lg bg-slate-100/60 dark:bg-slate-800/30 px-2.5 py-1.5 flex items-center gap-2 text-sm min-w-0">
      <div className="flex flex-col w-[88px] sm:w-[120px] shrink-0 text-[10px] uppercase tracking-wider text-slate-500">
        <span className="font-bold text-brand-700 dark:text-brand-300 leading-tight truncate">{stage}</span>
        <span className="font-mono text-[10px] text-slate-500">
          {date ? formatLongDate(date).split(',')[0] : 'A definir'}{time ? ` · ${time}` : ''}
        </span>
        {secondaryInfo && (
          <span className="text-[10px] text-slate-400 truncate normal-case">{secondaryInfo}</span>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0 font-semibold">
        <span className="text-[10px] uppercase text-slate-400">{home ? 'em casa' : 'fora'}</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <Flag team={opp} size="sm" />
        <span className="truncate">{opp?.name ?? 'A definir'}</span>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-sm font-bold">{scoreLine}</span>
        <span className={`text-[9px] font-bold uppercase rounded-full px-1.5 py-0.5 leading-none ${badgeCls}`}>
          {badge.label}
        </span>
      </div>
    </li>
  );
}
