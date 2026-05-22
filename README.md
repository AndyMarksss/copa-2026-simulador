# Copa do Mundo 2026 — Simulador Interativo

Aplicação web em **React + TypeScript + Tailwind CSS**, totalmente client-side, para simular a Copa do Mundo FIFA 2026 (48 seleções, 12 grupos, 8 melhores terceiros e mata-mata até a final).

Todos os cálculos são feitos em tempo real: cada placar lançado atualiza a tabela do grupo, os critérios de desempate, o ranking dos terceiros e a chave eliminatória.

---

## Como rodar

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

---

## Deploy no GitHub Pages

O projeto está pronto para ser hospedado gratuitamente no GitHub Pages, com **deploy automático a cada push na branch `main`**.

### Passos (uma única vez)

1. **Criar o repositório no GitHub**

   Crie um repositório novo (público), por exemplo `copa-2026-simulador`. Não inicialize com README/`.gitignore` para evitar conflitos.

2. **Subir o código**

   Na raiz do projeto, rode:

   ```bash
   git init
   git add .
   git commit -m "primeiro commit"
   git branch -M main
   git remote add origin https://github.com/<seu-usuario>/<nome-do-repo>.git
   git push -u origin main
   ```

3. **Ativar o GitHub Pages**

   No repositório no GitHub:

   - Vá em **Settings → Pages**.
   - Em **Source**, selecione **GitHub Actions**.
   - Salve.

4. **Aguardar o workflow rodar**

   Na aba **Actions**, abra a execução "Deploy to GitHub Pages". Quando terminar (≈1 min), o site fica em:

   ```
   https://<seu-usuario>.github.io/<nome-do-repo>/
   ```

### Como funciona

- O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) instala dependências, roda `npm run build` e publica a pasta `dist/`.
- A variável `VITE_BASE_PATH` é injetada automaticamente como `/<nome-do-repo>/` para que **todas as URLs de assets** (JS, CSS, logo, favicon) funcionem corretamente sob o subdiretório do GitHub Pages.
- Em `vite.config.ts`, a opção `base` lê essa variável; em dev local volta para `/`.
- No `WorldCupLogo.tsx`, o caminho da imagem usa `import.meta.env.BASE_URL`, então o logo aparece corretamente nos dois ambientes.
- O arquivo `public/.nojekyll` impede que o GitHub Pages tente processar a build como Jekyll (ele ignoraria pastas que começam com `_`).

### Atualizações posteriores

Basta dar `git push` na branch `main` — o workflow refaz a build e republica em segundos. Para forçar um deploy manual, vá em **Actions → Deploy to GitHub Pages → Run workflow**.

### Domínio próprio (opcional)

Se for usar um domínio personalizado:

