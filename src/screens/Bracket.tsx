import { useEffect, useRef, useState } from 'react';
import { BIBS, bibOf, useStore } from '../store';
import { bracketSize, playBracket, playoffSetup, type BracketMatch, type Slot } from '../engine';
import { renderBracketCard } from '../lib/shareCard';
import { SessionActions } from '../components/SessionActions';
import { Support } from '../components/Support';
import { useI18n } from '../i18n/react';

const COL_W = 180;
const GAP = 40;
const U = 52; // height of one first-round slot
const HEAD = 34;
const CARD_H = 88;

function MatchCard({ m, name, isNext, compact, style }: {
  m: BracketMatch; name: (id: string) => string; isNext: boolean; compact?: boolean; style?: React.CSSProperties;
}) {
  const { t, L } = useI18n();
  const r = m.result;
  const row = (slot: Slot, side: 'home' | 'away') => {
    const won = r && slot.team === r.winner;
    const score = r ? (side === 'home' ? r.match.homeScore : r.match.awayScore) : null;
    return (
      <div className={`bm__row${r && !won ? ' bm__row--lost' : ''}`}>
        {slot.team ? (
          <>
            <span className="bib bib--sm" style={{ background: (bibOf(slot.team) ?? BIBS[0]).color }} aria-hidden />
            <span className="bm__name">{name(slot.team)}</span>
          </>
        ) : (
          <span className="bm__name bm__name--pending">{L(slot.label)}</span>
        )}
        {won && r?.onPenalties && <span className="bm__pen">{t('bracket.pens')}</span>}
        {score !== null && <span className="bm__score">{score}</span>}
      </div>
    );
  };
  return (
    <article className={`bm${isNext ? ' bm--next' : ''}${compact ? ' bm--compact' : ''}`} style={style} aria-label={L(m.label)}>
      {row(m.home, 'home')}
      {row(m.away, 'away')}
      {!compact && r?.onPenalties && <p className="bm__note">{t('results.penalties', { team: name(r.winner) })}</p>}
      {!compact && isNext && <p className="bm__note">{t('bracket.playingNow')}</p>}
    </article>
  );
}

export function Bracket() {
  const { t, L, lang } = useI18n();
  const teams = useStore((s) => s.teams);
  const history = useStore((s) => s.history);
  const config = useStore((s) => s.config);
  const [view, setView] = useState<'tree' | 'list'>('tree');
  const scroller = useRef<HTMLDivElement>(null);

  const setup = playoffSetup(config, teams.map((tm) => tm.id), history);
  const seeds = setup?.seeds ?? [];
  const bracket = playBracket(seeds, setup?.history ?? [], setup?.thirdPlace ?? false);
  const projected = setup?.projected ?? false;
  const name = (id: string) => teams.find((tm) => tm.id === id)?.name ?? id;
  const size = bracketSize(Math.max(seeds.length, 2));
  const byes = seeds.slice(0, size - seeds.length).map((id) => ({ id, name: name(id) }));
  const out = bracket.outcome;
  const champBib = out ? bibOf(out.champion) ?? BIBS[0] : null;

  const tiers = Math.log2(size);
  const real = bracket.rounds.flatMap((r) => r.matches).filter((m) => m.tier !== undefined);
  const third = bracket.rounds.flatMap((r) => r.matches).find((m) => m.tier === undefined);
  const tierName = (tier: number) => L(bracket.rounds.find((r) => r.matches.some((m) => m.tier === tier))?.name ?? '');
  const x = (t: number) => t * (COL_W + GAP);
  const cy = (m: BracketMatch) => HEAD + (m.pos! + 0.5) * 2 ** (m.tier! + 1) * U;
  const treeW = tiers * COL_W + (tiers - 1) * GAP;
  const treeH = HEAD + size * U;
  const nextTier = real.find((m) => m.label === bracket.next?.label)?.tier;

  useEffect(() => {
    if (view !== 'tree' || nextTier === undefined) return;
    scroller.current?.scrollTo({ left: Math.max(0, x(nextTier) - 16), behavior: 'smooth' });
  }, [view, nextTier]);

  const links = real.flatMap((m) => {
    const parent = real.find((p) => p.tier === m.tier! + 1 && p.pos === Math.floor(m.pos! / 2));
    if (!parent) return [];
    const x1 = x(m.tier!) + COL_W;
    const x2 = x(m.tier! + 1);
    const mid = x1 + GAP / 2;
    return [`M${x1} ${cy(m)} H${mid} V${cy(parent)} H${x2}`];
  });

  return (
    <div className="screen">
      {out && champBib && (
        <section className="champ" style={{ background: champBib.color, color: champBib.ink }}>
          <p className="champ__tag">{t('match.champions')}</p>
          <h2 className="champ__name">{name(out.champion)}</h2>
          <p className="champ__sub">
            {t('bracket.runnerUp', { team: name(out.runnerUp) })}{out.third ? `. ${t('bracket.third', { team: name(out.third) })}.` : '.'}
          </p>
        </section>
      )}

      <div className="block__head">
        <h2 className="h2">{t('bracket.title')}</h2>
        <div className="seg seg--small" role="radiogroup" aria-label={t('bracket.viewAria')}>
          {([['tree', t('bracket.title')], ['list', t('bracket.list')]] as const).map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={view === id} className="seg__item" onClick={() => setView(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {byes.length > 0 && (
        <p className="hint">
          {byes.length > 3
            ? t('bracket.byeTop', { n: byes.length })
            : t(byes.length > 1 ? 'bracket.byeMany' : 'bracket.byeOne', { names: byes.map((b) => b.name).join(t('bracket.and')) })}
        </p>
      )}
      {projected && (
        <p className="hint hint--note">{t('bracket.projected')}</p>
      )}

      {view === 'tree' ? (
        <>
          {tiers > 2 && <p className="hint">{t('bracket.swipe')}</p>}
          <div className="tree-scroll" ref={scroller}>
            <div className="tree" style={{ width: treeW, height: treeH }}>
              <svg className="tree__links" width={treeW} height={treeH} aria-hidden>
                {links.map((d) => <path key={d} d={d} />)}
              </svg>
              {Array.from({ length: tiers }, (_, t) => (
                <span key={t} className="tree__head" style={{ left: x(t), width: COL_W }}>{tierName(t)}</span>
              ))}
              {real.map((m) => (
                <MatchCard key={m.label} m={m} name={name} compact isNext={bracket.next?.label === m.label}
                  style={{ position: 'absolute', left: x(m.tier!), top: cy(m) - CARD_H / 2, width: COL_W, height: CARD_H }} />
              ))}
            </div>
          </div>
          {third && (
            <section className="round">
              <h3 className="round__name">{L('Third place')}</h3>
              <MatchCard m={third} name={name} isNext={bracket.next?.label === third.label} />
            </section>
          )}
        </>
      ) : (
        bracket.rounds.map((round) => (
          <section key={round.name} className="round">
            <h3 className="round__name">{L(round.name)}</h3>
            {round.matches.map((m) => <MatchCard key={m.label} m={m} name={name} isNext={bracket.next?.label === m.label} />)}
          </section>
        ))
      )}

      <SessionActions render={() => renderBracketCard(teams, bracket, seeds.length, projected)} renderKey={`${lang}|${teams.map((tm) => tm.name).join()}|${history.length}|${seeds.join()}`} />
      {out && <Support />}
    </div>
  );
}
