'use client';

import { usePathname } from 'next/navigation';
import { DashContainer } from '@/components/ui/DashContainer';
import { Surface } from '@/components/ui/Surface';

/** Match each route family's width; the surrounding main owns padding. */
export default function RouteSkeleton() {
  const pathname = usePathname();
  const width = pathname.startsWith('/dashboard/lead/group')
    ? 'board'
    : pathname.startsWith('/dashboard/community') || pathname.startsWith('/dashboard/foundation')
      ? 'prose'
      : 'reading';

  return (
    <DashContainer width={width}>
      <div role="status">
        <span className="sr-only">Loading page</span>
        <div aria-hidden>
          <div className="mb-8 space-y-3">
            <div className="h-3 w-32 rounded-sm bg-black-4 motion-safe:animate-pulse" />
            <div className="h-10 w-72 max-w-full rounded-sm bg-black-4 motion-safe:animate-pulse md:w-96" />
            <div className="h-4 w-full max-w-md rounded-sm bg-black-4 motion-safe:animate-pulse" />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </DashContainer>
  );
}

function SkeletonCard() {
  return (
    <Surface pad="md">
      <div className="h-7 w-32 rounded-sm bg-black-4 motion-safe:animate-pulse" />
      <div className="mt-3 h-4 w-44 max-w-full rounded-sm bg-black-4 motion-safe:animate-pulse" />
      <div className="mt-6 h-4 w-full rounded-sm bg-black-4 motion-safe:animate-pulse" />
      <div className="mt-2 h-4 w-3/4 rounded-sm bg-black-4 motion-safe:animate-pulse" />
      <div className="mt-6 h-12 w-full rounded-sm bg-black-4 motion-safe:animate-pulse" />
    </Surface>
  );
}
