import { describe, expect, it } from 'vitest';
import {
  computeStandings, draftTeams, nextFixture, roundRobinCycle, seededRng, teamStrength,
  type FormatConfig, type Fixture, type PlayedMatch, type Player,
} from './index';

const play = (f: Fixture, homeScore: number, awayScore: number): PlayedMatch => ({ ...f, homeScore, awayScore });

describe('round-robin', () => {
  it('3 teams: each pair plays once per cycle, no team plays twice in a row', () => {
    const c = roundRobinCycle(['A', 'B', 'C']);
    expect(c).toHaveLength(3);
    const pairs = new Set(c.map((f) => [f.home, f.away].sort().join('')));
    expect(pairs).toEqual(new Set(['AB', 'AC', 'BC']));
    for (let i = 1; i < c.length; i++) {
      const prev = [c[i - 1].home, c[i - 1].away];
      const both = prev.includes(c[i].home) && prev.includes(c[i].away);
      expect(both).toBe(false);
    }
  });

  it('4 and 5 teams: every pair exactly once', () => {
    for (const n of [4, 5, 6]) {
      const ids = Array.from({ length: n }, (_, i) => `T${i}`);
      const c = roundRobinCycle(ids);
      expect(c).toHaveLength((n * (n - 1)) / 2);
      expect(new Set(c.map((f) => [f.home, f.away].sort().join('|'))).size).toBe(c.length);
    }
  });

  it('finishes after N cycles, endless never finishes', () => {
    const cfg: FormatConfig = { format: 'round-robin', cycles: 2 };
    const hist: PlayedMatch[] = [];
    for (let i = 0; i < 6; i++) hist.push(play(nextFixture(cfg, ['A', 'B', 'C'], hist)!, 1, 0));
    expect(nextFixture(cfg, ['A', 'B', 'C'], hist)).toBeNull();
    const endless: FormatConfig = { format: 'round-robin', cycles: 'endless' };
    expect(nextFixture(endless, ['A', 'B', 'C'], hist)).not.toBeNull();
  });
});

describe('winner-stays', () => {
  const cfg: FormatConfig = { format: 'winner-stays', drawRule: 'challenger-leaves', maxStreak: null };
  const teams = ['A', 'B', 'C'];

  it('winner stays, loser goes to the back, rested team enters', () => {
    let h: PlayedMatch[] = [];
    expect(nextFixture(cfg, teams, h)).toEqual({ home: 'A', away: 'B' });
    h = [play({ home: 'A', away: 'B' }, 2, 0)];
    expect(nextFixture(cfg, teams, h)).toEqual({ home: 'A', away: 'C' });
    h.push(play({ home: 'A', away: 'C' }, 0, 1)); // challenger C wins, becomes holder
    expect(nextFixture(cfg, teams, h)).toEqual({ home: 'C', away: 'B' });
  });

  it('draw: challenger leaves by default, holder leaves if configured', () => {
    const h = [play({ home: 'A', away: 'B' }, 1, 1)];
    expect(nextFixture(cfg, teams, h)).toEqual({ home: 'A', away: 'C' });
    const hl: FormatConfig = { format: 'winner-stays', drawRule: 'holder-leaves', maxStreak: null };
    expect(nextFixture(hl, teams, h)).toEqual({ home: 'B', away: 'C' });
  });

  it('maxStreak forces the winner to rest', () => {
    const capped: FormatConfig = { format: 'winner-stays', drawRule: 'challenger-leaves', maxStreak: 2 };
    const h = [play({ home: 'A', away: 'B' }, 1, 0), play({ home: 'A', away: 'C' }, 1, 0)];
    const next = nextFixture(capped, teams, h)!;
    expect([next.home, next.away]).not.toContain('A');
  });

  it('works with 2 teams', () => {
    const h = [play({ home: 'A', away: 'B' }, 1, 0)];
    expect(nextFixture(cfg, ['A', 'B'], h)).toEqual({ home: 'A', away: 'B' });
  });
});

