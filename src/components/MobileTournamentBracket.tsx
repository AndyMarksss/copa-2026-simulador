import React from 'react';
import type { KnockoutMatch, TournamentState } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import { teamById } from '../data/groups';
import { KnockoutMatchCard } from './KnockoutMatchCard';
import { Flag } from './Flag';
import { getKnockoutWinner } from '../logic/knockout';

// ----------------------------------------------------------------------------
// Chave vertical de mata-mata para mobile/tablet (visível apenas em <lg).
//
// Estrutura simples e intuitiva:
//
//      ──── OITAVAS DE FINAL ────
//        [M17] [M18]
//        [M19] [M20]
//           ╲╱   ╲╱           ← Connector4to2 (SVG)
//      ──── QUARTAS DE FINAL ────
//        [M25] [M26]
//             ╲╱              ← Connector2to1
//      ──── SEMIFINAL ────
//             [M29]
//              │
//              ▼ (gold)
//      ╔════ GRANDE FINAL ════╗
//             [M32]
//      ╚═════════════════════╝
//
//        [M31  3º Lugar]
//
//              ▲ (gold)
//      ──── SEMIFINAL ────
//             [M30]
//             ╱╲               ← Connector2to1 invertido
//      ──── QUARTAS DE FINAL ────
//        [M27] [M28]
//           ╱╲   ╱╲            ← Connector4to2 invertido
//      ──── OITAVAS DE FINAL ────
//        [M21] [M22]
//        [M23] [M24]
//
// ----------------------------------------------------------------------------

const SLOT_LABELS: Record<string, string> = {};
for (let i = 1; i <= 16; i++) SLOT_LABELS[`W:M${String(i).padStart(2, '0')}`] = `Vencedor M${String(i).padStart(2, '0')}`;
for (let i = 25; i <= 30; i++) SLOT_LABELS[`W:M${i}`] = `Vencedor M${i}`;
SLOT_LABELS['L:M29'] = 'Perdedor SF1';
SLOT_LABELS['L:M30'] = 'Perdedor SF2';
SLOT_LABELS['W:M29'] = 'Vencedor SF1';
SLOT_LABELS['W:M30'] = 'Vencedor SF2';
const slotLabel = (s: string) => SLOT_LABELS[s] ?? s;

interface Props {
  state: TournamentState;
  api: TournamentApi;
}

