import { useState } from 'react';
import { bibAt, MAX_TEAMS, MIN_TEAMS, useStore } from '../store';
import { FormatPicker } from '../components/FormatPicker';
import { Setting, Stepper, Switch } from '../components/controls';
import { useI18n } from '../i18n/react';
import type { Key } from '../i18n/dict';

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
  const { t } = useI18n();
  const [draftText, setDraftText] = useState('');

  const add = () => {
    const names = draftText.split(/[\n,]/);
    if (names.some((n) => n.trim())) s.addPlayers(names);
    setDraftText('');
  };

  const names = (
    <ul className="teamlist">
      {s.teams.map((tm, i) => (
        <li key={tm.id} className="teamrow">
          <span className="bib" style={{ background: bibAt(i).color }} aria-hidden />
          <input className="input" value={tm.name} maxLength={18} aria-label={t('setup.teamName', { n: i + 1 })}
            onChange={(e) => s.renameTeam(tm.id, e.target.value)} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="screen">
      <section className="block">
        <div className="block__head">
          <h2 className="h2">{t('setup.teams')}</h2>
          <Stepper label={t('setup.teamCount')} value={s.teams.length} min={MIN_TEAMS} max={MAX_TEAMS} onChange={s.setTeamCount} />
        </div>
        {s.teams.length > 8 ? (
          <details className="disclose">
            <summary className="disclose__sum">
              <span className="disclose__title">{t('setup.teamNames')}</span>
              <span className="disclose__note">{t('setup.teamNamesNote', { n: s.teams.length })}</span>
            </summary>
            {names}
          </details>
        ) : names}
      </section>

      <section className="block">
        <h2 className="h2">{t('setup.format')}</h2>
        <FormatPicker />
      </section>

      <section className="block">
        <h2 className="h2">{t('setup.timer')}</h2>
        <div className="card">
          <Setting label={t('setup.useTimer')}>
            <Switch label={t('setup.useTimer')} checked={s.matchMinutes > 0} onChange={(v) => s.setMinutes(v ? 10 : 0)} />
          </Setting>
          {s.matchMinutes > 0 && (
            <Setting label={t('setup.minutes')} help={t('setup.minutesHelp')}>
              <Stepper label={t('setup.minutes')} value={s.matchMinutes} min={1} max={180} onChange={s.setMinutes} />
            </Setting>
          )}
        </div>
      </section>

      <details className="block disclose">
        <summary className="disclose__sum">
          <span className="disclose__title">{t('setup.players')}</span>
          <span className="disclose__note">{t('setup.playersNote')}</span>
        </summary>

        <div className="addrow">
          <input className="input" value={draftText} placeholder={t('setup.playersPlaceholder')}
            aria-label={t('setup.addPlayers')} onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn btn--ghost" onClick={add}>{t('setup.add')}</button>
        </div>

        {s.players.length === 0 ? (
          <p className="hint">{t('setup.noPlayers')}</p>
        ) : (
          <>
            <ul className="players">
              {s.players.map((p) => (
                <li key={p.id} className="player">
                  <span className="player__name">{p.name}</span>
                  <button className={`chip chip--t${p.tier}`} onClick={() => s.cycleTier(p.id)}
                    aria-label={t('setup.tierAria', { name: p.name, tier: t(`tier.${p.tier}` as Key) })}>
                    {t(`tier.${p.tier}` as Key)}
                  </button>
                  <button className="iconbtn" onClick={() => s.removePlayer(p.id)} aria-label={t('setup.remove', { name: p.name })}>×</button>
                </li>
              ))}
            </ul>
            <p className="hint">{t('setup.tierHint')}</p>

            <div className="opt">
              <span className="opt__label">{t('setup.splitBy')}</span>
              <Seg label={t('setup.splitBy')} value={s.draftMode} onChange={s.setDraftMode}
                options={[{ value: 'balanced', label: t('setup.balanced') }, { value: 'random', label: t('setup.random') }]} />
            </div>
            <button className="btn btn--ghost btn--wide" onClick={s.runDraft} disabled={s.players.length < s.teams.length}>
              {s.roster ? t('setup.shuffle') : t('setup.split')}
            </button>
            {s.players.length < s.teams.length && <p className="hint">{t('setup.needPlayers', { n: s.teams.length })}</p>}

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
          {t('setup.start')}
        </button>
      </div>
    </div>
  );
}
