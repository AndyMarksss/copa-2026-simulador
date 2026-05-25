import React, { useState } from 'react';
import type { KnockoutMatch, Match, Team, TournamentState } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import type { TabId } from './AppTabs';
import { teamById } from '../data/groups';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { ScoreInput } from './ScoreInput';
import { ROUND_LABELS } from '../data/knockoutBracket';
import type { AnyMatch, MatchStatus } from '../logic/matchStatus';

// ---------------------------------------------------------------------------
// MatchCard — card de jogo compartilhado entre Dashboard e aba Jogos.
//
//   variant="compact"  → Dashboard. Sem edição. Card inteiro é clicável.
//   variant="full"     → Aba Jogos. Inputs de placar (com prorrogação +
//                        pênaltis para mata-mata), botão "Ver no grupo/chave"
//                        e clique no nome da seleção para abrir o grupo.
//
// A informação de fase/rodada aparece primeiro, depois o horário (a regra de
// hierarquia visual do projeto).
// ---------------------------------------------------------------------------

export interface MatchItem {
  match: AnyMatch;
  type: 'group' | 'knockout';
  status: MatchStatus;
}

interface MatchCardBase {
  item: MatchItem;
  state: TournamentState;
  isHighlighted?: boolean;
}

interface MatchCardCompact extends MatchCardBase {
  variant: 'compact';
  onClick: () => void;
}

interface MatchCardFull extends MatchCardBase {
  variant: 'full';
  api: TournamentApi;
  onNavigateContext: (tab: TabId) => void;
  /** Chamado ao tocar no nome da seleção (navega para Grupos com destaque). */
  onTeamClick: (teamId: string) => void;
}

export type MatchCardProps = MatchCardCompact | MatchCardFull;

export function MatchCard(props: MatchCardProps) {
  const { item, state, isHighlighted } = props;
  const { match, type, status } = item;
  const isKO = type === 'knockout';
  const ko = isKO ? (match as KnockoutMatch) : null;
  const grp = !isKO ? (match as Match) : null;

  const homeId = isKO ? ko!.homeTeamId : grp!.homeTeamId;
  const awayId = isKO ? ko!.awayTeamId : grp!.awayTeamId;
  const home = teamById(state.groups, homeId);
  const away = teamById(state.groups, awayId);

  const stage = isKO ? ROUND_LABELS[ko!.round] : (grp!.stage ?? `Grupo ${grp!.groupId}`);
  const time = match.time ?? '—';

  const homeScore = match.homeScore ?? null;
  const awayScore = match.awayScore ?? null;
  const homePens = isKO ? ko!.homePens : null;
  const awayPens = isKO ? ko!.awayPens : null;
  const source = isKO ? ko!.source : grp!.source;

  const homeIsWinner = isKO
    ? ko!.winnerTeamId !== null && ko!.winnerTeamId === homeId
    : status.isFinished && homeScore !== null && awayScore !== null && homeScore > awayScore;
  const awayIsWinner = isKO
    ? ko!.winnerTeamId !== null && ko!.winnerTeamId === awayId
    : status.isFinished && homeScore !== null && awayScore !== null && awayScore > homeScore;

  // Acento de borda por status (mesmo design nas duas variantes)
  const accent =
    status.primary === 'live'     ? 'ring-2 ring-rose-400/40 border-rose-400/30' :
    status.primary === 'today'    ? 'ring-1 ring-brand-400/30 border-brand-400/30' :
    status.primary === 'finished' ? 'border-emerald-400/25' :
    status.primary === 'past'     ? 'border-amber-400/25' : '';

  // -------------------- variante COMPACT (Dashboard) --------------------
  if (props.variant === 'compact') {
    return (
      <button
        type="button"
        data-match-id={(match as { id: string }).id}
        onClick={props.onClick}
        className={[
          'card card-compact !p-3 animate-fade-in w-full text-left',
          'flex flex-col gap-2 min-w-0',
          'hover:shadow-glow hover:-translate-y-0.5 transition-all active:scale-[.99]',
          'focus:outline-none focus:ring-2 focus:ring-brand-400/40',
          accent,
          isHighlighted ? 'match-highlight' : '',
        ].join(' ')}
      >
        <CardHeader stage={stage} time={time} status={status} source={source} compact />
        <div className="flex items-center gap-2 text-sm min-w-0">
          <TeamLine team={home} align="left" winner={homeIsWinner} compact />
          <ScoreCenter
            finished={status.isFinished}
            homeScore={homeScore} awayScore={awayScore}
            homePens={homePens} awayPens={awayPens}
          />
          <TeamLine team={away} align="right" winner={awayIsWinner} compact />
        </div>
        {match.city && (
          <footer className="flex items-center gap-1 text-[10px] text-slate-500 min-w-0">
            <Icon icon={icons.location} />
            <span className="truncate">{match.city}</span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-brand-700 dark:text-brand-300 font-semibold">
              Ver na aba Jogos <Icon icon={icons.chevronRight} />
            </span>
          </footer>
        )}
      </button>
    );
  }

  // -------------------- variante FULL (Aba Jogos) --------------------
  return (
    <FullMatchCard
      item={item}
      state={state}
      accent={accent}
      isHighlighted={!!isHighlighted}
      stage={stage}
      time={time}
      home={home}
      away={away}
      homeId={homeId}
      awayId={awayId}
      homeIsWinner={!!homeIsWinner}
      awayIsWinner={!!awayIsWinner}
      homeScore={homeScore}
      awayScore={awayScore}
      homePens={homePens}
      awayPens={awayPens}
      source={source}
      api={props.api}
      onNavigateContext={props.onNavigateContext}
      onTeamClick={props.onTeamClick}
    />
  );
}