export function MobileTournamentBracket({ state, api }: Props) {
  const byId = new Map(state.knockout.matches.map((m) => [m.id, m] as const));
  const get = (id: string) => byId.get(id)!;

  // Metade superior: oitavas → quartas → semi 1
  const upR16 = ['M17', 'M18', 'M19', 'M20'].map(get) as KnockoutMatch[];
  const upQF  = ['M25', 'M26'].map(get) as KnockoutMatch[];
  const upSF  = get('M29');

  // Metade inferior: semi 2 ← quartas ← oitavas
  const loSF  = get('M30');
  const loQF  = ['M27', 'M28'].map(get) as KnockoutMatch[];
  const loR16 = ['M21', 'M22', 'M23', 'M24'].map(get) as KnockoutMatch[];

  const finalMatch = get('M32');
  const thirdMatch = get('M31');
  const championId = finalMatch.winnerTeamId;
  const championTeam = championId ? teamById(state.groups, championId) : null;

  const anyR32Resolved = state.knockout.matches
    .filter((m) => m.round === 'R32').some((m) => m.winnerTeamId);

  // Conectores adquirem cor ativa quando AMBOS os jogos de origem têm vencedor.
  const upR16Active = upR16.every((m) => getKnockoutWinner(m).winner !== null);
  const upQFActive  = upQF.every((m) => getKnockoutWinner(m).winner !== null);
  const loQFActive  = loQF.every((m) => getKnockoutWinner(m).winner !== null);
  const loR16Active = loR16.every((m) => getKnockoutWinner(m).winner !== null);
  const upSFActive  = getKnockoutWinner(upSF).winner !== null;
  const loSFActive  = getKnockoutWinner(loSF).winner !== null;

  return (
    <div className="lg:hidden space-y-3">
      {/* Aviso (apenas uma vez) */}
      {!anyR32Resolved && (
        <div className="card card-pad text-sm text-slate-600 dark:text-slate-300">
          ⏳ As oitavas serão preenchidas automaticamente após a conclusão dos 16ª avos.
        </div>
      )}

      {/* Campeão (acima da chave) */}
      {championTeam && <ChampionBanner team={championTeam} />}

      {/* ============== METADE SUPERIOR ============== */}

      <PhaseLabel name="Oitavas de Final" />
      <FourGrid matches={upR16} state={state} api={api} />

      <Connector4to2 active={upR16Active} />

      <PhaseLabel name="Quartas de Final" />
      <TwoGrid matches={upQF} state={state} api={api} accent="qf" />

      <Connector2to1 active={upQFActive} />

      <PhaseLabel name="Semifinal" accent="brand" />
      <SingleCard match={upSF} state={state} api={api} accent="sf" />

      <PremiumArrow direction="down" active={upSFActive} />

      {/* ============== GRANDE FINAL ============== */}

      <FinalSection match={finalMatch} state={state} api={api} />

      <ThirdPlaceSection match={thirdMatch} state={state} api={api} />

      <PremiumArrow direction="up" active={loSFActive} />

      {/* ============== METADE INFERIOR ============== */}

      <PhaseLabel name="Semifinal" accent="brand" />
      <SingleCard match={loSF} state={state} api={api} accent="sf" />

      <Connector2to1 active={loQFActive} flipped />

      <PhaseLabel name="Quartas de Final" />
      <TwoGrid matches={loQF} state={state} api={api} accent="qf" />

      <Connector4to2 active={loR16Active} flipped />

      <PhaseLabel name="Oitavas de Final" />
      <FourGrid matches={loR16} state={state} api={api} />

      {api.lastInvalidatedKnockoutIds.length > 0 && (
        <div className="card card-pad bg-amber-500/10 border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 mt-4">
          ⚠️ Alterações invalidaram placares de:{' '}
          <span className="font-semibold">{api.lastInvalidatedKnockoutIds.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

// ---- Cabeçalho de uma fase ----

function PhaseLabel({ name, accent }: { name: string; accent?: 'brand' }) {
  const color = accent === 'brand'
    ? 'text-brand-700 dark:text-brand-300'
    : 'text-slate-500 dark:text-slate-400';
  return (
    <div className={`flex items-center gap-2 justify-center text-[10px] uppercase tracking-widest font-bold ${color} pt-1`}>
      <span className="h-px flex-1 max-w-[90px] bg-current opacity-30" />
      <span>{name}</span>
      <span className="h-px flex-1 max-w-[90px] bg-current opacity-30" />
    </div>
  );
}

// ---- Grids ----

function FourGrid({
  matches, state, api,
}: { matches: KnockoutMatch[]; state: TournamentState; api: TournamentApi }) {
  return (
    <div className="grid grid-cols-2 gap-2 min-w-0">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} state={state} api={api} />
      ))}
    </div>
  );
}

function TwoGrid({
  matches, state, api, accent,
}: {
  matches: KnockoutMatch[];
  state: TournamentState;
  api: TournamentApi;
  accent?: 'qf' | 'sf';
}) {
  return (
    <div className="grid grid-cols-2 gap-2 min-w-0">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} state={state} api={api} accent={accent} />
      ))}
    </div>
  );
}

function SingleCard({
  match, state, api, accent,
}: {
  match: KnockoutMatch;
  state: TournamentState;
  api: TournamentApi;
  accent?: 'qf' | 'sf';
}) {
  return (
    <div className="mx-auto w-full max-w-[300px] min-w-0">
      <MatchCard match={match} state={state} api={api} accent={accent} size="full" />
    </div>
  );
}

