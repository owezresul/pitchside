import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { LANGS } from '../i18n/dict';
import { useI18n } from '../i18n/react';

/** Globe button in the header that opens a small language menu. Scales to more languages later. */
export function LangSwitch() {
  const { t, lang } = useI18n();
  const setLang = useStore((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.id === lang)!;

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div className="lang" ref={root}>
      <button type="button" className="lang__btn" aria-haspopup="listbox" aria-expanded={open}
        aria-label={`${t('lang.label')}: ${current.native}`} onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
        </svg>
        <span>{current.short}</span>
      </button>
      {open && (
        <ul className="lang__menu" role="listbox" aria-label={t('lang.label')}>
          {LANGS.map((l) => (
            <li key={l.id} role="option" aria-selected={l.id === lang}>
              <button type="button" className="lang__opt" onClick={() => { setLang(l.id); setOpen(false); }}>
                <span className="lang__native">{l.native}</span>
                <span className="lang__check" aria-hidden>{l.id === lang ? '✓' : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
