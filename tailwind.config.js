/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Inter', 'sans-serif'],
      },
      colors: {
        // --------------------------------------------------------------------
        // Paleta da Copa do Mundo FIFA 2026 (EUA · México · Canadá).
        //   Identidade internacional, alegre e premium. Sem predominância
        //   verde-amarela (intencional).
        // --------------------------------------------------------------------
        wc: {
          navy:   '#0b1b3a',   // base profunda
          night:  '#060d20',   // dark background
          blue:   '#1e63d3',   // azul vivo (destaque)
          sky:    '#3aa1ff',   // azul céu (highlight)
          red:    '#c8102e',   // vermelho NA
          'red-soft': '#e85a6c',
          green:  '#006847',   // verde MX, usado pontualmente
          gold:   '#d4af37',   // dourado premium
          'gold-soft': '#f3d177',
          cream:  '#faf7f2',   // off-white
          ink:    '#0d1428',
        },
        // alias semântico
        brand: {
          50: '#eaf3ff',
          100: '#d1e4ff',
          200: '#a8cbff',
          300: '#74acff',
          400: '#3d8bff',
          500: '#1e63d3',
          600: '#1953bd',
          700: '#1647a0',
          800: '#163d83',
          900: '#0e2a5e',
        },
        gold: {
          50: '#fbf3dc',
          100: '#f7e6b4',
          200: '#f0d384',
          300: '#e6c057',
          400: '#d4af37',
          500: '#b78f24',
          600: '#90701c',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(11, 27, 58, 0.18)',
        glow: '0 0 0 1px rgba(58, 161, 255, 0.35), 0 12px 36px -10px rgba(30, 99, 211, 0.45)',
        gold: '0 0 0 1px rgba(212, 175, 55, 0.45), 0 14px 40px -8px rgba(212, 175, 55, 0.45)',
        'inner-soft': 'inset 0 1px 2px rgba(255,255,255,0.4)',
      },
      animation: {
        'fade-in':   'fadeIn 0.25s ease-out',
        'pop-in':    'popIn 0.3s cubic-bezier(.2,.9,.3,1.2)',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'tab-pop':   'tabPop 0.25s cubic-bezier(.4,1.6,.4,1)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        popIn: {
          '0%':   { opacity: 0, transform: 'scale(0.94)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.55 },
        },
        tabPop: {
          '0%':   { opacity: 0, transform: 'translateY(6px) scale(0.99)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