// ---- Card base com leve destaque por fase ----

function MatchCard({
  match, state, api, accent, size = 'compact',
}: {
  match: KnockoutMatch;
  state: TournamentState;
  api: TournamentApi;
  accent?: 'qf' | 'sf';
  size?: 'compact' | 'full';
}) {
  const ring =
    accent === 'sf' ? 'ring-1 ring-brand-400/40 bg-gradient-to-br from-brand-500/15 via-brand-500/5 to-transparent rounded-xl'
    : accent === 'qf' ? 'ring-1 ring-brand-400/20 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent rounded-xl'
    : '';
  return (
    <div className={`${ring} animate-fade-in`}>
      <KnockoutMatchCard
        match={match}
        home={teamById(state.groups, match.homeTeamId)}
        away={teamById(state.groups, match.awayTeamId)}
        slotALabel={slotLabel(match.slotA)}
        slotBLabel={slotLabel(match.slotB)}
        size={size}
        onScore={(field, value) => api.setKnockoutScore(match.id, field, value)}
        onSetManualWinner={(teamId) => api.setManualWinner(match.id, teamId)}
      />
    </div>
  );
}

// ---- Conectores SVG ----

/**
 * 4 → 2: dois pares lado a lado, cada par mergeando em um nó central.
 * Geometria pareada para parecer a chave real.
 */
function Connector4to2({ active, flipped }: { active: boolean; flipped?: boolean }) {
  const stroke = active ? '#d4af37' : 'rgba(58, 161, 255, 0.55)';
  const dot = active ? '#d4af37' : '#3aa1ff';
  const transform = flipped ? 'scale(1, -1) translate(0, -32)' : undefined;
  return (
    <div className="mx-auto w-full max-w-[420px] h-7" aria-hidden>
      <svg viewBox="0 0 400 32" className="w-full h-full" preserveAspectRatio="none">
        <g transform={transform}>
          {/* Par esquerdo: dois cards (M17, M18) → M25 */}
          <path d="M 55 0 L 55 14 L 110 14 L 110 32" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 165 0 L 165 14 L 110 14 L 110 32" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="110" cy="14" r="3.5" fill={dot} />
          {/* Par direito: dois cards (M19, M20) → M26 */}
          <path d="M 235 0 L 235 14 L 290 14 L 290 32" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 345 0 L 345 14 L 290 14 L 290 32" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="290" cy="14" r="3.5" fill={dot} />
        </g>
      </svg>
    </div>
  );
}

/**
 * 2 → 1: dois cards merging em um centralizado.
 */
function Connector2to1({ active, flipped }: { active: boolean; flipped?: boolean }) {
  const stroke = active ? '#d4af37' : 'rgba(58, 161, 255, 0.6)';
  const dot = active ? '#d4af37' : '#3aa1ff';
  const transform = flipped ? 'scale(1, -1) translate(0, -32)' : undefined;
  return (
    <div className="mx-auto w-full max-w-[300px] h-8" aria-hidden>
      <svg viewBox="0 0 200 32" className="w-full h-full" preserveAspectRatio="none">
        <g transform={transform}>
          <path d="M 55 0 L 55 16 L 100 16 L 100 32" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 145 0 L 145 16 L 100 16 L 100 32" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="100" cy="16" r="4" fill={dot} />
        </g>
      </svg>
    </div>
  );
}

/**
 * Seta vertical dourada para destacar a entrada/saída da Final.
 */
