import React, { useEffect, useRef, useState } from 'react';
import type { GroupId } from '../types';
import type { TournamentApi } from '../hooks/useTournament';
import { GroupCard } from './GroupCard';
import { ThirdPlacedRanking } from './ThirdPlacedRanking';
import { TeamDetailsModal } from './TeamDetailsModal';

interface GroupStageProps {
  api: TournamentApi;
  /** Quando informado, expande o card, rola até ele e aplica animação. */
  highlightedGroupId?: GroupId | null;
  /** Combinado com highlightedGroupId, destaca a linha da seleção. */
  highlightedTeamId?: string | null;
  /** Chamado após a animação terminar. */
  onClearHighlight?: () => void;
}

export function GroupStage({
  api, highlightedGroupId, highlightedTeamId, onClearHighlight,
}: GroupStageProps) {
  // Modal de trajetória da seleção — aberto ao clicar em uma linha da tabela.
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

  // Refs para cada GroupCard — usadas para rolar até o grupo destacado.
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!highlightedGroupId) return;
    const t1 = window.setTimeout(() => {
      const el = groupRefs.current[highlightedGroupId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    // A animação .group-highlight dura ~3s; .team-row-highlight ~2.4s.
    const t2 = window.setTimeout(() => onClearHighlight?.(), 3200);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [highlightedGroupId, highlightedTeamId, onClearHighlight]);

  return (
    <section className="space-y-5 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">Fase de Grupos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            12 grupos × 4 seleções. Os 2 primeiros + 8 melhores 3ºs avançam para os 16ª avos.
            <span className="hidden sm:inline"> Toque em uma seleção para ver a trajetória completa.</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {api.state.groups.map((g, idx) => {
          const isHighlighted = highlightedGroupId === g.id;
          return (
            <GroupCard
              key={g.id}
              ref={(el) => { groupRefs.current[g.id] = el; }}
              group={g}
              manualOrder={api.state.manualTiebreakers}
              onSetScore={api.setGroupMatchScore}
              onManualOrder={api.setManualTiebreak}
              defaultExpanded={idx === 0}
              onTeamClick={setOpenTeamId}
              highlightedTeamId={isHighlighted ? highlightedTeamId ?? null : null}
              forceExpanded={isHighlighted || undefined}
              highlighted={isHighlighted}
            />
          );
        })}
      </div>

      <ThirdPlacedRanking state={api.state} />

      <TeamDetailsModal
        state={api.state}
        teamId={openTeamId}
        onClose={() => setOpenTeamId(null)}
      />
    </section>
  );
}
