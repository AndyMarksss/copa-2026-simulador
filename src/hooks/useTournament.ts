import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Group, GroupId, KnockoutMatch, KnockoutRound, TournamentState } from '../types';
import { createInitialGroups, reconcileWithInitialMeta, teamById } from '../data/groups';
import { createEmptyBracket } from '../data/knockoutBracket';
import { applyKnockoutSchedule } from '../data/schedule';
import { computeGroupStandings } from '../logic/standings';
import { detectUnresolvedTies } from '../logic/tiebreakers';
import { recalculateKnockout } from '../logic/knockout';
import { loadState, saveState } from '../logic/storage';
import {
  simulatedGroupMatch, simulatedKnockoutMatch,
} from '../logic/simulate';

// ----------------------------------------------------------------------------
// Hook central que mantém todo o estado do simulador.
// ----------------------------------------------------------------------------

const STATE_VERSION = 3;

function createInitialState(): TournamentState {
  return {
    version: STATE_VERSION,
    groups: createInitialGroups(),
    // Aplica o calendário oficial já na carga (datas/horários/cidades/estádios)
    // para que o mata-mata não apareça com "Data a definir" antes do 1º recálculo.
    knockout: { matches: applyKnockoutSchedule(createEmptyBracket()) },
    manualTiebreakers: {},
  };
}

/**
 * Migra dumps antigos do localStorage para a versão atual.
 *  • Reaplica metadados das seleções (corrige flagCode em dumps antigos).
 *  • Preserva placares, source de cada resultado e estado do mata-mata.
 */
function migrate(state: TournamentState): TournamentState {
  if (!state) return createInitialState();
  const base = createInitialState();
  const reconciledGroups = state.groups
    ? reconcileWithInitialMeta(state.groups)
    : base.groups;

  return {
    version: STATE_VERSION,
    groups: reconciledGroups,
    knockout: state.knockout?.matches?.length
      ? {
          // Reaplica o calendário oficial (data/hora/cidade/estádio) preservando
          // placares, prorrogação, pênaltis, vencedor e source de cada partida.
          matches: applyKnockoutSchedule(
            state.knockout.matches.map((m) => ({
              ...m,
              manualWinnerTeamId: m.manualWinnerTeamId ?? null,
              source: m.source,
            })),
          ),
        }
      : base.knockout,
    manualTiebreakers: state.manualTiebreakers ?? {},
  };
}

// ----------------------------------------------------------------------------
// API exposta
// ----------------------------------------------------------------------------

export interface TournamentApi {
  state: TournamentState;
  setGroupMatchScore: (
    groupId: GroupId, matchId: string,
    home: number | null, away: number | null,
  ) => void;
  setKnockoutScore: (
    matchId: string,
    field: 'home' | 'away' | 'homeExtra' | 'awayExtra' | 'homePens' | 'awayPens',
    value: number | null,
  ) => void;
  setManualWinner: (matchId: string, teamId: string | null) => void;
  setManualTiebreak: (teamId: string, weight: number | null) => void;
  resetAll: () => void;
  clearGroups: () => void;
  clearKnockout: () => void;
  clearSimulatedOnly: () => number;
  importState: (incoming: TournamentState) => void;
  lastInvalidatedKnockoutIds: string[];
  unresolvedTies: Record<GroupId, string[][]>;
  autoSaveEnabled: boolean;
  toggleAutoSave: () => void;
  // Simulações por fase. Retornam quantos jogos foram simulados.
  simulateGroups: () => number;
  simulateRound: (round: KnockoutRound) => number;
  simulateAllKnockout: () => number;
}

// ----------------------------------------------------------------------------
// Implementação
// ----------------------------------------------------------------------------

