import { useEffect, useState, type ReactNode } from 'react';
import { APK_URL, REPO_URL } from '../config';
import { isNative } from '../lib/native';
import { useI18n } from '../i18n/react';

interface InstallPrompt extends Event { prompt: () => Promise<void> }

const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
const IconInstall = () => <svg {...svg}><path d="M12 4v11m0 0l-4-4m4 4l4-4" /><path d="M5 19h14" /></svg>;
const IconAndroid = () => <svg {...svg}><path d="M6 17V10a6 6 0 0112 0v7a1 1 0 01-1 1H7a1 1 0 01-1-1z" /><path d="M9 5L8 3M15 5l1-2" /><path d="M9.5 11h.01M14.5 11h.01" strokeWidth="2.6" /></svg>;
const IconCode = () => <svg {...svg}><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></svg>;
const Go = ({ down }: { down?: boolean }) => (
  <svg {...svg} width={18} height={18} className="getapp__go">{down ? <path d="M12 5v14m0 0l-5-5m5 5l5-5" /> : <path d="M7 17L17 7M9 7h8v8" />}</svg>
);

function Row({ icon, label, href, onClick, primary }: { icon: ReactNode; label: string; href?: string; onClick?: () => void; primary?: boolean }) {
  const inner = (
    <>
      <span className="getapp__chip">{icon}</span>
      <span className="getapp__label">{label}</span>
      <Go down={!href} />
    </>
  );
  const cls = `getapp__row${primary ? ' getapp__row--primary' : ''}`;
  return (
    <li>
      {href
        ? <a className={cls} href={href} target="_blank" rel="noreferrer">{inner}</a>
        : <button type="button" className={cls} onClick={onClick}>{inner}</button>}
    </li>
  );
}

/** Quiet "Get the app" card for the web version: install it, grab the Android build, or read the code. */
export function GetApp() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const installed = window.matchMedia?.('(display-mode: standalone)').matches;
  if (isNative || installed) return null;

  return (
    <section className="getapp" aria-label={t('app.get.title')}>
      <div className="getapp__head">
        <img className="getapp__icon" src="/icons/icon-192.png" alt="" width={48} height={48} />
        <div>
          <h2 className="getapp__title">{t('app.get.title')}</h2>
          <p className="getapp__note">{t('app.get.note')}</p>
        </div>
      </div>
      <ul className="getapp__list">
        {prompt && <Row primary icon={<IconInstall />} label={t('app.get.install')} onClick={() => { void prompt.prompt(); setPrompt(null); }} />}
        <Row icon={<IconAndroid />} label={t('app.get.android')} href={APK_URL} />
        <Row icon={<IconCode />} label={t('app.get.source')} href={REPO_URL} />
      </ul>
    </section>
  );
}