describe('timed-rotation', () => {
  const cfg: FormatConfig = { format: 'timed-rotation' };
  it('3 teams: everyone gets the same number of games (+-1) regardless of results', () => {
    const teams = ['A', 'B', 'C'];
    const hist: PlayedMatch[] = [];
    for (let i = 0; i < 9; i++) hist.push(play(nextFixture(cfg, teams, hist)!, 3, 0));
    const counts = Object.fromEntries(teams.map((t) => [t, hist.filter((m) => m.home === t || m.away === t).length]));
    expect(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts))).toBeLessThanOrEqual(1);
    for (let i = 1; i < hist.length; i++) {
      const same = [hist[i].home, hist[i].away].sort().join() === [hist[i - 1].home, hist[i - 1].away].sort().join();
      expect(same).toBe(false);
    }
  });
});

describe('standings', () => {
  it('points, goal difference, goals scored', () => {
    const rows = computeStandings(['A', 'B', 'C'], [
      play({ home: 'A', away: 'B' }, 2, 0),
      play({ home: 'B', away: 'C' }, 1, 1),
      play({ home: 'C', away: 'A' }, 0, 1),
    ]);
    expect(rows.map((r) => r.teamId)).toEqual(['A', 'C', 'B']);
    expect(rows[0]).toMatchObject({ points: 6, goalDiff: 3, played: 2, rank: 1 });
  });

  it('head-to-head breaks a level tie', () => {
    // all three level on 3 pts, gd 0, gf 1... build a case where only h2h differs
    const rows = computeStandings(['A', 'B', 'C', 'D'], [
      play({ home: 'A', away: 'B' }, 1, 0), // A beats B
      play({ home: 'B', away: 'C' }, 1, 0), // B beats C
      play({ home: 'C', away: 'A' }, 1, 0), // C beats A
      play({ home: 'D', away: 'A' }, 0, 0),
    ]);
    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.rank)).size).toBe(4);
  });

  it('order is stable and deterministic when fully level', () => {
    const rows = computeStandings(['B', 'A'], []);
    expect(rows.map((r) => r.teamId)).toEqual(['A', 'B']);
  });
});

