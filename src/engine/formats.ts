import { playBracket } from './bracket';
import { playoffRule, playoffSeeds, stagePlan } from './league';
import { roundRobinFixture } from './roundrobin';
import type { Fixture, FormatConfig, PlayedMatch, TeamId, WinnerStaysConfig } from './types';

export { roundRobinCycle } from './roundrobin';

type Result = 'home' | 'away' | 'draw';
const resultOf = (m: PlayedMatch): Result =>
  m.homeScore > m.awayScore ? 'home' : m.homeScore < m.awayScore ? 'away' : 'draw';

/**
 * Winner stays on. Replays history so the next fixture is always derived from
 * what actually happened (undo/edit a score and everything stays consistent).
 */
function winnerStaysNext(teamIds: readonly TeamId[], history: readonly PlayedMatch[], cfg: WinnerStaysConfig): Fixture | null {
  if (teamIds.length < 2) return null;
  let holder = teamIds[0];
  let challenger = teamIds[1];
  let queue = teamIds.slice(2);
  let streak = 0;

  for (const m of history) {
    const res = resultOf(m);
    let winner: TeamId | null = res === 'draw' ? null : res === 'home' ? m.home : m.away;
    let loser: TeamId;

    if (winner === null) {
      loser = cfg.drawRule === 'holder-leaves' ? holder : challenger;
      winner = loser === holder ? challenger : holder;
      streak = winner === holder ? streak : 0;
    } else {
      loser = winner === m.home ? m.away : m.home;
      streak = winner === holder ? streak + 1 : 1;
    }

    queue.push(loser);
    holder = winner;

    const capped = cfg.maxStreak !== null && streak >= cfg.maxStreak && queue.length >= 2;
    if (capped) {
      queue.push(holder);
      holder = queue.shift()!;
      streak = 0;
    }
    challenger = queue.shift()!;
  }
  return { home: holder, away: challenger };
}

/**
 * Fair rotation: the resting team always comes on; the team that has played
 * the most games in a row goes off, regardless of score. Ties -> loser leaves,
 * draw -> the challenger leaves. Score still counts for the standings.
 */
function rotationNext(teamIds: readonly TeamId[], history: readonly PlayedMatch[]): Fixture | null {
  if (teamIds.length < 2) return null;
  let holder = teamIds[0];
  let challenger = teamIds[1];
  const queue = teamIds.slice(2);
  const consecutive = new Map<TeamId, number>(teamIds.map((t) => [t, 0]));

  for (const m of history) {
    for (const t of teamIds) consecutive.set(t, queue.includes(t) ? 0 : (consecutive.get(t) ?? 0));
    consecutive.set(m.home, (consecutive.get(m.home) ?? 0) + 1);
    consecutive.set(m.away, (consecutive.get(m.away) ?? 0) + 1);

    const hc = consecutive.get(holder)!;
    const cc = consecutive.get(challenger)!;
    let leaver: TeamId;
    if (hc !== cc) leaver = hc > cc ? holder : challenger;
    else {
      const res = resultOf(m);
      const loser = res === 'draw' ? challenger : res === 'home' ? m.away : m.home;
      leaver = loser;
    }
    const stayer = leaver === holder ? challenger : holder;
    if (queue.length === 0) { challenger = leaver; holder = stayer; continue; }
    queue.push(leaver);
    holder = stayer;
    challenger = queue.shift()!;
  }
  return { home: holder, away: challenger };
}

/** The single entry point the UI calls: "what's the next match?" null = schedule finished. */
export function nextFixture(config: FormatConfig, teamIds: readonly TeamId[], history: readonly PlayedMatch[]): Fixture | null {
  switch (config.format) {
    case 'winner-stays': return winnerStaysNext(teamIds, history, config);
    case 'timed-rotation': return rotationNext(teamIds, history);
    case 'knockout': return playBracket(teamIds, history, config.thirdPlace).next;
    default: {
      if (config.format === 'round-robin' && config.cycles === 'endless') return roundRobinFixture(teamIds, history.length, 'endless');
      const plan = stagePlan(config, teamIds);
      if (!plan) return null;
      if (history.length < plan.fixtures.length) return plan.fixtures[history.length];
      const rule = playoffRule(config, teamIds);
      if (!rule) return null;
      const league = history.slice(0, plan.fixtures.length);
      return playBracket(playoffSeeds(config, teamIds, league), history.slice(plan.fixtures.length), rule.thirdPlace).next;
    }
  }
}