1. Crie `public/CNAME` com o domínio (ex.: `copa2026.meusite.com`).
2. Em `.github/workflows/deploy.yml`, troque `VITE_BASE_PATH: /${{ github.event.repository.name }}/` por `VITE_BASE_PATH: /`.
3. Configure o DNS conforme o [guia do GitHub](https://docs.github.com/pt/pages/configuring-a-custom-domain-for-your-github-pages-site).

### Logo

Não esqueça de colocar o arquivo `Logo_copa_2026.png` em `public/` antes do primeiro deploy — ele é servido como logo do header e como favicon. Sem o arquivo, o emblema "26" SVG aparece como fallback.

---

## Estrutura do projeto

```
src/
├── App.tsx                       # navegação por abas
├── main.tsx                      # entry + flag-icons.css
├── index.css                     # Tailwind + utilitários visuais
├── types/index.ts                # Team, Group, Match, KnockoutMatch ...
├── data/
│   ├── groups.ts                 # ⭐ 12 grupos, bandeiras (flagCode), FIFA rank
│   ├── schedule.ts               # ⭐ data/horário de cada partida
│   └── knockoutBracket.ts        # ⭐ confrontos R32 → Final
├── logic/
│   ├── matches.ts                # round-robin
│   ├── standings.ts              # tabela base do grupo
│   ├── tiebreakers.ts            # ⭐ critérios de desempate
│   ├── thirdPlaced.ts            # ranking dos 8 melhores 3ºs
│   ├── knockout.ts               # ⭐ winners (ET / pênaltis / manual)
│   └── storage.ts                # localStorage + import/export JSON
├── hooks/
│   ├── useTournament.ts          # estado central + migração de dados
│   └── useTheme.ts
└── components/
    ├── AppTabs.tsx               # 🆕 navegação por abas
    ├── Header.tsx
    ├── Dashboard.tsx             # 🆕 com UpcomingMatches embutido
    ├── UpcomingMatches.tsx       # 🆕 próximas partidas, agrupadas por dia
    ├── GroupStage.tsx            # 🆕 grid responsivo até 4 colunas
    ├── GroupCard.tsx             # 🆕 compacto
    ├── ThirdPlacedRanking.tsx
    ├── RoundOf32.tsx             # 🆕 aba dedicada aos 16ª avos
    ├── BracketView.tsx           # 🆕 chave simétrica (L/R, Final no centro)
    ├── FinalCard.tsx             # 🆕 card especial da final + pódio
    ├── ThirdPlaceCard.tsx        # 🆕 disputa de 3º lugar
    ├── KnockoutMatchCard.tsx     # 🆕 ET/pênaltis automáticos + manual winner
    ├── Flag.tsx                  # 🆕 SVG via flag-icons + fallback emoji/iniciais
    ├── ScoreInput.tsx
    ├── Badge.tsx
    └── SettingsPanel.tsx         # 🆕 aba "Configurações"
```

---

## Onde alterar coisas importantes

| O que mudar                                    | Arquivo                                                     |
|------------------------------------------------|-------------------------------------------------------------|
| Seleções / bandeiras / ranking FIFA            | `src/data/groups.ts`                                        |
| Datas e horários dos jogos                     | `src/data/schedule.ts` (`GROUP_SCHEDULE` e `KO_SCHEDULE`)   |
| Confrontos do mata-mata                        | `src/data/knockoutBracket.ts`                               |
| Critérios de desempate da fase de grupos       | `src/logic/tiebreakers.ts`                                  |
| Como os 3ºs são alocados aos slots `3#1..3#8`  | `src/logic/knockout.ts` → `resolveThirdPlacedSlots()`       |
| Funções de vencedor no mata-mata               | `src/logic/knockout.ts` (helpers públicos abaixo)           |

### Funções públicas do mata-mata

```ts
getNormalTimeWinner(m)    // vencedor no tempo regulamentar
getExtraTimeWinner(m)     // vencedor após prorrogação (placar + ET)
getPenaltyWinner(m)       // vencedor nos pênaltis
needsExtraTime(m)         // true se empate ao fim do tempo normal
needsPenalties(m)         // true se empate após a prorrogação
getKnockoutWinner(m)      // decisão final (com manualWinnerTeamId override)
isKnockoutMatchResolved(m)
```

### Lógica de prorrogação e pênaltis

- O placar do tempo normal aparece sempre.
- **Se o tempo normal terminar empatado**, os inputs da prorrogação aparecem automaticamente (sem botão para alternar).
- **Se a prorrogação também ficar empatada**, os inputs de pênaltis aparecem automaticamente.
- Existe ainda um `<details>` discreto "**Definir vencedor manualmente**" — para os casos em que o usuário queira encerrar a partida sem preencher pênaltis (ex.: WO).

### Reorganização do chaveamento

- **16ª avos de Final** (R32) — aba própria, com 16 cards lado a lado e listagem dos classificados para as oitavas.
- **Chaveamento Final** — começa nas oitavas. Layout simétrico:
  - Coluna 1: Oitavas (esquerda) → Coluna 2: Quartas (esquerda) → Coluna 3: SF1
  - **Coluna central**: Pódio do campeão + Final + Disputa de 3º lugar
  - Coluna 5: SF2 → Coluna 6: Quartas (direita) → Coluna 7: Oitavas (direita)
- Em telas pequenas, a chave rola horizontalmente.

### Bandeiras (Escócia, Inglaterra e outras)

O componente `<Flag>` usa SVGs reais da biblioteca **flag-icons** (codes ISO Alpha-2 + regiões do Reino Unido: `gb-eng`, `gb-sct`). Há três fallbacks em sequência:

1. `team.flagCode` → `<span class="fi fi-{code}">` (SVG real)
2. `team.flag` (emoji) — se o sistema não tiver o SVG.
3. Iniciais do `team.code` — se o emoji também falhar.

Para mudar o mapeamento de bandeiras, edite o campo `flagCode` em `src/data/groups.ts`.

### Migração de dados antigos

O hook `useTournament` chama `migrate()` ao carregar o `localStorage`. Essa função:

- Reaplica nome/bandeira/ranking atual de cada seleção (corrige `flagCode` ausente em dumps antigos).
- Preserva placares, estado do mata-mata e desempates manuais.

Por isso, importar o `copa-2026.json` exportado pela versão anterior funciona sem perda.

---

## Abas

1. **Dashboard** — resumo (jogos preenchidos, classificados, melhores 3ºs, status mata-mata) + próximas partidas agrupadas por dia.
2. **Fase de Grupos** — 12 grupos em grade até 4 colunas + ranking dos melhores 3ºs.
3. **16ª avos de Final** — 16 confrontos da R32 com placar/ET/pênaltis e listagem dos 16 classificados para as oitavas.
4. **Chaveamento Final** — chave visual simétrica oitavas → final, com pódio do campeão e disputa de 3º.
5. **Configurações** — JSON import/export, salvamento automático, tema claro/escuro, limpar fases, resetar.
