import { bibOf, useStore } from '../store';

export function Results({ onMatch }: { onMatch: () => void }) {
  const teams = useStore((s) => s.teams);
  const history = useStore((s) => s.history);
  const undoLast = useStore((s) => s.undoLast);
  const name = (id: string) => teams.find((t) => t.id === id)?.name ?? id;

  if (history.length === 0) {
    return (
      <div className="screen">
        <h2 className="h2">Results</h2>
        <p className="hint">No results yet. Press Full time at the end of a match and it shows up here.</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <h2 className="h2">Results</h2>
      <ol className="results">
        {history.map((m, i) => ({ m, n: i + 1 })).reverse().map(({ m, n }) => (
          <li key={n} className="result">
            {m.label && (
              <span className="result__tag">
                {m.label}{m.shootoutWinner ? `. ${name(m.shootoutWinner)} won on penalties` : ''}
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
        Reopen the last match
      </button>
      <p className="hint">Wrong score? Reopen the last match, fix the goals, then press Full time again.</p>
    </div>
  );
}
