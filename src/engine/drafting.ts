import { shuffle, type Rng } from './rng';
import type { Player, TeamId } from './types';

export type DraftMode = 'random' | 'balanced';
export type Draft = Record<TeamId, Player[]>;

/**
 * random   : shuffle, deal one by one (team sizes differ by at most 1).
 * balanced : sort by tier (1 = best), shuffle inside each tier, then snake-deal
 *            (A B C | C B A | A B C ...) so strong players spread evenly.
 * The starting team is randomised so team A isn't always favoured by the snake.
 */
export function draftTeams(players: readonly Player[], teamIds: readonly TeamId[], mode: DraftMode, rng: Rng = Math.random): Draft {
  const draft: Draft = Object.fromEntries(teamIds.map((id) => [id, [] as Player[]]));
  if (!teamIds.length) return draft;

  const order = shuffle(teamIds, rng);
  let pool: Player[];
  if (mode === 'random') {
    pool = shuffle(players, rng);
  } else {
    const tiers = [...new Set(players.map((p) => p.tier))].sort((a, b) => a - b);
    pool = tiers.flatMap((t) => shuffle(players.filter((p) => p.tier === t), rng));
  }

  pool.forEach((player, i) => {
    const row = Math.floor(i / order.length);
    const col = i % order.length;
    const teamId = mode === 'balanced' && row % 2 ? order[order.length - 1 - col] : order[col];
    draft[teamId].push(player);
  });
  return draft;
}

/** Sum of (maxTier + 1 - tier): higher = stronger. Useful to show the organizer how fair a draft is. */
export function teamStrength(players: readonly Player[], maxTier: number): number {
  return players.reduce((sum, p) => sum + (maxTier + 1 - p.tier), 0);
}
