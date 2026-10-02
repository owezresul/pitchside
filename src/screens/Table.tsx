import { BIBS, bibOf, useStore } from '../store';
import { leagueHistory, leagueTables, type LeagueTable } from '../engine';
import { renderShareCard } from '../lib/shareCard';
import { SessionActions } from '../components/SessionActions';
import { useI18n } from '../i18n/react';

function Standings({ t: tbl, name }: { t: LeagueTable; name: (id: string) => string }) {
  const { t, L } = useI18n();
  return (
    <div className="tablewrap">
      {tbl.title && <h3 className="round__name table__title">{L(tbl.title)}</h3>}
      <table className="table">
        <thead>
          <tr><th className="table__team">{t('table.team')}</th><th>{t('col.p')}</th><th>{t('col.w')}</th><th>{t('col.d')}</th><th>{t('col.l')}</th><th>{t('col.gd')}</th><th>{t('col.pts')}</th></tr>
        </thead>
        <tbody>
          {tbl.rows.map((r, i) => (
            <tr key={r.teamId}
              className={[
                i < tbl.through ? 'table__row--q' : '',
                i < tbl.byes ? 'table__row--bye' : '',
                tbl.through > 0 && i === tbl.through - 1 && tbl.through < tbl.rows.length ? 'table__row--cut' : '',
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
  const { t, lang } = useI18n();
  const teams = useStore((s) => s.teams);
  const config = useStore((s) => s.config);
  const all = useStore((s) => s.history);
  const ids = teams.map((tm) => tm.id);
  const history = leagueHistory(config, ids, all);
  const tables = leagueTables(config, ids, all);
  const name = (id: string) => teams.find((tm) => tm.id === id)?.name ?? id;
  const first = tables[0];
  const grouped = tables.length > 1;

  return (
    <div className="screen">
      <h2 className="h2">{grouped ? t('table.groups') : t('table.title')}</h2>
      {tables.map((tb, i) => <Standings key={i} t={tb} name={name} />)}
      {first.through > 0 && (
        <p className="hint">
          {grouped
            ? t('table.hintGroups', { n: first.through })
            : first.byes > 0
              ? t('table.hintByes', { byes: first.byes, from: first.byes + 1, to: first.through })
              : t('table.hintThrough', { n: first.through })}
        </p>
      )}
      <SessionActions
        render={() => renderShareCard(teams, history, tables)}
        renderKey={`${lang}|${teams.map((tm) => tm.name).join()}|${history.length}`} />
    </div>
  );
}
