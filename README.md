<p align="center">
  <img src="public/Logo_copa_2026.png" alt="Copa do Mundo 2026" width="140" />
</p>

<h1 align="center">Simulador Interativo · Copa do Mundo 2026</h1>

<p align="center">
  Simule todos os jogos da Copa: <strong>fase de grupos</strong>, <strong>melhores terceiros</strong>,
  <strong>16ª avos</strong> e <strong>mata-mata</strong> até a final — com cálculos automáticos e visual inspirado no Mundial 2026.
</p>

<p align="center">
  <a href="https://andymarksss.github.io/copa-2026-simulador/">
    <img src="https://img.shields.io/badge/demo-online-success?style=flat-square&logo=github" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-0EA5E9?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</p>

<p align="center">
  <a href="https://andymarksss.github.io/copa-2026-simulador/"><strong>🌐 Acessar simulador online »</strong></a>
</p>

---

## ✨ O que você pode fazer

- **Preencher placares** de qualquer um dos 72 jogos da fase de grupos e ver a tabela atualizar em tempo real.
- **Acompanhar os 8 melhores terceiros** automaticamente — com os critérios oficiais de desempate aplicados.
- **Simular rodadas inteiras** (grupos, 16ª avos, oitavas, quartas, semis, final) com placares plausíveis baseados no ranking FIFA.
- **Editar o mata-mata** com suporte a prorrogação, pênaltis e até decisão manual de vencedor (para casos de exceção).
- **Visualizar a chave** completa: bracket horizontal espelhado no desktop, chave vertical com conectores SVG no mobile.
- **Salvar e restaurar** simulações via `localStorage` ou export/import JSON.
- **Tema claro e escuro**, layout responsivo (mobile, tablet, desktop) e identidade visual da Copa do Mundo FIFA 2026.

---

## 🎯 Como usar

1. **Preencha ou simule a fase de grupos** — aba *Grupos* ou botão *Simular fase de grupos*.
2. **Confira os classificados** e os 8 melhores 3ºs no ranking automático.
3. **Preencha ou simule a 16ª avos** — empates abrem prorrogação e pênaltis automaticamente.
4. **Acompanhe o chaveamento final** — oitavas, quartas, semis, 3º lugar e Final são preenchidos sozinhos.
5. **Exporte o JSON** para guardar sua simulação, ou importe um arquivo anterior para retomar.

Tudo é processado no navegador, sem nenhum backend.

---

## 🛠️ Stack

- ⚛️ **React 18** + **TypeScript 5** (strict)
- ⚡ **Vite 5**
- 🎨 **Tailwind CSS 3** (paleta FIFA 2026: navy · sky · red · gold · cream)
- 🏳️ **flag-icons** (SVG, com suporte a `gb-eng`, `gb-sct` etc.)
- 💾 `localStorage` puro — zero dependências de backend

---

## 🚀 Rodando localmente

Requisitos: **Node.js 18+**.

```bash
git clone https://github.com/AndyMarksss/copa-2026-simulador.git
cd copa-2026-simulador
npm install
npm run dev
```

Abra `http://localhost:5173`. Hot reload ativo.

Para gerar a versão de produção:

```bash
npm run build      # gera ./dist
npm run preview    # serve o build em http://localhost:4173
```

---

## ☁️ Deploy automático (GitHub Pages)

O projeto vem com um workflow pronto em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

A cada push na branch `main`:

1. O Vite é buildado com `VITE_BASE_PATH=/copa-2026-simulador/`.
2. O conteúdo de `dist/` é publicado como artifact do Pages.
3. O job `deploy` põe o site no ar em `https://<seu-usuario>.github.io/<nome-do-repo>/`.

Para ativar no seu fork: **Settings → Pages → Source: GitHub Actions** — o workflow tenta ativar sozinho via `enablement: true` na primeira execução.

---

## 📂 Organização do código

