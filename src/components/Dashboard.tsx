import React, { useMemo } from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { TournamentState } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import type { NavigateFn } from '../App';
import { matchIsPlayed } from '../logic/matches';
import { computeGroupStandings } from '../logic/standings';
import { computeThirdPlacedRanking } from '../logic/thirdPlaced';
import { getMatchStatus } from '../logic/matchStatus';
import { teamById } from '../data/groups';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { useToast } from './Toast';
import { MatchCard, type MatchItem } from './MatchCard';

interface DashboardProps {
  state: TournamentState;
  api: TournamentApi;
  onNavigate: NavigateFn;
}

export function Dashboard({ state, api, onNavigate }: DashboardProps) {
  const toast = useToast();

  // --------- métricas ---------
  const totalGroupMatches = state.groups.reduce((acc, g) => acc + g.matches.length, 0);
  const playedGroupMatches = state.groups.reduce(
    (acc, g) => acc + g.matches.filter(matchIsPlayed).length,
    0,
  );
  const groupProgress = (playedGroupMatches / totalGroupMatches) * 100;

  const qualifiedDirect = state.groups.reduce<number>((acc, g) => {
    const groupComplete = g.matches.every(matchIsPlayed);
    if (!groupComplete) return acc;
    return acc + Math.min(2, computeGroupStandings(g, state.manualTiebreakers).length);
  }, 0);
  const thirds = computeThirdPlacedRanking(state.groups, state.manualTiebreakers);
  const qualifiedTotal = qualifiedDirect + thirds.qualified.length;

  const champion = state.knockout.matches.find((m) => m.round === 'F')?.winnerTeamId ?? null;
  const championTeam = champion ? teamById(state.groups, champion) : null;

  const r32Played = state.knockout.matches.filter((m) => m.round === 'R32' && m.winnerTeamId).length;
  const r16Played = state.knockout.matches.filter((m) => m.round === 'R16' && m.winnerTeamId).length;
  const qfPlayed  = state.knockout.matches.filter((m) => m.round === 'QF'  && m.winnerTeamId).length;
  const sfPlayed  = state.knockout.matches.filter((m) => m.round === 'SF'  && m.winnerTeamId).length;
  const koTotal   = r32Played + r16Played + qfPlayed + sfPlayed;
  const koProgress = (koTotal / 30) * 100;

  // --------- coleta de jogos para o resumo ---------
  const allMatchesWithStatus = useMemo<MatchItem[]>(() => {
    const now = new Date();
    const arr: MatchItem[] = [];
    for (const g of state.groups) {
      for (const m of g.matches) arr.push({ match: m, type: 'group', status: getMatchStatus(m, now) });
    }
    for (const m of state.knockout.matches) {
      arr.push({ match: m, type: 'knockout', status: getMatchStatus(m, now) });
    }
    return arr;
  }, [state]);

  const todayCount = allMatchesWithStatus.filter((i) => i.status.isToday).length;
  const finishedCount = allMatchesWithStatus.filter((i) => i.status.isFinished).length;

  const upcomingTop = useMemo(() => {
    return allMatchesWithStatus
      .filter((i) => !i.status.isFinished && i.match.homeTeamId && i.match.awayTeamId)
      .sort((a, b) => (a.status.startMs ?? Infinity) - (b.status.startMs ?? Infinity))
      .slice(0, 3);
  }, [allMatchesWithStatus]);

  const recentTop = useMemo(() => {
    return allMatchesWithStatus
      .filter((i) => i.status.isFinished)
      .sort((a, b) => (b.status.startMs ?? -Infinity) - (a.status.startMs ?? -Infinity))
      .slice(0, 3);
  }, [allMatchesWithStatus]);

  return (
    <section className="space-y-5 animate-slide-up">
      {/* ============== CAMPEÃO (quando definido) ============== */}
      {championTeam ? (
        <div className="card card-pad bg-gradient-to-r from-yellow-400/15 via-amber-400/10 to-orange-400/10 border-yellow-400/40 flex items-center gap-4 animate-glow">
          <Icon icon={icons.champion} className="text-5xl text-yellow-500 animate-trophy" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-yellow-700 dark:text-yellow-300 font-bold">
              Campeão da Copa do Mundo 2026
            </div>
            <div className="flex items-center gap-3 mt-1 min-w-0">
              <Flag team={championTeam} size="xl" />
              <div className="font-display tracking-widest text-2xl sm:text-3xl text-gradient-gold leading-tight text-balance">
                {championTeam.name}
              </div>
            </div>
          </div>
          <button className="btn-gold hidden sm:inline-flex shrink-0" onClick={() => onNavigate('bracket')}>
            <Icon icon={icons.bracket} /> Ver chaveamento
          </button>
        </div>
      ) : (
        <HeroSection onNavigate={onNavigate} />
      )}

      {/* ============== STAT CARDS ============== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <StatCard
          icon={icons.simulateGroups}
          label="Fase de Grupos"
          value={`${playedGroupMatches}`}
          suffix={`/${totalGroupMatches}`}
          progress={groupProgress}
          action="Ver grupos"
          onClick={() => onNavigate('groups')}
        />
        <StatCard
          icon={icons.qualified}
          label="Classificados"
          value={`${qualifiedTotal}`}
          suffix="/32"
          hint="24 diretos + 8 melhores 3ºs"
          action="Ver chave"
          onClick={() => onNavigate('bracket')}
        />
        <StatCard
          icon={icons.bracket}
          label="Mata-mata"
          value={`${koTotal}`}
          suffix="/30"
          progress={koProgress}
          hint={
            sfPlayed === 2 ? 'Em vésperas da final' :
            qfPlayed === 4 ? 'Semifinais' :
            r16Played === 8 ? 'Quartas de final' :
            r32Played === 16 ? 'Oitavas de final' :
            r32Played > 0 ? '16ª avos em andamento' :
            'Aguardando classificados'
          }
          action="Ver chave"
          onClick={() => onNavigate('bracket')}
        />
        <StatCard
          icon={icons.thirdPlace}
          label="Melhores 3ºs"
          value={`${thirds.qualified.length}`}
          suffix="/8"
          hint={thirds.allGroupsComplete ? 'definidos' : 'aguardando grupos'}
          action="Ver ranking"
          onClick={() => onNavigate('groups')}
        />
        <StatCard
          icon={icons.today}
          label="Jogos de hoje"
          value={`${todayCount}`}
          hint={todayCount === 0 ? 'Sem jogos hoje' : 'Acompanhe ao vivo'}
          action="Ver jogos"
          onClick={() => onNavigate('matches', { matchFilter: 'today' })}
        />
        <StatCard
          icon={icons.recent}
          label="Resultados"
          value={`${finishedCount}`}
          hint={finishedCount === 0 ? 'Nenhum ainda' : 'finalizados até agora'}
          action="Ver resultados"
          onClick={() => onNavigate('matches', { matchFilter: 'finished' })}
        />
      </div>

      {/* ============== ACESSO RÁPIDO ============== */}
      <section className="card card-pad">
        <h3 className="font-display tracking-wider text-xl flex items-center gap-2 mb-2">
          <Icon icon={icons.arrowRight} className="text-brand-500" />
          Acesso rápido
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <ShortcutButton label="Jogos"     icon={icons.matches}  onClick={() => onNavigate('matches')} />
          <ShortcutButton label="Grupos"    icon={icons.groups}   onClick={() => onNavigate('groups')} />
          <ShortcutButton label="16ª avos"  icon={icons.round32}  onClick={() => onNavigate('r32')} />
          <ShortcutButton label="Chave"     icon={icons.bracket}  onClick={() => onNavigate('bracket')} />
          <ShortcutButton label="Config"    icon={icons.settings} onClick={() => onNavigate('settings')} />
        </div>
      </section>

      {/* ============== SIMULAÇÕES (somente desktop) ============== */}
      <div className="hidden lg:block card card-pad">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h3 className="font-display tracking-wider text-2xl flex items-center gap-2">
            <Icon icon={icons.simulation} className="text-brand-500" />
            Simulações rápidas
          </h3>
          <span className="text-xs text-slate-500">
            Resultados simulados ficam marcados; os manuais são preservados.
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              const n = api.simulateGroups();
              toast.show({
                variant: n > 0 ? 'success' : 'warn',
                title: n > 0 ? `${n} jogo(s) simulado(s) nos grupos` : 'Nada a simular nos grupos',
                description: n > 0 ? 'Tabelas atualizadas.' : 'Todos os jogos já estão preenchidos.',
              });
            }}
          >
            <Icon icon={icons.simulateGroups} />
            Simular fase de grupos
          </button>
          <button
            className="btn-soft"
            onClick={() => {
              const n = api.simulateRound('R32');
              toast.show({
                variant: n > 0 ? 'success' : 'warn',
                title: n > 0 ? `${n} jogo(s) simulado(s) nos 16ª avos` : 'Aguardando classificados',
              });
            }}
          >
            <Icon icon={icons.simulateR32} />
            Simular 16ª avos
          </button>
          <button
            className="btn-soft"
            onClick={() => {
              const n = api.simulateRound('R16');
              toast.show({
                variant: n > 0 ? 'success' : 'warn',
                title: n > 0 ? `${n} jogo(s) simulado(s) nas oitavas` : 'Oitavas ainda não disponíveis',
              });
            }}
          >
            <Icon icon={icons.simulateR16} />
            Simular oitavas
          </button>
          <button
            className="btn-gold"
            onClick={() => {
              const n = api.simulateAllKnockout();
              toast.show({
                variant: n > 0 ? 'success' : 'warn',
                title: n > 0 ? `${n} jogo(s) simulado(s) no mata-mata` : 'Nada a simular',
              });
            }}
          >
            <Icon icon={icons.simulateAll} />
            Simular mata-mata
          </button>
        </div>
      </div>

      {/* ============== RESUMOS COMPACTOS ============== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CompactList
          title="Próximos jogos"
          icon={icons.calendar}
          items={upcomingTop}
          state={state}
          emptyMessage="Sem partidas futuras pendentes."
          ctaLabel="Ver todos os jogos"
          onSeeAll={() => onNavigate('matches', { matchFilter: 'upcoming' })}
          onItemClick={(matchId) =>
            onNavigate('matches', { matchFilter: 'all', highlightMatchId: matchId })
          }
        />
        <CompactList
          title="Últimos resultados"
          icon={icons.recent}
          items={recentTop}
          state={state}
          emptyMessage="Nenhum resultado preenchido ainda."
          ctaLabel="Ver todos os resultados"
          onSeeAll={() => onNavigate('matches', { matchFilter: 'finished' })}
          onItemClick={(matchId) =>
            onNavigate('matches', { matchFilter: 'all', highlightMatchId: matchId })
          }
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HeroSection — apresenta o simulador antes de haver um campeão
// ---------------------------------------------------------------------------

function HeroSection({ onNavigate }: { onNavigate: NavigateFn }) {
  return (
    <section
      className="
        card card-pad relative overflow-hidden
        bg-gradient-to-br from-brand-600/15 via-brand-500/10 to-wc-red/10
        border-brand-500/30
      "
    >
      <div className="relative z-10 lg:max-w-4xl">
        <div className="text-[10px] uppercase tracking-widest text-brand-700 dark:text-brand-300 font-bold">
          EUA · México · Canadá · 11 jun → 19 jul
        </div>
        <h2 className="font-display tracking-wider text-2xl sm:text-3xl mt-1 text-balance">
          <span className="text-gradient-blue">Sua caderneta da Copa</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
          Preencha placares, acompanhe classificados e veja o mata-mata se formar em tempo real.
        </p>

        {/*
          Mobile: grid 2x2 (1 coluna em telas < 400px).
          Desktop (lg+): botões em uma linha horizontal, com largura natural.
        */}
        <div className="mt-4 grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 sm:gap-3 lg:flex lg:flex-row lg:flex-wrap lg:items-center">
          <button className="btn-primary w-full lg:w-auto" onClick={() => onNavigate('groups')}>
            <Icon icon={icons.groups} /> Ver grupos
          </button>
          <button className="btn-soft w-full lg:w-auto" onClick={() => onNavigate('matches')}>
            <Icon icon={icons.matches} /> Ver jogos
          </button>
          <button
            className="btn-soft w-full lg:w-auto"
            onClick={() => onNavigate('settings', { highlightSimulations: true })}
          >
            <Icon icon={icons.simulation} /> Simulações
          </button>
          <button className="btn-gold w-full lg:w-auto" onClick={() => onNavigate('bracket')}>
            <Icon icon={icons.bracket} /> Ver chaveamento
          </button>
        </div>
      </div>

      {/* Decoração sutil — taça */}
      <div className="hidden md:block absolute -right-6 -top-6 opacity-20 pointer-events-none select-none">
        <Icon icon={icons.trophy} className="text-[10rem] text-yellow-400" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: IconDefinition;
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
  progress?: number;
  action?: string;
  onClick?: () => void;
}

