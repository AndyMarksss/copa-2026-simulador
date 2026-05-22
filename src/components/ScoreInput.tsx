import React from 'react';

interface ScoreInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  ariaLabel: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'default' | 'amber' | 'rose';
}

const SIZE_CLASSES: Record<NonNullable<ScoreInputProps['size']>, string> = {
  xs: 'w-6 h-6 text-[11px]',
  sm: 'w-7 h-7 text-[12px]',
  md: 'w-9 h-8 text-sm',
  lg: 'w-12 h-10 text-lg',
};

const TONE_CLASSES: Record<NonNullable<ScoreInputProps['tone']>, string> = {
  default: '',
  amber:   'border-amber-400/60 focus:border-amber-500 focus:ring-amber-400/40',
  rose:    'border-rose-400/60 focus:border-rose-500 focus:ring-rose-400/40 text-rose-600 dark:text-rose-400',
};

export function ScoreInput({
  value, onChange, ariaLabel, disabled,
  size = 'sm', tone = 'default',
}: ScoreInputProps) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      step={1}
      inputMode="numeric"
      className={[
        'score-input shrink-0',
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
      ].join(' ')}
      disabled={disabled}
      aria-label={ariaLabel}
      value={value === null ? '' : value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '') return onChange(null);
        const n = parseInt(v, 10);
        if (Number.isNaN(n)) return;
        onChange(Math.max(0, Math.min(20, n)));
      }}
    />
  );
}
