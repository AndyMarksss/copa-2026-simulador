import React from 'react';
import type { TournamentApi } from '../hooks/useTournament';
import { GroupCard } from './GroupCard';
import { ThirdPlacedRanking } from './ThirdPlacedRanking';

interface GroupStageProps {
  api: TournamentApi;
}

export function GroupStage({ api }: GroupStageProps) {
  return (
    <section className="space-y-5 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">Fase de Grupos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            12 grupos × 4 seleções. Os 2 primeiros + 8 melhores 3ºs avançam para os 16ª avos.
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
          />
        ))}
      </div>

      <ThirdPlacedRanking state={api.state} />
    </section>
  );
}
