import { useEffect, useState } from 'react';
import { APK_URL, REPO_URL } from '../config';
import { isNative } from '../lib/native';
import { useI18n } from '../i18n/react';

interface InstallPrompt extends Event { prompt: () => Promise<void> }

/** "Get the app" block for the web version: install it, grab the Android build, or read the code. */
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
      <h2 className="h2">{t('app.get.title')}</h2>
      <p className="hint">{t('app.get.note')}</p>
      <div className="getapp__links">
        {prompt && (
          <button type="button" className="btn btn--primary" onClick={() => { void prompt.prompt(); setPrompt(null); }}>
            {t('app.get.install')}
          </button>
        )}
        <a className="btn btn--ghost" href={APK_URL} target="_blank" rel="noreferrer">{t('app.get.android')}</a>
        <a className="btn btn--ghost" href={REPO_URL} target="_blank" rel="noreferrer">{t('app.get.source')}</a>
      </div>
    </section>
  );
}
