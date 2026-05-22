import React from 'react';
import type { KnockoutMatch, Team } from '../types';
import { KnockoutMatchCard } from './KnockoutMatchCard';

interface ThirdPlaceCardProps {
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

export function ThirdPlaceCard(props: ThirdPlaceCardProps) {
  return (
    <div className="w-full">
      <h4 className="text-center text-[10px] uppercase tracking-wider text-orange-600 dark:text-orange-400 font-bold mb-1">
        Disputa de 3º Lugar
      </h4>
      <KnockoutMatchCard
        match={props.match}
        home={props.home}
        away={props.away}
        slotALabel={props.slotALabel}
        slotBLabel={props.slotBLabel}
        size="compact"
        highlightWinner="thirdplace"
        onScore={props.onScore}
        onSetManualWinner={props.onSetManualWinner}
      />
    </div>
  );
}
