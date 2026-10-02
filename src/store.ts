import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { detectLang, teamName, type Lang } from './i18n/dict';
import {
  computeStandings, defaultConfig, draftTeams, inPlayoffs, nextFixture, normalizeConfig,
  type DraftMode, type Fixture, type FormatConfig, type PlayedMatch, type Player, type Team, type TeamId,
} from './engine';

export const BIBS = [
  { name: 'Orange', color: '#FF6A2B', ink: '#1C0B02' },
  { name: 'Sky', color: '#3AA6F2', ink: '#04131F' },
  { name: 'Pink', color: '#F0468F', ink: '#210512' },
  { name: 'Mint', color: '#35D49C', ink: '#03160F' },
  { name: 'Violet', color: '#8E72F2', ink: '#100829' },
  { name: 'Chalk', color: '#EEF1E6', ink: '#0F2019' },
] as const;

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 32;

export interface Bib { name: string; color: string; ink: string }
/** First six are the classic training bibs; after that colors are generated so every team stays distinct. */
export function bibAt(i: number): Bib {
  if (i < BIBS.length) return BIBS[i];
  const hue = Math.round((i * 137.508) % 360);
  return { name: `Team ${i + 1}`, color: `hsl(${hue} 68% 58%)`, ink: '#0f1a14' };
}
export const bibOf = (id: TeamId): Bib => bibAt(Number(id.slice(1)));

const makeTeams = (n: number, old: Team[] = [], lang: Lang = 'en'): Team[] =>
  Array.from({ length: n }, (_, i) => old[i] ?? { id: `t${i}`, name: teamName(i, lang) });

type Timer = { running: boolean; endsAt: number | null; leftMs: number };

interface State {
  lang: Lang;
  phase: 'setup' | 'live';
  teams: Team[];
  config: FormatConfig;
  matchMinutes: number; // 0 = no timer
  players: Player[];
  draftMode: DraftMode;
  roster: Record<TeamId, Player[]> | null;
  history: PlayedMatch[];
  live: { home: number; away: number; shootout: 'home' | 'away' | null };
  timer: Timer;

  setLang: (lang: Lang) => void;
  setTeamCount: (n: number) => void;
  renameTeam: (id: TeamId, name: string) => void;
  setConfig: (c: FormatConfig) => void;
  setMinutes: (m: number) => void;
  addPlayers: (names: string[]) => void;
  cycleTier: (id: string) => void;
  removePlayer: (id: string) => void;
  setDraftMode: (m: DraftMode) => void;
  runDraft: () => void;
  start: () => void;
  goal: (side: 'home' | 'away', delta: 1 | -1) => void;
  setShootout: (side: 'home' | 'away') => void;
  toggleTimer: () => void;
  timerDone: () => void;
  fullTime: () => void;
  undoLast: () => void;
  endSession: () => void;
}

const fresh = (minutes: number): Timer => ({ running: false, endsAt: null, leftMs: minutes * 60_000 });

const initialLang = detectLang();

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      lang: initialLang,
      phase: 'setup',
      teams: makeTeams(3, [], initialLang),
      config: defaultConfig,
      matchMinutes: 10,
      players: [],
      draftMode: 'balanced',
      roster: null,
      history: [],
      live: { home: 0, away: 0, shootout: null },
      timer: fresh(10),

      // Teams still carrying their default name follow the new language; renamed teams are left alone.
      setLang: (lang) =>
        set((s) => ({ lang, teams: s.teams.map((t, i) => (t.name === teamName(i, s.lang) ? { ...t, name: teamName(i, lang) } : t)) })),
      setTeamCount: (n) =>
        set((s) => {
          const count = Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, n));
          return { teams: makeTeams(count, s.teams, s.lang), config: normalizeConfig(s.config, count), roster: null };
        }),
      renameTeam: (id, name) => set((s) => ({ teams: s.teams.map((t) => (t.id === id ? { ...t, name } : t)) })),
      setConfig: (config) => set((s) => ({ config: normalizeConfig(config, s.teams.length) })),
      setMinutes: (matchMinutes) => set({ matchMinutes, timer: fresh(matchMinutes) }),

      addPlayers: (names) =>
        set((s) => ({
          roster: null,
          players: [
            ...s.players,
            ...names.map((n) => n.trim()).filter(Boolean).map((name) => ({ id: crypto.randomUUID(), name, tier: 2 })),
          ],
        })),
      cycleTier: (id) =>
        set((s) => ({ roster: null, players: s.players.map((p) => (p.id === id ? { ...p, tier: (p.tier % 3) + 1 } : p)) })),
      removePlayer: (id) => set((s) => ({ roster: null, players: s.players.filter((p) => p.id !== id) })),
      setDraftMode: (draftMode) => set({ draftMode }),
      runDraft: () => {
        const { players, teams, draftMode } = get();
        set({ roster: draftTeams(players, teams.map((t) => t.id), draftMode) });
      },

      start: () => set((s) => ({ phase: 'live', history: [], live: { home: 0, away: 0, shootout: null }, timer: fresh(s.matchMinutes) })),

      goal: (side, delta) =>
        set((s) => ({ live: { ...s.live, [side]: Math.max(0, s.live[side] + delta), shootout: null } })),
      setShootout: (side) => set((s) => ({ live: { ...s.live, shootout: side } })),

      toggleTimer: () =>
        set((s) => {
          const t = s.timer;
          if (t.running) return { timer: { running: false, endsAt: null, leftMs: Math.max(0, (t.endsAt ?? 0) - Date.now()) } };
          if (t.leftMs <= 0) return { timer: fresh(s.matchMinutes) };
          return { timer: { running: true, endsAt: Date.now() + t.leftMs, leftMs: t.leftMs } };
        }),
      timerDone: () => set({ timer: { running: false, endsAt: null, leftMs: 0 } }),

      fullTime: () => {
        const s = get();
        const f = selectFixture(s);
        if (!f) return;
        const draw = s.live.home === s.live.away;
        const knockout = inPlayoffs(s.config, s.teams.map((t) => t.id), s.history);
        if (knockout && draw && !s.live.shootout) return; // a playoff needs a winner
        set({
          history: [
            ...s.history,
            { ...f, homeScore: s.live.home, awayScore: s.live.away, ...(knockout && draw && s.live.shootout ? { shootoutWinner: f[s.live.shootout] } : {}) },
          ],
          live: { home: 0, away: 0, shootout: null },
          timer: fresh(s.matchMinutes),
        });
      },

      undoLast: () => {
        const s = get();
        const last = s.history[s.history.length - 1];
        if (!last) return;
        set({
          history: s.history.slice(0, -1),
          live: { home: last.homeScore, away: last.awayScore, shootout: last.shootoutWinner ? (last.shootoutWinner === last.home ? 'home' : 'away') : null },
          timer: fresh(s.matchMinutes),
        });
      },

      endSession: () => set((s) => ({ phase: 'setup', history: [], live: { home: 0, away: 0, shootout: null }, timer: fresh(s.matchMinutes) })),
    }),
    { name: 'pitchside-v1' },
  ),
);

type Slice = Pick<State, 'teams' | 'config' | 'history'>;
export const selectFixture = (s: Slice): Fixture | null =>
  nextFixture(s.config, s.teams.map((t) => t.id), s.history);

export const selectStandings = (s: Pick<State, 'teams' | 'history'>) =>
  computeStandings(s.teams.map((t) => t.id), s.history);
