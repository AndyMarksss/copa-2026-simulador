import React from 'react';
import type { ThirdPlacedEntry, TournamentState } from '../types';
import { computeThirdPlacedRanking } from '../logic/thirdPlaced';
import { teamById } from '../data/groups';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { useOpenTeamDetails } from './TeamDetailsContext';

// ---------------------------------------------------------------------------
// Ranking dos 3º colocados.
//
//   • Layout premium consistente com as demais tabelas do projeto.
//   • Os 8 melhores ganham fundo azul/esverdeado suave; os eliminados ficam
//     com opacidade menor e um separador discreto "Fora da zona de
//     classificação" acima da 9ª linha (apenas quando há mais de 8 entradas).
//   • Mobile: cabeçalho abreviado (Gr. · P · SG · GP) e situação reduzida
//     a uma bolinha colorida com tooltip; o nome da seleção fica clicável e
//     abre o histórico via context.
//   • Sem scroll horizontal.
// ---------------------------------------------------------------------------

interface ThirdPlacedRankingProps {
  state: TournamentState;
}

export function ThirdPlacedRanking({ state }: ThirdPlacedRankingProps) {
  const result = computeThirdPlacedRanking(state.groups, state.manualTiebreakers);
  const openTeam = useOpenTeamDetails();

  // Posição da linha que separa classificados dos eliminados.
  // Só exibimos o separador quando há ao menos 9 entradas (ou seja, quando
  // existem times eliminados visíveis abaixo da zona de classificação).
  const showCutoff = result.ranking.length > 8;

  return (
    <section className="card card-pad">
      <header className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div className="min-w-0">
          <h3 className="font-display tracking-wider text-2xl flex items-center gap-2">
            <Icon icon={icons.thirdPlace} className="text-brand-500 text-xl" />
            Ranking dos 3º colocados
          </h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Os 8 melhores avançam para a Rodada de 32.
          </p>
        </div>
        <span className={[
          'chip shrink-0',
          result.allGroupsComplete
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30',
        ].join(' ')}>
          <Icon icon={result.allGroupsComplete ? icons.qualified : icons.pending} />
          {result.allGroupsComplete ? 'Classificação definida' : 'Em apuração'}
        </span>
      </header>

      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
        <table className="w-full text-[11px] sm:text-[13px] table-fixed tabular-nums">
          <colgroup>
            <col className="w-7 sm:w-9" />
            <col />
            <col className="w-8 sm:w-12" />
            <col className="w-7 sm:w-10" />
            <col className="w-9 sm:w-12" />
            <col className="w-8 sm:w-10" />
            <col className="w-10 sm:w-32" />
          </colgroup>
          <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left py-2 px-1.5 sm:px-2 font-semibold">#</th>
              <th className="text-left py-2 px-1 font-semibold">Seleção</th>
              <th className="text-center py-2 px-0.5 font-semibold" title="Grupo">
                <span className="sm:hidden">Gr.</span>
                <span className="hidden sm:inline">Grupo</span>
              </th>
              <th className="text-center py-2 px-0.5 font-semibold" title="Pontos">P</th>
              <th className="text-center py-2 px-0.5 font-semibold" title="Saldo de gols">SG</th>
              <th className="text-center py-2 px-0.5 font-semibold" title="Gols pró">GP</th>
              <th className="text-center sm:text-left py-2 px-0.5 sm:px-2 font-semibold">
                <span className="sm:hidden">Status</span>
                <span className="hidden sm:inline">Situação</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {result.ranking.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                  <Icon icon={icons.pending} className="block text-2xl mb-1 mx-auto text-slate-400" />
                  Os 3º colocados aparecerão aqui assim que houver jogos preenchidos.
                </td>
              </tr>
            )}

            {result.ranking.map((entry, idx) => {
              // Linha de separação: aparece DENTRO da 9ª linha como um td colspan.
              const cutoffBefore = showCutoff && idx === 8;
              return (
                <React.Fragment key={entry.teamId}>
                  {cutoffBefore && (
                    <tr>
                      <td colSpan={7} className="px-2 py-1">
                        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-rose-700 dark:text-rose-300 font-bold">
                          <span className="h-px flex-1 bg-rose-300/50 dark:bg-rose-700/40" aria-hidden />
                          <span>Fora da zona de classificação</span>
                          <span className="h-px flex-1 bg-rose-300/50 dark:bg-rose-700/40" aria-hidden />
                        </div>
                      </td>
                    </tr>
                  )}
                  <RankRow
                    entry={entry}
                    state={state}
                    allComplete={result.allGroupsComplete}
                    onTeamClick={openTeam}
                  />
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda discreta para reforçar significado das cores */}
      {result.ranking.length > 0 && (
        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-sky-500" aria-hidden />
            Top 8 — avança para 16ª avos
          </span>
          {showCutoff && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500" aria-hidden />
              Eliminados
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" aria-hidden />
            Em disputa
          </span>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Linha individual do ranking
// ---------------------------------------------------------------------------

function RankRow({
  entry, state, allComplete, onTeamClick,
}: {
  entry: ThirdPlacedEntry;
  state: TournamentState;
  allComplete: boolean;
  onTeamClick: (teamId: string) => void;
}) {
  const team = teamById(state.groups, entry.teamId)!;
  const inTop8 = entry.rank <= 8;

  // Tom da linha por situação (opacidades em múltiplos de 5 — consistente
  // com o resto do projeto).
  const rowTone = !allComplete
    ? 'bg-amber-500/5  dark:bg-amber-500/10'           // todos em disputa
    : inTop8
      ? 'bg-sky-500/10  dark:bg-sky-500/15'            // classificados
      : 'bg-rose-500/5  dark:bg-rose-500/10 opacity-70'; // eliminados

  // Dot indicador (mobile usa só a bolinha; desktop usa bolinha + texto)
  const status = !allComplete
    ? { label: 'Em disputa', dotCls: 'bg-amber-500', textCls: 'text-amber-700 dark:text-amber-300' }
    : inTop8
      ? { label: 'Melhor 3º', dotCls: 'bg-sky-500',  textCls: 'text-sky-700 dark:text-sky-300' }
      : { label: 'Eliminada', dotCls: 'bg-rose-500', textCls: 'text-rose-700 dark:text-rose-300' };

  const sgTone =
    entry.goalDifference > 0 ? 'text-emerald-700 dark:text-emerald-300' :
    entry.goalDifference < 0 ? 'text-rose-700 dark:text-rose-300'       :
                               'text-slate-600 dark:text-slate-300';

  return (
    <tr
      className={[
        'border-t border-slate-200/60 dark:border-slate-800/60 leading-tight',
        'cursor-pointer hover:bg-brand-500/10 transition-colors',
        rowTone,
      ].join(' ')}
      onClick={() => onTeamClick(entry.teamId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTeamClick(entry.teamId);
        }
      }}
      aria-label={`Ver trajetória de ${team.name}`}
    >
      <td className="py-2 px-1.5 sm:px-2 font-display text-sm sm:text-base text-brand-700 dark:text-brand-300">
        {entry.rank}
      </td>
      <td className="py-2 px-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Flag team={team} size="sm" />
          <span
            className="font-semibold truncate hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            title={`${team.name} — ${status.label}`}
          >
            {team.name}
          </span>
        </div>
      </td>
      <td className="text-center py-2 px-0.5 font-mono text-slate-600 dark:text-slate-300">
        {entry.groupId}
      </td>
      <td className="text-center py-2 px-0.5 font-bold">{entry.points}</td>
      <td className={`text-center py-2 px-0.5 font-semibold ${sgTone}`}>
        {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
      </td>
      <td className="text-center py-2 px-0.5 text-slate-600 dark:text-slate-300">
        {entry.goalsFor}
      </td>
      <td className="py-2 px-0.5 sm:px-2">
        {/* Mobile: só bolinha (com title). Desktop: bolinha + label. */}
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${status.dotCls}`}
            aria-hidden
            title={status.label}
          />
          <span className={`hidden sm:inline text-[11px] font-semibold ${status.textCls}`}>
            {status.label}
          </span>
        </div>
      </td>
    </tr>
  );
}
