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
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Arquivos extra a colocar no precache (além dos gerados pelo Vite).
      includeAssets: ['Logo_copa_2026.png', 'favicon.ico'],
      manifest: {
        name:        'Simulador Copa do Mundo 2026',
        short_name:  'Copa 2026',
        description: 'Simulador interativo da Copa do Mundo FIFA 2026',
        lang:        'pt-BR',
        theme_color:      '#0b1b3a',  // wc-navy
        background_color: '#060c1a',  // wc-night
        display:     'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: 'Logo_copa_2026.png', sizes: '192x192', type: 'image/png' },
          { src: 'Logo_copa_2026.png', sizes: '512x512', type: 'image/png' },
          { src: 'Logo_copa_2026.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Limpa caches antigos automaticamente quando há nova versão.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Limite generoso para os arquivos SVG das bandeiras.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    port: 5173,
    open: true,
  },
});
