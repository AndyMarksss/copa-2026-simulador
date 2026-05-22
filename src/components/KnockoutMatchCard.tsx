import React from 'react';
import type { KnockoutMatch, Team } from '../types';
import { ScoreInput } from './ScoreInput';
import { Badge } from './Badge';
import { Flag } from './Flag';
import { needsExtraTime, needsPenalties, getKnockoutWinner } from '../logic/knockout';

// ----------------------------------------------------------------------------
// Card de jogo eliminatório.
//
//   • Tempo normal sempre visível em destaque.
//   • Empate → linha de prorrogação aparece automaticamente.
//   • Ainda empate → linha de pênaltis aparece automaticamente.
//   • Botão "Definir vencedor manualmente" para casos excepcionais.
//
//   Tamanhos:
//     - "compact":  usado no chaveamento (oitavas → final) — UI minimalista
//                   para caber em colunas estreitas (grid 7 colunas).
//     - "full":     usado na aba R32 e na FinalCard — mais espaço para tudo.
// ----------------------------------------------------------------------------

interface KnockoutMatchCardProps {
  match: KnockoutMatch;
  home: Team | undefined;
  away: Team | undefined;
  slotALabel: string;
  slotBLabel: string;
  size?: 'compact' | 'full';
  highlightWinner?: 'champion' | 'thirdplace' | null;
  onScore: (
    field: 'home' | 'away' | 'homeExtra' | 'awayExtra' | 'homePens' | 'awayPens',
    value: number | null,
  ) => void;
  onSetManualWinner?: (teamId: string | null) => void;
}

export function KnockoutMatchCard({
  match, home, away, slotALabel, slotBLabel,
  size = 'compact', highlightWinner, onScore, onSetManualWinner,
}: KnockoutMatchCardProps) {
  const { winner } = getKnockoutWinner(match);
  const wantsExtra = needsExtraTime(match);
  const wantsPens  = needsPenalties(match);
  const isHomeWinner = winner !== null && winner === match.homeTeamId;
  const isAwayWinner = winner !== null && winner === match.awayTeamId;

  const isFull = size === 'full';

  return (
    <article
      className={[
        'bracket-card animate-pop-in',
        isFull ? 'card-pad' : '',
        highlightWinner === 'champion'   ? 'ring-2 ring-yellow-400 shadow-gold' : '',
        highlightWinner === 'thirdplace' ? 'ring-1 ring-orange-400'             : '',
      ].join(' ')}
    >
      {/* Cabeçalho compacto: ID + data */}
      <header className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 min-w-0 gap-1">
        <span className="font-bold shrink-0">{match.id}</span>
        <span className="font-medium normal-case tracking-normal text-slate-500 truncate">
          {match.date
            ? `${match.date.split('-').reverse().slice(0, 2).join('/')} · ${match.time ?? ''}`
            : ''}
        </span>
        {match.source === 'simulated' && (
          <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 shrink-0" title="Resultado simulado">SIM</span>
        )}
        {highlightWinner === 'champion'   && <span className="text-yellow-600 dark:text-yellow-400 font-bold shrink-0">FINAL</span>}
        {highlightWinner === 'thirdplace' && <span className="text-orange-600 dark:text-orange-400 font-bold shrink-0">3º</span>}
      </header>

      <Side
        team={home}
        slotLabel={slotALabel}
        score={match.homeScore}
        extra={match.homeExtra}
        pens={match.homePens}
        isWinner={isHomeWinner}
        otherDefined={Boolean(winner)}
        showExtra={wantsExtra}
        showPens={wantsPens}
        onScore={(v) => onScore('home', v)}
        onExtra={(v) => onScore('homeExtra', v)}
        onPens={(v) => onScore('homePens', v)}
        size={size}
      />
      <div className="my-0.5 border-t border-slate-200/50 dark:border-slate-800/50" />
      <Side
        team={away}
        slotLabel={slotBLabel}
        score={match.awayScore}
        extra={match.awayExtra}
        pens={match.awayPens}
        isWinner={isAwayWinner}
        otherDefined={Boolean(winner)}
        showExtra={wantsExtra}
        showPens={wantsPens}
        onScore={(v) => onScore('away', v)}
        onExtra={(v) => onScore('awayExtra', v)}
        onPens={(v) => onScore('awayPens', v)}
        size={size}
      />

      {/* Rodapé minimalista (compact) ou completo (full) */}
      {isFull ? (
        <footer className="mt-2 flex items-center justify-between gap-2 text-[11px] flex-wrap">
          <StatusBadge match={match} wantsExtra={wantsExtra} wantsPens={wantsPens} winner={winner}
                       homeName={home?.name} awayName={away?.name} isHomeWinner={isHomeWinner} />
          {(wantsPens || (wantsExtra && !winner)) && onSetManualWinner && match.homeTeamId && match.awayTeamId && (
            <details className="ml-auto text-[10px]">
              <summary className="cursor-pointer text-brand-700 dark:text-brand-300 hover:underline">
                Definir vencedor manualmente
              </summary>
              <div className="mt-1 flex gap-1">
                <button className="btn-soft !py-1 !px-2 text-[10px]" onClick={() => onSetManualWinner(match.homeTeamId)}>{home?.code}</button>
                <button className="btn-soft !py-1 !px-2 text-[10px]" onClick={() => onSetManualWinner(match.awayTeamId)}>{away?.code}</button>
                {match.manualWinnerTeamId && (
                  <button className="btn-ghost !py-1 !px-2 text-[10px]" onClick={() => onSetManualWinner(null)}>limpar</button>
                )}
              </div>
            </details>
          )}
        </footer>
      ) : (
        (wantsExtra || wantsPens) && (
          <footer className="mt-1 text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold text-center">
            {wantsPens ? 'PÊNALTIS' : 'PRORROGAÇÃO'}
          </footer>
        )
      )}

      {isFull && (match.stadium || match.city) && (
        <div className="mt-1.5 text-[10px] text-slate-400">
          {[match.city, match.stadium].filter(Boolean).join(' · ')}
        </div>
      )}
    </article>
  );
}

