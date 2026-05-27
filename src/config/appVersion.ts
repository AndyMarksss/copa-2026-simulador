// ---------------------------------------------------------------------------
// Versão do aplicativo — usada no rodapé e em logs.
// Incrementar manualmente conforme grandes mudanças (semver).
// ---------------------------------------------------------------------------

export const APP_VERSION = '1.14.0';
export const APP_VERSION_LABEL = `v${APP_VERSION}`;
export const APP_LAST_UPDATED = '2026-05-27';

/** Data formatada em pt-BR para exibição no rodapé. */
export function formatLastUpdated(iso = APP_LAST_UPDATED): string {
  try {
    const d = new Date(iso + 'T00:00:00');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}
