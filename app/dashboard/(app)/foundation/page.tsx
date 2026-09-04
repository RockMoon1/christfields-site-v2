import Link from 'next/link';
import { FOUNDATION } from '@/lib/dashboard/foundations';
import { bibleUrl } from '@/lib/dashboard/bible';

export const metadata = {
  title: 'What we stand for | Christ Fields',
};

/**
 * The always-available "What we stand for" page. Linked from the welcome, the
 * Seed overview panel, and Settings. States plainly what this is and why, with
 * the gospel carried through Scripture and tone rather than a hard ask.
 */
export default function FoundationPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          {FOUNDATION.eyebrow}
        </p>
        <h1 className="mb-5 font-display text-4xl font-light leading-tight text-ivory md:text-5xl">
          {FOUNDATION.heading}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-silver md:text-lg">{FOUNDATION.intro}</p>
      </header>

      {/* Beliefs */}
      <section className="mb-10 grid gap-3 sm:grid-cols-2">
        {FOUNDATION.beliefs.map((b) => (
          <article
            key={b.title}
            className="rounded-sm border border-border-sub bg-black-3 p-6"
          >
            <h2 className="mb-2 font-display text-xl font-light text-ivory">{b.title}</h2>
            <p className="mb-3 text-sm leading-relaxed text-silver">{b.body}</p>
            <a
              href={bibleUrl(b.ref)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold-lt hover:underline"
            >
              {b.ref} &#8599;
            </a>
          </article>
        ))}
      </section>

      {/* What we do */}
      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-8">
        <h2 className="mb-3 font-display text-2xl font-light text-ivory">{FOUNDATION.doingTitle}</h2>
        <p className="text-base leading-relaxed text-silver">{FOUNDATION.doing}</p>
      </section>

      {/* The heart of it */}
      <section className="relative mb-10 overflow-hidden rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-8">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />
        <h2 className="mb-3 font-display text-2xl font-light text-gold-lt">{FOUNDATION.gospelTitle}</h2>
        <p className="text-base leading-relaxed text-ivory-dim">{FOUNDATION.gospel}</p>
      </section>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
      >
        &larr; Back to your dashboard
      </Link>
    </div>
  );
}
