import { useState } from 'react';
import { bibAt, MAX_TEAMS, MIN_TEAMS, useStore } from '../store';
import { FormatPicker } from '../components/FormatPicker';
import { Setting, Stepper, Switch } from '../components/controls';

const TIER_LABEL = ['', 'Strong', 'Solid', 'Casual'];

function Seg<T extends string | number>(props: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === props.value}
          className="seg__item" onClick={() => props.onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Setup() {
  const s = useStore();
  const [draftText, setDraftText] = useState('');

  const add = () => {
    const names = draftText.split(/[\n,]/);
    if (names.some((n) => n.trim())) s.addPlayers(names);
    setDraftText('');
  };

  const names = (
    <ul className="teamlist">
      {s.teams.map((t, i) => (
        <li key={t.id} className="teamrow">
          <span className="bib" style={{ background: bibAt(i).color }} aria-hidden />
          <input className="input" value={t.name} maxLength={18} aria-label={`Team ${i + 1} name`}
            onChange={(e) => s.renameTeam(t.id, e.target.value)} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="screen">
      <section className="block">
        <div className="block__head">
          <h2 className="h2">Teams</h2>
          <Stepper label="Number of teams" value={s.teams.length} min={MIN_TEAMS} max={MAX_TEAMS} onChange={s.setTeamCount} />
        </div>
        {s.teams.length > 8 ? (
          <details className="disclose">
            <summary className="disclose__sum">
              <span className="disclose__title">Team names</span>
              <span className="disclose__note">{s.teams.length} teams. Tap to rename them.</span>
            </summary>
            {names}
          </details>
        ) : names}
      </section>

      <section className="block">
        <h2 className="h2">Format</h2>
        <FormatPicker />
      </section>

      <section className="block">
        <h2 className="h2">Match timer</h2>
        <div className="card">
          <Setting label="Use a timer">
            <Switch label="Use a timer" checked={s.matchMinutes > 0} onChange={(v) => s.setMinutes(v ? 10 : 0)} />
          </Setting>
          {s.matchMinutes > 0 && (
            <Setting label="Minutes per match" help="Type any length, halves work too">
              <Stepper label="Minutes per match" value={s.matchMinutes} min={1} max={180} onChange={s.setMinutes} />
            </Setting>
          )}
        </div>
      </section>

      <details className="block disclose">
        <summary className="disclose__sum">
          <span className="disclose__title">Players</span>
          <span className="disclose__note">Optional. Add names to let the app split the teams.</span>
        </summary>

        <div className="addrow">
          <input className="input" value={draftText} placeholder="Names, separated by commas"
            aria-label="Add players" onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn btn--ghost" onClick={add}>Add</button>
        </div>

        {s.players.length === 0 ? (
          <p className="hint">No players yet. Paste a whole list at once if you have one.</p>
        ) : (
          <>
            <ul className="players">
              {s.players.map((p) => (
                <li key={p.id} className="player">
                  <span className="player__name">{p.name}</span>
                  <button className={`chip chip--t${p.tier}`} onClick={() => s.cycleTier(p.id)}
                    aria-label={`${p.name}: ${TIER_LABEL[p.tier]}. Tap to change level`}>
                    {TIER_LABEL[p.tier]}
                  </button>
                  <button className="iconbtn" onClick={() => s.removePlayer(p.id)} aria-label={`Remove ${p.name}`}>×</button>
                </li>
              ))}
            </ul>
            <p className="hint">Tap a level to change it. Balanced mode spreads each level evenly across teams.</p>

            <div className="opt">
              <span className="opt__label">Split by</span>
              <Seg label="Split by" value={s.draftMode} onChange={s.setDraftMode}
                options={[{ value: 'balanced', label: 'Balanced' }, { value: 'random', label: 'Random' }]} />
            </div>
            <button className="btn btn--ghost btn--wide" onClick={s.runDraft} disabled={s.players.length < s.teams.length}>
              {s.roster ? 'Shuffle again' : 'Split into teams'}
            </button>
            {s.players.length < s.teams.length && <p className="hint">Add at least {s.teams.length} players to split them.</p>}

            {s.roster && (
              <div className="roster">
                {s.teams.map((t, i) => (
                  <div key={t.id} className="roster__team" style={{ borderTopColor: bibAt(i).color }}>
                    <strong className="roster__name">{t.name}</strong>
                    <ul className="roster__list">
                      {(s.roster?.[t.id] ?? []).map((p) => <li key={p.id}>{p.name}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </details>

      <div className="dock">
        <button className="btn btn--primary btn--wide" onClick={s.start}
          disabled={s.teams.some((t) => !t.name.trim())}>
          Start session
        </button>
      </div>
    </div>
  );
}
