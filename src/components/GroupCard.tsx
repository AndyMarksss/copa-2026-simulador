import React, { forwardRef, useEffect, useState } from 'react';
import type { Group, GroupId, Match } from '../types';
import { computeGroupStandings } from '../logic/standings';
import { detectUnresolvedTies } from '../logic/tiebreakers';
import { matchIsPlayed } from '../logic/matches';
import { teamById } from '../data/groups';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { ScoreInput } from './ScoreInput';

interface GroupCardProps {
  group: Group;
  manualOrder: Record<string, number>;
  onSetScore: (groupId: GroupId, matchId: string, home: number | null, away: number | null) => void;
  onManualOrder: (teamId: string, weight: number | null) => void;
  /** Em mobile/tablet, controla o estado inicial dos jogos. Default: true. */
  defaultExpanded?: boolean;
  /** Quando informado, transforma cada linha da tabela em um botão clicável. */
  onTeamClick?: (teamId: string) => void;
  /** Quando informado, destaca temporariamente a linha dessa seleção. */
  highlightedTeamId?: string | null;
  /** Quando true, força a expansão do card (sobrescreve estado local). */
  forceExpanded?: boolean;
  /** Quando true, aplica animação de destaque ao card inteiro. */
  highlighted?: boolean;
}

export const GroupCard = forwardRef<HTMLElement, GroupCardProps>(function GroupCard({
  group, manualOrder, onSetScore, onManualOrder, defaultExpanded = true,
  onTeamClick, highlightedTeamId, forceExpanded, highlighted,
}, ref) {
  const standings = computeGroupStandings(group, manualOrder);
  const ties = detectUnresolvedTies(standings, group.matches, manualOrder);
  const played = group.matches.filter(matchIsPlayed).length;
  const total = group.matches.length;
  const complete = played === total;
  const pending = total - played;

  // Estado de expansão usado apenas em mobile/tablet (<lg).
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

  // Se forceExpanded chegar como true, garante que o card mobile esteja aberto.
  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  return (
    <article
      ref={ref}
      className={[
        'card card-compact animate-fade-in flex flex-col scroll-anchor',
        highlighted ? 'group-highlight' : '',
      ].join(' ')}
      data-group-id={group.id}
    >
      {/* -------- HEADER -------- */}
      <header
        className="
          flex items-center justify-between gap-2 mb-2 -mx-1 px-2 py-1.5 rounded-lg
          bg-gradient-to-r from-brand-500/10 via-transparent to-transparent
          lg:cursor-default
        "
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Recolher jogos do grupo' : 'Expandir jogos do grupo'}
          className="
            flex items-center gap-2 flex-1 min-w-0 text-left
            lg:cursor-default
          "
        >
          <span className="font-display tracking-wider text-xl shrink-0">
            Grupo <span className="text-brand-600 dark:text-brand-400">{group.id}</span>
          </span>
          <ProgressBadge played={played} total={total} pending={pending} complete={complete} />
          {/* Chevron — visível apenas em mobile/tablet */}
          <svg
            className={[
              'lg:hidden ml-auto w-4 h-4 text-slate-500 transition-transform duration-300',
              expanded ? 'rotate-180' : 'rotate-0',
            ].join(' ')}
            viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      {/* -------- TABELA (sempre visível) -------- */}
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-wide text-slate-500">
              <th className="text-left py-1 font-semibold w-4">#</th>
              <th className="text-left py-1 font-semibold">Seleção</th>
              <th className="text-center py-1 font-semibold" title="Pontos">P</th>
              <th className="text-center py-1 font-semibold hidden sm:table-cell" title="Jogos">J</th>
              <th className="text-center py-1 font-semibold hidden sm:table-cell" title="Vitórias">V</th>
              <th className="text-center py-1 font-semibold hidden sm:table-cell" title="Empates">E</th>
              <th className="text-center py-1 font-semibold hidden sm:table-cell" title="Derrotas">D</th>
              <th className="text-center py-1 font-semibold" title="Saldo">SG</th>
              <th className="text-center py-1 font-semibold sm:hidden" title="Gols pró">GP</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => {
              const team = teamById([group], s.teamId)!;
              const top2 = s.position <= 2;
              const isThird = s.position === 3;
              const isFourth = s.position === 4;
              const clickable = !!onTeamClick;
              const isHighlighted = highlightedTeamId === s.teamId;
              return (
                <tr
                  key={s.teamId}
                  className={[
                    'border-t border-slate-200/60 dark:border-slate-800/60',
                    top2 ? 'bg-emerald-500/10' : '',
                    isThird ? 'bg-amber-500/10' : '',
                    isFourth ? 'bg-rose-500/5' : '',
                    clickable ? 'cursor-pointer hover:bg-brand-500/10' : '',
                    isHighlighted ? 'team-row-highlight' : '',
                  ].join(' ')}
                  onClick={clickable ? () => onTeamClick!(s.teamId) : undefined}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onKeyDown={clickable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTeamClick!(s.teamId);
                    }
                  } : undefined}
                  aria-label={clickable ? `Ver trajetória de ${team.name}` : undefined}
                >
                  <td className="py-1 font-semibold text-slate-500">{s.position}</td>
                  <td className="py-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Flag team={team} size="sm" />
                      <span
                        className={[
                          'font-semibold truncate',
                          clickable ? 'hover:text-brand-700 dark:hover:text-brand-300 transition-colors' : '',
                        ].join(' ')}
                        title={team.name}
                      >
                        {team.name}
                      </span>
                      {(top2 || isThird) && (
                        <span className={[
                          'inline-block w-1.5 h-1.5 rounded-full ml-auto shrink-0',
                          top2 ? 'bg-emerald-500' : 'bg-amber-500',
                        ].join(' ')} />
                      )}
                    </div>
                  </td>
                  <td className="text-center font-bold">{s.points}</td>
                  <td className="text-center hidden sm:table-cell">{s.played}</td>
                  <td className="text-center hidden sm:table-cell">{s.wins}</td>
                  <td className="text-center hidden sm:table-cell">{s.draws}</td>
                  <td className="text-center hidden sm:table-cell">{s.losses}</td>
                  <td className={`text-center font-semibold ${
                    s.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-400'
                    : s.goalDifference < 0 ? 'text-rose-600 dark:text-rose-400' : ''
                  }`}>
                    {s.goalDifference > 0 ? '+' : ''}{s.goalDifference}
                  </td>
                  <td className="text-center sm:hidden">{s.goalsFor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Aviso de empate manual */}
      {ties.length > 0 && (
        <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
          <Icon icon={icons.warning} className="text-amber-500 mr-1" />
          Empate sem critério decisivo entre&nbsp;
          {ties.map((tiedTeams, i) => (
            <span key={i} className="font-semibold">
              {tiedTeams.map((id) => teamById([group], id)?.code ?? id).join(' / ')}
              {i < ties.length - 1 ? ' | ' : ''}
            </span>
          ))}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {ties.flat().map((teamId) => (
              <ManualTiebreakInput
                key={teamId}
                code={teamById([group], teamId)?.code ?? teamId}
                value={manualOrder[teamId] ?? null}
                onChange={(v) => onManualOrder(teamId, v)}
              />
            ))}
          </div>
        </div>
      )}

      {/* -------- JOGOS (retráteis em mobile/tablet) -------- */}
      {/* Em desktop sempre visíveis. Em mobile/tablet, controlados via `data-open`. */}
      <div className="hidden lg:block mt-3">
        <MatchList group={group} onSetScore={onSetScore} />
      </div>
      <div className="lg:hidden">
        {/* Hint quando recolhido */}
        {!expanded && (
          <button
            type="button"
            className="
              mt-2 w-full text-[11px] text-slate-500 dark:text-slate-400
              rounded-lg border border-dashed border-slate-300/70 dark:border-slate-700/70
              py-1.5 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors
            "
            onClick={() => setExpanded(true)}
          >
            Jogos ocultos — toque para expandir
          </button>
        )}
        <div className="collapsible mt-2" data-open={expanded}>
          <div className="collapsible-inner">
            <MatchList group={group} onSetScore={onSetScore} />
          </div>
        </div>
      </div>
    </article>
  );
});

