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
 *   - pwa-192x192.png            (Android Chrome — pequeno)
 *   - pwa-384x384.png            (médio)
 *   - pwa-512x512.png            (splash / alta resolução)
 *   - apple-touch-icon.png       (180×180, iOS — iOS não recorta)
 *   - maskable-icon-192x192.png  (Android adaptable, low-dpi)
 *   - maskable-icon-512x512.png  (Android adaptable, hi-dpi)
 *
 * O ícone "maskable" tem padding maior (22%) porque o Android só garante
 * visibilidade do centro 80% — então deixamos margem extra para evitar
 * recorte do conteúdo.
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
 * @param {number} [opts.paddingRatio]  padding interno (default 0.15 = 15%)
 * @param {boolean}[opts.transparent]   se true, fundo transparente
 */
async function generateIcon(size, filename, opts = {}) {
  const padding = Math.round(size * (opts.paddingRatio ?? 0.15));
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

  console.log(`  ✓ ${filename}  (${size}×${size}, padding ${Math.round((opts.paddingRatio ?? 0.15) * 100)}%)`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Gerando ícones PWA a partir de Logo_copa_2026.png…\n');

  // "any" — usado normalmente. Padding 15% deixa o logo respirar dentro do quadrado.
  await generateIcon(192, 'pwa-192x192.png', { paddingRatio: 0.15 });
  await generateIcon(384, 'pwa-384x384.png', { paddingRatio: 0.15 });
  await generateIcon(512, 'pwa-512x512.png', { paddingRatio: 0.15 });

  // iOS — sem recorte agressivo, então padding menor (10%).
  await generateIcon(180, 'apple-touch-icon.png', { paddingRatio: 0.10 });

  // Maskable — Android Adaptive Icons recortam ~20% das bordas. Padding extra
  // (22%) garante que o logo fique sempre visível dentro do recorte aplicado.
  await generateIcon(192, 'maskable-icon-192x192.png', { paddingRatio: 0.22 });
  await generateIcon(512, 'maskable-icon-512x512.png', { paddingRatio: 0.22 });

  console.log('\nPronto. Ícones disponíveis em /public.');
  console.log('Lembre de reinstalar o PWA no celular para o sistema baixar o novo ícone.');
}

main().catch((err) => {
  console.error('Falha ao gerar ícones:', err);
  process.exit(1);
});
