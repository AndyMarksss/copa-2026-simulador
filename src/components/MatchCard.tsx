import React from 'react';
import type { KnockoutMatch, Match, Team, TournamentState } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import type { TabId } from './AppTabs';
import { teamById } from '../data/groups';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { ScoreInput } from './ScoreInput';
import { ROUND_LABELS } from '../data/knockoutBracket';
import { formatLongDate } from '../data/schedule';
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
        <CardHeader stage={stage} time={time} date={match.date} status={status} source={source} compact showDate />
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
  source?: 'manual' | 'simulated';
  api: TournamentApi;
  onNavigateContext: (tab: TabId) => void;
  onTeamClick: (teamId: string) => void;
}

function FullMatchCard({
  item, accent, isHighlighted,
  stage, time, home, away, homeId, awayId,
  homeIsWinner, awayIsWinner,
  homeScore, awayScore, source,
  api, onNavigateContext, onTeamClick,
}: FullProps) {
  const { match, type, status } = item;
  const isKO = type === 'knockout';
  const ko = isKO ? (match as KnockoutMatch) : null;
  const grp = !isKO ? (match as Match) : null;
  const editable = !!(homeId && awayId);

  // Navegação contextual (link no rodapé)
  const ctx = isKO
    ? (ko!.round === 'R32'
        ? { label: 'Ver nos 16ª avos', tab: 'r32' as TabId }
        : { label: 'Ver no chaveamento', tab: 'bracket' as TabId })
    : { label: 'Ver no grupo', tab: 'groups' as TabId };

  // Dispara a edição do placar no estado global (fonte única de verdade).
  const setHome = (v: number | null) =>
    isKO ? api.setKnockoutScore(ko!.id, 'home', v)
         : api.setGroupMatchScore(grp!.groupId, grp!.id, v, grp!.awayScore);
  const setAway = (v: number | null) =>
    isKO ? api.setKnockoutScore(ko!.id, 'away', v)
         : api.setGroupMatchScore(grp!.groupId, grp!.id, grp!.homeScore, v);

  // Mata-mata: detecta necessidade de prorrogação / pênaltis.
  const tied = isKO && homeScore !== null && awayScore !== null && homeScore === awayScore;
  const tiedAfterExtra =
    !!tied && isKO &&
    ko!.homeExtra !== null && ko!.awayExtra !== null &&
    (homeScore ?? 0) + ko!.homeExtra === (awayScore ?? 0) + ko!.awayExtra;

  return (
    <article
      data-match-id={(match as { id: string }).id}
      className={[
        'card card-compact !p-3 animate-fade-in flex flex-col gap-2.5 min-w-0',
        accent,
        isHighlighted ? 'match-highlight' : '',
      ].join(' ')}
    >
      <CardHeader stage={stage} time={time} status={status} source={source} />

      {/* Linha principal: seleção · inputs de placar · seleção (sempre visíveis) */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        <TeamLine
          team={home} align="left" winner={homeIsWinner}
          onClick={homeId ? () => onTeamClick(homeId) : undefined}
        />
        <InlineScore
          editable={editable}
          homeScore={homeScore}
          awayScore={awayScore}
          onHome={setHome}
          onAway={setAway}
        />
        <TeamLine
          team={away} align="right" winner={awayIsWinner}
          onClick={awayId ? () => onTeamClick(awayId) : undefined}
        />
      </div>

      {/* Mata-mata empatado → prorrogação / pênaltis / decisão manual (auto) */}
      {isKO && editable && tied && (
        <KnockoutExtras
          ko={ko!}
          api={api}
          homeCode={home?.code}
          awayCode={away?.code}
          showPens={tiedAfterExtra}
        />
      )}

      <footer className="flex items-center justify-between text-[10px] text-slate-500 gap-2 min-w-0">
        {match.city ? (
          <span className="flex items-center gap-1 min-w-0">
            <Icon icon={icons.location} />
            <span className="truncate">{match.city}</span>
          </span>
        ) : <span />}
        <button
          onClick={() => onNavigateContext(ctx.tab)}
          className="inline-flex items-center gap-1 text-brand-700 dark:text-brand-300 font-semibold hover:underline shrink-0"
        >
          {ctx.label} <Icon icon={icons.chevronRight} />
        </button>
      </footer>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Placar inline (sempre visível na aba Jogos)
// ---------------------------------------------------------------------------

function InlineScore({
  editable, homeScore, awayScore, onHome, onAway,
}: {
  editable: boolean;
  homeScore: number | null;
  awayScore: number | null;
  onHome: (v: number | null) => void;
  onAway: (v: number | null) => void;
}) {
  if (!editable) {
    // Jogo sem times definidos (mata-mata futuro): placeholder neutro.
    return <span className="text-xs text-slate-400 font-bold shrink-0 px-1.5">×</span>;
  }
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <ScoreInput value={homeScore} onChange={onHome} ariaLabel="Placar mandante" size="md" />
      <span className="text-slate-400 text-xs font-bold">×</span>
      <ScoreInput value={awayScore} onChange={onAway} ariaLabel="Placar visitante" size="md" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes compartilhados
// ---------------------------------------------------------------------------

function CardHeader({
  stage, time, date, status, source, compact, showDate,
}: {
  stage: string;
  time: string;
  date?: string;
  status: MatchStatus;
  source?: 'manual' | 'simulated';
  compact?: boolean;
  /** Se true, mostra a data formatada antes do horário. Padrão: false. */
  showDate?: boolean;
}) {
  const dayLabel = showDate && date ? formatLongDate(date) : null;
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
        <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
          {dayLabel && (
            <>
              <Icon icon={icons.calendar} className="text-slate-400" />
              <span>{dayLabel}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
            </>
          )}
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
// Extras do mata-mata (prorrogação · pênaltis · decisão manual)
//   Aparece automaticamente abaixo do placar quando o jogo está empatado.
//   O placar do tempo normal fica nos inputs centrais (InlineScore).
// ---------------------------------------------------------------------------

function KnockoutExtras({
  ko, api, homeCode, awayCode, showPens,
}: {
  ko: KnockoutMatch;
  api: TournamentApi;
  homeCode?: string;
  awayCode?: string;
  showPens: boolean;
}) {
  const homeT = ko.homeTeamId;
  const awayT = ko.awayTeamId;

  return (
    <div className="rounded-lg bg-slate-100/70 dark:bg-slate-800/40 px-2.5 py-2 flex flex-col gap-2 text-[11px]">
      {/* Prorrogação */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 font-semibold">
          Prorrogação
        </span>
        <div className="flex items-center gap-1.5">
          <ScoreInput
            value={ko.homeExtra}
            onChange={(v) => api.setKnockoutScore(ko.id, 'homeExtra', v)}
            ariaLabel="Gols prorrogação mandante"
            size="sm"
            tone="amber"
          />
          <span className="text-slate-400 text-xs font-bold">×</span>
          <ScoreInput
            value={ko.awayExtra}
            onChange={(v) => api.setKnockoutScore(ko.id, 'awayExtra', v)}
            ariaLabel="Gols prorrogação visitante"
            size="sm"
            tone="amber"
          />
        </div>
      </div>

      {/* Pênaltis (quando o agregado segue empatado após a prorrogação) */}
      {showPens && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300 font-semibold">
            Pênaltis
          </span>
          <div className="flex items-center gap-1.5">
            <ScoreInput
              value={ko.homePens}
              onChange={(v) => api.setKnockoutScore(ko.id, 'homePens', v)}
              ariaLabel="Pênaltis mandante"
              size="sm"
              tone="rose"
            />
            <span className="text-slate-400 text-xs font-bold">×</span>
            <ScoreInput
              value={ko.awayPens}
              onChange={(v) => api.setKnockoutScore(ko.id, 'awayPens', v)}
              ariaLabel="Pênaltis visitante"
              size="sm"
              tone="rose"
            />
          </div>
        </div>
      )}

      {/* Decisão manual de vencedor (override, útil em empate total) */}
      {homeT && awayT && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Vencedor
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => api.setManualWinner(ko.id, homeT)}
              className={[
                'btn-soft !py-1 !px-2 text-[11px]',
                ko.manualWinnerTeamId === homeT ? 'ring-2 ring-brand-500' : '',
              ].join(' ')}
            >
              {homeCode ?? 'Mandante'}
            </button>
            <button
              type="button"
              onClick={() => api.setManualWinner(ko.id, awayT)}
              className={[
                'btn-soft !py-1 !px-2 text-[11px]',
                ko.manualWinnerTeamId === awayT ? 'ring-2 ring-brand-500' : '',
              ].join(' ')}
            >
              {awayCode ?? 'Visitante'}
            </button>
            {ko.manualWinnerTeamId && (
              <button
                type="button"
                onClick={() => api.setManualWinner(ko.id, null)}
                className="btn-ghost !py-1 !px-2 text-[11px]"
              >
                limpar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