describe('drafting', () => {
  const players: Player[] = [
    ...Array.from({ length: 3 }, (_, i): Player => ({ id: `a${i}`, name: `A${i}`, tier: 1 })),
    ...Array.from({ length: 3 }, (_, i): Player => ({ id: `b${i}`, name: `B${i}`, tier: 2 })),
    ...Array.from({ length: 3 }, (_, i): Player => ({ id: `c${i}`, name: `C${i}`, tier: 3 })),
  ];
  const teams = ['X', 'Y', 'Z'];

  it('balanced: each team gets one player from every tier', () => {
    const d = draftTeams(players, teams, 'balanced', seededRng(1));
    for (const t of teams) expect(d[t].map((p) => p.tier).sort()).toEqual([1, 2, 3]);
  });

  it('random and balanced keep team sizes within 1 and use every player once', () => {
    const eleven = players.slice(0, 11 > players.length ? players.length : 11).concat({ id: 'z', name: 'Z', tier: 2 }, { id: 'y', name: 'Y', tier: 3 });
    for (const mode of ['random', 'balanced'] as const) {
      const d = draftTeams(eleven, teams, mode, seededRng(7));
      const sizes = teams.map((t) => d[t].length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(teams.flatMap((t) => d[t]).map((p) => p.id).sort()).toEqual(eleven.map((p) => p.id).sort());
    }
  });

  it('balanced is fairer than the worst random draft on strength spread', () => {
    const uneven: Player[] = [1, 1, 1, 1, 2, 2, 3, 3].map((tier, i) => ({ id: `p${i}`, name: `P${i}`, tier }));
    const spread = (mode: 'random' | 'balanced', seed: number) => {
      const d = draftTeams(uneven, ['X', 'Y'], mode, seededRng(seed));
      const s = ['X', 'Y'].map((t) => teamStrength(d[t], 3));
      return Math.abs(s[0] - s[1]);
    };
    const worstRandom = Math.max(...Array.from({ length: 50 }, (_, s) => spread('random', s)));
    const worstBalanced = Math.max(...Array.from({ length: 50 }, (_, s) => spread('balanced', s)));
    expect(worstBalanced).toBeLessThanOrEqual(worstRandom);
  });
});

import { bracketSize, playBracket, seedOrder } from './index';

describe('knockout', () => {
  const win = (home: string, away: string, hs: number, as: number, shootoutWinner?: string): PlayedMatch =>
    ({ home, away, homeScore: hs, awayScore: as, shootoutWinner });

  it('seed order is the standard bracket', () => {
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(bracketSize(3)).toBe(4);
    expect(bracketSize(5)).toBe(8);
  });

  it('3 teams: seed 1 gets a bye, 2 v 3 then the final', () => {
    const cfg: FormatConfig = { format: 'knockout', thirdPlace: false };
    const ids = ['A', 'B', 'C'];
    expect(nextFixture(cfg, ids, [])).toMatchObject({ home: 'B', away: 'C' });
    const h = [win('B', 'C', 2, 1)];
    expect(nextFixture(cfg, ids, h)).toMatchObject({ home: 'A', away: 'B', label: 'Final' });
    const done = [...h, win('A', 'B', 0, 3)];
    expect(nextFixture(cfg, ids, done)).toBeNull();
    expect(playBracket(ids, done, false).outcome).toEqual({ champion: 'B', runnerUp: 'A', third: undefined });
  });

  it('draw goes to the shootout winner', () => {
    const ids = ['A', 'B', 'C'];
    const b = playBracket(ids, [win('B', 'C', 1, 1, 'C')], false);
    expect(b.next).toMatchObject({ home: 'A', away: 'C' });
    expect(b.rounds[0].matches[0].result?.onPenalties).toBe(true);
  });

  it('4 teams with third place: semis, third place, then final', () => {
    const ids = ['A', 'B', 'C', 'D'];
    const order: string[] = [];
    let h: PlayedMatch[] = [];
    for (let i = 0; i < 4; i++) {
      const f = nextFixture({ format: 'knockout', thirdPlace: true }, ids, h)!;
      order.push(f.label!);
      h = [...h, win(f.home, f.away, 1, 0)];
    }
    expect(order).toEqual(['Semi-final 1', 'Semi-final 2', 'Third place', 'Final']);
    const b = playBracket(ids, h, true);
    expect(b.next).toBeNull();
    expect(b.outcome?.champion).toBeTruthy();
    expect(b.outcome?.champion).not.toBe(b.outcome?.runnerUp);
    expect(b.outcome?.third).toBeTruthy();
  });

  it('5 and 6 teams: byes for top seeds, everyone can finish', () => {
    for (const n of [5, 6]) {
      const ids = Array.from({ length: n }, (_, i) => `T${i}`);
      let h: PlayedMatch[] = [];
      let guard = 0;
      while (guard++ < 20) {
        const f = nextFixture({ format: 'knockout', thirdPlace: true }, ids, h);
        if (!f) break;
        h = [...h, win(f.home, f.away, 2, 1)];
      }
      expect(playBracket(ids, h, true).outcome).not.toBeNull();
      expect(h.length).toBe(n === 5 ? 5 : 6); // n-1 matches + third place
    }
  });
});

describe('big brackets', () => {
  it('up to 32 teams: every match gets a tier/pos and a full run finishes with n-1 matches', () => {
    for (const n of [7, 16, 20, 32]) {
      const ids = Array.from({ length: n }, (_, i) => `t${i}`);
      let h: PlayedMatch[] = [];
      for (let guard = 0; guard < 100; guard++) {
        const f = nextFixture({ format: 'knockout', thirdPlace: false }, ids, h);
        if (!f) break;
        h = [...h, { home: f.home, away: f.away, homeScore: 1, awayScore: 0 }];
      }
      const b = playBracket(ids, h, false);
      expect(h).toHaveLength(n - 1);
      expect(b.outcome).not.toBeNull();
      const all = b.rounds.flatMap((r) => r.matches);
      expect(all.every((m) => m.tier !== undefined && m.pos !== undefined)).toBe(true);
    }
  });
});

import { inPlayoffs, leagueHistory, leagueTotal, playoffSetup } from './index';

describe('group stage then playoffs', () => {
  const win = (home: string, away: string, hs: number, as: number): PlayedMatch => ({ home, away, homeScore: hs, awayScore: as });
  const cfg = (q: number, third = false): FormatConfig => ({ format: 'round-robin', cycles: 1, playoffs: { qualifiers: q, thirdPlace: third } });

  it('4 teams, top 2: 6 group matches then a final, standings ignore the playoff', () => {
    const ids = ['A', 'B', 'C', 'D'];
    expect(leagueTotal(cfg(2), ids)).toBe(6);
    let h: PlayedMatch[] = [];
    const labels: string[] = [];
    for (let guard = 0; guard < 20; guard++) {
      const f = nextFixture(cfg(2), ids, h);
      if (!f) break;
      labels.push(f.label ?? '');
      // lower id always wins so the table is A, B, C, D
      const aWins = f.home < f.away;
      h = [...h, win(f.home, f.away, aWins ? 1 : 0, aWins ? 0 : 1)];
    }
    expect(h).toHaveLength(7);
    expect(labels.slice(0, 6).every((l) => l.startsWith('Group stage'))).toBe(true);
    expect(labels[6]).toBe('Final');
    expect(playoffSetup(cfg(2), ids, h)!.seeds).toEqual(['A', 'B']);
    expect(leagueHistory(cfg(2), ids, h)).toHaveLength(6);
    expect(inPlayoffs(cfg(2), ids, h.slice(0, 5))).toBe(false);
    expect(inPlayoffs(cfg(2), ids, h.slice(0, 6))).toBe(true);
  });

  it('6 teams, top 4 with third place: 15 group + 4 playoff matches', () => {
    const ids = ['A', 'B', 'C', 'D', 'E', 'F'];
    let h: PlayedMatch[] = [];
    for (let guard = 0; guard < 40; guard++) {
      const f = nextFixture(cfg(4, true), ids, h);
      if (!f) break;
      h = [...h, win(f.home, f.away, f.home < f.away ? 2 : 0, f.home < f.away ? 0 : 2)];
    }
    expect(h).toHaveLength(15 + 4);
    expect(playoffSetup(cfg(4, true), ids, h)!.seeds).toEqual(['A', 'B', 'C', 'D']);
  });

  it('projected seeds before the group stage ends', () => {
    const ps = playoffSetup(cfg(2), ['A', 'B', 'C'], []);
    expect(ps?.projected).toBe(true);
  });

  it('plain round-robin is unaffected', () => {
    expect(leagueTotal({ format: 'round-robin', cycles: 1 }, ['A', 'B', 'C'])).toBeNull();
    expect(playoffSetup({ format: 'round-robin', cycles: 1 }, ['A', 'B', 'C'], [])).toBeNull();
  });
});

import { assignGroups, defaultFor, leagueTables, normalizeConfig, playoffRule, stagePlan, swissSchedule } from './index';

describe('groups', () => {
  const ids8 = Array.from({ length: 8 }, (_, i) => `t${i}`);
  const run = (cfg: FormatConfig, ids: string[], pick: (f: Fixture) => [number, number] = (f) => (f.home < f.away ? [2, 0] : [0, 2])) => {
    let h: PlayedMatch[] = [];
    for (let guard = 0; guard < 500; guard++) {
      const f = nextFixture(cfg, ids, h);
      if (!f) break;
      const [a, b] = pick(f);
      h = [...h, { home: f.home, away: f.away, homeScore: a, awayScore: b }];
    }
    return h;
  };

  it('deals teams into groups of near-equal size, snake or random', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `t${i}`);
    for (const draw of ['seeded', 'random'] as const) {
      const g = assignGroups(ids, 3, draw, 42);
      expect(g.flat().sort()).toEqual([...ids].sort());
      const sizes = g.map((x) => x.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    }
    expect(assignGroups(ids, 2, 'seeded', 0)[0].slice(0, 4)).toEqual(['t0', 't3', 't4', 't7']);
    expect(assignGroups(ids, 3, 'random', 7)).toEqual(assignGroups(ids, 3, 'random', 7));
  });

  it('2 groups of 4, top 2 advance: 12 group matches, then semis and final', () => {
    const cfg: FormatConfig = { format: 'groups', groups: 2, cycles: 1, advance: 2, draw: 'seeded', seed: 1, playoffs: { thirdPlace: false } };
    const h = run(cfg, ids8);
    expect(h).toHaveLength(12 + 3);
    expect(stagePlan(cfg, ids8)!.fixtures.every((f) => f.label!.startsWith('Group'))).toBe(true);
    expect(playoffRule(cfg, ids8)).toEqual({ qualifiers: 4, thirdPlace: false });
    expect(leagueTables(cfg, ids8, h).map((t) => t.title)).toEqual(['Group A', 'Group B']);
  });

  it('group winners are seeded first and nobody meets their own group in round one', () => {
    const cfg: FormatConfig = { format: 'groups', groups: 4, cycles: 1, advance: 2, draw: 'random', seed: 5, playoffs: { thirdPlace: false } };
    const ids = Array.from({ length: 16 }, (_, i) => `t${i}`);
    const h = run(cfg, ids);
    const ps = playoffSetup(cfg, ids, h)!;
    const groups = stagePlan(cfg, ids)!.groups!;
    const gi = (id: string) => groups.findIndex((g) => g.includes(id));
    expect(ps.seeds).toHaveLength(8);
    expect(new Set(ps.seeds.slice(0, 4).map(gi)).size).toBe(4); // four winners, four different groups
    const order = seedOrder(8);
    for (let p = 0; p < 8; p += 2) expect(gi(ps.seeds[order[p] - 1])).not.toBe(gi(ps.seeds[order[p + 1] - 1]));
    expect(h).toHaveLength(4 * 6 + 7);
  });

  it('normalize keeps groups valid when the team count shrinks', () => {
    const cfg = defaultFor('groups', 16);
    const small = normalizeConfig(cfg, 6);
    expect(small.format === 'groups' && small.groups <= 3 && small.advance <= 2).toBe(true);
  });
});