// ---------------------------------------------------------------------------
// Variante FULL — separada para isolar o estado local de edição.
// ---------------------------------------------------------------------------

interface FullProps {
  item: MatchItem;
  state: TournamentState;
  accent: string;
  isHighlighted: boolean;
  stage: string;
  time: string;
  home: Team | undefined;
  away: Team | undefined;
  homeId: string | null;
  awayId: string | null;
  homeIsWinner: boolean;
  awayIsWinner: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
  source?: 'manual' | 'simulated';
  api: TournamentApi;
  onNavigateContext: (tab: TabId) => void;
  onTeamClick: (teamId: string) => void;
}

function FullMatchCard({
  item, accent, isHighlighted,
  stage, time, home, away, homeId, awayId,
  homeIsWinner, awayIsWinner,
  homeScore, awayScore, homePens, awayPens, source,
  api, onNavigateContext, onTeamClick,
}: FullProps) {
  const { match, type, status } = item;
  const isKO = type === 'knockout';
  const ko = isKO ? (match as KnockoutMatch) : null;

  const [editing, setEditing] = useState(false);
  const editable = !!(homeId && awayId);

  // Navegação contextual (botão à direita do footer)
  const ctx = isKO
    ? (ko!.round === 'R32'
        ? { label: 'Ver nos 16ª avos', tab: 'r32' as TabId }
        : { label: 'Ver no chaveamento', tab: 'bracket' as TabId })
    : { label: 'Ver no grupo', tab: 'groups' as TabId };

  // Apenas times de grupo abrem o histórico via clique no nome.
  // Para mata-mata, o clique simplesmente não faz nada — não há grupo único associado.
  const isGroupMatch = !isKO;

  return (
    <article
      data-match-id={(match as { id: string }).id}
      className={[
        'card card-compact !p-3 animate-fade-in flex flex-col gap-2 min-w-0',
        accent,
        isHighlighted ? 'match-highlight' : '',
      ].join(' ')}
    >
      <CardHeader stage={stage} time={time} status={status} source={source} />

      <div className="flex items-center gap-2 text-sm min-w-0">
        <TeamLine
          team={home} align="left" winner={homeIsWinner}
          onClick={isGroupMatch && homeId ? () => onTeamClick(homeId) : undefined}
        />
        <ScoreCenter
          finished={status.isFinished}
          homeScore={homeScore} awayScore={awayScore}
          homePens={homePens} awayPens={awayPens}
        />
        <TeamLine
          team={away} align="right" winner={awayIsWinner}
          onClick={isGroupMatch && awayId ? () => onTeamClick(awayId) : undefined}
        />
      </div>

      {editing && editable && (
        <ScoreEditor item={item} api={api} onDone={() => setEditing(false)} />
      )}

      <footer className="flex items-center justify-between text-[10px] text-slate-500 gap-2 min-w-0 flex-wrap">
        {match.city ? (
          <span className="flex items-center gap-1 min-w-0">
            <Icon icon={icons.location} />
            <span className="truncate">{match.city}</span>
          </span>
        ) : <span />}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {editable && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={[
                'inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 transition-colors',
                editing
                  ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
              aria-expanded={editing}
            >
              <Icon icon={editing ? icons.close : icons.simulation} />
              {editing
                ? 'Fechar'
                : (status.isFinished ? 'Editar placar' : 'Preencher placar')}
            </button>
          )}
          <button
            onClick={() => onNavigateContext(ctx.tab)}
            className="inline-flex items-center gap-1 text-brand-700 dark:text-brand-300 font-semibold hover:underline"
          >
            {ctx.label} <Icon icon={icons.chevronRight} />
          </button>
        </div>
      </footer>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes compartilhados
// ---------------------------------------------------------------------------

function CardHeader({
  stage, time, status, source, compact,
}: {
  stage: string;
  time: string;
  status: MatchStatus;
  source?: 'manual' | 'simulated';
  compact?: boolean;
}) {
  return (
    <header className="flex items-start justify-between gap-2 min-w-0">
      <div className="flex flex-col min-w-0">
        <span
          className={[
            'font-bold text-brand-700 dark:text-brand-300 leading-tight',
            compact ? 'text-[11px] uppercase tracking-wider' : 'text-[11px] uppercase tracking-wider',
          ].join(' ')}
        >
          {stage}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
          <Icon icon={icons.clock} className="text-slate-400" />
          <span className="font-mono">{time}</span>
        </span>
      </div>
      <StatusBadge status={status} source={source} />
    </header>
  );
}

function TeamLine({
  team, align, winner, compact, onClick,
}: {
  team: Team | undefined;
  align: 'left' | 'right';
  winner: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const interactive = !!onClick;
  return (
    <div className={[
      'flex-1 min-w-0 flex items-center gap-1.5',
      align === 'right' ? 'flex-row-reverse text-right' : 'text-left',
      winner ? 'font-bold text-emerald-700 dark:text-emerald-300' : '',
      compact ? 'text-[13px] sm:text-sm' : '',
    ].join(' ')}>
      <Flag team={team} size="sm" />
      {interactive ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClick!(); }}
          title={`Ver trajetória de ${team?.name ?? ''}`}
          className="
            truncate hover:underline hover:text-brand-700 dark:hover:text-brand-300
            transition-colors focus:outline-none focus:underline
          "
        >
          {team?.name ?? 'A definir'}
        </button>
      ) : (
        <span className="truncate">{team?.name ?? 'A definir'}</span>
      )}
    </div>
  );
}

function ScoreCenter({
  finished, homeScore, awayScore, homePens, awayPens,
}: {
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
}) {
  if (finished && homeScore !== null && awayScore !== null) {
    return (
      <div className="flex flex-col items-center text-sm font-bold shrink-0 px-1.5">
        <span>{homeScore} <span className="text-slate-400 text-xs">×</span> {awayScore}</span>
        {homePens !== null && awayPens !== null && (
          <span className="text-[9px] font-semibold text-rose-500">({homePens}-{awayPens} pen)</span>
        )}
      </div>
    );
  }
  return (
    <span className="text-xs text-slate-400 font-bold shrink-0 px-1.5">×</span>
  );
}

function StatusBadge({
  status, source,
}: {
  status: MatchStatus;
  source?: 'manual' | 'simulated';
}) {
  if (status.primary === 'live') {
    return (
      <span className="chip bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30 shrink-0">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Ao vivo
      </span>
    );
  }
  if (status.primary === 'today') {
    return (
      <span className="chip bg-brand-500/15 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30 shrink-0">
        <Icon icon={icons.today} /> Hoje
      </span>
    );
  }
  if (status.primary === 'upcoming') {
    return (
      <span className="chip bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30 shrink-0">
        <Icon icon={icons.upcoming} /> Próximo
      </span>
    );
  }
  if (status.primary === 'finished') {
    return (
      <span className="chip bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 shrink-0">
        <Icon icon={icons.qualified} />
        Final
        {source === 'simulated' && <span className="text-[8px] uppercase opacity-70 ml-0.5">SIM</span>}
        {source === 'manual'    && <span className="text-[8px] uppercase opacity-70 ml-0.5">MAN</span>}
      </span>
    );
  }
  if (status.primary === 'past') {
    return (
      <span className="chip bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 shrink-0">
        <Icon icon={icons.warning} /> Aguardando
      </span>
    );
  }
  return (
    <span className="chip bg-slate-500/10 text-slate-500 dark:text-slate-300 ring-1 ring-slate-500/20 shrink-0">
      <Icon icon={icons.pending} /> Pendente
    </span>
  );
}

// ---------------------------------------------------------------------------
// Editor inline (apenas variant="full")
// ---------------------------------------------------------------------------

function ScoreEditor({
  item, api, onDone,
}: {
  item: MatchItem;
  api: TournamentApi;
  onDone: () => void;
}) {
  const { match, type } = item;
  const isKO = type === 'knockout';

  if (!isKO) {
    const m = match as Match;
    return (
      <div className="rounded-lg bg-slate-100/70 dark:bg-slate-800/40 px-2 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            Editar placar — fase de grupos
          </span>
          {m.source && (
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              {m.source === 'simulated' ? 'Simulado' : 'Manual'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <ScoreInput
            value={m.homeScore}
            onChange={(v) => api.setGroupMatchScore(m.groupId, m.id, v, m.awayScore)}
            ariaLabel="Placar mandante"
            size="md"
          />
          <span className="text-slate-400 text-sm font-bold">×</span>
          <ScoreInput
            value={m.awayScore}
            onChange={(v) => api.setGroupMatchScore(m.groupId, m.id, m.homeScore, v)}
            ariaLabel="Placar visitante"
            size="md"
          />
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            className="text-[10px] font-semibold text-rose-600 dark:text-rose-300 hover:underline"
            onClick={() => api.setGroupMatchScore(m.groupId, m.id, null, null)}
          >
            Limpar
          </button>
          <button
            type="button"
            className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 hover:underline"
            onClick={onDone}
          >
            Concluído
          </button>
        </div>
      </div>
    );
  }

  const m = match as KnockoutMatch;
  const tied =
    m.homeScore !== null && m.awayScore !== null && m.homeScore === m.awayScore;
  const tiedAfterExtra =
    tied &&
    m.homeExtra !== null && m.awayExtra !== null &&
    (m.homeScore ?? 0) + m.homeExtra === (m.awayScore ?? 0) + m.awayExtra;

  return (
    <div className="rounded-lg bg-slate-100/70 dark:bg-slate-800/40 px-2 py-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Editar placar — mata-mata
        </span>
        {m.source && (
          <span className="text-[9px] font-bold text-slate-500 uppercase">
            {m.source === 'simulated' ? 'Simulado' : 'Manual'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-500">Tempo normal</span>
        <div className="flex items-center justify-center gap-3">
          <ScoreInput
            value={m.homeScore}
            onChange={(v) => api.setKnockoutScore(m.id, 'home', v)}
            ariaLabel="Placar mandante (tempo normal)"
            size="md"
          />
          <span className="text-slate-400 text-sm font-bold">×</span>
          <ScoreInput
            value={m.awayScore}
            onChange={(v) => api.setKnockoutScore(m.id, 'away', v)}
            ariaLabel="Placar visitante (tempo normal)"
            size="md"
          />
        </div>
      </div>

      {tied && (
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
            Prorrogação (gols adicionais)
          </span>
          <div className="flex items-center justify-center gap-3">
            <ScoreInput
              value={m.homeExtra}
              onChange={(v) => api.setKnockoutScore(m.id, 'homeExtra', v)}
              ariaLabel="Gols prorrogação mandante"
              size="md"
              tone="amber"
            />
            <span className="text-slate-400 text-sm font-bold">×</span>
            <ScoreInput
              value={m.awayExtra}
              onChange={(v) => api.setKnockoutScore(m.id, 'awayExtra', v)}
              ariaLabel="Gols prorrogação visitante"
              size="md"
              tone="amber"
            />
          </div>
        </div>
      )}

      {tiedAfterExtra && (
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold">
            Pênaltis
          </span>
          <div className="flex items-center justify-center gap-3">
            <ScoreInput
              value={m.homePens}
              onChange={(v) => api.setKnockoutScore(m.id, 'homePens', v)}
              ariaLabel="Pênaltis mandante"
              size="md"
              tone="rose"
            />
            <span className="text-slate-400 text-sm font-bold">×</span>
            <ScoreInput
              value={m.awayPens}
              onChange={(v) => api.setKnockoutScore(m.id, 'awayPens', v)}
              ariaLabel="Pênaltis visitante"
              size="md"
              tone="rose"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          className="text-[10px] font-semibold text-rose-600 dark:text-rose-300 hover:underline"
          onClick={() => {
            api.setKnockoutScore(m.id, 'home', null);
            api.setKnockoutScore(m.id, 'away', null);
            api.setKnockoutScore(m.id, 'homeExtra', null);
            api.setKnockoutScore(m.id, 'awayExtra', null);
            api.setKnockoutScore(m.id, 'homePens', null);
            api.setKnockoutScore(m.id, 'awayPens', null);
          }}
        >
          Limpar
        </button>
        <button
          type="button"
          className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 hover:underline"
          onClick={onDone}
        >
          Concluído
        </button>
      </div>
    </div>
  );
}
