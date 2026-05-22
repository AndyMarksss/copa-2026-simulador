import React from 'react';
import type { TournamentApi } from '../hooks/useTournament';
import { downloadJson, uploadJson } from '../logic/storage';
import { useToast } from './Toast';

interface SettingsPanelProps {
  api: TournamentApi;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function SettingsPanel({ api, theme, onToggleTheme }: SettingsPanelProps) {
  const toast = useToast();

  const confirmAnd = (msg: string, fn: () => void) => () => {
    if (window.confirm(msg)) fn();
  };

  const onExport = () => {
    downloadJson(api.state, 'copa-2026.json');
    toast.show({ variant: 'success', title: 'JSON exportado', description: 'Arquivo salvo em downloads.' });
  };
  const onImport = async () => {
    try {
      const data = await uploadJson();
      api.importState(data);
      toast.show({ variant: 'success', title: 'JSON importado', description: 'Estado restaurado com sucesso.' });
    } catch (e) {
      console.error(e);
    }
  };

  const simReport = (kind: string) => (n: number) =>
    toast.show({
      variant: n > 0 ? 'success' : 'warn',
      title: n > 0 ? `${n} jogo(s) simulado(s) — ${kind}` : `Nada a simular em "${kind}"`,
      description: n === 0 ? 'Verifique se a fase anterior já está concluída.' : 'Resultados simulados ficam marcados como SIM.',
    });

  const onClearSimulated = () => {
    const removed = api.clearSimulatedOnly();
    toast.show({
      variant: removed > 0 ? 'info' : 'warn',
      title: removed > 0 ? `${removed} resultado(s) simulado(s) removido(s)` : 'Nenhum resultado simulado',
      description: removed > 0 ? 'Resultados manuais foram preservados.' : undefined,
    });
  };

  return (
    <section className="space-y-5 animate-slide-up">
      <header>
        <h2 className="section-title">Configurações</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aprenda como usar, gere simulações rápidas, importe/exporte resultados e personalize o tema.
        </p>
      </header>

      {/* ---------------------------------------------------------------
          1. COMO USAR — primeiro, para orientar quem chega na página
         --------------------------------------------------------------- */}
      <section className="card card-pad bg-gradient-to-br from-brand-500/10 via-transparent to-brand-500/5 border-brand-500/25">
        <header className="flex items-center gap-2 mb-3">
          <span aria-hidden className="text-2xl">🗺️</span>
          <div>
            <h3 className="font-display tracking-wider text-xl">Como usar</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cinco passos para simular toda a Copa.
            </p>
          </div>
        </header>

        <ol className="space-y-2.5 text-sm">
          <Step n={1} title="Preencha ou simule a fase de grupos">
            Toque em <strong>Grupos</strong> e edite os placares — ou use o botão <em>Simular fase de grupos</em> aqui embaixo para gerar resultados realistas.
          </Step>
          <Step n={2} title="Confira os classificados e os melhores 3ºs">
            A tabela atualiza automaticamente. Os 24 classificados diretos + 8 melhores terceiros formam os 32 dos 16ª avos.
          </Step>
          <Step n={3} title="Preencha ou simule os 16ª avos">
            Vá em <strong>16ª avos</strong> e decida os jogos da Rodada de 32. Empates abrem prorrogação e pênaltis automaticamente.
          </Step>
          <Step n={4} title="Acompanhe o chaveamento final">
            Em <strong>Chave</strong>, oitavas → quartas → semifinais → final são preenchidas automaticamente. A disputa de 3º lugar aparece abaixo da final.
          </Step>
          <Step n={5} title="Salve ou restaure sua simulação">
            Use <em>Exportar JSON</em> para baixar o estado do torneio, e <em>Importar JSON</em> para retomá-lo em outro momento.
          </Step>
        </ol>
      </section>

      {/* ---------------------------------------------------------------
          2. SIMULAÇÕES RÁPIDAS
         --------------------------------------------------------------- */}
      <Card title="Simulações rápidas" icon="⚡">
        <p className="text-[11px] text-slate-500">
          Geram placares plausíveis baseados no ranking FIFA. Resultados manuais nunca são sobrescritos.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <button className="btn-primary" onClick={() => simReport('fase de grupos')(api.simulateGroups())}>⚽ Simular fase de grupos</button>
          <button className="btn-soft"    onClick={() => simReport('16ª avos')(api.simulateRound('R32'))}>🎯 Simular 16ª avos</button>
          <button className="btn-soft"    onClick={() => simReport('oitavas')(api.simulateRound('R16'))}>🥊 Simular oitavas</button>
          <button className="btn-soft"    onClick={() => simReport('quartas')(api.simulateRound('QF'))}>🔥 Simular quartas</button>
          <button className="btn-soft"    onClick={() => simReport('semis + 3º + final')(api.simulateRound('SF') + api.simulateRound('3P') + api.simulateRound('F'))}>🏅 Simular semis + final</button>
          <button className="btn-gold"    onClick={() => simReport('mata-mata completo')(api.simulateAllKnockout())}>🏆 Simular mata-mata completo</button>
        </div>
        <button className="btn-ghost w-full mt-1" onClick={onClearSimulated}>
          🧽 Limpar apenas simulações (preserva manuais)
        </button>
      </Card>

      {/* ---------------------------------------------------------------
          3. IMPORTAR / EXPORTAR
         --------------------------------------------------------------- */}
      <Card title="Importar / Exportar dados" icon="💾">
        <div className="flex items-center justify-between text-sm">
          <span>Salvamento automático</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={api.autoSaveEnabled}
              onChange={api.toggleAutoSave}
            />
            <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-checked:bg-brand-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">
          Quando ativo, o estado é gravado no <code>localStorage</code> a cada alteração.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button className="btn-soft" onClick={onExport}>⬇️ Exportar JSON</button>
          <button className="btn-soft" onClick={onImport}>⬆️ Importar JSON</button>
        </div>
      </Card>

      {/* ---------------------------------------------------------------
          4. LIMPEZA DE FASES
         --------------------------------------------------------------- */}
      <Card title="Limpeza de fases" icon="🧹">
        <p className="text-[11px] text-slate-500">
          Reinicia placares de uma fase específica, mantendo as demais intactas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            className="btn-ghost"
            onClick={confirmAnd('Limpar TODOS os placares da fase de grupos?', api.clearGroups)}
          >
            🧹 Limpar fase de grupos
          </button>
          <button
            className="btn-ghost"
            onClick={confirmAnd('Limpar TODOS os placares do mata-mata?', api.clearKnockout)}
          >
            🧹 Limpar mata-mata
          </button>
        </div>
      </Card>

      {/* ---------------------------------------------------------------
          5. RESETAR TORNEIO
         --------------------------------------------------------------- */}
      <Card title="Resetar torneio" icon="♻️">
        <p className="text-[11px] text-slate-500">
          Apaga todos os placares e volta o simulador ao estado inicial. Esta ação não pode ser desfeita.
        </p>
        <button
          className="btn-danger w-full"
          onClick={confirmAnd('Resetar todo o torneio? Esta ação não pode ser desfeita.', api.resetAll)}
        >
          ♻️ Resetar torneio inteiro
        </button>
      </Card>

      {/* ---------------------------------------------------------------
          6. PREFERÊNCIAS
         --------------------------------------------------------------- */}
      <Card title="Preferências" icon="🎨">
        <div className="flex items-center justify-between text-sm">
          <span>Tema visual</span>
          <button className="btn-ghost" onClick={onToggleTheme}>
            {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          O tema é salvo individualmente no seu navegador.
        </p>
      </Card>

      <div className="card card-pad text-[11px] text-slate-500 leading-relaxed">
        <p>
          <strong className="text-slate-700 dark:text-slate-200">Sobre os dados:</strong> nada é
          enviado a nenhum servidor. Todos os placares, desempates manuais e o tema visual ficam
          armazenados apenas no <code>localStorage</code> deste navegador.
        </p>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Sub-componentes
// ----------------------------------------------------------------------------

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad flex flex-col gap-2">
      <h3 className="font-display tracking-wider text-lg flex items-center gap-2">
        <span aria-hidden>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );
}

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