// ----------------------------------------------------------------------------
// Lista de jogos do grupo
// ----------------------------------------------------------------------------

function MatchList({
  group, onSetScore,
}: {
  group: Group;
  onSetScore: (groupId: GroupId, matchId: string, home: number | null, away: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      {[0, 1, 2].map((roundIdx) => (
        <div key={roundIdx} className="flex flex-col gap-1">
          {roundIdx > 0 && (
            <div className="text-[9px] uppercase tracking-wider text-slate-400 px-1 pt-1">
              Rodada {roundIdx + 1}
            </div>
          )}
          {group.matches.slice(roundIdx * 2, roundIdx * 2 + 2).map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              home={teamById([group], m.homeTeamId)!}
              away={teamById([group], m.awayTeamId)!}
              onScore={(home, away) => onSetScore(group.id, m.id, home, away)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Linha de um jogo
// ----------------------------------------------------------------------------

function MatchRow({
  match, home, away, onScore,
}: {
  match: Match;
  home: { name: string; code: string; flagCode: string; flag: string };
  away: { name: string; code: string; flagCode: string; flag: string };
  onScore: (home: number | null, away: number | null) => void;
}) {
  const isSimulated = match.source === 'simulated';
  return (
    <div
      className={[
        'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors',
        isSimulated
          ? 'bg-sky-500/10 hover:bg-sky-500/20 ring-1 ring-sky-500/20'
          : 'bg-slate-100/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70',
      ].join(' ')}
      title={isSimulated ? 'Resultado simulado' : undefined}
    >
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="truncate font-medium" title={home.name}>{home.code}</span>
        <Flag team={home as any} size="sm" />
      </div>
      <ScoreInput
        value={match.homeScore}
        onChange={(v) => onScore(v, match.awayScore)}
        ariaLabel={`${home.code} placar`}
      />
      <span className="text-slate-400 text-[10px]">×</span>
      <ScoreInput
        value={match.awayScore}
        onChange={(v) => onScore(match.homeScore, v)}
        ariaLabel={`${away.code} placar`}
      />
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <Flag team={away as any} size="sm" />
        <span className="truncate font-medium" title={away.name}>{away.code}</span>
      </div>
      {isSimulated && (
        <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 shrink-0" title="Simulado">
          SIM
        </span>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Badge de progresso do grupo
// ----------------------------------------------------------------------------

function ProgressBadge({
  played, total, pending, complete,
}: { played: number; total: number; pending: number; complete: boolean }) {
  if (complete) {
    return (
      <span className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30">
        <Icon icon={icons.qualified} /> Completo
      </span>
    );
  }
  if (played === 0) {
    return (
      <span className="chip bg-slate-500/10 text-slate-500 dark:text-slate-300 ring-1 ring-slate-500/20">
        {total} jogos
      </span>
    );
  }
  return (
    <span className="chip bg-brand-500/15 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/25">
      {played}/{total}
      <span className="hidden sm:inline">&nbsp;preenchidos</span>
      <span className="text-slate-400 mx-1 hidden sm:inline">·</span>
      <span className="hidden sm:inline">{pending} pendente{pending === 1 ? '' : 's'}</span>
    </span>
  );
}

function ManualTiebreakInput({
  code, value, onChange,
}: {
  code: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1 text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-amber-400/40">
      <span className="font-semibold">{code}</span>
      <input
        type="number"
        className="w-10 score-input h-6 text-[10px]"
        value={value === null ? '' : value}
        placeholder="ordem"
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') return onChange(null);
          const n = parseInt(v, 10);
          if (Number.isNaN(n)) return;
          onChange(n);
        }}
      />
    </label>
  );
}
