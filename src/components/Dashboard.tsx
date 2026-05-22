import React from 'react';
import type { TournamentState } from '../types';
import { matchIsPlayed } from '../logic/matches';
import { computeGroupStandings } from '../logic/standings';
import { computeThirdPlacedRanking } from '../logic/thirdPlaced';
import { teamById } from '../data/groups';
import { Flag } from './Flag';
import { UpcomingMatches } from './UpcomingMatches';
import { RecentResults } from './RecentResults';
import type { TournamentApi } from '../hooks/useTournament';
import { useToast } from './Toast';

interface DashboardProps {
  state: TournamentState;
  api: TournamentApi;
}

export function Dashboard({ state, api }: DashboardProps) {
  const toast = useToast();

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

  return (
    <section className="space-y-5 animate-slide-up">
      {/* Card especial do campeão */}
      {championTeam && (
        <div className="card card-pad bg-gradient-to-r from-yellow-400/15 via-amber-400/10 to-orange-400/10 border-yellow-400/40 flex items-center gap-4 animate-glow">
          <span className="text-5xl animate-trophy">🏆</span>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-yellow-700 dark:text-yellow-300 font-bold">
              Campeão da Copa do Mundo 2026
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Flag team={championTeam} size="xl" />
              <div className="font-display tracking-widest text-3xl text-gradient-gold">
                {championTeam.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards de progresso e status — 1 col em telas muito pequenas, 2 em mobile médio, 4 em desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          icon="⚽"
          label="Fase de Grupos"
          value={`${playedGroupMatches}`}
          suffix={`/${totalGroupMatches}`}
          progress={groupProgress}
        />
        <StatCard
          icon="🎯"
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
        />
        <StatCard
          icon="✅"
          label="Classificados"
          value={`${qualifiedTotal}`}
          suffix="/32"
          hint="24 diretos + 8 melhores 3ºs"
        />
        <StatCard
          icon="🥉"
          label="Melhores 3ºs"
          value={`${thirds.qualified.length}`}
          suffix="/8"
          hint={thirds.allGroupsComplete ? 'definidos' : 'aguardando grupos'}
        />
      </div>

      {/* Atalhos de simulação rápida — apenas no desktop. No mobile/tablet
          ficam na aba Configurações (para não sobrecarregar o dashboard). */}
      <div className="hidden lg:block card card-pad">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h3 className="font-display tracking-wider text-2xl flex items-center gap-2">
            <span aria-hidden>⚡</span> Simulações rápidas
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
                description: n > 0 ? 'Tabelas e melhores 3ºs atualizados.' : 'Todos os jogos já estão preenchidos.',
              });
            }}
          >
            ⚽ Simular fase de grupos
          </button>
          <button
            className="btn-soft"
            onClick={() => {
              const n = api.simulateRound('R32');
              toast.show({
                variant: n > 0 ? 'success' : 'warn',
                title: n > 0 ? `${n} jogo(s) simulado(s) nos 16ª avos` : 'Aguardando classificados',
                description: n === 0 ? 'Finalize ou simule a fase de grupos primeiro.' : undefined,
              });
            }}
          >
            🎯 Simular 16ª avos
          </button>
          <button
            className="btn-soft"
            onClick={() => {
              const n = api.simulateRound('R16');
              toast.show({
                variant: n > 0 ? 'success' : 'warn',
                title: n > 0 ? `${n} jogo(s) simulado(s) nas oitavas` : 'Oitavas ainda não disponíveis',
                description: n === 0 ? 'Finalize os 16ª avos antes de simular as oitavas.' : undefined,
              });
            }}
          >
            🥊 Simular oitavas
          </button>
          <button
            className="btn-gold"
            onClick={() => {
              const n = api.simulateAllKnockout();
              toast.show({
                variant: n > 0 ? 'success' : 'warn',
                title: n > 0 ? `${n} jogo(s) simulado(s) no mata-mata` : 'Nada a simular',
                description: n > 0 ? 'Chaveamento completo até a final.' : undefined,
              });
            }}
          >
            🏆 Simular mata-mata
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <UpcomingMatches state={state} />
        <RecentResults state={state} />
      </div>
    </section>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
  progress?: number;
}

function StatCard({ icon, label, value, suffix, hint, progress }: StatCardProps) {
  return (
    <div className="stat-card !p-3 sm:!p-5">
      <span className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5 truncate">
        <span aria-hidden>{icon}</span><span className="truncate">{label}</span>
      </span>
      <span className="font-display leading-none text-3xl sm:text-4xl">
        {value}{suffix && <span className="text-sm sm:text-base text-slate-400">{suffix}</span>}
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
    </div>
  );
}
