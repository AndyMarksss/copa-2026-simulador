import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Hook que controla o modal de boas-vindas / primeiro acesso.
//
//   • Na primeira vez que o usuário abrir o site (chave inexistente no
//     localStorage), `isOpen` começa como `true`.
//   • Ao fechar, marca a flag e o modal não volta a aparecer.
//   • O usuário pode reabrir manualmente via Configurações através do
//     `open()` exposto pelo hook.
// ---------------------------------------------------------------------------

export const FIRST_ACCESS_KEY = 'copa2026:firstAccessInstructionsSeen';

function safeGet(): string | null {
  try { return localStorage.getItem(FIRST_ACCESS_KEY); }
  catch { return null; }
}

function safeSetSeen(): void {
  try { localStorage.setItem(FIRST_ACCESS_KEY, 'true'); }
  catch { /* navegador sem localStorage (modo privado etc.) — ignora */ }
}

export function useFirstAccessModal() {
  // Decisão inicial calculada uma única vez na montagem. Em SSR (sem window),
  // começamos fechado e abrimos só depois no useEffect — evita hydration mismatch.
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (safeGet() !== 'true') setIsOpen(true);
  }, []);

  /** Fecha o modal e persiste que o usuário já viu as instruções. */
  const close = useCallback(() => {
    safeSetSeen();
    setIsOpen(false);
  }, []);

  /** Reabre o modal manualmente (sem apagar a flag). */
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return { isOpen, open, close };
}
