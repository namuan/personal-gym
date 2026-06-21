import { useEffect, useRef, useState } from 'react';
import { buildShareUrl } from '../data/shareCodec.js';
import { APP_PATH } from '../config.js';

/**
 * ShareModal renders the shareable URL of the currently saved plan and
 * lets the user copy it to the clipboard. It is purely a presentation
 * and clipboard helper: it does not persist anything to IndexedDB.
 *
 * Props:
 *   - open: boolean
 *   - onClose: () => void
 *   - payload: string | null  // result of encodePlanToPayload(plan)
 *   - exerciseCount: number
 *   - encodedBytes: number    // size of the payload in bytes (for the summary)
 *   - error: string | null    // encoding error, if any
 */
export default function ShareModal({
  open,
  onClose,
  payload,
  exerciseCount,
  encodedBytes,
  error,
}) {
  const inputRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const url = payload
    ? buildShareUrl({
        origin: window.location.origin,
        base: APP_PATH,
        payload,
      })
    : '';

  async function handleCopy() {
    if (!inputRef.current) return;
    inputRef.current.select();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers that block the async clipboard API:
      // the select() above lets the user copy with Ctrl/Cmd+C.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 px-4 py-6 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2
            id="share-modal-title"
            className="text-lg font-semibold tracking-tight"
          >
            Share your plan
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Send this link to someone else. They'll see a preview and can
            import it with one tap. No account or server needed.
          </p>
        </div>

        {error ? (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="share-url">
                Share link
              </label>
              <input
                ref={inputRef}
                id="share-url"
                type="text"
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="input font-mono text-xs"
              />
              <p className="mt-1 text-xs text-slate-500">
                {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                {' · '}
                ~{Math.max(1, Math.round(encodedBytes / 100) / 10)} KB encoded
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="btn-primary flex-1 sm:flex-none"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