function StatCard({ icon, label, value, suffix, hint, progress, action, onClick }: StatCardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      className={[
        'stat-card !p-3 sm:!p-4 text-left',
        onClick ? 'hover:shadow-glow hover:-translate-y-0.5 transition-all active:scale-[.98] cursor-pointer' : '',
      ].join(' ')}
      onClick={onClick}
    >
      <span className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5 truncate">
        <Icon icon={icon} className="text-brand-500 text-sm" />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-display leading-none text-2xl sm:text-3xl">
        {value}{suffix && <span className="text-xs sm:text-sm text-slate-400">{suffix}</span>}
      </span>
      {hint && <span className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-2">{hint}</span>}
      {progress !== undefined && (
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
          <div
            className="h-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundImage: 'linear-gradient(90deg, #1e63d3, #3aa1ff)',
            }}
          />
        </div>
      )}
      {action && (
        <span className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 inline-flex items-center gap-1 mt-1">
          {action} <Icon icon={icons.chevronRight} />
        </span>
      )}
    </Comp>
  );
}

// ---------------------------------------------------------------------------
// Botão de atalho rápido
// ---------------------------------------------------------------------------

function ShortcutButton({
  label, icon, onClick,
}: { label: string; icon: IconDefinition; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl
        bg-slate-100/70 dark:bg-slate-800/40
        hover:bg-brand-500/10 dark:hover:bg-brand-500/20
        transition-all active:scale-95
      "
    >
      <Icon icon={icon} className="text-xl text-brand-600 dark:text-brand-400" />
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Lista compacta para próximas/recentes (top 3 + "Ver todos")
// ---------------------------------------------------------------------------

interface CompactListProps {
  title: string;
  icon: IconDefinition;
  items: MatchItem[];
  state: TournamentState;
  emptyMessage: string;
  ctaLabel: string;
  onSeeAll: () => void;
  onItemClick: (matchId: string) => void;
}

function CompactList({
  title, icon, items, state, emptyMessage, ctaLabel, onSeeAll, onItemClick,
}: CompactListProps) {
  return (
    <section className="card card-pad">
      <header className="flex items-center justify-between mb-3">
        <h3 className="font-display tracking-wider text-xl flex items-center gap-2">
          <Icon icon={icon} className="text-brand-500" />
          {title}
        </h3>
        <button
          className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 inline-flex items-center gap-1 hover:underline"
          onClick={onSeeAll}
        >
          {ctaLabel} <Icon icon={icons.chevronRight} />
        </button>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <MatchCard
              key={(item.match as { id: string }).id}
              variant="compact"
              item={item}
              state={state}
              onClick={() => onItemClick((item.match as { id: string }).id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
