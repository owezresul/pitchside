import { useMemo } from 'react';
import { BIBS, bibOf, selectFixture, useStore } from '../store';
import { formatClock, useRemaining } from '../lib/useRemaining';
import { useI18n } from '../i18n/react';
import { ChampionCard } from '../components/ChampionCard';
import { Support } from '../components/Support';
import { inPlayoffs, leagueChampions, leagueTotal, nextFixture, playBracket, playoffSetup } from '../engine';

const RESTING_FORMATS = ['round-robin', 'winner-stays', 'timed-rotation'];

function Clock() {
  const { t } = useI18n();
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
        {over ? t('clock.restart') : running ? t('clock.pause') : left === minutes * 60_000 ? t('clock.start') : t('clock.resume')}
      </button>
    </div>
  );
}

function Score({ side }: { side: 'home' | 'away' }) {
  const { t } = useI18n();
  const teams = useStore((s) => s.teams);
  const roster = useStore((s) => s.roster);
  const history = useStore((s) => s.history);
  const config = useStore((s) => s.config);
  const value = useStore((s) => s.live[side]);
  const goal = useStore((s) => s.goal);
  const fixture = useMemo(() => selectFixture({ teams, config, history }), [teams, config, history]);
  if (!fixture) return null;
  const id = fixture[side];
  const team = teams.find((tm) => tm.id === id)!;
  const bib = bibOf(id) ?? BIBS[0];
  const names = (roster?.[id] ?? []).map((p) => p.name).join(', ');
  return (
    <section className="score" style={{ background: bib.color, color: bib.ink }} aria-label={team.name}>
      <h2 className="score__name">{team.name}</h2>
      {names && <p className="score__roster">{names}</p>}
      <div className="score__row">
        <output className="score__num" aria-label={t('match.goals', { team: team.name })}>{value}</output>
        <button className="goalbtn" onClick={() => goal(side, 1)} aria-label={t('match.goalFor', { team: team.name })}>+1</button>
      </div>
      <button className="score__undo" onClick={() => goal(side, -1)} disabled={value === 0}>{t('match.removeGoal')}</button>
    </section>
  );
}

export function Match({ onDone }: { onDone: () => void }) {
  const { t, L } = useI18n();
  const { teams, config, history, live, fullTime, setShootout } = useStore();
  const fixture = useMemo(() => selectFixture({ teams, config, history }), [teams, config, history]);
  const name = (id: string) => teams.find((tm) => tm.id === id)?.name ?? id;
  const ids = teams.map((tm) => tm.id);
  const knockout = inPlayoffs(config, ids, history);
  const setup = playoffSetup(config, ids, history);

  if (!fixture) {
    const out = setup && !setup.projected ? playBracket(setup.seeds, setup.history, setup.thirdPlace).outcome : null;
    const champ = out ? bibOf(out.champion) ?? BIBS[0] : null;
    const champs = leagueChampions(config, ids, history);
    return (
      <div className="screen">
        <section className="done">
          {out && champ ? (
            <div className="champ" style={{ background: champ.color, color: champ.ink }}>
              <p className="champ__tag">{t('match.champions')}</p>
              <h2 className="champ__name">{name(out.champion)}</h2>
            </div>
          ) : champs ? (
            champs.map((c) => (
              <ChampionCard key={c.teamId} teamId={c.teamId} compact={champs.length > 1}
                tag={c.title ? t('champ.groupWinner', { group: L(c.title) }) : undefined} />
            ))
          ) : (
            <h2 className="done__title">{t('match.allPlayed')}</h2>
          )}
          <p className="hint">{setup ? t('match.doneBracket') : t('match.doneTable')}</p>
          <button className="btn btn--primary btn--wide" onClick={onDone}>{setup ? t('match.seeBracket') : t('match.seeTable')}</button>
        </section>
        <Support />
      </div>
    );
  }

  const draw = live.home === live.away;
  const needShootout = knockout && draw;
  const shootoutWinner = needShootout && live.shootout ? fixture[live.shootout] : undefined;
  const next = needShootout && !live.shootout
    ? undefined
    : nextFixture(config, teams.map((tm) => tm.id), [...history, { ...fixture, homeScore: live.home, awayScore: live.away, shootoutWinner }]);
  const resting = teams.filter((tm) => tm.id !== fixture.home && tm.id !== fixture.away);
  const total = leagueTotal(config, ids);
  const dynamic = config.format === 'winner-stays' || config.format === 'timed-rotation' || knockout || (total !== null && history.length + 1 >= total);

  return (
    <div className="screen">
      <p className="matchno">{L(fixture.label ?? `Match ${history.length + 1}`)}</p>
      <Clock />
      <Score side="home" />
      <Score side="away" />

      {needShootout && (
        <section className="shootout" aria-label={t('match.shootoutAria')}>
          <p className="shootout__title">{t('match.shootoutQ')}</p>
          <div className="seg" role="radiogroup" aria-label={t('match.shootoutWinner')}>
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
        {t('match.fullTime')}
      </button>

      {next !== undefined && (
        <p className="next">
          {next ? (
            <>
              <strong>{dynamic ? t('match.upNextIf') : t('match.upNext')}</strong>
              {next.label ? `${L(next.label)}, ` : ''}{t('match.vs', { home: name(next.home), away: name(next.away) })}
            </>
          ) : (
            <strong>{fixture.label === 'Final' ? t('match.final') : t('match.last')}</strong>
          )}
          {!knockout && RESTING_FORMATS.includes(config.format) && teams.length <= 6 && resting.length > 0 && <span className="next__rest">{t('match.sitting', { names: resting.map((tm) => tm.name).join(', ') })}</span>}
        </p>
      )}
    </div>
  );
}
