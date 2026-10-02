import { useMemo } from 'react';
import { BIBS, bibOf, selectFixture, useStore } from '../store';
import { formatClock, useRemaining } from '../lib/useRemaining';
import { inPlayoffs, leagueTotal, nextFixture, playBracket, playoffSetup } from '../engine';

const RESTING_FORMATS = ['round-robin', 'winner-stays', 'timed-rotation'];

function Clock() {
  const minutes = useStore((s) => s.matchMinutes);
  const running = useStore((s) => s.timer.running);
  const toggle = useStore((s) => s.toggleTimer);
  const left = useRemaining();
  if (!minutes) return null;
  const over = left === 0;
  return (
    <div className={`clock${over ? ' clock--over' : ''}`}>
      <output className="clock__time" aria-live="off">{formatClock(left)}</output>
      <button className="btn btn--ghost" onClick={toggle}>
        {over ? 'Restart clock' : running ? 'Pause' : left === minutes * 60_000 ? 'Start clock' : 'Resume'}
      </button>
    </div>
  );
}

function Score({ side }: { side: 'home' | 'away' }) {
  const teams = useStore((s) => s.teams);
  const roster = useStore((s) => s.roster);
  const history = useStore((s) => s.history);
  const config = useStore((s) => s.config);
  const value = useStore((s) => s.live[side]);
  const goal = useStore((s) => s.goal);
  const fixture = useMemo(() => selectFixture({ teams, config, history }), [teams, config, history]);
  if (!fixture) return null;
  const id = fixture[side];
  const team = teams.find((t) => t.id === id)!;
  const bib = bibOf(id) ?? BIBS[0];
  const names = (roster?.[id] ?? []).map((p) => p.name).join(', ');
  return (
    <section className="score" style={{ background: bib.color, color: bib.ink }} aria-label={team.name}>
      <h2 className="score__name">{team.name}</h2>
      {names && <p className="score__roster">{names}</p>}
      <div className="score__row">
        <output className="score__num" aria-label={`${team.name} goals`}>{value}</output>
        <button className="goalbtn" onClick={() => goal(side, 1)} aria-label={`Goal for ${team.name}`}>+1</button>
      </div>
      <button className="score__undo" onClick={() => goal(side, -1)} disabled={value === 0}>Remove a goal</button>
    </section>
  );
}

export function Match({ onDone }: { onDone: () => void }) {
  const { teams, config, history, live, fullTime, setShootout } = useStore();
  const fixture = useMemo(() => selectFixture({ teams, config, history }), [teams, config, history]);
  const name = (id: string) => teams.find((t) => t.id === id)?.name ?? id;
  const ids = teams.map((t) => t.id);
  const knockout = inPlayoffs(config, ids, history);
  const setup = playoffSetup(config, ids, history);

  if (!fixture) {
    const out = setup && !setup.projected ? playBracket(setup.seeds, setup.history, setup.thirdPlace).outcome : null;
    const champ = out ? bibOf(out.champion) ?? BIBS[0] : null;
    return (
      <div className="screen">
        <section className="done">
          {out && champ ? (
            <div className="champ" style={{ background: champ.color, color: champ.ink }}>
              <p className="champ__tag">Champions</p>
              <h2 className="champ__name">{name(out.champion)}</h2>
            </div>
          ) : (
            <h2 className="done__title">All rounds played</h2>
          )}
          <p className="hint">Check the {setup ? 'bracket' : 'final table'}, or reopen the last match from Results if you need to fix it.</p>
          <button className="btn btn--primary btn--wide" onClick={onDone}>{setup ? 'See the bracket' : 'See the table'}</button>
        </section>
      </div>
    );
  }

  const draw = live.home === live.away;
  const needShootout = knockout && draw;
  const shootoutWinner = needShootout && live.shootout ? fixture[live.shootout] : undefined;
  const next = needShootout && !live.shootout
    ? undefined
    : nextFixture(config, teams.map((t) => t.id), [...history, { ...fixture, homeScore: live.home, awayScore: live.away, shootoutWinner }]);
  const resting = teams.filter((t) => t.id !== fixture.home && t.id !== fixture.away);
  const total = leagueTotal(config, ids);
  const dynamic = config.format === 'winner-stays' || config.format === 'timed-rotation' || knockout || (total !== null && history.length + 1 >= total);

  return (
    <div className="screen">
      <p className="matchno">{fixture.label ?? `Match ${history.length + 1}`}</p>
      <Clock />
      <Score side="home" />
      <Score side="away" />

      {needShootout && (
        <section className="shootout" aria-label="Penalty shootout">
          <p className="shootout__title">Level after full time. Who won the penalty shootout?</p>
          <div className="seg" role="radiogroup" aria-label="Shootout winner">
            {(['home', 'away'] as const).map((side) => (
              <button key={side} type="button" role="radio" aria-checked={live.shootout === side}
                className="seg__item" onClick={() => setShootout(side)}>
                {name(fixture[side])}
              </button>
            ))}
          </div>
        </section>
      )}

      <button className="btn btn--primary btn--wide" onClick={fullTime} disabled={needShootout && !live.shootout}>
        Full time
      </button>

      {next !== undefined && (
        <p className="next">
          {next ? (
            <>
              <strong>{dynamic ? 'Up next if it ends like this: ' : 'Up next: '}</strong>
              {next.label ? `${next.label}, ` : ''}{name(next.home)} vs {name(next.away)}
            </>
          ) : (
            <strong>{fixture.label === 'Final' ? 'This is the final' : 'This is the last match'}</strong>
          )}
          {!knockout && RESTING_FORMATS.includes(config.format) && teams.length <= 6 && resting.length > 0 && <span className="next__rest"> Sitting out now: {resting.map((t) => t.name).join(', ')}.</span>}
        </p>
      )}
    </div>
  );
}
