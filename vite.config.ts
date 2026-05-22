import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    port: 5173,
    open: true,
  },
});
