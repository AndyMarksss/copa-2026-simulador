import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// ---------------------------------------------------------------------------
// Wrapper padronizado para ícones Font Awesome.
//
//   <Icon icon={icons.trophy} />              ← decorativo (aria-hidden)
//   <Icon icon={icons.trophy} title="Final"/> ← com tooltip e acessível
//   <Icon icon={icons.warning} className="text-amber-500" />
//
// O tamanho do ícone vem do font-size do container (text-sm / text-lg / etc.).
// ---------------------------------------------------------------------------

interface IconProps {
  icon: IconDefinition;
  className?: string;
  title?: string;
  ariaLabel?: string;
  spin?: boolean;
}

export function Icon({ icon, className, title, ariaLabel, spin }: IconProps) {
  const isInformative = Boolean(title || ariaLabel);
  return (
    <FontAwesomeIcon
      icon={icon}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-hidden={!isInformative ? true : undefined}
      spin={spin}
      className={className}
    />
  );
}
