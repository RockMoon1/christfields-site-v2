import Link from 'next/link';
import { verseForToday } from '@/lib/dashboard/content';
import { verseContextFor } from '@/lib/dashboard/scripture-context';
import { bibleUrl } from '@/lib/faithflow/guidance';

/**
 * "Verse in context." A calm, focused study screen for today's verse: the words,
 * then their setting (who wrote it, to whom, when), then what is happening
 * around them, then a couple of threads elsewhere in Scripture. The aim is sound
 * hermeneutics made simple, the opposite of proof-texting. The full passage is
 * linked out rather than reprinted, so the reader always sees the verse in its
 * place.
 */
export default function VerseContextPage() {
  const verse = verseForToday();
  const ctx = verseContextFor(verse.reference);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        prefetch
        className="mb-8 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-silver"
      >
        &larr; Overview
      </Link>

      {/* The verse */}
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        In context
      </p>
      <blockquote className="font-display text-2xl font-light leading-relaxed text-ivory md:text-3xl">
        &ldquo;{verse.verse_text}&rdquo;
      </blockquote>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-medium uppercase tracking-[0.14em] text-gold-lt">
          {verse.reference}
        </span>
        <span className="text-xs text-muted">{verse.translation}</span>
        <a
          href={bibleUrl(verse.reference)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
        >
          Read the whole chapter &#8599;
        </a>
      </div>

      {ctx ? (
        <div className="mt-8 space-y-6">
          <Block label="The setting" body={ctx.setting} />
          <Block label="In its place" body={ctx.inContext} />

          {ctx.crossRefs.length > 0 && (
            <section className="rounded-md border border-border-sub bg-black-3 p-5">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
                The same thread elsewhere
              </p>
              <ul className="space-y-3">
                {ctx.crossRefs.map((c) => (
                  <li key={c.ref}>
                    <a
                      href={bibleUrl(c.ref)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium uppercase tracking-[0.1em] text-gold-lt hover:underline"
                    >
                      {c.ref} &#8599;
                    </a>
                    <p className="mt-0.5 text-sm leading-relaxed text-silver">{c.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-border-sub bg-black-3 p-6">
          <p className="text-sm leading-relaxed text-silver">
            The best way to read any verse well is to read what is around it. Open the whole chapter
            and notice who is speaking, to whom, and what is happening.
          </p>
          <a
            href={bibleUrl(verse.reference)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
          >
            Read the whole chapter &#8599;
          </a>
        </div>
      )}

      {/* FaithFlow is the community space: this page is a conversation starter, not a
          study tool. Deep, personal study is handed off to the sibling apps below so we
          do not duplicate GraceFlow / LearnFlow. */}
      <section className="mt-8 rounded-md border border-border-sub bg-black-3 p-5">
        <p className="text-sm leading-relaxed text-silver">
          This is a starting point, not the whole study. Sit with it, then bring it to your group and
          talk it through together. Scripture lands deeper when it is opened face to face.
        </p>
      </section>

      <div className="mt-4">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Want to go deeper on your own?
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="https://graceflows.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-md border border-border-sub bg-black-3 p-4 transition-colors hover:border-gold/40"
          >
            <span className="text-sm font-medium text-ivory">GraceFlow</span>
            <p className="mt-1 text-xs leading-relaxed text-silver">
              The verse for the moment, in its true context, with a short reflection and a prayer.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors group-hover:text-gold-lt">
              Open GraceFlow &#8599;
            </span>
          </a>
          <a
            href="https://graceflows.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-md border border-border-sub bg-black-3 p-4 transition-colors hover:border-gold/40"
          >
            <span className="text-sm font-medium text-ivory">LearnFlow</span>
            <p className="mt-1 text-xs leading-relaxed text-silver">
              Go to the source: the original Greek and Hebrew, word by word, with
              cross-references. It is the Study tab inside GraceFlow.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors group-hover:text-gold-lt">
              Open the Study tab &#8599;
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <section>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">{label}</p>
      <p className="text-base leading-relaxed text-ivory-dim">{body}</p>
    </section>
  );
}
