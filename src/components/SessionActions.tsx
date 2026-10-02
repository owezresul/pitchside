import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { shareOrDownload } from '../lib/shareCard';

/** Share preview + share button + two-step "end session". Used by the table and the bracket. */
export function SessionActions({ render, renderKey }: { render: () => Promise<Blob>; renderKey: string }) {
  const endSession = useStore((s) => s.endSession);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

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
      <h2 className="h2">Share</h2>
      {url && <img className="sharepreview" src={url} alt="Preview of the image you can share" />}
      <button className="btn btn--primary btn--wide" disabled={!blob} onClick={() => blob && shareOrDownload(blob)}>
        Share image
      </button>

      <div className="danger">
        {confirm ? (
          <>
            <p className="hint">This clears all results and goes back to setup.</p>
            <div className="danger__row">
              <button className="btn btn--ghost" onClick={() => setConfirm(false)}>Keep playing</button>
              <button className="btn btn--danger" onClick={endSession}>End session</button>
            </div>
          </>
        ) : (
          <button className="btn btn--ghost btn--wide" onClick={() => setConfirm(true)}>End session</button>
        )}
      </div>
    </>
  );
}
