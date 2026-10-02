import type { Fixture, TeamId } from './types';

const BYE = '__bye__';

/** One cycle via the circle method. Odd team counts get a bye (3 teams -> one rests each round). */
export function roundRobinCycle(teamIds: readonly TeamId[]): Fixture[] {
  const ids: string[] = [...teamIds];
  if (ids.length < 2) return [];
  if (ids.length % 2) ids.push(BYE);
  const n = ids.length;
  const fixtures: Fixture[] = [];
  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      const a = ids[i];
      const b = ids[n - 1 - i];
      if (a === BYE || b === BYE) continue;
      // alternate home/away so nobody is always "home"
      fixtures.push((i + round) % 2 ? { home: b, away: a } : { home: a, away: b });
    }
    ids.splice(1, 0, ids.pop()!); // rotate everyone except the first
  }
  return fixtures;
}

/** The k-th (0-based) fixture of a round-robin that repeats `cycles` times. null once it is finished. */
export function roundRobinFixture(teamIds: readonly TeamId[], k: number, cycles: number | 'endless'): Fixture | null {
  const cycle = roundRobinCycle(teamIds);
  if (!cycle.length) return null;
  if (cycles !== 'endless' && k >= cycle.length * cycles) return null;
  const f = cycle[k % cycle.length];
  // flip home/away on odd cycles
  return Math.floor(k / cycle.length) % 2 ? { home: f.away, away: f.home } : f;
}
