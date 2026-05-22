import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Hook que expõe o estado de instalabilidade do app como PWA.
//
//   • canInstall  — true quando o navegador disparou `beforeinstallprompt`
//                   e o app ainda não foi instalado.
//   • isInstalled — true quando estamos rodando em modo standalone
//                   (já instalado como PWA) ou após o evento `appinstalled`.
//   • installApp() — dispara o prompt nativo de instalação.
// ---------------------------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const matches = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return Boolean(matches || iosStandalone);
}

export function useInstallPWA() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => detectStandalone());

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setIsInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!promptEvent) return 'unavailable' as const;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setPromptEvent(null);
    }
    return outcome;
  }, [promptEvent]);

  return {
    canInstall: Boolean(promptEvent) && !isInstalled,
    isInstalled,
    installApp,
  };
}
