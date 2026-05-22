import React from 'react';
import type { KnockoutMatch, TournamentState } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import { teamById } from '../data/groups';
import { KnockoutMatchCard } from './KnockoutMatchCard';
import { FinalCard } from './FinalCard';
import { ThirdPlaceCard } from './ThirdPlaceCard';
import { MobileTournamentBracket } from './MobileTournamentBracket';

// ----------------------------------------------------------------------------
// Chaveamento visual a partir das OITAVAS.
//
// Desktop (lg+):
//   Grid de 7 colunas (cada uma minmax(0, 1fr) → cabe inteiro sem scroll).
//     │ R16 esq │ QF esq │ SF esq │ FINAL+3P │ SF dir │ QF dir │ R16 dir │
//
// Mobile / tablet (< lg):
//   Fases empilhadas verticalmente em seções:
//     Oitavas → Quartas → Semifinais → Final → 3º Lugar
//   Cada seção mostra os jogos em 1 ou 2 colunas conforme o espaço.
// ----------------------------------------------------------------------------

const SLOT_LABELS: Record<string, string> = {};
for (let i = 1; i <= 16; i++) SLOT_LABELS[`W:M${String(i).padStart(2, '0')}`] = `Vencedor M${String(i).padStart(2, '0')}`;
for (let i = 25; i <= 30; i++) SLOT_LABELS[`W:M${i}`] = `Vencedor M${i}`;
SLOT_LABELS['L:M29'] = 'Perdedor SF1';
SLOT_LABELS['L:M30'] = 'Perdedor SF2';
SLOT_LABELS['W:M29'] = 'Vencedor SF1';
SLOT_LABELS['W:M30'] = 'Vencedor SF2';

const slotLabel = (s: string) => SLOT_LABELS[s] ?? s;

interface BracketViewProps {
  state: TournamentState;
  api: TournamentApi;
}

