import React, { useMemo } from 'react';
import type { TournamentState } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { MatchCard, type MatchItem } from './MatchCard';
import { getMatchStatus } from '../logic/matchStatus';
import { useOpenTeamDetails } from './TeamDetailsContext';

// ---------------------------------------------------------------------------
// Aba "16ª avos" — agora usa o MatchCard (variant="full") para ficar
// visualmente IDÊNTICA à aba Jogos. Inclui:
//   • placar editável (tempo normal + prorrogação + pênaltis)
//   • decisão manual de vencedor em empates
//   • clique no nome da seleção → abre histórico/trajetória
//   • mesma identidade visual (badges, accent ring, footer)
// ---------------------------------------------------------------------------

interface RoundOf32Props {
  state: TournamentState;
  api: TournamentApi;
}

export function RoundOf32({ state, api }: RoundOf32Props) {
  const openTeam = useOpenTeamDetails();

  const r32 = useMemo(() => state.knockout.matches.filter((m) => m.round === 'R32'), [state.knockout.matches]);
  const r16 = useMemo(() => state.knockout.matches.filter((m) => m.round === 'R16'), [state.knockout.matches]);

  const decidedCount = r32.filter((m) => m.winnerTeamId).length;
  const anyTeamsResolved = r32.some((m) => m.homeTeamId || m.awayTeamId);

  // Transforma cada KnockoutMatch em MatchItem para o MatchCard
  const items: MatchItem[] = useMemo(() => {
    const now = new Date();
    return r32.map((m) => ({ match: m, type: 'knockout' as const, status: getMatchStatus(m, now) }));
  }, [r32]);

  return (
    <section className="space-y-5 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">16ª avos de Final</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Os 32 classificados (24 diretos + 8 melhores 3ºs) se enfrentam aqui.
            Os vencedores avançam para as oitavas.
          </p>
        </div>
        <div className="card card-compact flex items-center gap-3 text-xs">
          <span className="font-display text-3xl text-brand-600 dark:text-brand-400 leading-none">
            {decidedCount}<span className="text-slate-400 text-base">/16</span>
          </span>
          <span className="text-slate-500">jogos resolvidos</span>
        </div>
      </header>

      {!anyTeamsResolved && (
        <div className="card card-pad text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <Icon icon={icons.pending} className="text-brand-500 mt-0.5" />
          <span>
            Preencha primeiro os jogos da fase de grupos. Esta tela libera assim que
            os 24 classificados diretos e os 8 melhores terceiros forem definidos.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {items.map((item) => (
          <MatchCard
            key={(item.match as { id: string }).id}
            variant="full"
            item={item}
            state={state}
            api={api}
            onNavigateContext={() => { /* nenhuma navegação a partir desta aba */ }}
            onTeamClick={openTeam}
          />
        ))}
      </div>

      {/* Lista compacta dos 16 classificados para as oitavas */}
      <div className="card card-pad">
        <h3 className="font-display tracking-wider text-xl mb-2">
          Classificados para as Oitavas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
          {r16.map((m, idx) => (
            <QualifiedFromR32 key={m.id} label={`Oitavas ${idx + 1}`} matchSlots={[m.slotA, m.slotB]} state={state} />
          ))}
        </div>
      </div>

      {api.lastInvalidatedKnockoutIds.length > 0 && (
        <div className="card card-pad bg-amber-500/10 border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <Icon icon={icons.warning} className="text-amber-500 mt-0.5" />
          <span>
            Alterações na fase anterior invalidaram os placares de:{' '}
            <span className="font-semibold">{api.lastInvalidatedKnockoutIds.join(', ')}</span>
          </span>
        </div>
      )}
    </section>
  );
}

function QualifiedFromR32({
  label, matchSlots, state,
}: {
  label: string;
  matchSlots: [string, string];
  state: TournamentState;
}) {
  const r32 = state.knockout.matches.filter((m) => m.round === 'R32');
  const find = (slot: string) => {
    if (!slot.startsWith('W:')) return null;
    const id = slot.slice(2);
    return r32.find((m) => m.id === id)?.winnerTeamId ?? null;
  };
  const aId = find(matchSlots[0]);
  const bId = find(matchSlots[1]);
  const a = aId ? state.groups.flatMap((g) => g.teams).find((t) => t.id === aId) : null;
  const b = bId ? state.groups.flatMap((g) => g.teams).find((t) => t.id === bId) : null;
  return (
    <div className="text-xs rounded-md border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">{label}</div>
      <div className="flex flex-col gap-0.5 font-medium">
        <span className="truncate">{a ? `${a.flag ? a.flag + ' ' : ''}${a.name}` : <span className="text-slate-400">a definir</span>}</span>
        <span className="truncate">{b ? `${b.flag ? b.flag + ' ' : ''}${b.name}` : <span className="text-slate-400">a definir</span>}</span>
      </div>
    </div>
  );
}
