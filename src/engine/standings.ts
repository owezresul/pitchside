import type { PlayedMatch, StandingRow, TeamId } from './types';

export interface PointsRule {
  win: number;
  draw: number;
}
export const defaultPoints: PointsRule = { win: 3, draw: 1 };

function blank(teamId: TeamId): StandingRow {
  return { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, rank: 0 };
}

function table(teamIds: readonly TeamId[], matches: readonly PlayedMatch[], rule: PointsRule) {
  const rows = new Map(teamIds.map((id) => [id, blank(id)]));
  for (const m of matches) {
    const h = rows.get(m.home);
    const a = rows.get(m.away);
    if (!h || !a) continue;
    h.played++; a.played++;
    h.goalsFor += m.homeScore; h.goalsAgainst += m.awayScore;
    a.goalsFor += m.awayScore; a.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) { h.won++; a.lost++; h.points += rule.win; }
    else if (m.homeScore < m.awayScore) { a.won++; h.lost++; a.points += rule.win; }
    else { h.drawn++; a.drawn++; h.points += rule.draw; a.points += rule.draw; }
  }
  for (const r of rows.values()) r.goalDiff = r.goalsFor - r.goalsAgainst;
  return rows;
}

/**
 * Order: points -> goal difference -> goals scored -> head-to-head points
 * (among the teams still level) -> team id, so the order is always stable.
 */
export function computeStandings(
  teamIds: readonly TeamId[],
  matches: readonly PlayedMatch[],
  rule: PointsRule = defaultPoints,
): StandingRow[] {
  const rows = [...table(teamIds, matches, rule).values()];
  const key = (r: StandingRow) => `${r.points}|${r.goalDiff}|${r.goalsFor}`;

  const groups = new Map<string, StandingRow[]>();
  for (const r of rows) groups.set(key(r), [...(groups.get(key(r)) ?? []), r]);

  const h2h = new Map<TeamId, number>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ids = group.map((g) => g.teamId);
    const mini = table(ids, matches.filter((m) => ids.includes(m.home) && ids.includes(m.away)), rule);
    for (const id of ids) h2h.set(id, mini.get(id)!.points);
  }

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      (h2h.get(b.teamId) ?? 0) - (h2h.get(a.teamId) ?? 0) ||
      a.teamId.localeCompare(b.teamId),
  );
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
