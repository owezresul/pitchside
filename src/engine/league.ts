import { bracketSize, seedOrder } from './bracket';
import { seededRng, shuffle } from './rng';
import { roundRobinCycle, roundRobinFixture } from './roundrobin';
import { computeStandings } from './standings';
import type { Fixture, FormatConfig, FormatId, PlayedMatch, PlayoffRule, StandingRow, TeamId } from './types';

export const groupLetter = (i: number) => String.fromCharCode(65 + i);

/* ------------------------------------------------------------------ groups */

/** Seeded = snake by team order (1 2 3 | 3 2 1 ...). Random = shuffled with a stored seed, so it survives refresh. */
export function assignGroups(ids: readonly TeamId[], groups: number, draw: 'random' | 'seeded', seed: number): TeamId[][] {
  const order = draw === 'random' ? shuffle(ids, seededRng(seed)) : [...ids];
  const out: TeamId[][] = Array.from({ length: groups }, () => []);
  order.forEach((id, i) => {
    const row = Math.floor(i / groups);
    const col = i % groups;
    out[draw === 'seeded' && row % 2 ? groups - 1 - col : col].push(id);
  });
  return out;
}

/* ------------------------------------------------------------------- swiss */

/**
 * Everyone plays `matches` different opponents, once each. Built as a circulant graph over a seeded
 * shuffle (so it is the same after a refresh), then ordered greedily so teams progress evenly and
 * rarely play twice in a row. Needs matches < teams, and an even teams*matches.
 */
export function swissSchedule(ids: readonly TeamId[], matches: number, seed: number): Fixture[] {
  const n = ids.length;
  let m = Math.min(matches, n - 1);
  if (n % 2 === 1 && m % 2 === 1) m -= 1;
  if (m < 1) return [];

  const order = shuffle(ids, seededRng(seed));
  const edges: [TeamId, TeamId][] = [];
  for (let d = 1; d <= Math.floor(m / 2); d++) for (let i = 0; i < n; i++) edges.push([order[i], order[(i + d) % n]]);
  if (m % 2 === 1) for (let i = 0; i < n / 2; i++) edges.push([order[i], order[i + n / 2]]);

  const played = new Map<TeamId, number>(ids.map((id) => [id, 0]));
  const homes = new Map<TeamId, number>(ids.map((id) => [id, 0]));
  const out: Fixture[] = [];
  let last: [TeamId, TeamId] | null = null;

  while (edges.length) {
    let best = 0;
    let bestScore = Infinity;
    edges.forEach(([a, b], i) => {
      const pa = played.get(a)!; const pb = played.get(b)!;
      const clash = last && (last.includes(a) || last.includes(b)) ? 1 : 0;
      const score = Math.max(pa, pb) * 1e6 + (pa + pb) * 1e3 + clash * 10 + i / 1000;
      if (score < bestScore) { bestScore = score; best = i; }
    });
    const [a, b] = edges.splice(best, 1)[0];
    const aHome = homes.get(a)! <= homes.get(b)!;
    const f: Fixture = aHome ? { home: a, away: b } : { home: b, away: a };
    homes.set(f.home, homes.get(f.home)! + 1);
    played.set(a, played.get(a)! + 1); played.set(b, played.get(b)! + 1);
    out.push({ ...f, label: `League phase ${out.length + 1} of ${out.length + 1 + edges.length}` });
    last = [a, b];
  }
  const total = out.length;
  return out.map((f, i) => ({ ...f, label: `League phase ${i + 1} of ${total}` }));
}

/* -------------------------------------------------------------- stage plan */

export interface StagePlan {
  fixtures: Fixture[];
  /** Group membership for the groups format, otherwise null. */
  groups: TeamId[][] | null;
}

const cache = new Map<string, StagePlan | null>();

/** The fixed list of league/group matches, or null for formats without one (knockout, street rules, endless). */
export function stagePlan(config: FormatConfig, ids: readonly TeamId[]): StagePlan | null {
  if (config.format !== 'round-robin' && config.format !== 'groups' && config.format !== 'swiss') return null;
  const key = JSON.stringify([config, ids]);
  if (cache.has(key)) return cache.get(key)!;
  if (cache.size > 24) cache.clear();
  const plan = buildPlan(config, ids);
  cache.set(key, plan);
  return plan;
}