function PremiumArrow({
  direction, active,
}: { direction: 'down' | 'up'; active: boolean }) {
  const color = active ? '#d4af37' : 'rgba(212, 175, 55, 0.55)';
  return (
    <div className="flex flex-col items-center gap-1.5 py-1.5" aria-hidden>
      {direction === 'up' && (
        <span className="text-base font-bold" style={{ color }}>▲</span>
      )}
      <span
        className="w-px h-7 rounded"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${color}, ${color}AA, ${color})`,
        }}
      />
      {direction === 'down' && (
        <span className="text-base font-bold" style={{ color }}>▼</span>
      )}
    </div>
  );
}

// ---- Final premium ----

function FinalSection({
  match, state, api,
}: { match: KnockoutMatch; state: TournamentState; api: TournamentApi }) {
  const dateLabel = match.date
    ? `${match.date.split('-').reverse().slice(0, 2).join('/')}${match.time ? ` · ${match.time}` : ''}`
    : 'Data a definir';
  return (
    <section
      className="
        rounded-2xl p-3 sm:p-4
        bg-gradient-to-br from-yellow-400/20 via-amber-400/10 to-orange-400/5
        border-2 border-yellow-400/50 shadow-gold animate-glow
      "
    >
      <header className="flex items-center justify-center gap-2 mb-2.5">
        <span className="text-2xl animate-trophy" aria-hidden>🏆</span>
        <div className="text-center">
          <h3 className="font-display tracking-widest text-xl text-gradient-gold leading-none">
            Grande Final
          </h3>
          <p className="text-[10px] uppercase tracking-wider text-yellow-700 dark:text-yellow-300 font-bold mt-1">
            {dateLabel}
          </p>
        </div>
        <span className="text-2xl animate-trophy" aria-hidden>🏆</span>
      </header>
      <KnockoutMatchCard
        match={match}
        home={teamById(state.groups, match.homeTeamId)}
        away={teamById(state.groups, match.awayTeamId)}
        slotALabel={slotLabel(match.slotA)}
        slotBLabel={slotLabel(match.slotB)}
        size="full"
        highlightWinner="champion"
        onScore={(field, value) => api.setKnockoutScore(match.id, field, value)}
        onSetManualWinner={(teamId) => api.setManualWinner(match.id, teamId)}
      />
    </section>
  );
}

// ---- 3º lugar ----

function ThirdPlaceSection({
  match, state, api,
}: { match: KnockoutMatch; state: TournamentState; api: TournamentApi }) {
  return (
    <section className="rounded-2xl p-3 border border-orange-400/35 bg-gradient-to-br from-orange-400/10 via-orange-400/5 to-transparent">
      <header className="flex items-center justify-center gap-2 mb-2">
        <span className="text-lg" aria-hidden>🥉</span>
        <h3 className="font-display tracking-wider text-base text-orange-700 dark:text-orange-300">
          Disputa de 3º Lugar
        </h3>
      </header>
      <KnockoutMatchCard
        match={match}
        home={teamById(state.groups, match.homeTeamId)}
        away={teamById(state.groups, match.awayTeamId)}
        slotALabel={slotLabel(match.slotA)}
        slotBLabel={slotLabel(match.slotB)}
        size="full"
        highlightWinner="thirdplace"
        onScore={(field, value) => api.setKnockoutScore(match.id, field, value)}
        onSetManualWinner={(teamId) => api.setManualWinner(match.id, teamId)}
      />
    </section>
  );
}

// ---- Banner do campeão ----

function ChampionBanner({
  team,
}: {
  team: { name: string; flagCode: string; flag: string; code: string };
}) {
  return (
    <section
      className="
        rounded-2xl p-4 text-center
        bg-gradient-to-br from-yellow-400/30 via-amber-400/15 to-orange-400/10
        border border-yellow-400/50 shadow-gold animate-glow
      "
    >
      <div className="text-5xl animate-trophy" aria-hidden>🏆</div>
      <div className="mt-1 flex flex-col items-center gap-1">
        <Flag team={team as any} size="xl" />
        <div className="font-display tracking-widest text-2xl text-gradient-gold">
          {team.name}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-yellow-700 dark:text-yellow-300 font-bold">
          Campeão Mundial 2026
        </div>
      </div>
    </section>
  );
}
