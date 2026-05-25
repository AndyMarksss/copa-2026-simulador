import React, { createContext, useContext } from 'react';

// ---------------------------------------------------------------------------
// Context simples para abrir o histórico/trajetória de uma seleção a partir
// de qualquer lugar da aplicação (Dashboard, aba Jogos, GroupCard, 16ª avos…).
//
//   • App.tsx fornece o handler real (que faz `setSelectedTeamId(id)`).
//   • Componentes consomem via `useOpenTeamDetails()` e chamam com o teamId.
//   • A renderização do modal acontece UMA ÚNICA VEZ em App.tsx (top-level)
//     para que ele escape de qualquer transform ancestral.
// ---------------------------------------------------------------------------

const NOOP = (_teamId: string) => { /* noop por padrão */ };

const TeamDetailsContext = createContext<(teamId: string) => void>(NOOP);

export function TeamDetailsProvider({
  open, children,
}: {
  open: (teamId: string) => void;
  children: React.ReactNode;
}) {
  return (
    <TeamDetailsContext.Provider value={open}>
      {children}
    </TeamDetailsContext.Provider>
  );
}

export function useOpenTeamDetails() {
  return useContext(TeamDetailsContext);
}