function buildPlan(config: FormatConfig, ids: readonly TeamId[]): StagePlan | null {
  if (config.format === 'round-robin') {
    if (config.cycles === 'endless') return null;
    const total = roundRobinCycle(ids).length * config.cycles;
    const fixtures = Array.from({ length: total }, (_, k) => {
      const f = roundRobinFixture(ids, k, config.cycles)!;
      return config.playoffs ? { ...f, label: `Group stage ${k + 1} of ${total}` } : f;
    });
    return { fixtures, groups: null };
  }
  if (config.format === 'groups') {
    const groups = assignGroups(ids, config.groups, config.draw, config.seed);
    const lists = groups.map((members, gi) => {
      const cycle = roundRobinCycle(members);
      const all: Fixture[] = [];
      for (let c = 0; c < config.cycles; c++) for (const f of cycle) all.push(c % 2 ? { home: f.away, away: f.home } : f);
      return all.map((f, k) => ({ ...f, label: `Group ${groupLetter(gi)}, match ${k + 1} of ${all.length}` }));
    });
    const fixtures: Fixture[] = [];
    for (let k = 0; k < Math.max(...lists.map((l) => l.length)); k++) for (const l of lists) if (k < l.length) fixtures.push(l[k]);
    return { fixtures, groups };
  }
  if (config.format === 'swiss') return { fixtures: swissSchedule(ids, config.matches, config.seed), groups: null };
  return null;
}

/* ---------------------------------------------------------------- playoffs */

/** null = no knockout stage follows. Knockout-only sessions put everybody in. */
export function playoffRule(config: FormatConfig, ids: readonly TeamId[]): PlayoffRule | null {
  const n = ids.length;
  const make = (q: number, thirdPlace: boolean): PlayoffRule => {
    const qualifiers = Math.min(Math.max(q, 2), n);
    return { qualifiers, thirdPlace: thirdPlace && qualifiers >= 4 };
  };
  switch (config.format) {
    case 'knockout': return make(n, config.thirdPlace);
    case 'round-robin': return config.playoffs ? make(config.playoffs.qualifiers, config.playoffs.thirdPlace) : null;
    case 'swiss': return config.playoffs ? make(config.playoffs.qualifiers, config.playoffs.thirdPlace) : null;
    case 'groups': return config.playoffs ? make(config.groups * config.advance, config.playoffs.thirdPlace) : null;
    default: return null;
  }
}

/** Number of group/league matches when a knockout follows them, otherwise null. */
export function leagueTotal(config: FormatConfig, ids: readonly TeamId[]): number | null {
  const plan = stagePlan(config, ids);
  return plan && playoffRule(config, ids) ? plan.fixtures.length : null;
}

/** Only the league/group matches (everything, when there is no fixed league stage). */
export function leagueHistory(config: FormatConfig, ids: readonly TeamId[], history: readonly PlayedMatch[]): PlayedMatch[] {
  const plan = stagePlan(config, ids);
  return plan ? history.slice(0, plan.fixtures.length) : [...history];
}

/** True when the current/next match is a knockout match (somebody has to win it). */
export function inPlayoffs(config: FormatConfig, ids: readonly TeamId[], history: readonly PlayedMatch[]): boolean {
  if (config.format === 'knockout') return true;
  const total = leagueTotal(config, ids);
  return total !== null && history.length >= total;
}

interface Cand { id: TeamId; gi: number; rank: number; ppg: number; gd: number; gf: number }

/** Swap teams inside the same seed tier so nobody meets a team from their own group in round one. */
function avoidSameGroup(cands: Cand[]): Cand[] {
  const n = cands.length;
  const order = seedOrder(bracketSize(n));
  const arr = cands.slice();
  for (let p = 0; p < order.length; p += 2) {
    const a = order[p]; const b = order[p + 1];
    if (a > n || b > n || arr[a - 1].gi !== arr[b - 1].gi) continue;
    const strong = Math.min(a, b); const weak = Math.max(a, b);
    for (let s = 1; s <= n; s++) {
      if (s === weak || s === strong || arr[s - 1].rank !== arr[weak - 1].rank) continue;
      const mate = order[order.indexOf(s) ^ 1];
      const okA = arr[s - 1].gi !== arr[strong - 1].gi;
      const okB = mate > n || arr[weak - 1].gi !== arr[mate - 1].gi;
      if (okA && okB) { [arr[s - 1], arr[weak - 1]] = [arr[weak - 1], arr[s - 1]]; break; }
    }
  }
  return arr;
}

/** Who goes into the bracket, best seed first. */
export function playoffSeeds(config: FormatConfig, ids: readonly TeamId[], league: readonly PlayedMatch[]): TeamId[] {
  const rule = playoffRule(config, ids);
  if (!rule) return [];
  if (config.format === 'knockout') return [...ids];
  const plan = stagePlan(config, ids);
  if (config.format === 'groups' && plan?.groups) {
    const cands: Cand[] = plan.groups.flatMap((members, gi) =>
      computeStandings(members, league.filter((m) => members.includes(m.home) && members.includes(m.away)))
        .slice(0, config.advance)
        .map((r) => ({
          id: r.teamId, gi, rank: r.rank,
          ppg: r.played ? r.points / r.played : 0, gd: r.played ? r.goalDiff / r.played : 0, gf: r.played ? r.goalsFor / r.played : 0,
        })),
    );
    cands.sort((x, y) => x.rank - y.rank || y.ppg - x.ppg || y.gd - x.gd || y.gf - x.gf || x.gi - y.gi);
    return avoidSameGroup(cands).map((c) => c.id);
  }
  return computeStandings(ids, league).slice(0, rule.qualifiers).map((r) => r.teamId);
}

