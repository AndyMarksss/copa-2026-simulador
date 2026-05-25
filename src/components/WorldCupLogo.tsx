import React, { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Logo principal do simulador — versão theme-aware.
//
//   • Tema CLARO  → /Logo_copa_2026-header-light.png  ("26" escuro)
//   • Tema ESCURO → /Logo_copa_2026-header-dark.png   ("26" branco)
//
//   Ambas as imagens são geradas por `npm run generate-icons` com canvas
//   idêntico (640×640) e mesma área útil — então têm a MESMA presença visual
//   no header, sem salto ao alternar tema.
//
//   O componente OBSERVA a classe `.dark` do <html> via MutationObserver,
//   então funciona com qualquer mecanismo de tema (hook, contexto, manual)
//   sem precisar receber props.
// ---------------------------------------------------------------------------

interface WorldCupLogoProps {
  /** Se informado, sobrescreve o tamanho responsivo padrão (em px). */
  size?: number;
  className?: string;
}

const BASE = import.meta.env.BASE_URL;
// Versões NORMALIZADAS para o header — ambas têm o mesmo canvas (640×640)
// com a logo centralizada e mesma proporção de padding, garantindo tamanho
// visual idêntico ao alternar tema. Geradas por `npm run generate-icons`.
const LIGHT_SRC = `${BASE}Logo_copa_2026-header-light.png`;
const DARK_SRC  = `${BASE}Logo_copa_2026-header-dark.png`;

/** Observa a classe `dark` no <html> e retorna `true` se o tema escuro estiver ativo. */
function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

export function WorldCupLogo({ size, className = '' }: WorldCupLogoProps) {
  const isDark = useIsDarkTheme();
  const [failedLight, setFailedLight] = useState(false);
  const [failedDark, setFailedDark] = useState(false);

  const src = isDark ? DARK_SRC : LIGHT_SRC;
  const failed = isDark ? failedDark : failedLight;

  // ---------- Shell responsivo padronizado ----------
  // Se size for passado, fica fixo; caso contrário usa tamanhos responsivos.
  const fixedStyle: React.CSSProperties | undefined =
    size !== undefined ? { width: size, height: size } : undefined;
  const responsiveClasses =
    size === undefined ? 'w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16' : '';

  if (failed) {
    return (
      <span
        className={[
          'logo-shell relative inline-flex items-center justify-center shrink-0',
          responsiveClasses,
          className,
        ].join(' ')}
        style={fixedStyle}
      >
        <DefaultEmblem />
      </span>
    );
  }

  return (
    <span
      className={[
        'logo-shell relative inline-flex items-center justify-center shrink-0',
        responsiveClasses,
        className,
      ].join(' ')}
      style={fixedStyle}
    >
      <img
        key={src}              // remonta ao trocar tema → dispara fade
        src={src}
        alt="Copa do Mundo FIFA 2026"
        onError={() => (isDark ? setFailedDark(true) : setFailedLight(true))}
        draggable={false}
        className={[
          'logo-img w-full h-full object-contain',
          'transition-opacity duration-300',
          // Como ambas as logos já são geradas com canvas idêntico e mesma
          // área útil, NÃO precisamos de escala diferente por tema — a única
          // diferença é a sombra/glow.
          isDark
            ? 'drop-shadow-[0_0_14px_rgba(245,197,66,0.35)]'
            : 'drop-shadow-[0_4px_12px_rgba(15,23,42,0.18)]',
        ].join(' ')}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Fallback inline (emblema "26") quando nenhuma das imagens carregar.
// ---------------------------------------------------------------------------

function DefaultEmblem() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" className="drop-shadow-lg">
      <defs>
        <linearGradient id="wc-shield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0b1b3a" />
          <stop offset="55%"  stopColor="#1e63d3" />
          <stop offset="100%" stopColor="#c8102e" />
        </linearGradient>
        <linearGradient id="wc-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#f3d177" />
          <stop offset="100%" stopColor="#b78f24" />
        </linearGradient>
      </defs>
      <path
        d="M32 3 L58 11 C58 11 58 28 58 33 C58 50 46 59 32 62 C18 59 6 50 6 33 C6 28 6 11 6 11 Z"
        fill="url(#wc-shield)"
        stroke="url(#wc-gold)"
        strokeWidth="1.4"
      />
      <text
        x="32" y="42"
        textAnchor="middle"
        fontFamily="'Bebas Neue', Inter, system-ui, sans-serif"
        fontSize="24" fontWeight="800" letterSpacing="1"
        fill="white"
      >
        26
      </text>
    </svg>
  );
}
