import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ----------------------------------------------------------------------------
// `base` controla o prefixo de URL das assets na build de produção.
//
//   • Em dev local (`npm run dev`) e em produção sob domínio próprio
//     (`https://exemplo.com/`), use `/`.
//   • No GitHub Pages, o projeto é servido em
//     `https://<user>.github.io/<repo>/`, então `base` precisa ser
//     `/<repo>/`. O workflow `.github/workflows/deploy.yml` injeta
//     automaticamente esse valor via VITE_BASE_PATH.
// ----------------------------------------------------------------------------
const BASE = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Arquivos extra a colocar no precache (além dos gerados pelo Vite).
      includeAssets: [
        'Logo_copa_2026.png',
        'pwa-192x192.png',
        'pwa-384x384.png',
        'pwa-512x512.png',
        'apple-touch-icon.png',
        'maskable-icon-192x192.png',
        'maskable-icon-512x512.png',
      ],
      manifest: {
        // Identificador estável — ajuda o Chrome a detectar quando o manifest
        // mudou e regerar o WebAPK no Android (com o ícone atualizado).
        id:           `${BASE}?source=pwa`,
        name:         'Copa do Mundo 2026',
        short_name:   'Copa 2026',
        description:  'Caderneta interativa para acompanhar jogos, resultados, grupos e mata-mata da Copa do Mundo 2026.',
        lang:         'pt-BR',
        dir:          'ltr',
        start_url:    BASE,
        scope:        BASE,
        theme_color:      '#0b1b3a',  // wc-navy
        background_color: '#060c1a',  // wc-night
        display:      'standalone',
        orientation:  'portrait-primary',
        categories:   ['sports', 'games', 'entertainment'],
        // Sinalizamos que não temos app nativo (só a versão web).
        prefer_related_applications: false,
        // Os ícones abaixo são gerados por `npm run generate-icons`:
        // canvas QUADRADO com a logo centralizada e padding interno,
        // evitando o stretch ao instalar como app.
        icons: [
          { src: 'pwa-192x192.png',           sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-384x384.png',           sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png',           sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  base: BASE,
  server: {
    port: 5173,
    open: true,
  },
});
