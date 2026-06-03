'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Shared error boundary UI for the app's route segments. If a server component
 * throws, this renders a calm, recoverable page instead of Next's generic
 * "Application error" white screen. The actual message + digest are available
 * behind a toggle so we can debug from a phone without dev tools.
 *
 * Used by the per-segment error.tsx files (member, leader, root).
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
        Something went sideways
      </p>
      <h1 className="mb-4 font-display text-4xl font-light text-ivory">
        We could not load this page.
      </h1>
      <p className="mb-6 leading-relaxed text-silver">
        This is usually a temporary hiccup. The rest of the site is still working. Try again, and
        if it keeps happening let us know.
      </p>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
        >
          Back to main site
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="text-[10px] font-medium uppercase tracking-[0.22em] text-silver underline transition-colors hover:text-gold-lt"
      >
        {showDetails ? 'Hide details' : 'Show error details'}
      </button>

      {showDetails && (
        <div className="mx-auto mt-6 max-w-xl rounded-sm border border-border-sub bg-black-3 p-4 text-left">
          {error.digest && (
            <p className="mb-3 text-xs">
              <span className="text-silver">Digest: </span>
              <code className="break-all font-mono text-gold-lt">{error.digest}</code>
            </p>
          )}
          <p className="text-xs">
            <span className="text-silver">Message: </span>
            <code className="break-all font-mono text-ivory">{error.message || '(no message)'}</code>
          </p>
          {error.stack && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.16em] text-silver">
                Stack
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed text-silver">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