describe('Champions League style league phase', () => {
  it('36 teams, 8 matches each: 144 unique matches, 8 opponents each, evenly paced', () => {
    const ids = Array.from({ length: 36 }, (_, i) => `t${i}`);
    const f = swissSchedule(ids, 8, 123);
    expect(f).toHaveLength(144);
    const pairs = new Set(f.map((x) => [x.home, x.away].sort().join('|')));
    expect(pairs.size).toBe(144);
    const count = (id: string, upTo = f.length) => f.slice(0, upTo).filter((x) => x.home === id || x.away === id).length;
    for (const id of ids) expect(count(id)).toBe(8);
    for (let k = 10; k <= 144; k += 17) {
      const cs = ids.map((id) => count(id, k));
      expect(Math.max(...cs) - Math.min(...cs)).toBeLessThanOrEqual(2);
    }
    expect(swissSchedule(ids, 8, 123)).toEqual(f); // same seed, same schedule
  });

  it('odd team counts get an even number of matches each', () => {
    const ids = Array.from({ length: 9 }, (_, i) => `t${i}`);
    const f = swissSchedule(ids, 5, 9); // 5 is odd, so it drops to 4
    for (const id of ids) expect(f.filter((x) => x.home === id || x.away === id).length).toBe(4);
  });

  it('full 36 team run: top 8 skip the play-off round, 9th to 24th play off', () => {
    const ids = Array.from({ length: 36 }, (_, i) => `t${i}`);
    const cfg: FormatConfig = { format: 'swiss', matches: 8, seed: 3, playoffs: { qualifiers: 24, thirdPlace: false } };
    let h: PlayedMatch[] = [];
    const labels: string[] = [];
    for (let guard = 0; guard < 400; guard++) {
      const f = nextFixture(cfg, ids, h);
      if (!f) break;
      labels.push(f.label ?? '');
      const aWins = Number(f.home.slice(1)) < Number(f.away.slice(1));
      h = [...h, { home: f.home, away: f.away, homeScore: aWins ? 1 : 0, awayScore: aWins ? 0 : 1 }];
    }
    expect(h).toHaveLength(144 + 8 + 8 + 4 + 2 + 1);
    expect(labels[144]).toBe('Play-off round 1');
    expect(labels.filter((l) => l.startsWith('Play-off round'))).toHaveLength(8);
    const ps = playoffSetup(cfg, ids, h)!;
    expect(ps.seeds).toHaveLength(24);
    const table = leagueTables(cfg, ids, h)[0];
    expect(table.through).toBe(24);
    expect(table.byes).toBe(8);
  });
});

