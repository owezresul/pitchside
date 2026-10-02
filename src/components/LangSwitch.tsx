import { useStore } from '../store';
import { LANGS } from '../i18n/dict';
import { useI18n } from '../i18n/react';

/** One tap switches the language. The active one is highlighted, and with more languages it cycles. */
export function LangSwitch() {
  const { t, lang } = useI18n();
  const setLang = useStore((s) => s.setLang);
  const next = LANGS[(LANGS.findIndex((l) => l.id === lang) + 1) % LANGS.length];
  return (
    <button type="button" className="lang" onClick={() => setLang(next.id)}
      aria-label={t('lang.switchTo', { name: next.native })}>
      {LANGS.map((l) => (
        <span key={l.id} className={`lang__seg${l.id === lang ? ' lang__seg--on' : ''}`} aria-hidden>{l.short}</span>
      ))}
    </button>
  );
}
