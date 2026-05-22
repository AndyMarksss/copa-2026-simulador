import type { KnockoutMatch, KnockoutRound, SlotId } from '../types';

// ----------------------------------------------------------------------------
// Estrutura fixa da chave eliminatória da Copa do Mundo 2026.
//
//   - Como a FIFA ainda não publicou (até esta versão) o mapeamento oficial
//     completo dos terceiros colocados, a chave abaixo segue um critério lógico
//     e simétrico:
//       • 8 confrontos: 1º de grupo  x  Melhor terceiro
//       • 4 confrontos: 1º de grupo  x  2º de outro grupo
//       • 4 confrontos: 2º de grupo  x  2º de outro grupo
//
//   - SlotIds:
//       "1A".."1L"  → vencedor do grupo
//       "2A".."2L"  → vice do grupo
//       "3#1".."3#8" → terceiros classificados, em ordem de ranking
//       "W:M01"     → vencedor da partida M01
//       "L:M29"     → perdedor da partida M29 (usado na disputa de 3º lugar)
//
//   Para alterar qualquer confronto, basta editar slotA / slotB abaixo.
// ----------------------------------------------------------------------------

interface PairingTemplate {
  id: string;
  round: KnockoutRound;
  slotA: SlotId;
  slotB: SlotId;
}

export const BRACKET_TEMPLATE: PairingTemplate[] = [
  // Rodada de 32 – metade SUPERIOR (gera as Quartas 1 e 2)
  { id: 'M01', round: 'R32', slotA: '1A', slotB: '3#1' },
  { id: 'M02', round: 'R32', slotA: '1B', slotB: '2H'  },
  { id: 'M03', round: 'R32', slotA: '1C', slotB: '3#2' },
  { id: 'M04', round: 'R32', slotA: '1D', slotB: '2I'  },
  { id: 'M05', round: 'R32', slotA: '1E', slotB: '3#3' },
  { id: 'M06', round: 'R32', slotA: '1F', slotB: '2L'  },
  { id: 'M07', round: 'R32', slotA: '1G', slotB: '3#4' },
  { id: 'M08', round: 'R32', slotA: '1H', slotB: '2J'  },

  // Rodada de 32 – metade INFERIOR (gera as Quartas 3 e 4)
  { id: 'M09', round: 'R32', slotA: '1I', slotB: '3#5' },
  { id: 'M10', round: 'R32', slotA: '1J', slotB: '2K'  },
  { id: 'M11', round: 'R32', slotA: '1K', slotB: '3#6' },
  { id: 'M12', round: 'R32', slotA: '1L', slotB: '2G'  },
  { id: 'M13', round: 'R32', slotA: '2A', slotB: '3#7' },
  { id: 'M14', round: 'R32', slotA: '2B', slotB: '3#8' },
  { id: 'M15', round: 'R32', slotA: '2C', slotB: '2F'  },
  { id: 'M16', round: 'R32', slotA: '2D', slotB: '2E'  },

  // Oitavas
  { id: 'M17', round: 'R16', slotA: 'W:M01', slotB: 'W:M02' },
  { id: 'M18', round: 'R16', slotA: 'W:M03', slotB: 'W:M04' },
  { id: 'M19', round: 'R16', slotA: 'W:M05', slotB: 'W:M06' },
  { id: 'M20', round: 'R16', slotA: 'W:M07', slotB: 'W:M08' },
  { id: 'M21', round: 'R16', slotA: 'W:M09', slotB: 'W:M10' },
  { id: 'M22', round: 'R16', slotA: 'W:M11', slotB: 'W:M12' },
  { id: 'M23', round: 'R16', slotA: 'W:M13', slotB: 'W:M14' },
  { id: 'M24', round: 'R16', slotA: 'W:M15', slotB: 'W:M16' },

  // Quartas
  { id: 'M25', round: 'QF', slotA: 'W:M17', slotB: 'W:M18' },
  { id: 'M26', round: 'QF', slotA: 'W:M19', slotB: 'W:M20' },
  { id: 'M27', round: 'QF', slotA: 'W:M21', slotB: 'W:M22' },
  { id: 'M28', round: 'QF', slotA: 'W:M23', slotB: 'W:M24' },

  // Semifinais
  { id: 'M29', round: 'SF', slotA: 'W:M25', slotB: 'W:M26' },
  { id: 'M30', round: 'SF', slotA: 'W:M27', slotB: 'W:M28' },

  // Disputa de 3º lugar
  { id: 'M31', round: '3P', slotA: 'L:M29', slotB: 'L:M30' },

  // Final
  { id: 'M32', round: 'F',  slotA: 'W:M29', slotB: 'W:M30' },
];

export function createEmptyBracket(): KnockoutMatch[] {
  return BRACKET_TEMPLATE.map((p) => ({
    id: p.id,
    round: p.round,
    slotA: p.slotA,
    slotB: p.slotB,
    homeTeamId: null,
    awayTeamId: null,
    homeScore: null,
    awayScore: null,
    homeExtra: null,
    awayExtra: null,
    homePens: null,
    awayPens: null,
    winnerTeamId: null,
    loserTeamId: null,
  }));
}

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  R32: 'Rodada de 32',
  R16: 'Oitavas de Final',
  QF: 'Quartas de Final',
  SF: 'Semifinais',
  '3P': 'Disputa de 3º Lugar',
  F: 'Final',
};
