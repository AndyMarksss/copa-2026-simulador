import React, { useState } from 'react';

// ----------------------------------------------------------------------------
// Logo principal do simulador.
//
// Usa o arquivo `Logo_copa_2026.png` colocado em /public.
// Em caso de erro (404 etc.), cai no emblema "26" SVG como fallback.
// ----------------------------------------------------------------------------

interface WorldCupLogoProps {
  /** Altura desejada em px (largura é proporcional). */
  size?: number;
  className?: string;
}

// Usa BASE_URL do Vite para que o caminho continue válido quando o site
// for servido sob um subdiretório (ex.: GitHub Pages em /repo-name/).
const LOGO_SRC = `${import.meta.env.BASE_URL}Logo_copa_2026.png`;

export function WorldCupLogo({ size = 56, className = '' }: WorldCupLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src={LOGO_SRC}
        alt="Copa do Mundo FIFA 2026"
        onError={() => setFailed(true)}
        draggable={false}
        style={{ height: size, width: 'auto' }}
        className={[
          'object-contain shrink-0',
          'drop-shadow-[0_2px_8px_rgba(11,27,58,0.20)]',
          'dark:drop-shadow-[0_0_14px_rgba(212,175,55,0.20)]',
          className,
        ].join(' ')}
      />
    );
  }

  // Fallback: emblema vetorial estilizado "26" (apenas se a imagem falhar).
  return (
    <span
      aria-label="Copa do Mundo 2026"
      role="img"
      className={`inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <DefaultEmblem />
    </span>
  );
}

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