```
src/
├── App.tsx                       # composição + navegação
├── main.tsx                      # entry + flag-icons CSS
├── index.css                     # Tailwind + tokens FIFA 2026
├── types/                        # Team, Group, Match, KnockoutMatch ...
├── data/
│   ├── groups.ts                 # 12 grupos, bandeiras, ranking FIFA
│   ├── schedule.ts               # datas/horários das partidas
│   └── knockoutBracket.ts        # confrontos R32 → Final
├── logic/
│   ├── matches.ts                # round-robin
│   ├── standings.ts              # tabela base do grupo
│   ├── tiebreakers.ts            # critérios de desempate
│   ├── thirdPlaced.ts            # ranking dos 8 melhores 3ºs
│   ├── knockout.ts               # winners (ET / pênaltis / manual)
│   ├── simulate.ts               # PRNG + placares realistas
│   └── storage.ts                # localStorage + JSON in/out
├── hooks/
│   ├── useTournament.ts          # estado central + migração de dados
│   └── useTheme.ts
└── components/
    ├── AppTabs.tsx               # desktop tabs + bottom nav mobile
    ├── Header.tsx                # logo + tema
    ├── Dashboard.tsx
    ├── UpcomingMatches.tsx       # próximas partidas, agrupadas por dia
    ├── RecentResults.tsx         # últimos resultados com badge SIM/manual
    ├── GroupStage.tsx
    ├── GroupCard.tsx             # tabela + jogos retráteis no mobile
    ├── ThirdPlacedRanking.tsx
    ├── RoundOf32.tsx             # aba dedicada aos 16ª avos
    ├── BracketView.tsx           # entrypoint do chaveamento
    ├── MobileTournamentBracket.tsx  # chave vertical com conectores SVG
    ├── FinalCard.tsx             # final premium com pódio do campeão
    ├── ThirdPlaceCard.tsx        # disputa de 3º lugar
    ├── KnockoutMatchCard.tsx     # ET/pênaltis automáticos + manual winner
    ├── Flag.tsx                  # SVG via flag-icons + fallback emoji/iniciais
    ├── WorldCupLogo.tsx          # logo do header (fallback "26" SVG)
    ├── ScoreInput.tsx
    ├── Badge.tsx
    ├── Toast.tsx
    └── SettingsPanel.tsx         # Como usar · Simulações · JSON · Tema
```

---

## ⚙️ Onde editar

| O que mudar | Arquivo |
|---|---|
| Seleções, bandeiras, ranking FIFA | [`src/data/groups.ts`](src/data/groups.ts) |
| Datas e horários dos jogos | [`src/data/schedule.ts`](src/data/schedule.ts) |
| Confrontos do mata-mata | [`src/data/knockoutBracket.ts`](src/data/knockoutBracket.ts) |
| Critérios de desempate | [`src/logic/tiebreakers.ts`](src/logic/tiebreakers.ts) |
| Pesos da simulação | [`src/logic/simulate.ts`](src/logic/simulate.ts) |
| Paleta visual | [`tailwind.config.js`](tailwind.config.js) (objeto `wc`) + [`src/index.css`](src/index.css) (variáveis `--wc-*`) |

### Lógica do mata-mata exposta

```ts
getNormalTimeWinner(m)    // vencedor no tempo regulamentar
getExtraTimeWinner(m)     // vencedor após prorrogação (placar + ET)
getPenaltyWinner(m)       // vencedor nos pênaltis
needsExtraTime(m)         // true se empate ao fim do tempo normal
needsPenalties(m)         // true se empate após a prorrogação
getKnockoutWinner(m)      // decisão final (com manualWinnerTeamId override)
isKnockoutMatchResolved(m)
```

### Critérios de desempate da fase de grupos

1. Pontos
2. Confronto direto (P → SG → GP entre empatados)
3. Saldo de gols geral
4. Gols marcados geral
5. Fair play
6. Ranking FIFA
7. Desempate manual

---

## 📱 Responsividade

- **Desktop (≥ 1024 px)**: abas no topo, fase de grupos em até 4 colunas, chaveamento horizontal espelhado de 7 colunas, sem scroll horizontal.
- **Tablet**: 2 colunas de grupos, chave vertical com cards maiores.
- **Mobile**: grupos retráteis (tabela fica visível, só os jogos colapsam), chave vertical com **conectores SVG 4→2 e 2→1**, menu inferior flutuante com safe-area para iPhone.

---

## 🎨 Identidade visual

Paleta inspirada na Copa do Mundo FIFA 2026 (EUA · México · Canadá):

| Token | Cor | Uso |
|---|---|---|
| `wc-navy` | `#0b1b3a` | base profunda |
| `wc-blue` | `#1e63d3` | destaque principal |
| `wc-sky` | `#3aa1ff` | highlights |
| `wc-red` | `#c8102e` | acento (NA red) |
| `wc-gold` | `#d4af37` | final, campeão, taça |
| `wc-cream` | `#faf7f2` | contraste leve |

Glassmorphism leve, gradientes suaves, animações discretas, sem cara de seleção brasileira.

---

## 📝 Notas

- Aplicação **100% client-side**: nada é enviado a nenhum servidor.
- O arquivo `Logo_copa_2026.png` em `/public` é usado como logo do header e favicon. Se ele estiver ausente, um emblema `26` em SVG aparece como fallback.
- O simulador é um projeto **não-oficial**, sem qualquer afiliação com a FIFA. As bandeiras vêm da biblioteca open-source [flag-icons](https://github.com/lipis/flag-icons).

---

## 📄 Licença

MIT — sinta-se livre para fazer fork, estudar e adaptar.

---

<p align="center">
  Construído com ⚽ por <strong><a href="https://github.com/AndyMarksss">@AndyMarksss</a></strong>
</p>
