import { useEffect, useState } from 'react';
import { setKeepAwake } from './lib/native';
import { useStore } from './store';
import { LangSwitch } from './components/LangSwitch';
import { useI18n } from './i18n/react';
import { playoffRule } from './engine';
import { Setup } from './screens/Setup';
import { Match } from './screens/Match';
import { Table } from './screens/Table';
import { Bracket } from './screens/Bracket';
import { Results } from './screens/Results';

type Tab = 'match' | 'table' | 'bracket' | 'results';

export default function App() {
  const phase = useStore((s) => s.phase);
  const played = useStore((s) => s.history.length);
  const config = useStore((s) => s.config);
  const [chosen, setTab] = useState<Tab>('match');
  const running = useStore((s) => s.timer.running);
  useEffect(() => { setKeepAwake(running); return () => setKeepAwake(false); }, [running]);

  const teams = useStore((s) => s.teams);
  const { t, lang } = useI18n();
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const hasPlayoffs = playoffRule(config, teams.map((t) => t.id)) !== null;
  const tabIds: Tab[] =
    config.format === 'knockout'
      ? ['match', 'bracket', 'results']
      : hasPlayoffs
        ? ['match', 'table', 'bracket', 'results']
        : ['match', 'table', 'results'];
  const tabs = tabIds.map((id) => [id, t(`tab.${id}`)] as [Tab, string]);
  const tab: Tab = tabs.some(([id]) => id === chosen) ? chosen : 'match';
  const doneTab: Tab = hasPlayoffs ? 'bracket' : 'table';

  return (
    <div className="app">
      <header className="top">
        <span className="top__brand">Pitchside</span>
        <span className="top__ctx">{phase === 'setup' ? t('top.new') : t('top.played', { n: played })}</span>
        <LangSwitch />
      </header>

      <main className="main">
        {phase === 'setup' && <Setup />}
        {phase === 'live' && tab === 'match' && <Match onDone={() => setTab(doneTab)} />}
        {phase === 'live' && tab === 'table' && <Table />}
        {phase === 'live' && tab === 'bracket' && <Bracket />}
        {phase === 'live' && tab === 'results' && <Results onMatch={() => setTab('match')} />}
      </main>

      {phase === 'live' && (
        <nav className="tabs" aria-label={t('app.session')} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map(([id, label]) => (
            <button key={id} className="tabs__item" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
