'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Error boundary for the dashboard. If a server component anywhere in the
 * (app) route group throws, this catches it and renders a friendly page
 * instead of letting the whole site crash with Next.js' generic
 * "Application error" screen.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
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
      <p className="mb-2 leading-relaxed text-silver">
        This usually means the database connection is misconfigured or the schema has
        not been initialized yet. The rest of the site is still working.
      </p>
      {error.digest && (
        <p className="mb-8 text-xs text-muted">
          Error ID: <code className="font-mono text-gold-lt">{error.digest}</code>
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
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
    </div>
  );
}
