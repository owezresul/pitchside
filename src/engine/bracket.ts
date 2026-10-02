import type { Fixture, PlayedMatch, TeamId } from './types';

export interface Slot { team: TeamId | null; label: string; bye?: boolean }
export interface BracketResult { match: PlayedMatch; winner: TeamId; loser: TeamId; onPenalties: boolean }
/** tier = round index (0 = first round), pos = position inside that round. Third place has neither. */
export interface BracketMatch { label: string; home: Slot; away: Slot; result?: BracketResult; tier?: number; pos?: number }
export interface BracketRound { name: string; matches: BracketMatch[] }
export interface Outcome { champion: TeamId; runnerUp: TeamId; third?: TeamId }
export interface Bracket { rounds: BracketRound[]; next: Fixture | null; outcome: Outcome | null }

/** Standard seeding: 1 meets the lowest seed, 1 and 2 can only meet in the final. */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const len = order.length * 2;
    order = order.flatMap((s) => [s, len + 1 - s]);
  }
  return order;
}

export const bracketSize = (n: number) => { let s = 2; while (s < n) s *= 2; return s; };

const roundName = (slots: number) =>
  slots === 2 ? 'Final' : slots === 4 ? 'Semi-final' : slots === 8 ? 'Quarter-final' : `Round of ${slots}`;

/**
 * Builds the whole bracket from the match history. Seeds = team order (first = top seed).
 * Odd sizes give byes to the top seeds. Like the other formats it is derived by
 * replaying history, so reopening the last match just works.
 */
export function playBracket(seeds: readonly TeamId[], history: readonly PlayedMatch[], thirdPlace: boolean): Bracket {
  const n = seeds.length;
  const rounds: BracketRound[] = [];
  if (n < 2) return { rounds, next: null, outcome: null };

  let used = 0;
  let slots: Slot[] = seedOrder(bracketSize(n)).map((seed) =>
    seed <= n ? { team: seeds[seed - 1], label: `Seed ${seed}` } : { team: null, label: 'Bye', bye: true },
  );

  const play = (label: string, home: Slot, away: Slot): BracketMatch => {
    const m: BracketMatch = { label, home, away };
    if (home.team && away.team && used < history.length) {
      const r = history[used++];
      const draw = r.homeScore === r.awayScore;
      const winner = r.homeScore > r.awayScore ? r.home : r.awayScore > r.homeScore ? r.away : (r.shootoutWinner ?? r.home);
      m.result = { match: r, winner, loser: winner === r.home ? r.away : r.home, onPenalties: draw };
    }
    return m;
  };
  const winnerSlot = (m: BracketMatch): Slot =>
    m.result ? { team: m.result.winner, label: '' } : { team: null, label: `Winner of ${m.label}` };
  const loserSlot = (m: BracketMatch): Slot =>
    m.result ? { team: m.result.loser, label: '' } : { team: null, label: `Loser of ${m.label}` };

  let third: BracketMatch | undefined;
  let tier = 0;
  while (slots.length > 1) {
    const name = tier === 0 && bracketSize(n) > n && slots.length >= 16 ? 'Play-off round' : roundName(slots.length);
    const pairs: [Slot, Slot][] = [];
    for (let i = 0; i < slots.length; i += 2) pairs.push([slots[i], slots[i + 1]]);
    const real = pairs.filter(([a, b]) => !a.bye && !b.bye).length;

    let idx = 0;
    const matches: BracketMatch[] = [];
    const next: Slot[] = [];
    for (let pi = 0; pi < pairs.length; pi++) {
      const [a, b] = pairs[pi];
      if (a.bye || b.bye) { next.push(a.bye ? b : a); continue; }
      const m = play(real > 1 ? `${name} ${++idx}` : name, a, b);
      m.tier = tier; m.pos = pi;
      matches.push(m);
      next.push(winnerSlot(m));
    }
    rounds.push({ name, matches });

    if (thirdPlace && slots.length === 4 && matches.length === 2) {
      third = play('Third place', loserSlot(matches[0]), loserSlot(matches[1]));
      rounds.push({ name: 'Third place', matches: [third] });
    }
    slots = next;
    tier++;
  }

  const all = rounds.flatMap((r) => r.matches);
  const nextMatch = all.find((m) => !m.result && m.home.team && m.away.team);
  const final = rounds[rounds.length - 1].matches[0];
  const outcome: Outcome | null =
    final.result && (!third || third.result)
      ? { champion: final.result.winner, runnerUp: final.result.loser, third: third?.result?.winner }
      : null;

  return {
    rounds,
    next: nextMatch ? { home: nextMatch.home.team!, away: nextMatch.away.team!, label: nextMatch.label } : null,
    outcome,
  };
}
