import React, { useState } from 'react';
import type { TournamentApi } from '../hooks/useTournament';
import { GroupCard } from './GroupCard';
import { ThirdPlacedRanking } from './ThirdPlacedRanking';
import { TeamDetailsModal } from './TeamDetailsModal';

interface GroupStageProps {
  api: TournamentApi;
}

export function GroupStage({ api }: GroupStageProps) {
  // Modal de trajetória da seleção — aberto ao clicar em uma linha da tabela.
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

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

      {/* 1 col mobile · 2 cols tablet · 3 cols xl · 4 cols 2xl */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {api.state.groups.map((g, idx) => (
          <GroupCard
            key={g.id}
            group={g}
            manualOrder={api.state.manualTiebreakers}
            onSetScore={api.setGroupMatchScore}
            onManualOrder={api.setManualTiebreak}
            defaultExpanded={idx === 0}
            onTeamClick={setOpenTeamId}
          />
        ))}
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
