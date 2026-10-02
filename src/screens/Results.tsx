import { bibOf, useStore } from '../store';
import { useI18n } from '../i18n/react';

export function Results({ onMatch }: { onMatch: () => void }) {
  const { t, L } = useI18n();
  const teams = useStore((s) => s.teams);
  const history = useStore((s) => s.history);
  const undoLast = useStore((s) => s.undoLast);
  const name = (id: string) => teams.find((tm) => tm.id === id)?.name ?? id;

  if (history.length === 0) {
    return (
      <div className="screen">
        <h2 className="h2">{t('results.title')}</h2>
        <p className="hint">{t('results.none')}</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <h2 className="h2">{t('results.title')}</h2>
      <ol className="results">
        {history.map((m, i) => ({ m, n: i + 1 })).reverse().map(({ m, n }) => (
          <li key={n} className="result">
            {m.label && (
              <span className="result__tag">
                {L(m.label)}{m.shootoutWinner ? `. ${t('results.penalties', { team: name(m.shootoutWinner) })}` : ''}
              </span>
            )}
            <span className="result__n">{n}</span>
            <span className="result__side result__side--home">
              {name(m.home)}<span className="bib bib--sm" style={{ background: bibOf(m.home).color }} aria-hidden />
            </span>
            <span className="result__score">{m.homeScore} – {m.awayScore}</span>
            <span className="result__side">
              <span className="bib bib--sm" style={{ background: bibOf(m.away).color }} aria-hidden />{name(m.away)}
            </span>
          </li>
        ))}
      </ol>
      <button className="btn btn--ghost btn--wide" onClick={() => { undoLast(); onMatch(); }}>
        {t('results.reopen')}
      </button>
      <p className="hint">{t('results.reopenHint')}</p>
    </div>
  );
}
