'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Error boundary for the dashboard. If a server component anywhere in the
 * (app) route group throws, this catches it and renders a friendly page
 * instead of letting the whole site crash with Next.js' generic
 * "Application error" screen.
 *
 * Shows the actual error message + digest behind a toggle so we can
 * actually debug what is failing on user devices.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Always log to the console so dev tools on the user's device pick it up.
    // eslint-disable-next-line no-console
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
        Something went sideways
      </p>
      <h1 className="mb-4 font-display text-4xl font-light text-ivory">
        We could not load this page.
      </h1>
      <p className="mb-6 leading-relaxed text-silver">
        This usually means the database connection is misconfigured or the schema has
        not been initialized yet. The rest of the site is still working.
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

      {/* Diagnostic details. Hidden behind a toggle so users do not see a wall
          of stack trace, but available with one tap so we can debug from a
          phone without dev tools. */}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted underline transition-colors hover:text-gold-lt"
      >
        {showDetails ? 'Hide details' : 'Show error details'}
      </button>

      {showDetails && (
        <div className="mx-auto mt-6 max-w-xl rounded-sm border border-border-sub bg-black-3 p-4 text-left">
          {error.digest && (
            <p className="mb-3 text-xs">
              <span className="text-muted">Digest: </span>
              <code className="break-all font-mono text-gold-lt">{error.digest}</code>
            </p>
          )}
          <p className="text-xs">
            <span className="text-muted">Message: </span>
            <code className="break-all font-mono text-ivory">
              {error.message || '(no message)'}
            </code>
          </p>
          {error.stack && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.16em] text-muted">
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
