export type TeamId = string;

export interface Team {
  id: TeamId;
  name: string;
}

/** tier 1 = strongest. Organizer assigns tiers when starting a session. */
export interface Player {
  id: string;
  name: string;
  tier: number;
}

export type FormatId = 'round-robin' | 'groups' | 'swiss' | 'knockout' | 'winner-stays' | 'timed-rotation';

export interface PlayoffRule {
  /** How many teams go into the knockout bracket. Non powers of two give byes to the top seeds. */
  qualifiers: number;
  thirdPlace: boolean;
}

export interface Fixture {
  home: TeamId;
  away: TeamId;
  /** Set by knockout: 'Semi-final 1', 'Final', ... */
  label?: string;
}

export interface PlayedMatch extends Fixture {
  homeScore: number;
  awayScore: number;
  /** Knockout only: who won the penalty shootout after a draw. */
  shootoutWinner?: TeamId;
}

export interface RoundRobinConfig {
  format: 'round-robin';
  /** Number of full cycles, or 'endless' to keep going until the session ends. */
  cycles: number | 'endless';
  /** Optional playoffs after the group stage. Needs a finite number of cycles. */
  playoffs?: PlayoffRule | null;
}

export interface GroupsConfig {
  format: 'groups';
  groups: number;
  /** Times each team plays the others in its group. */
  cycles: number;
  /** Teams advancing from each group. */
  advance: number;
  draw: 'random' | 'seeded';
  seed: number;
  /** null = just the group tables, no knockout afterwards. */
  playoffs: { thirdPlace: boolean } | null;
}

/** Champions League style league phase: one table, everyone plays a few different opponents. */
export interface SwissConfig {
  format: 'swiss';
  matches: number;
  seed: number;
  playoffs: PlayoffRule | null;
}

export interface WinnerStaysConfig {
  format: 'winner-stays';
  /** Who leaves after a draw. Default: the challenger. */
  drawRule: 'challenger-leaves' | 'holder-leaves';
  /** After this many consecutive wins the holder must rest too. null = no cap. */
  maxStreak: number | null;
}

export interface TimedRotationConfig {
  format: 'timed-rotation';
}

export interface KnockoutConfig {
  format: 'knockout';
  /** Play a third-place match (needs 4+ teams). */
  thirdPlace: boolean;
}

export type FormatConfig =
  | RoundRobinConfig | GroupsConfig | SwissConfig | KnockoutConfig | WinnerStaysConfig | TimedRotationConfig;

export const defaultConfig: FormatConfig = { format: 'round-robin', cycles: 1 };

export interface StandingRow {
  teamId: TeamId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  rank: number;
}
