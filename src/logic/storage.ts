import type { TournamentState } from '../types';

export const STORAGE_KEY = 'copa-2026-simulador-state-v1';
export const THEME_KEY = 'copa-2026-simulador-theme';

export function loadState(): TournamentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TournamentState;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (e) {
    console.warn('Falha ao carregar estado salvo:', e);
    return null;
  }
}

export function saveState(state: TournamentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Falha ao salvar estado:', e);
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadJson(state: TournamentState, filename = 'copa-2026.json'): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function uploadJson(): Promise<TournamentState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('Nenhum arquivo selecionado.')); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as TournamentState;
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}