export function useTournament(): TournamentApi {
  const [state, setState] = useState<TournamentState>(() => {
    const persisted = loadState();
    return persisted ? migrate(persisted) : createInitialState();
  });

  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const lastInvalidatedRef = useRef<string[]>([]);

  const recalcKnockout = useCallback((s: TournamentState): TournamentState => {
    const { matches, invalidatedIds } = recalculateKnockout({
      groups: s.groups,
      matches: s.knockout.matches,
      manualOrder: s.manualTiebreakers,
    });
    lastInvalidatedRef.current = invalidatedIds;
    return { ...s, knockout: { matches } };
  }, []);

  const updateState = useCallback(
    (mutator: (s: TournamentState) => TournamentState) => {
      setState((prev) => recalcKnockout(mutator(prev)));
    },
    [recalcKnockout],
  );

  useEffect(() => {
    if (autoSaveEnabled) saveState(state);
  }, [state, autoSaveEnabled]);

  // ---------------- placares manuais ----------------

  const setGroupMatchScore = useCallback(
    (groupId: GroupId, matchId: string, home: number | null, away: number | null) => {
      updateState((s) => ({
        ...s,
        groups: s.groups.map((g) =>
          g.id !== groupId ? g : {
            ...g,
            matches: g.matches.map((m) =>
              m.id !== matchId ? m
                : { ...m, homeScore: home, awayScore: away,
                    source: (home === null && away === null) ? undefined : 'manual' },
            ),
          },
        ),
      }));
    },
    [updateState],
  );

  const setKnockoutScore = useCallback(
    (matchId, field, value) => {
      updateState((s) => ({
        ...s,
        knockout: {
          matches: s.knockout.matches.map((m) => {
            if (m.id !== matchId) return m;
            const updated = { ...m, source: 'manual' as const };
            switch (field) {
              case 'home':      updated.homeScore = value; break;
              case 'away':      updated.awayScore = value; break;
              case 'homeExtra': updated.homeExtra = value; break;
              case 'awayExtra': updated.awayExtra = value; break;
              case 'homePens':  updated.homePens  = value; break;
              case 'awayPens':  updated.awayPens  = value; break;
            }
            return updated;
          }),
        },
      }));
    },
    [updateState],
  ) as TournamentApi['setKnockoutScore'];

  const setManualWinner = useCallback(
    (matchId: string, teamId: string | null) => {
      updateState((s) => ({
        ...s,
        knockout: {
          matches: s.knockout.matches.map((m) =>
            m.id === matchId ? { ...m, manualWinnerTeamId: teamId, source: 'manual' as const } : m,
          ),
        },
      }));
    },
    [updateState],
  );

  const setManualTiebreak = useCallback(
    (teamId: string, weight: number | null) => {
      updateState((s) => {
        const next = { ...s.manualTiebreakers };
        if (weight === null) delete next[teamId];
        else next[teamId] = weight;
        return { ...s, manualTiebreakers: next };
      });
    },
    [updateState],
  );

  // ---------------- limpezas ----------------

  const resetAll = useCallback(() => {
    updateState(() => createInitialState());
  }, [updateState]);

  const clearGroups = useCallback(() => {
    updateState((s) => ({
      ...s,
      groups: s.groups.map((g) => ({
        ...g,
        matches: g.matches.map((m) => ({ ...m, homeScore: null, awayScore: null, source: undefined })),
      })),
    }));
  }, [updateState]);

  const clearKnockout = useCallback(() => {
    updateState((s) => ({
      ...s,
      knockout: {
        matches: s.knockout.matches.map((m) => ({
          ...m,
          homeScore: null, awayScore: null,
          homeExtra: null, awayExtra: null,
          homePens: null,  awayPens: null,
          manualWinnerTeamId: null,
          winnerTeamId: null, loserTeamId: null,
          source: undefined,
        })),
      },
    }));
  }, [updateState]);

  /** Remove apenas resultados originados de simulação, preservando os manuais. */
  const clearSimulatedOnly = useCallback((): number => {
    let removed = 0;
    updateState((s) => ({
      ...s,
      groups: s.groups.map((g) => ({
        ...g,
        matches: g.matches.map((m) => {
          if (m.source !== 'simulated') return m;
          removed++;
          return { ...m, homeScore: null, awayScore: null, source: undefined };
        }),
      })),
      knockout: {
        matches: s.knockout.matches.map((m) => {
          if (m.source !== 'simulated') return m;
          removed++;
          return {
            ...m,
            homeScore: null, awayScore: null,
            homeExtra: null, awayExtra: null,
            homePens: null, awayPens: null,
            source: undefined,
          };
        }),
      },
    }));
    return removed;
  }, [updateState]);

  // ---------------- import / autosave ----------------

  const importState = useCallback(
    (incoming: TournamentState) => {
      try { updateState(() => migrate(incoming)); }
      catch (e) {
        console.error('Estado importado inválido:', e);
        alert('Arquivo inválido. Não foi possível importar.');
      }
    },
    [updateState],
  );

  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled((v) => {
      const next = !v;
      if (next) saveState(state);
      return next;
    });
  }, [state]);

  // ---------------- simulações ----------------

  const simulateGroups = useCallback((): number => {
    let count = 0;
    updateState((s) => {
      const baseSeed = Date.now();
      const groups = s.groups.map((g) => ({
        ...g,
        matches: g.matches.map((m, idx) => {
          if (m.homeScore !== null && m.awayScore !== null) return m;   // preserva manual
          const home = g.teams.find((t) => t.id === m.homeTeamId);
          const away = g.teams.find((t) => t.id === m.awayTeamId);
          if (!home || !away) return m;
          count++;
          return simulatedGroupMatch(m, home, away, baseSeed + g.id.charCodeAt(0) * 31 + idx);
        }),
      }));
      return { ...s, groups };
    });
    return count;
  }, [updateState]);

  const simulateRound = useCallback(
    (round: KnockoutRound): number => {
      let count = 0;
      updateState((s) => {
        const baseSeed = Date.now();
        // recálculo "intermediário": precisamos garantir que os homeTeamId/awayTeamId
        // estejam preenchidos antes de simular.
        let recalculated = recalculateKnockout({
          groups: s.groups,
          matches: s.knockout.matches,
          manualOrder: s.manualTiebreakers,
        }).matches;

        recalculated = recalculated.map((m, idx) => {
          if (m.round !== round) return m;
          if (!m.homeTeamId || !m.awayTeamId) return m;       // ainda não definido
          if (m.homeScore !== null && m.awayScore !== null) return m; // preserva manual/anterior
          const home = teamById(s.groups, m.homeTeamId);
          const away = teamById(s.groups, m.awayTeamId);
          count++;
          return simulatedKnockoutMatch(m, home, away, baseSeed + idx);
        });

        return { ...s, knockout: { matches: recalculated } };
      });
      return count;
    },
    [updateState],
  );

  const simulateAllKnockout = useCallback((): number => {
    const order: KnockoutRound[] = ['R32', 'R16', 'QF', 'SF', '3P', 'F'];
    let total = 0;
    // Loop sequencial — cada round recalcula a chave (resolvendo slots).
    for (const round of order) total += simulateRound(round);
    return total;
  }, [simulateRound]);

  // ---------- empates não resolvidos por grupo (warnings de UI) ----------
  const unresolvedTies = useMemo(() => {
    const result: Record<string, string[][]> = {};
    for (const g of state.groups) {
      const standings = computeGroupStandings(g, state.manualTiebreakers);
      const ties = detectUnresolvedTies(standings, g.matches, state.manualTiebreakers);
      if (ties.length) result[g.id] = ties;
    }
    return result as Record<GroupId, string[][]>;
  }, [state.groups, state.manualTiebreakers]);

  return {
    state,
    setGroupMatchScore,
    setKnockoutScore,
    setManualWinner,
    setManualTiebreak,
    resetAll,
    clearGroups,
    clearKnockout,
    clearSimulatedOnly,
    importState,
    lastInvalidatedKnockoutIds: lastInvalidatedRef.current,
    unresolvedTies,
    autoSaveEnabled,
    toggleAutoSave,
    simulateGroups,
    simulateRound,
    simulateAllKnockout,
  };
}
