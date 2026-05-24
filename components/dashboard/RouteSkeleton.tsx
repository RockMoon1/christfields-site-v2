/**
 * Shared dashboard loading skeleton. Next renders this instantly on navigation
 * while the next segment's server components fetch, so transitions stay snappy
 * even when the database is slow. Used by the per-segment loading.tsx files.
 */
export default function RouteSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:p-10">
      <div className="mb-12 space-y-3">
        <div className="h-3 w-32 animate-pulse rounded-sm bg-black-4" />
        <div className="h-10 w-72 animate-pulse rounded-sm bg-black-4 md:w-96" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-sm bg-black-4" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="h-7 w-32 animate-pulse rounded-sm bg-black-4" />
      <div className="mt-3 h-4 w-44 animate-pulse rounded-sm bg-black-4" />
      <div className="mt-6 h-12 w-20 animate-pulse rounded-sm bg-black-4" />
      <div className="mt-4 h-2 w-full animate-pulse rounded-sm bg-black-4" />
      <div className="mt-6 border-t border-border-sub pt-5">
        <div className="h-3 w-20 animate-pulse rounded-sm bg-black-4" />
        <div className="mt-3 h-2 w-full animate-pulse rounded-sm bg-black-4" />
        <div className="mt-5 h-9 w-full animate-pulse rounded-sm bg-black-4" />
      </div>
    </div>
  );
}
