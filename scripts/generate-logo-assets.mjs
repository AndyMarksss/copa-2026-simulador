/**
 * Gera todos os ativos derivados das logos da Copa 2026.
 *
 * ── Etapa 1 — limpar a logo escura ─────────────────────────────────────────
 *   `Logo_copa_2026-claro.png` (com fundo preto embutido) →
 *   `Logo_copa_2026-claro-clean.png` (fundo transparente).
 *
 *   Pixels MUITO próximos do preto puro viram transparentes; pixels
 *   ligeiramente acima do limiar recebem alpha proporcional (anti-aliasing),
 *   preservando bordas suaves sem comer detalhes da taça ou do texto FIFA.
 *
 * ── Etapa 2 — normalizar logos para o HEADER ───────────────────────────────
 *   Recorta os espaços transparentes excessivos das duas logos e coloca cada
 *   uma em um canvas QUADRADO IDÊNTICO (640×640) com mesmo padding interno.
 *   Resultado: as duas logos têm o MESMO tamanho visual quando exibidas no
 *   header, eliminando o "salto" ao alternar tema claro/escuro.
 *
 *   Saídas:
 *     - Logo_copa_2026-header-light.png  (do tema claro, com "26" preto)
 *     - Logo_copa_2026-header-dark.png   (do tema escuro, com "26" branco)
 *
 * ── Etapa 3 — gerar ícones PWA quadrados ───────────────────────────────────
 *   A partir da logo clara limpa, monta canvas QUADRADO com fundo navy,
 *   encaixa a logo no centro (object-contain) e adiciona padding interno.
 *   Resultado: ícones que NÃO esticam quando instalados como app.
 *
 *   Saídas em /public:
 *     - pwa-192x192.png            (Android Chrome — pequeno)
 *     - pwa-384x384.png            (médio)
 *     - pwa-512x512.png            (splash / alta resolução)
 *     - apple-touch-icon.png       (180×180, iOS — iOS não recorta)
 *     - maskable-icon-192x192.png  (Android adaptable, low-dpi)
 *     - maskable-icon-512x512.png  (Android adaptable, hi-dpi)
 *
 * Rodar com:  npm run generate-icons
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

const RAW_LIGHT_LOGO  = join(PUBLIC, 'Logo_copa_2026.png');
const RAW_DARK_LOGO   = join(PUBLIC, 'Logo_copa_2026-claro.png');
const CLEAN_DARK_LOGO = join(PUBLIC, 'Logo_copa_2026-claro-clean.png');
const HEADER_LIGHT    = join(PUBLIC, 'Logo_copa_2026-header-light.png');
const HEADER_DARK     = join(PUBLIC, 'Logo_copa_2026-header-dark.png');

// Cor do tema FIFA 2026 (navy) — fundo dos ícones do PWA.
const NAVY = { r: 11, g: 27, b: 58, alpha: 1 };

// ─────────────────────────────────────────────────────────────────────────────
// Etapa 1 — remover o fundo preto da logo clara
// ─────────────────────────────────────────────────────────────────────────────

async function cleanDarkLogo() {
  console.log('Limpando fundo preto de Logo_copa_2026-claro.png…');

  // Carrega como RGBA cru — assim podemos editar pixel a pixel.
  const { data, info } = await sharp(RAW_DARK_LOGO)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Limiar: pixels com max(R,G,B) < THRESHOLD são considerados fundo puro.
  // Para suavização de bordas, pixels entre THRESHOLD e SOFT_END recebem
  // alpha proporcional (cria transição agradável sem cortar serrilhado).
  const THRESHOLD = 22;
  const SOFT_END  = 50;

  let fullyCleared = 0;
  let softened     = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxRGB = Math.max(r, g, b);

    if (maxRGB < THRESHOLD) {
      data[i + 3] = 0;
      fullyCleared++;
    } else if (maxRGB < SOFT_END) {
      const ratio = (maxRGB - THRESHOLD) / (SOFT_END - THRESHOLD);
      data[i + 3] = Math.round(data[i + 3] * ratio);
      softened++;
    }
  }

  const total = width * height;
  console.log(
    `  → ${fullyCleared.toLocaleString('pt-BR')} pixels totalmente transparentes` +
    `, ${softened.toLocaleString('pt-BR')} suavizados (de ${total.toLocaleString('pt-BR')})`,
  );

  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(CLEAN_DARK_LOGO);

  console.log(`  ✓ Logo_copa_2026-claro-clean.png  (${width}×${height})\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Etapa 2 — normalizar logos para o HEADER (mesmo tamanho visual)
// ─────────────────────────────────────────────────────────────────────────────
//
// Cada logo entra em um canvas IDÊNTICO (640×640 transparente). O conteúdo é
// recortado das bordas transparentes e ajustado para caber numa área comum,
// garantindo que ambas tenham a MESMA altura visual no header — sem importar
// se uma é mais "alta" ou tem proporções diferentes da outra.
//
// Por que recortar antes? Cada logo pode ter quantidades diferentes de espaço
// transparente "padding" embutidas no arquivo original. Recortar normaliza
// isso → as duas terminam com a mesma "presença visual" depois do resize.

const HEADER_CANVAS = 640;
const HEADER_PADDING_RATIO = 0.07; // 7% de margem dentro do canvas

async function normalizeForHeader(srcPath, outPath, label) {
  const padding = Math.round(HEADER_CANVAS * HEADER_PADDING_RATIO);
  const content = HEADER_CANVAS - padding * 2;

  // 1) Garante alpha e recorta bordas transparentes (isola o conteúdo da logo)
  const trimmedBuffer = await sharp(srcPath)
    .ensureAlpha()
    .trim()
    .png()
    .toBuffer();

  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  const tw = trimmedMeta.width ?? 0;
  const th = trimmedMeta.height ?? 0;

  // 2) Encaixa o conteúdo no quadrado interno (preservando proporção)
  const fittedBuffer = await sharp(trimmedBuffer)
    .resize(content, content, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 3) Compõe sobre canvas transparente quadrado
  await sharp({
    create: {
      width: HEADER_CANVAS,
      height: HEADER_CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fittedBuffer, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(
    `  ✓ ${label}  (canvas ${HEADER_CANVAS}×${HEADER_CANVAS}, conteúdo trim ${tw}×${th})`,
  );
}

async function normalizeHeaderLogos() {
  console.log('Normalizando logos do header (mesmo canvas, mesma área útil)…');
  await normalizeForHeader(RAW_LIGHT_LOGO, HEADER_LIGHT, 'Logo_copa_2026-header-light.png');
  await normalizeForHeader(CLEAN_DARK_LOGO, HEADER_DARK, 'Logo_copa_2026-header-dark.png');
  console.log('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Etapa 3 — gerar os ícones PWA quadrados
// ─────────────────────────────────────────────────────────────────────────────

async function generateIcon(size, filename, opts = {}) {
  const paddingRatio = opts.paddingRatio ?? 0.15;
  const padding = Math.round(size * paddingRatio);
  const innerSize = size - padding * 2;

  // 1) Redimensiona a logo CLEAN para caber no quadrado interno (sem distorcer).
  const logoBuffer = await sharp(CLEAN_DARK_LOGO)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 2) Compõe sobre canvas quadrado navy.
  await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png({ compressionLevel: 9, quality: 92 })
    .toFile(join(PUBLIC, filename));

  console.log(
    `  ✓ ${filename}  (${size}×${size}, padding ${Math.round(paddingRatio * 100)}%)`,
  );
}

async function generateIcons() {
  console.log('Gerando ícones PWA a partir da logo clara limpa…');

  // "any" — padding 15% deixa o logo respirar.
  await generateIcon(192, 'pwa-192x192.png', { paddingRatio: 0.15 });
  await generateIcon(384, 'pwa-384x384.png', { paddingRatio: 0.15 });
  await generateIcon(512, 'pwa-512x512.png', { paddingRatio: 0.15 });

  // iOS — não recorta agressivamente, padding menor.
  await generateIcon(180, 'apple-touch-icon.png', { paddingRatio: 0.10 });

  // Maskable — Android recorta ~20% das bordas; margem extra garante safe-zone.
  await generateIcon(192, 'maskable-icon-192x192.png', { paddingRatio: 0.22 });
  await generateIcon(512, 'maskable-icon-512x512.png', { paddingRatio: 0.22 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Execução
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(PUBLIC, { recursive: true });
  await cleanDarkLogo();
  await normalizeHeaderLogos();
  await generateIcons();
  console.log('\nPronto. Ativos disponíveis em /public.');
  console.log('Lembre de reinstalar o PWA no celular para o sistema baixar o novo ícone.');
}

main().catch((err) => {
  console.error('Falha ao gerar ativos:', err);
  process.exit(1);
});
