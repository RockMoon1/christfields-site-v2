'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { bibleUrl } from '@/lib/faithflow/guidance';

interface CrossRef {
  ref: string;
  note: string;
}

interface VerseResult {
  reference: string;
  text: string;
  translation: string;
  reflection: string;
  setting: string | null;
  inContext: string | null;
  crossRefs: CrossRef[];
  grounded?: boolean;
  remaining?: number;
}

/**
 * "A verse for what you are carrying." The member writes what is on them; a
 * grounded model (server-side, free NVIDIA stack) returns a fitting verse and a
 * Scripture-pointing reflection, alongside our vetted setting, in-context note,
 * and cross-references. The model can only choose from a vetted pool, so it
 * never invents Scripture, and the history shown is ours, not the model's.
 */
export function VerseForYou() {
  const [situation, setSituation] = useState('');
  const [result, setResult] = useState<VerseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function ask() {
    const value = situation.trim();
    if (value.length < 2) {
      setError('Tell me a little about what you are carrying.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Could not find a verse right now. Please try again.');
      } else {
        setResult(data as VerseResult);
      }
    } catch {
      setError('Could not reach the server. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative mb-8 overflow-hidden rounded-md border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6 md:p-8">
      {/* Animated top hairline */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Soft ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(201,165,72,0.10), transparent 70%)' }}
      />

      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        Bring it to the Word
      </p>
      <h3 className="mb-2 font-display text-2xl font-light text-ivory md:text-3xl">
        A verse for what you are carrying
      </h3>
      <p className="mb-5 max-w-xl text-sm leading-relaxed text-silver">
        Say what is on you, in your own words. We will find a verse to sit with, read it in its
        place, and let the Word speak to it. This stays between you and God.
      </p>

      <textarea
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        placeholder="Tired and a little anxious about money this week..."
        rows={3}
        maxLength={500}
        className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={ask}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-gold-lt disabled:opacity-60"
        >
          {loading ? 'Finding a verse…' : 'Find a verse'}
        </button>
        {result && typeof result.remaining === 'number' && result.remaining >= 0 && (
          <span className="text-xs text-muted">
            {result.remaining} {result.remaining === 1 ? 'verse' : 'verses'} left today
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.reference + result.reflection.slice(0, 8)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 overflow-hidden rounded-md border border-border-sub bg-black-2/70"
          >
            {/* The verse */}
            <div className="border-l-2 border-gold p-5 md:p-6">
              <blockquote className="font-display text-xl font-light leading-relaxed text-ivory md:text-2xl">
                &ldquo;{result.text}&rdquo;
              </blockquote>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <a
                  href={bibleUrl(result.reference)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium uppercase tracking-[0.14em] text-gold-lt hover:underline"
                >
                  {result.reference} &#8599;
                </a>
                <span className="text-xs text-muted">{result.translation}</span>
              </div>
            </div>

            {/* Reflection + grounded context */}
            <div className="space-y-5 px-5 pb-6 md:px-6">
              {result.reflection && (
                <p className="text-sm leading-relaxed text-ivory-dim">{result.reflection}</p>
              )}

              {result.setting && (
                <Block label="The setting" body={result.setting} />
              )}
              {result.inContext && (
                <Block label="In its place" body={result.inContext} />
              )}

              {result.crossRefs.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
                    The same thread elsewhere
                  </p>
                  <ul className="space-y-2">
                    {result.crossRefs.map((c) => (
                      <li key={c.ref}>
                        <a
                          href={bibleUrl(c.ref)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium uppercase tracking-[0.12em] text-gold-lt hover:underline"
                        >
                          {c.ref} &#8599;
                        </a>
                        <span className="ml-2 text-xs text-silver">{c.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">{label}</p>
      <p className="text-sm leading-relaxed text-silver">{body}</p>
    </div>
  );
}
