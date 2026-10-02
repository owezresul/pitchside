import { BIBS, bibOf, useStore } from '../store';
import { leagueHistory, leagueTables, type LeagueTable } from '../engine';
import { renderShareCard } from '../lib/shareCard';
import { SessionActions } from '../components/SessionActions';

function Standings({ t, name }: { t: LeagueTable; name: (id: string) => string }) {
  return (
    <div className="tablewrap">
      {t.title && <h3 className="round__name table__title">{t.title}</h3>}
      <table className="table">
        <thead>
          <tr><th className="table__team">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
        </thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr key={r.teamId}
              className={[
                i < t.through ? 'table__row--q' : '',
                i < t.byes ? 'table__row--bye' : '',
                t.through > 0 && i === t.through - 1 && t.through < t.rows.length ? 'table__row--cut' : '',
              ].join(' ')}>
              <td className="table__team">
                <span className="bib bib--sm" style={{ background: (bibOf(r.teamId) ?? BIBS[0]).color }} aria-hidden />
                {name(r.teamId)}
              </td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
              <td>{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
              <td className="table__pts">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Table() {
  const teams = useStore((s) => s.teams);
  const config = useStore((s) => s.config);
  const all = useStore((s) => s.history);
  const ids = teams.map((t) => t.id);
  const history = leagueHistory(config, ids, all);
  const tables = leagueTables(config, ids, all);
  const name = (id: string) => teams.find((t) => t.id === id)?.name ?? id;
  const first = tables[0];
  const grouped = tables.length > 1;

  return (
    <div className="screen">
      <h2 className="h2">{grouped ? 'Groups' : 'Table'}</h2>
      {tables.map((t, i) => <Standings key={i} t={t} name={name} />)}
      {first.through > 0 && (
        <p className="hint">
          {grouped
            ? `The top ${first.through} of each group go through to the playoffs. See the Bracket tab.`
            : first.byes > 0
              ? `Top ${first.byes} skip the first knockout round. Places ${first.byes + 1} to ${first.through} play off. See the Bracket tab.`
              : `The top ${first.through} go through to the playoffs. See the Bracket tab.`}
        </p>
      )}
      <SessionActions
        render={() => renderShareCard(teams, history, tables)}
        renderKey={`${teams.map((t) => t.name).join()}|${history.length}`} />
    </div>
  );
}
