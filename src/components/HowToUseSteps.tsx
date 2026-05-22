import React from 'react';
import { Icon } from './Icon';
import { icons } from '../utils/icons';

// ---------------------------------------------------------------------------
// Conteúdo "Como usar" compartilhado entre:
//   • aba Configurações (seção dedicada)
//   • FirstAccessModal (modal de boas-vindas no primeiro acesso)
//
// Manter aqui evita duplicação. Para alterar os passos exibidos nos DOIS
// lugares, edite somente este arquivo.
// ---------------------------------------------------------------------------

interface StepDef {
  n: number;
  title: string;
  content: React.ReactNode;
}

export const HOW_TO_USE_STEPS: StepDef[] = [
  {
    n: 1,
    title: 'Preencha ou simule a fase de grupos',
    content: (
      <>
        Toque em <strong>Grupos</strong> e edite os placares — ou use o botão{' '}
        <em>Simular fase de grupos</em> aqui embaixo para gerar resultados realistas.
      </>
    ),
  },
  {
    n: 2,
    title: 'Confira os classificados e os melhores 3ºs',
    content: (
      <>
        A tabela atualiza automaticamente. Os 24 classificados diretos + 8 melhores
        terceiros formam os 32 dos 16ª avos.
      </>
    ),
  },
  {
    n: 3,
    title: 'Preencha ou simule os 16ª avos',
    content: (
      <>
        Vá em <strong>16ª avos</strong> e decida os jogos da Rodada de 32. Empates
        abrem prorrogação e pênaltis automaticamente.
      </>
    ),
  },
  {
    n: 4,
    title: 'Acompanhe o chaveamento final',
    content: (
      <>
        Em <strong>Chave</strong>, oitavas → quartas → semifinais → final são preenchidas
        automaticamente. A disputa de 3º lugar aparece abaixo da final.
      </>
    ),
  },
  {
    n: 5,
    title: 'Salve ou restaure sua simulação',
    content: (
      <>
        Use <em>Exportar JSON</em> para baixar o estado do torneio, e{' '}
        <em>Importar JSON</em> para retomá-lo em outro momento.
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Cabeçalho padrão
// ---------------------------------------------------------------------------

export function HowToUseHeader() {
  return (
    <header className="flex items-center gap-2 mb-3">
      <Icon icon={icons.howToUse} className="text-2xl text-brand-500" />
      <div>
        <h3 className="font-display tracking-wider text-xl">Como usar</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Cinco passos para simular toda a Copa.
        </p>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Lista ordenada com os 5 passos
// ---------------------------------------------------------------------------

export function HowToUseSteps() {
  return (
    <ol className="space-y-2.5 text-sm">
      {HOW_TO_USE_STEPS.map((step) => (
        <Step key={step.n} n={step.n} title={step.title}>
          {step.content}
        </Step>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Item individual — passo com badge numerada azul
// ---------------------------------------------------------------------------

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="
          shrink-0 w-7 h-7 rounded-full
          bg-gradient-to-br from-brand-600 to-brand-400 text-white
          flex items-center justify-center font-bold text-[13px]
          shadow-glow
        "
      >
        {n}
      </span>
      <div className="min-w-0 leading-snug">
        <div className="font-semibold text-slate-800 dark:text-slate-100">{title}</div>
        <div className="text-[12.5px] text-slate-600 dark:text-slate-300">{children}</div>
      </div>
    </li>
  );
}
