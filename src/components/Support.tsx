import { CONTACT, DONATE_URL } from '../config';
import { useI18n } from '../i18n/react';

const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

const links = [
  { name: 'Telegram', href: CONTACT.telegram, icon: <svg {...svg}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg> },
  { name: 'WhatsApp', href: CONTACT.whatsapp, icon: <svg {...svg}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg> },
  { name: 'GitHub', href: CONTACT.github, icon: <svg {...svg}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg> },
];

/** A small, quiet note with a donate link and ways to reach the author. Shown when a tournament is finished. */
export function Support() {
  const { t } = useI18n();
  return (
    <aside className="support">
      <p className="support__text">{t('support.text')}</p>
      <div className="support__row">
        {DONATE_URL && (
          <a className="support__donate" href={DONATE_URL} target="_blank" rel="noreferrer">
            <svg {...svg} width={18} height={18}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            {t('support.donate')}
          </a>
        )}
        {links.map((l) => (
          <a key={l.name} className="support__chip" href={l.href} target="_blank" rel="noreferrer" aria-label={l.name} title={l.name}>
            {l.icon}
          </a>
        ))}
      </div>
    </aside>
  );
}
