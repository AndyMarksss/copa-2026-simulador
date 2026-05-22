# Logo da Copa do Mundo 2026

Coloque o arquivo `Logo_copa_2026.png` (ou variantes aceitas) nesta pasta para que ele apareça no header do simulador.

Caminhos que o componente `WorldCupLogo` procura, na ordem:

1. `/assets/Logo_copa_2026.png` ← preferido
2. `/Logo_copa_2026.png`
3. `/assets/Logo_copa_2026.svg`
4. `/assets/logo_copa_2026.png`
5. `/assets/world-cup-2026-logo.png`
6. `/assets/world-cup-2026-logo.svg`

Caso nenhum desses arquivos exista, um emblema vetorial `26` é renderizado como fallback (apenas para evitar header vazio).

## Tamanhos sugeridos

- Mobile: ~44 px de altura
- Desktop: ~60 px de altura

A imagem é exibida com `object-contain`, então qualquer proporção alta (vertical) é preservada e não cortada.
