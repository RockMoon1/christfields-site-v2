import Link from 'next/link';
import { getQuiet } from './actions';
import { QuietQuestion } from '@/components/dashboard/QuietQuestion';

/**
 * A quiet question. A leaf from Home or You, never a tab. One question a
 * week, answered in private, kept scrambled, opened only by its author.
 */
export default async function QuietPage() {
  const view = await getQuiet();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="mb-4 inline-flex min-h-[44px] items-center text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-silver">
        &larr; Home
      </Link>
      <header className="mb-6">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">A quiet question</p>
        <h2 className="font-display text-3xl font-light text-ivory">Between you and God.</h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-silver">
          Confess to one another and pray for one another, so that you may be healed. This is the first step: saying it
          somewhere safe. The rest happens in the room.
        </p>
      </header>
      <QuietQuestion view={view} />
    </div>
  );
}
