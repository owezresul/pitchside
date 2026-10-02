import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { shareOrDownload } from '../lib/shareCard';
import { useI18n } from '../i18n/react';
import { getShareUrl } from '../config';

/** Share preview + share button + two-step "end session". Used by the table and the bracket. */
export function SessionActions({ render, renderKey }: { render: () => Promise<Blob>; renderKey: string }) {
  const { t } = useI18n();
  const endSession = useStore((s) => s.endSession);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const share = async () => {
    if (!blob) return;
    const url = getShareUrl();
    const result = await shareOrDownload(blob, url ? t('share.caption', { url }) : t('share.captionNoLink'));
    setNote(result === 'downloaded' ? t('share.downloaded') : null);
  };

  useEffect(() => {
    let alive = true;
    render().then((b) => {
      if (!alive) return;
      setBlob(b);
      setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b); });
    }).catch(() => undefined);
    return () => { alive = false; };
    // render closes over the same data renderKey summarises
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey]);

  return (
    <>
      <h2 className="h2">{t('share.title')}</h2>
      {url && <img className="sharepreview" src={url} alt={t('share.previewAlt')} />}
      <button className="btn btn--primary btn--wide" disabled={!blob} onClick={share}>
        {t('share.button')}
      </button>
      {note && <p className="hint">{note}</p>}

      <div className="danger">
        {confirm ? (
          <>
            <p className="hint">{t('end.warn')}</p>
            <div className="danger__row">
              <button className="btn btn--ghost" onClick={() => setConfirm(false)}>{t('end.keep')}</button>
              <button className="btn btn--danger" onClick={endSession}>{t('end.confirm')}</button>
            </div>
          </>
        ) : (
          <button className="btn btn--ghost btn--wide" onClick={() => setConfirm(true)}>{t('end.confirm')}</button>
        )}
      </div>
    </>
  );
}