// ----------------------------------------------------------------------------
// Linha de um lado (mandante ou visitante)
// ----------------------------------------------------------------------------

interface SideProps {
  team: Team | undefined;
  slotLabel: string;
  score: number | null;
  extra: number | null;
  pens: number | null;
  isWinner: boolean;
  otherDefined: boolean;
  showExtra: boolean;
  showPens: boolean;
  size: 'compact' | 'full';
  onScore: (v: number | null) => void;
  onExtra: (v: number | null) => void;
  onPens: (v: number | null) => void;
}

function Side({
  team, slotLabel, score, extra, pens, isWinner, otherDefined,
  showExtra, showPens, onScore, onExtra, onPens, size,
}: SideProps) {
  const isFull = size === 'full';

  return (
    <div className={[
      'bracket-team',
      isWinner ? 'bracket-team-winner' : (otherDefined ? 'bracket-team-loser' : ''),
    ].join(' ')}>
      <Flag team={team} size={isFull ? 'md' : 'sm'} />
      <span
        className={[
          'flex-1 min-w-0 truncate',
          isWinner ? 'font-bold' : 'font-medium',
          isFull ? 'text-sm' : 'text-fluid-xs',
        ].join(' ')}
        title={team?.name}
      >
        {team ? team.name : <span className="text-slate-400 font-normal italic">{slotLabel}</span>}
      </span>

      {/* Inputs alinhados à direita; pequenos no compact */}
      <ScoreInput
        ariaLabel="Placar"
        value={score}
        onChange={onScore}
        disabled={!team}
        size={isFull ? 'md' : 'xs'}
      />
      {showExtra && (
        <ScoreInput
          ariaLabel="Prorrogação"
          value={extra}
          onChange={onExtra}
          disabled={!team}
          size={isFull ? 'md' : 'xs'}
          tone="amber"
        />
      )}
      {showPens && (
        <ScoreInput
          ariaLabel="Pênaltis"
          value={pens}
          onChange={onPens}
          disabled={!team}
          size={isFull ? 'md' : 'xs'}
          tone="rose"
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Badge de status para o footer (full)
// ----------------------------------------------------------------------------

function StatusBadge({ match, wantsExtra, wantsPens, winner, homeName, awayName, isHomeWinner }: {
  match: KnockoutMatch;
  wantsExtra: boolean; wantsPens: boolean;
  winner: string | null;
  homeName?: string; awayName?: string; isHomeWinner: boolean;
}) {
  if (!match.homeTeamId || !match.awayTeamId) return <Badge variant="pendente" />;
  if (winner) {
    return (
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
        ✓ {(isHomeWinner ? homeName : awayName) ?? 'Vencedor definido'}
      </span>
    );
  }
  if (match.homeScore === null && match.awayScore === null) return <Badge variant="pendente" />;
  return <Badge variant="em-disputa">{wantsPens ? 'Pênaltis' : wantsExtra ? 'Prorrogação' : 'Aguardando placar'}</Badge>;
}