export function BracketView({ state, api }: BracketViewProps) {
  const byId = new Map(state.knockout.matches.map((m) => [m.id, m] as const));
  const get = (id: string) => byId.get(id)!;

  const left = {
    r16: ['M17', 'M18', 'M19', 'M20'].map(get),
    qf:  ['M25', 'M26'].map(get),
    sf:  get('M29'),
  };
  const right = {
    r16: ['M21', 'M22', 'M23', 'M24'].map(get),
    qf:  ['M27', 'M28'].map(get),
    sf:  get('M30'),
  };
  const finalMatch = get('M32');
  const thirdMatch = get('M31');

  const champion = finalMatch.winnerTeamId ? teamById(state.groups, finalMatch.winnerTeamId) : null;
  const r32AnyResolved = state.knockout.matches.filter((m) => m.round === 'R32').some((m) => m.winnerTeamId);

  return (
    <section className="space-y-5 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">Chaveamento Final</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Oitavas → Quartas → Semifinais → Final, com 3º lugar abaixo. Os 16ª avos ficam na aba anterior.
          </p>
        </div>
        {champion && (
          <div className="flex items-center gap-2 text-sm font-display tracking-wider text-yellow-700 dark:text-yellow-300">
            <span className="animate-trophy text-2xl">🏆</span>
            CAMPEÃO: {champion.name}
          </div>
        )}
      </header>

      {/* Aviso somente no desktop — o mobile mostra um próprio dentro do componente. */}
      {!r32AnyResolved && (
        <div className="hidden lg:block card card-pad text-sm text-slate-600 dark:text-slate-300">
          ⏳ As oitavas serão preenchidas automaticamente assim que os jogos dos 16ª avos forem decididos.
        </div>
      )}

      {/* =================== Desktop (lg+) =================== */}
      <DesktopBracket
        left={left} right={right}
        finalMatch={finalMatch} thirdMatch={thirdMatch}
        state={state} api={api}
      />

      {/* =================== Mobile / Tablet (<lg) =================== */}
      <MobileTournamentBracket state={state} api={api} />

      {/* Aviso de placares invalidados somente no desktop — o mobile já mostra um próprio. */}
      {api.lastInvalidatedKnockoutIds.length > 0 && (
        <div className="hidden lg:block card card-pad bg-amber-500/10 border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
          ⚠️ Alterações invalidaram placares de:{' '}
          <span className="font-semibold">{api.lastInvalidatedKnockoutIds.join(', ')}</span>
        </div>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------------
// Versão desktop (lg+) — grid 7 colunas, sem overflow.
// ----------------------------------------------------------------------------

interface SidesData {
  left:  { r16: KnockoutMatch[]; qf: KnockoutMatch[]; sf: KnockoutMatch };
  right: { r16: KnockoutMatch[]; qf: KnockoutMatch[]; sf: KnockoutMatch };
  finalMatch: KnockoutMatch;
  thirdMatch: KnockoutMatch;
  state: TournamentState;
  api: TournamentApi;
}

function DesktopBracket({ left, right, finalMatch, thirdMatch, state, api }: SidesData) {
  return (
    <div className="hidden lg:grid lg:grid-cols-[repeat(7,minmax(0,1fr))] gap-2 xl:gap-3 items-stretch">
      <Column title="Oitavas"    matches={left.r16}     state={state} api={api} />
      <Column title="Quartas"    matches={left.qf}      state={state} api={api} />
      <Column title="Semifinal"  matches={[left.sf]}    state={state} api={api} />
      <CenterColumn finalMatch={finalMatch} thirdMatch={thirdMatch} state={state} api={api} />
      <Column title="Semifinal"  matches={[right.sf]}   state={state} api={api} />
      <Column title="Quartas"    matches={right.qf}     state={state} api={api} />
      <Column title="Oitavas"    matches={right.r16}    state={state} api={api} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Coluna genérica do bracket (desktop)
// ----------------------------------------------------------------------------

function Column({
  title, matches, state, api,
}: {
  title: string;
  matches: KnockoutMatch[];
  state: TournamentState;
  api: TournamentApi;
}) {
  return (
    <div className="flex flex-col justify-around gap-2 min-w-0">
      <h4 className="text-center text-[9px] uppercase tracking-wider text-slate-500 font-bold">
        {title}
      </h4>
      {matches.map((m) => (
        <KnockoutMatchCard
          key={m.id}
          match={m}
          home={teamById(state.groups, m.homeTeamId)}
          away={teamById(state.groups, m.awayTeamId)}
          slotALabel={slotLabel(m.slotA)}
          slotBLabel={slotLabel(m.slotB)}
          size="compact"
          onScore={(field, value) => api.setKnockoutScore(m.id, field, value)}
          onSetManualWinner={(teamId) => api.setManualWinner(m.id, teamId)}
        />
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Coluna central (Final + Pódio do campeão + 3º lugar) – desktop
// ----------------------------------------------------------------------------

function CenterColumn({
  finalMatch, thirdMatch, state, api,
}: {
  finalMatch: KnockoutMatch;
  thirdMatch: KnockoutMatch;
  state: TournamentState;
  api: TournamentApi;
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 min-w-0">
      <h4 className="text-center text-[10px] uppercase tracking-wider text-yellow-700 dark:text-yellow-300 font-bold">
        Grande Final
      </h4>
      <FinalCard
        match={finalMatch}
        home={teamById(state.groups, finalMatch.homeTeamId)}
        away={teamById(state.groups, finalMatch.awayTeamId)}
        slotALabel={slotLabel(finalMatch.slotA)}
        slotBLabel={slotLabel(finalMatch.slotB)}
        onScore={(field, value) => api.setKnockoutScore(finalMatch.id, field, value)}
        onSetManualWinner={(teamId) => api.setManualWinner(finalMatch.id, teamId)}
      />
      <ThirdPlaceCard
        match={thirdMatch}
        home={teamById(state.groups, thirdMatch.homeTeamId)}
        away={teamById(state.groups, thirdMatch.awayTeamId)}
        slotALabel={slotLabel(thirdMatch.slotA)}
        slotBLabel={slotLabel(thirdMatch.slotB)}
        onScore={(field, value) => api.setKnockoutScore(thirdMatch.id, field, value)}
        onSetManualWinner={(teamId) => api.setManualWinner(thirdMatch.id, teamId)}
      />
    </div>
  );
}
