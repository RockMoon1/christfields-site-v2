'use client';

import dynamic from 'next/dynamic';
import type { OrbArea } from './PremiumOrb';
import type { JourneyStage } from '@/lib/dashboard/journey';

/**
 * Lazy boundary for the 3D orb. The WebGL stack (three + @react-three) is ~500KB
 * of client JS, so we load it as a separate chunk after the page is interactive
 * instead of shipping it in the overview's first-load bundle. ssr:false is safe:
 * the Canvas renders nothing meaningful on the server anyway, and it must live
 * in a client component (Next forbids ssr:false in server components).
 *
 * This does NOT touch PremiumOrb's internal hydration/Suspense constraints — it
 * only defers loading the whole component.
 */
const PremiumOrb = dynamic(() => import('./PremiumOrb').then((m) => m.PremiumOrb), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />,
});

export function OrbLazy(props: {
  className?: string;
  areas?: OrbArea[];
  vitality?: number;
  stage?: JourneyStage;
}) {
  return <PremiumOrb {...props} />;
}