export interface PlayoffSetup {
  seeds: TeamId[];
  history: PlayedMatch[];
  thirdPlace: boolean;
  /** true while the league/group stage is still running: seeds are just today's qualifiers. */
  projected: boolean;
}

/** Everything the bracket needs, for pure knockout and for league/groups/swiss + playoffs. null = no playoffs. */
export function playoffSetup(config: FormatConfig, ids: readonly TeamId[], history: readonly PlayedMatch[]): PlayoffSetup | null {
  const rule = playoffRule(config, ids);
  if (!rule) return null;
  if (config.format === 'knockout') return { seeds: [...ids], history: [...history], thirdPlace: rule.thirdPlace, projected: false };
  const plan = stagePlan(config, ids);
  if (!plan) return null;
  const total = plan.fixtures.length;
  const league = history.slice(0, total);
  return { seeds: playoffSeeds(config, ids, league), history: history.slice(total), thirdPlace: rule.thirdPlace, projected: league.length < total };
}

/* ------------------------------------------------------------------ tables */

export interface LeagueTable {
  title: string | null;
  rows: StandingRow[];
  /** Rows (from the top) that qualify for the knockout stage. */
  through: number;
  /** Of those, how many skip the first knockout round. */
  byes: number;
}

export function leagueTables(config: FormatConfig, ids: readonly TeamId[], history: readonly PlayedMatch[]): LeagueTable[] {
  const league = leagueHistory(config, ids, history);
  const plan = stagePlan(config, ids);
  const rule = playoffRule(config, ids);
  if (config.format === 'groups' && plan?.groups) {
    return plan.groups.map((members, gi) => ({
      title: `Group ${groupLetter(gi)}`,
      rows: computeStandings(members, league.filter((m) => members.includes(m.home) && members.includes(m.away))),
      through: rule ? Math.min(config.advance, members.length) : 0,
      byes: 0,
    }));
  }
  const q = rule?.qualifiers ?? 0;
  return [{ title: null, rows: computeStandings(ids, league), through: q, byes: q >= 2 ? bracketSize(q) - q : 0 }];
}

/* ------------------------------------------------------------ config tools */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Keeps a config valid for the current number of teams. */
export function normalizeConfig(config: FormatConfig, n: number): FormatConfig {
  switch (config.format) {
    case 'round-robin':
      return {
        ...config,
        cycles: config.playoffs && config.cycles === 'endless' ? 1 : config.cycles,
        playoffs: config.playoffs ? { ...config.playoffs, qualifiers: clamp(config.playoffs.qualifiers, 2, Math.max(2, n)) } : null,
      };
    case 'groups': {
      const groups = clamp(config.groups, 2, Math.max(2, Math.min(8, Math.floor(n / 2))));
      return { ...config, groups, cycles: clamp(config.cycles, 1, 4), advance: clamp(config.advance, 1, Math.max(1, Math.floor(n / groups))) };
    }
    case 'swiss': {
      let matches = clamp(config.matches, 1, Math.max(1, n - 1));
      if (n % 2 === 1 && matches % 2 === 1) matches = matches + 1 <= n - 1 ? matches + 1 : Math.max(1, matches - 1);
      return { ...config, matches, playoffs: config.playoffs ? { ...config.playoffs, qualifiers: clamp(config.playoffs.qualifiers, 2, Math.max(2, n)) } : null };
    }
    default: return config;
  }
}

/** Sensible starting settings when the organizer picks a format. */
export function defaultFor(id: FormatId, n: number): FormatConfig {
  switch (id) {
    case 'round-robin': return { format: 'round-robin', cycles: 1, playoffs: null };
    case 'groups': {
      const groups = clamp(Math.floor(n / 4), 2, 8);
      return normalizeConfig({ format: 'groups', groups, cycles: 1, advance: 2, draw: 'random', seed: newSeed(), playoffs: { thirdPlace: false } }, n);
    }
    case 'swiss':
      return normalizeConfig({
        format: 'swiss', matches: n >= 24 ? 8 : 4, seed: newSeed(),
        playoffs: { qualifiers: n >= 24 ? 24 : Math.min(n, 8), thirdPlace: false },
      }, n);
    case 'knockout': return { format: 'knockout', thirdPlace: false };
    case 'winner-stays': return { format: 'winner-stays', drawRule: 'challenger-leaves', maxStreak: null };
    case 'timed-rotation': return { format: 'timed-rotation' };
  }
}

export { newSeed };
