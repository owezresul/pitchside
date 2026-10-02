import type { ReactNode } from 'react';
import { useStore } from '../store';
import { Select, Setting, Stepper, Switch } from './controls';
import { useI18n } from '../i18n/react';
import type { Key } from '../i18n/dict';
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

const CARDS: { id: CardId; title: Key; desc: Key }[] = [
  { id: 'round-robin', title: 'fmt.league', desc: 'fmt.league.desc' },
  { id: 'groups', title: 'fmt.groups', desc: 'fmt.groups.desc' },
  { id: 'swiss', title: 'fmt.swiss', desc: 'fmt.swiss.desc' },
  { id: 'knockout', title: 'fmt.knockout', desc: 'fmt.knockout.desc' },
  { id: 'street', title: 'fmt.street', desc: 'fmt.street.desc' },
];

const cardOf = (c: FormatConfig): CardId => (c.format === 'winner-stays' || c.format === 'timed-rotation' ? 'street' : c.format);

function Note({ children }: { children: ReactNode }) {
  return <p className="fmtnote">{children}</p>;
}

export function FormatPicker() {
  const { t } = useI18n();
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
    return byes > 0 ? t('set.byes', { byes, from: byes + 1, to: q }) : null;
  };

  const body = () => {
    switch (cfg.format) {
      case 'round-robin': {
        const po = cfg.playoffs;
        return (
          <>
            {cfg.cycles !== 'endless' && (
              <Setting label={t('set.rounds')} help={t('set.roundsHelp')}>
                <Stepper label={t('set.rounds')} value={cfg.cycles} min={1} max={6} onChange={(v) => setConfig({ ...cfg, cycles: v })} />
              </Setting>
            )}
            {!po && (
              <Setting label={t('set.noLimit')} help={t('set.noLimitHelp')}>
                <Switch label={t('set.noLimit')} checked={cfg.cycles === 'endless'} onChange={(v) => setConfig({ ...cfg, cycles: v ? 'endless' : 1 })} />
              </Setting>
            )}
            <Setting label={t('set.playoffs')}>
              <Switch label={t('set.playoffs')} checked={!!po}
                onChange={(v) => setConfig({ ...cfg, cycles: typeof cfg.cycles === 'number' ? cfg.cycles : 1, playoffs: v ? { qualifiers: n >= 4 ? 4 : 2, thirdPlace: false } : null })} />
            </Setting>
            {po && (
              <>
                <Setting label={t('set.through')}>
                  <Stepper label={t('set.through')} value={po.qualifiers} min={2} max={n} onChange={(v) => setConfig({ ...cfg, playoffs: { ...po, qualifiers: v } })} />
                </Setting>
                {po.qualifiers >= 4 && (
                  <Setting label={t('set.third')}>
                    <Switch label={t('set.third')} checked={po.thirdPlace} onChange={(v) => setConfig({ ...cfg, playoffs: { ...po, thirdPlace: v } })} />
                  </Setting>
                )}
                <Note>{byesNote(po.qualifiers) ?? t('set.leagueSeed')} {t('set.shootout')}</Note>
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
            <Setting label={t('set.groupCount')}>
              <Stepper label={t('set.groupCount')} value={cfg.groups} min={2} max={Math.max(2, Math.min(16, Math.floor(n / 2)))} onChange={(v) => setConfig({ ...cfg, groups: v })} />
            </Setting>
            <Setting label={t('set.groupRounds')}>
              <Stepper label={t('set.groupRounds')} value={cfg.cycles} min={1} max={4} onChange={(v) => setConfig({ ...cfg, cycles: v })} />
            </Setting>
            <Setting label={t('set.advance')}>
              <Stepper label={t('set.advance')} value={cfg.advance} min={1} max={maxAdvance} onChange={(v) => setConfig({ ...cfg, advance: v })} />
            </Setting>
            <Setting label={t('set.drawn')}>
              <Select label={t('set.drawAria')} value={cfg.draw} onChange={(v) => setConfig({ ...cfg, draw: v })}
                options={[{ value: 'random', label: t('set.drawRandom') }, { value: 'seeded', label: t('set.drawSeeded') }]} />
            </Setting>
            <Setting label={t('set.playoffs')} help={cfg.playoffs ? t('set.goThrough', { n: q }) : t('set.groupTablesOnly')}>
              <Switch label={t('set.playoffs')} checked={!!cfg.playoffs} onChange={(v) => setConfig({ ...cfg, playoffs: v ? { thirdPlace: false } : null })} />
            </Setting>
            {cfg.playoffs && q >= 4 && (
              <Setting label={t('set.third')}>
                <Switch label={t('set.third')} checked={cfg.playoffs.thirdPlace} onChange={(v) => setConfig({ ...cfg, playoffs: { thirdPlace: v } })} />
              </Setting>
            )}
            <div className="groupprev">
              {groups.map((g, i) => (
                <p key={i} className="groupprev__row">
                  <strong>{t('set.groupName', { letter: groupLetter(i) })}</strong>
                  <span>{g.map((id) => teams.find((t) => t.id === id)?.name).join(', ')}</span>
                </p>
              ))}
              {cfg.draw === 'random' && (
                <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfig({ ...cfg, seed: newSeed() })}>{t('set.redraw')}</button>
              )}
            </div>
            {cfg.playoffs && <Note>{t('set.groupNote')} {t('set.shootout')}</Note>}
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
              {t('set.clPreset')}
            </button>
            <Setting label={t('set.matchesPer')} help={t('set.matchesTotal', { n: Math.floor((n * cfg.matches) / 2) })}>
              <Stepper label={t('set.matchesPer')} value={cfg.matches} min={step === 2 ? 2 : 1} max={Math.max(1, n - 1)} step={step} onChange={(v) => setConfig({ ...cfg, matches: v })} />
            </Setting>
            <Setting label={t('set.playoffs')}>
              <Switch label={t('set.playoffs')} checked={!!po} onChange={(v) => setConfig({ ...cfg, playoffs: v ? { qualifiers: Math.min(n, n >= 24 ? 24 : 8), thirdPlace: false } : null })} />
            </Setting>
            {po && (
              <>
                <Setting label={t('set.through')}>
                  <Stepper label={t('set.through')} value={po.qualifiers} min={2} max={n} onChange={(v) => setConfig({ ...cfg, playoffs: { ...po, qualifiers: v } })} />
                </Setting>
                {po.qualifiers >= 4 && (
                  <Setting label={t('set.third')}>
                    <Switch label={t('set.third')} checked={po.thirdPlace} onChange={(v) => setConfig({ ...cfg, playoffs: { ...po, thirdPlace: v } })} />
                  </Setting>
                )}
              </>
            )}
            <Note>
              {t('set.swissNote')}
              {po && byesNote(po.qualifiers) ? ` ${byesNote(po.qualifiers)}` : ''}
              {n % 2 === 1 ? ` ${t('set.oddNote')}` : ''}
            </Note>
          </>
        );
      }

      case 'knockout':
        return (
          <>
            {n >= 4 && (
              <Setting label={t('set.third')}>
                <Switch label={t('set.third')} checked={cfg.thirdPlace} onChange={(v) => setConfig({ ...cfg, thirdPlace: v })} />
              </Setting>
            )}
            <Note>
              {t('set.koSeed')}{byesNote(n) ? ` ${byesNote(n)}` : ''} {t('set.koShootout')}
            </Note>
          </>
        );

      case 'winner-stays':
      case 'timed-rotation':
        return (
          <>
            <Setting label={t('set.rule')}>
              <Select label={t('set.streetAria')} value={cfg.format} onChange={(v) => setConfig(defaultFor(v, n))}
                options={[{ value: 'winner-stays', label: t('set.winnerStays') }, { value: 'timed-rotation', label: t('set.rotation') }]} />
            </Setting>
            {cfg.format === 'winner-stays' ? (
              <>
                <Setting label={t('set.afterDraw')}>
                  <Select label={t('set.afterDraw')} value={cfg.drawRule} onChange={(v) => setConfig({ ...cfg, drawRule: v })}
                    options={[{ value: 'challenger-leaves', label: t('set.challengerSits') }, { value: 'holder-leaves', label: t('set.holderSits') }]} />
                </Setting>
                <Setting label={t('set.streak')} help={t('set.streakHelp')}>
                  <Stepper label={t('set.streak')} value={cfg.maxStreak ?? 0} min={0} max={10} showZero
                    onChange={(v) => setConfig({ ...cfg, maxStreak: v === 0 ? null : v })} />
                </Setting>
                <Note>{t('set.winnerNote')}</Note>
              </>
            ) : (
              <Note>{t('set.rotationNote')}</Note>
            )}
          </>
        );
    }
  };

  return (
    <div className="fmt" role="radiogroup" aria-label={t('fmt.aria')}>
      {CARDS.map((c) => {
        const selected = on === c.id;
        return (
          <div key={c.id} className={`fmtcard${selected ? ' fmtcard--on' : ''}`}>
            <button type="button" role="radio" aria-checked={selected} className="fmtcard__head" onClick={() => pick(c.id)}>
              <span className="fmtcard__icon"><Icon id={c.id} /></span>
              <span className="fmtcard__text">
                <span className="fmtcard__title">{t(c.title)}</span>
                <span className="fmtcard__desc">{t(c.desc)}</span>
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