import { leagueChampions } from './index';

describe('champions of league stages and big tournaments', () => {
  const play = (cfg: FormatConfig, ids: string[]) => {
    let h: PlayedMatch[] = [];
    for (let guard = 0; guard < 5000; guard++) {
      const f = nextFixture(cfg, ids, h);
      if (!f) break;
      const homeWins = Number(f.home.slice(1)) < Number(f.away.slice(1));
      h = [...h, { home: f.home, away: f.away, homeScore: homeWins ? 2 : 0, awayScore: homeWins ? 0 : 1 }];
    }
    return h;
  };

  it('a finished league with no playoffs has one champion, and none before it ends', () => {
    const ids = ['t0', 't1', 't2', 't3'];
    const cfg: FormatConfig = { format: 'round-robin', cycles: 1, playoffs: null };
    expect(leagueChampions(cfg, ids, [])).toBeNull();
    const h = play(cfg, ids);
    expect(h).toHaveLength(6);
    expect(leagueChampions(cfg, ids, h.slice(0, 5))).toBeNull();
    expect(leagueChampions(cfg, ids, h)).toEqual([{ title: null, teamId: 't0' }]);
  });

  it('groups without playoffs give one winner per group; with playoffs there is no league champion', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `t${i}`);
    const cfg: FormatConfig = { format: 'groups', groups: 2, cycles: 1, advance: 2, draw: 'seeded', seed: 1, playoffs: null };
    const c = leagueChampions(cfg, ids, play(cfg, ids))!;
    expect(c.map((x) => x.title)).toEqual(['Group A', 'Group B']);
    expect(c.map((x) => x.teamId)).toEqual(['t0', 't1']);
    expect(leagueChampions({ ...cfg, playoffs: { thirdPlace: false } }, ids, play({ ...cfg, playoffs: { thirdPlace: false } }, ids))).toBeNull();
  });

  it('a Champions-style league phase without playoffs crowns the table leader', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `t${i}`);
    const cfg: FormatConfig = { format: 'swiss', matches: 4, seed: 2, playoffs: null };
    const h = play(cfg, ids);
    expect(h).toHaveLength(20);
    expect(leagueChampions(cfg, ids, h)).toHaveLength(1);
  });

  it('64 teams: knockout bracket and 16 groups both run to the end', () => {
    const ids = Array.from({ length: 64 }, (_, i) => `t${i}`);
    expect(play({ format: 'knockout', thirdPlace: true }, ids)).toHaveLength(64);
    const g = defaultFor('groups', 64);
    const norm = normalizeConfig({ ...g, format: 'groups', groups: 16, advance: 2 } as FormatConfig, 64);
    expect(norm.format === 'groups' && norm.groups).toBe(16);
    const h = play(norm, ids);
    expect(h).toHaveLength(16 * 6 + 31); // 16 groups of 4, then 32 qualifiers
  });
});
