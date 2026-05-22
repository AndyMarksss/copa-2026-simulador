/**
 * Gera os ícones PWA quadrados a partir de `public/Logo_copa_2026.png`.
 *
 * O logo oficial é vertical (mais alto que largo). Se ele for usado direto
 * como ícone PWA, o sistema operacional ou navegador o estica/corta. Este
 * script cria um canvas QUADRADO com fundo navy, encaixa a logo dentro com
 * `fit: 'contain'` (sem deformar) e adiciona padding interno — garantindo
 * que o ícone instalado fique proporcional e bonito em qualquer dispositivo.
 *
 * Saídas em /public:
 *   - pwa-192x192.png            (Android Chrome)
 *   - pwa-512x512.png            (splash / alta resolução)
 *   - apple-touch-icon.png       (180×180, iOS)
 *   - maskable-icon-512x512.png  (Android adaptable icon, 12% safe area)
 *
 * Rodar com:  npm run generate-icons
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC  = join(ROOT, 'public', 'Logo_copa_2026.png');
const OUT  = join(ROOT, 'public');

// Cor do tema FIFA 2026 (navy)
const NAVY = { r: 11, g: 27, b: 58, alpha: 1 };

/**
 * @param {number} size       lado do canvas final (px)
 * @param {string} filename   nome do arquivo de saída em /public
 * @param {object} opts
 * @param {number} [opts.paddingRatio]  padding interno (default 0.12 = 12%)
 * @param {boolean}[opts.transparent]   se true, fundo transparente
 */
async function generateIcon(size, filename, opts = {}) {
  const padding = Math.round(size * (opts.paddingRatio ?? 0.12));
  const innerSize = size - padding * 2;

  // 1) Redimensiona a logo para caber dentro do quadrado interno SEM esticar.
  const logoBuffer = await sharp(SRC)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 2) Cria o canvas quadrado com fundo navy (ou transparente) e compõe a logo no centro.
  const bg = opts.transparent
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : NAVY;

  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png({ compressionLevel: 9, quality: 92 })
    .toFile(join(OUT, filename));

  console.log(`  ✓ ${filename}  (${size}×${size})`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Gerando ícones PWA a partir de Logo_copa_2026.png…\n');

  // Android Chrome - any purpose
  await generateIcon(192, 'pwa-192x192.png');
  await generateIcon(512, 'pwa-512x512.png');

  // iOS Apple touch icon (cantos arredondados automáticos do iOS)
  await generateIcon(180, 'apple-touch-icon.png', { paddingRatio: 0.10 });

  // Maskable icon (Android adaptable) — 10% padding garante safe-zone
  await generateIcon(512, 'maskable-icon-512x512.png', { paddingRatio: 0.18 });

  console.log('\nPronto. Ícones disponíveis em /public.');
}

main().catch((err) => {
  console.error('Falha ao gerar ícones:', err);
  process.exit(1);
});
