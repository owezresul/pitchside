import { BIBS, bibOf, useStore } from '../store';
import { useI18n } from '../i18n/react';

/** Big colored banner for the winner. Uses the team's bib color. */
export function ChampionCard({ teamId, tag, compact }: { teamId: string; tag?: string; compact?: boolean }) {
  const { t } = useI18n();
  const name = useStore((s) => s.teams.find((tm) => tm.id === teamId)?.name ?? teamId);
  const bib = bibOf(teamId) ?? BIBS[0];
  return (
    <section className={`champ${compact ? ' champ--small' : ''}`} style={{ background: bib.color, color: bib.ink }}>
      <p className="champ__tag">{tag ?? t('match.champions')}</p>
      <h2 className="champ__name">{name}</h2>
    </section>
  );
}
