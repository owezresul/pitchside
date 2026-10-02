import type { ReactNode } from 'react';
import { useStore } from '../store';
import { Select, Setting, Stepper, Switch } from './controls';
import {
  assignGroups, bracketSize, defaultFor, groupLetter, newSeed,
  type FormatConfig, type FormatId,
} from '../engine';

type CardId = Exclude<FormatId, 'winner-stays' | 'timed-rotation'> | 'street';

const Icon = ({ id }: { id: CardId }) => {
  const p = { width: 26, height: 26, viewBox: '0 0 26 26', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
  switch (id) {
    case 'round-robin': return <svg {...p}><path d="M4 7h18M4 13h18M4 19h18" /><path d="M4 7h2M4 13h2M4 19h2" strokeWidth="4" /></svg>;
    case 'groups': return <svg {...p}><rect x="3" y="4" width="9" height="8" rx="2" /><rect x="14" y="4" width="9" height="8" rx="2" /><rect x="3" y="15" width="9" height="7" rx="2" /><rect x="14" y="15" width="9" height="7" rx="2" /></svg>;
    case 'swiss': return <svg {...p}><circle cx="5" cy="5" r="1.6" /><circle cx="13" cy="5" r="1.6" /><circle cx="21" cy="5" r="1.6" /><circle cx="5" cy="13" r="1.6" /><circle cx="13" cy="13" r="1.6" /><circle cx="21" cy="13" r="1.6" /><circle cx="5" cy="21" r="1.6" /><circle cx="13" cy="21" r="1.6" /><circle cx="21" cy="21" r="1.6" /><path d="M5 5l8 8M13 5l8 8M5 13l8 8M13 13l8 8" strokeWidth="1.4" /></svg>;
    case 'knockout': return <svg {...p}><path d="M3 5h6v6h5M3 17h6v-6M14 11h9" /><path d="M3 9h0M3 21h6v-4" /></svg>;
    case 'street': return <svg {...p}><path d="M4 9h14l-3-3M22 17H8l3 3" /></svg>;
  }
};

const CARDS: { id: CardId; title: string; desc: string }[] = [
  { id: 'round-robin', title: 'League', desc: 'Everyone plays everyone. Playoffs optional.' },
  { id: 'groups', title: 'Groups', desc: 'Group A, B, C... then playoffs for the best.' },
  { id: 'swiss', title: 'Champions League style', desc: 'One big table. Each team plays a few different opponents.' },
  { id: 'knockout', title: 'Knockout', desc: 'Straight to playoffs. Lose and you are out.' },
  { id: 'street', title: 'Street rules', desc: 'Winner stays on, or a fair rotation. Best for 3 teams.' },
];

const cardOf = (c: FormatConfig): CardId => (c.format === 'winner-stays' || c.format === 'timed-rotation' ? 'street' : c.format);

function Note({ children }: { children: ReactNode }) {
  return <p className="fmtnote">{children}</p>;
}

export function FormatPicker() {
  const teams = useStore((s) => s.teams);
  const cfg = useStore((s) => s.config);
  const setConfig = useStore((s) => s.setConfig);
  const setTeamCount = useStore((s) => s.setTeamCount);
  const n = teams.length;
  const ids = teams.map((t) => t.id);
  const on = cardOf(cfg);

  const pick = (id: CardId) => {
    if (id === on) return;
    const count = id === 'groups' ? Math.max(n, 4) : n;
    if (count !== n) setTeamCount(count);
    setConfig(defaultFor(id === 'street' ? 'winner-stays' : id, count));
  };

  const byesNote = (q: number) => {
    const byes = bracketSize(q) - q;
    return byes > 0
      ? `The top ${byes} skip the first knockout round. Places ${byes + 1} to ${q} play off for the remaining spots.`
      : null;
  };

  const body = () => {
    switch (cfg.format) {
      case 'round-robin': {
        const po = cfg.playoffs;
        return (
          <>
            {cfg.cycles !== 'endless' && (
              <Setting label="Rounds" help="Times every team meets every other team">
                <Stepper label="Rounds" value={cfg.cycles} min={1} max={6} onChange={(v) => setConfig({ ...cfg, cycles: v })} />
              </Setting>
            )}
            {!po && (
              <Setting label="No round limit" help="Keep playing until you stop">
                <Switch label="No round limit" checked={cfg.cycles === 'endless'} onChange={(v) => setConfig({ ...cfg, cycles: v ? 'endless' : 1 })} />
              </Setting>
            )}
            <Setting label="Playoffs afterwards">
              <Switch label="Playoffs afterwards" checked={!!po}
                onChange={(v) => setConfig({ ...cfg, cycles: typeof cfg.cycles === 'number' ? cfg.cycles : 1, playoffs: v ? { qualifiers: n >= 4 ? 4 : 2, thirdPlace: false } : null })} />
            </Setting>
            {po && (
              <>
                <Setting label="Teams going through">
                  <Stepper label="Teams going through" value={po.qualifiers} min={2} max={n} onChange={(v) => setConfig({ ...cfg, playoffs: { ...po, qualifiers: v } })} />
                </Setting>
                {po.qualifiers >= 4 && (
                  <Setting label="Third-place match">
                    <Switch label="Third-place match" checked={po.thirdPlace} onChange={(v) => setConfig({ ...cfg, playoffs: { ...po, thirdPlace: v } })} />
                  </Setting>
                )}
                <Note>{byesNote(po.qualifiers) ?? 'The table seeds the bracket: 1st plays the lowest qualifier.'} A drawn playoff match goes to a penalty shootout.</Note>
              </>
            )}
          </>
        );
      }

      case 'groups': {
        const groups = assignGroups(ids, cfg.groups, cfg.draw, cfg.seed);
        const q = cfg.groups * cfg.advance;
        const maxAdvance = Math.max(1, Math.floor(n / cfg.groups));
        return (
          <>
            <Setting label="Groups">
              <Stepper label="Groups" value={cfg.groups} min={2} max={Math.max(2, Math.min(8, Math.floor(n / 2)))} onChange={(v) => setConfig({ ...cfg, groups: v })} />
            </Setting>
            <Setting label="Rounds in each group">
              <Stepper label="Rounds in each group" value={cfg.cycles} min={1} max={4} onChange={(v) => setConfig({ ...cfg, cycles: v })} />
            </Setting>
            <Setting label="Advance from each group">
              <Stepper label="Advance from each group" value={cfg.advance} min={1} max={maxAdvance} onChange={(v) => setConfig({ ...cfg, advance: v })} />
            </Setting>
            <Setting label="Groups are drawn">
              <Select label="How groups are drawn" value={cfg.draw} onChange={(v) => setConfig({ ...cfg, draw: v })}
                options={[{ value: 'random', label: 'At random' }, { value: 'seeded', label: 'By team order' }]} />
            </Setting>
            <Setting label="Playoffs afterwards" help={cfg.playoffs ? `${q} teams go through` : 'Group tables only'}>
              <Switch label="Playoffs afterwards" checked={!!cfg.playoffs} onChange={(v) => setConfig({ ...cfg, playoffs: v ? { thirdPlace: false } : null })} />
            </Setting>
            {cfg.playoffs && q >= 4 && (
              <Setting label="Third-place match">
                <Switch label="Third-place match" checked={cfg.playoffs.thirdPlace} onChange={(v) => setConfig({ ...cfg, playoffs: { thirdPlace: v } })} />
              </Setting>
            )}
            <div className="groupprev">
              {groups.map((g, i) => (
                <p key={i} className="groupprev__row">
                  <strong>Group {groupLetter(i)}</strong>
                  <span>{g.map((id) => teams.find((t) => t.id === id)?.name).join(', ')}</span>
                </p>
              ))}
              {cfg.draw === 'random' && (
                <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfig({ ...cfg, seed: newSeed() })}>Draw again</button>
              )}
            </div>
            {cfg.playoffs && <Note>Group winners are seeded first, and teams from the same group avoid meeting in the first round. A drawn playoff match goes to a penalty shootout.</Note>}
          </>
        );
      }

      case 'swiss': {
        const po = cfg.playoffs;
        const step = n % 2 === 1 ? 2 : 1;
        return (
          <>
            <button type="button" className="btn btn--ghost btn--wide"
              onClick={() => { setTeamCount(36); setConfig({ format: 'swiss', matches: 8, seed: newSeed(), playoffs: { qualifiers: 24, thirdPlace: false } }); }}>
              Use the real Champions League numbers (36 teams)
            </button>
            <Setting label="Matches per team" help={`${Math.floor((n * cfg.matches) / 2)} matches in total`}>
              <Stepper label="Matches per team" value={cfg.matches} min={step === 2 ? 2 : 1} max={Math.max(1, n - 1)} step={step} onChange={(v) => setConfig({ ...cfg, matches: v })} />
            </Setting>
            <Setting label="Playoffs afterwards">
              <Switch label="Playoffs afterwards" checked={!!po} onChange={(v) => setConfig({ ...cfg, playoffs: v ? { qualifiers: Math.min(n, n >= 24 ? 24 : 8), thirdPlace: false } : null })} />
            </Setting>
            {po && (
              <>
                <Setting label="Teams going through">
                  <Stepper label="Teams going through" value={po.qualifiers} min={2} max={n} onChange={(v) => setConfig({ ...cfg, playoffs: { ...po, qualifiers: v } })} />
                </Setting>
                {po.qualifiers >= 4 && (
                  <Setting label="Third-place match">
                    <Switch label="Third-place match" checked={po.thirdPlace} onChange={(v) => setConfig({ ...cfg, playoffs: { ...po, thirdPlace: v } })} />
                  </Setting>
                )}
              </>
            )}
            <Note>
              Everyone plays different opponents, once each, so the table is the only ranking.
              {po && byesNote(po.qualifiers) ? ` ${byesNote(po.qualifiers)}` : ''}
              {n % 2 === 1 ? ' With an odd number of teams, matches per team go up in twos.' : ''}
            </Note>
          </>
        );
      }

      case 'knockout':
        return (
          <>
            {n >= 4 && (
              <Setting label="Third-place match">
                <Switch label="Third-place match" checked={cfg.thirdPlace} onChange={(v) => setConfig({ ...cfg, thirdPlace: v })} />
              </Setting>
            )}
            <Note>
              Team 1 is the top seed.{byesNote(n) ? ` ${byesNote(n)}` : ''} A drawn match goes to a penalty shootout.
            </Note>
          </>
        );

      case 'winner-stays':
      case 'timed-rotation':
        return (
          <>
            <Setting label="Rule">
              <Select label="Street rule" value={cfg.format} onChange={(v) => setConfig(defaultFor(v, n))}
                options={[{ value: 'winner-stays', label: 'Winner stays' }, { value: 'timed-rotation', label: 'Fair rotation' }]} />
            </Setting>
            {cfg.format === 'winner-stays' ? (
              <>
                <Setting label="After a draw">
                  <Select label="After a draw" value={cfg.drawRule} onChange={(v) => setConfig({ ...cfg, drawRule: v })}
                    options={[{ value: 'challenger-leaves', label: 'Challenger sits' }, { value: 'holder-leaves', label: 'Holder sits' }]} />
                </Setting>
                <Setting label="Win streak limit" help="0 means no limit">
                  <Stepper label="Win streak limit" value={cfg.maxStreak ?? 0} min={0} max={10} showZero
                    onChange={(v) => setConfig({ ...cfg, maxStreak: v === 0 ? null : v })} />
                </Setting>
                <Note>Winner keeps the pitch, loser sits out. Classic street rules.</Note>
              </>
            ) : (
              <Note>The resting team always comes on, whatever the score. Everyone plays the same amount.</Note>
            )}
          </>
        );
    }
  };

  return (
    <div className="fmt" role="radiogroup" aria-label="Tournament format">
      {CARDS.map((c) => {
        const selected = on === c.id;
        return (
          <div key={c.id} className={`fmtcard${selected ? ' fmtcard--on' : ''}`}>
            <button type="button" role="radio" aria-checked={selected} className="fmtcard__head" onClick={() => pick(c.id)}>
              <span className="fmtcard__icon"><Icon id={c.id} /></span>
              <span className="fmtcard__text">
                <span className="fmtcard__title">{c.title}</span>
                <span className="fmtcard__desc">{c.desc}</span>
              </span>
              <span className="fmtcard__dot" aria-hidden />
            </button>
            {selected && <div className="fmtcard__body">{body()}</div>}
          </div>
        );
      })}
    </div>
  );
}

