import { useEffect, useState } from 'react';
import { setKeepAwake } from './lib/native';
import { useStore } from './store';
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
  const hasPlayoffs = playoffRule(config, teams.map((t) => t.id)) !== null;
  const tabs: [Tab, string][] =
    config.format === 'knockout'
      ? [['match', 'Match'], ['bracket', 'Bracket'], ['results', 'Results']]
      : hasPlayoffs
        ? [['match', 'Match'], ['table', 'Table'], ['bracket', 'Bracket'], ['results', 'Results']]
        : [['match', 'Match'], ['table', 'Table'], ['results', 'Results']];
  const tab: Tab = tabs.some(([id]) => id === chosen) ? chosen : 'match';
  const doneTab: Tab = hasPlayoffs ? 'bracket' : 'table';

  return (
    <div className="app">
      <header className="top">
        <span className="top__brand">Pitchside</span>
        <span className="top__ctx">{phase === 'setup' ? 'New session' : `${played} played`}</span>
      </header>

      <main className="main">
        {phase === 'setup' && <Setup />}
        {phase === 'live' && tab === 'match' && <Match onDone={() => setTab(doneTab)} />}
        {phase === 'live' && tab === 'table' && <Table />}
        {phase === 'live' && tab === 'bracket' && <Bracket />}
        {phase === 'live' && tab === 'results' && <Results onMatch={() => setTab('match')} />}
      </main>

      {phase === 'live' && (
        <nav className="tabs" aria-label="Session" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
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
