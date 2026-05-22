import React from 'react';
import type { KnockoutMatch, Team } from '../types';
import { KnockoutMatchCard } from './KnockoutMatchCard';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { icons } from '../utils/icons';
import { getKnockoutWinner } from '../logic/knockout';

interface FinalCardProps {
  match: KnockoutMatch;
  home: Team | undefined;
  away: Team | undefined;
  slotALabel: string;
  slotBLabel: string;
  onScore: (
    field: 'home' | 'away' | 'homeExtra' | 'awayExtra' | 'homePens' | 'awayPens',
    value: number | null,
  ) => void;
  onSetManualWinner: (teamId: string | null) => void;
}

export function FinalCard({
  match, home, away, slotALabel, slotBLabel, onScore, onSetManualWinner,
}: FinalCardProps) {
  const { winner } = getKnockoutWinner(match);
  const championTeam = winner === home?.id ? home : winner === away?.id ? away : undefined;

  return (
    <div className="w-full min-w-0 flex flex-col gap-2">
      {/* Faixa do campeão acima do card da final */}
      {championTeam && (
        <div
          className="rounded-xl px-2.5 py-2 text-center
                     bg-gradient-to-br from-yellow-400/20 via-amber-400/15 to-orange-400/10
                     border border-yellow-400/40 animate-glow"
        >
          <Icon icon={icons.trophy} className="text-2xl text-yellow-500 animate-trophy" />
          <div className="mt-0.5 flex flex-col items-center gap-0.5">
            <Flag team={championTeam} size="lg" />
            <div className="font-display tracking-widest text-base sm:text-lg text-gradient-gold truncate w-full">
              {championTeam.name}
            </div>
            <div className="text-[9px] uppercase tracking-widest text-yellow-700 dark:text-yellow-300 font-bold">
              Campeão Mundial
            </div>
          </div>
        </div>
      )}

      <KnockoutMatchCard
        match={match}
        home={home}
        away={away}
        slotALabel={slotALabel}
        slotBLabel={slotBLabel}
        size="compact"
        highlightWinner="champion"
        onScore={onScore}
        onSetManualWinner={onSetManualWinner}
      />
    </div>
  );
}
