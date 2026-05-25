import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { GroupId, KnockoutMatch, Team, TournamentState } from '../types';
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
  /**
   * Chamado quando o usuário clica em "Grupo X" no cabeçalho da seleção.
   * Recebe o id do grupo e o id da seleção (para destaque visual). O handler
   * é responsável por navegar para a aba Grupos, fechar o modal e aplicar a
   * animação de destaque.
   */
  onNavigateToGroup?: (groupId: GroupId, teamId: string) => void;
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

export function TeamDetailsModal({ state, teamId, onClose, onNavigateToGroup }: TeamDetailsModalProps) {
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
              <div className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                {onNavigateToGroup ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToGroup(team.groupId, team.id)}
                    title={`Ver Grupo ${team.groupId} na aba Grupos`}
                    className="
                      inline-flex items-center gap-1
                      rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5
                      font-semibold text-brand-700 dark:text-brand-300
                      hover:bg-brand-500/15
                      focus:outline-none focus:ring-2 focus:ring-brand-400/40
                      underline decoration-dotted underline-offset-2
                      transition-colors
                    "
                  >
                    Grupo {team.groupId}
                    <Icon icon={icons.chevronRight} className="text-[9px]" />
                  </button>
                ) : (
                  <span>Grupo {team.groupId}</span>
                )}
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
              <TeamStandingMiniTable standing={myStanding} />
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

/**
 * Mini-tabela compacta com 9 colunas (Pos · Pts · J · V · E · D · GP · GC · SG).
 * Cabe no mobile sem scroll horizontal usando padding apertado e fonte menor.
 * Pos e Pts ficam em destaque (gradiente azul); V/D coloridos; SG ganha cor
 * conforme o saldo (positivo verde, negativo vermelho, zero neutro).
 */
function TeamStandingMiniTable({
  standing,
}: {
  standing: {
    position: number; points: number; played: number;
    wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; goalDifference: number;
  };
}) {
  const sgTone =
    standing.goalDifference > 0 ? 'text-emerald-700 dark:text-emerald-300' :
    standing.goalDifference < 0 ? 'text-rose-700 dark:text-rose-300'       :
                                  'text-slate-600 dark:text-slate-300';

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden bg-white/70 dark:bg-slate-800/30">
      <table className="w-full text-center text-[12px] sm:text-sm border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-100/80 dark:bg-slate-800/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500">
            <th className="py-1 px-0.5 sm:px-2 font-semibold">Pos</th>
            <th className="py-1 px-0.5 sm:px-2 font-semibold">Pts</th>
            <th className="py-1 px-0.5 sm:px-2 font-semibold">J</th>
            <th className="py-1 px-0.5 sm:px-2 font-semibold">V</th>
            <th className="py-1 px-0.5 sm:px-2 font-semibold">E</th>
            <th className="py-1 px-0.5 sm:px-2 font-semibold">D</th>
            <th className="py-1 px-0.5 sm:px-2 font-semibold">GP</th>
            <th className="py-1 px-0.5 sm:px-2 font-semibold">GC</th>
            <th className="py-1 px-0.5 sm:px-2 font-semibold">SG</th>
          </tr>
        </thead>
        <tbody>
          <tr className="font-semibold">
            <td className="py-2 px-0.5 sm:px-2 font-display text-base sm:text-lg text-brand-700 dark:text-brand-300">
              {standing.position}º
            </td>
            <td className="py-2 px-0.5 sm:px-2 font-display text-base sm:text-lg text-brand-700 dark:text-brand-300">
              {standing.points}
            </td>
            <td className="py-2 px-0.5 sm:px-2 text-slate-700 dark:text-slate-200">{standing.played}</td>
            <td className="py-2 px-0.5 sm:px-2 text-emerald-700 dark:text-emerald-300">{standing.wins}</td>
            <td className="py-2 px-0.5 sm:px-2 text-slate-500">{standing.draws}</td>
            <td className="py-2 px-0.5 sm:px-2 text-rose-700 dark:text-rose-300">{standing.losses}</td>
            <td className="py-2 px-0.5 sm:px-2 text-slate-700 dark:text-slate-200">{standing.goalsFor}</td>
            <td className="py-2 px-0.5 sm:px-2 text-slate-700 dark:text-slate-200">{standing.goalsAgainst}</td>
            <td className={`py-2 px-0.5 sm:px-2 font-bold ${sgTone}`}>
              {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Card de partida no histórico — layout VERTICAL para garantir que a fase
 * apareça inteira (sem truncate). Estrutura:
 *
 *   Grupo B — Rodada 1                          [Vitória]
 *   Quinta-feira · 19:00 · em casa
 *   🇨🇭 Suíça                                 1 × 2
 *
 * O grupo NÃO é clicável aqui — quem leva o usuário para a aba Grupos é o
 * botão "Grupo X" abaixo do nome da seleção, no cabeçalho do modal.
 */
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

  const dayLabel = date ? formatLongDate(date) : 'Data a definir';

  return (
    <li className="rounded-xl bg-slate-100/60 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 px-3 py-2 flex flex-col gap-1 min-w-0 text-sm">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="font-bold text-brand-700 dark:text-brand-300 text-[11px] uppercase tracking-wider leading-snug min-w-0">
          {stage}
        </div>
        <span className={`text-[9px] font-bold uppercase rounded-full px-1.5 py-0.5 leading-none whitespace-nowrap shrink-0 ${badgeCls}`}>
          {badge.label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
        <Icon icon={icons.calendar} className="text-slate-400" />
        <span>{dayLabel}</span>
        {time && (
          <>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="font-mono">{time}</span>
          </>
        )}
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span className="uppercase text-[10px] tracking-wider">{home ? 'em casa' : 'fora'}</span>
        {secondaryInfo && (
          <>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="truncate">{secondaryInfo}</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 font-semibold">
          <Flag team={opp} size="sm" />
          <span className="truncate">{opp?.name ?? 'A definir'}</span>
        </div>
        <span className="font-display tracking-wider text-base sm:text-lg shrink-0">{scoreLine}</span>
      </div>
    </li>
  );
}
