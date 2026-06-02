'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { bibleUrl } from '@/lib/faithflow/guidance';

interface VerseResult {
  reference: string;
  text: string;
  translation: string;
  reflection: string;
  grounded?: boolean;
}

/**
 * "A verse for what you are carrying." The member writes what is on them; a
 * grounded model (server-side, free NVIDIA stack) returns a fitting verse and a
 * short reflection. The model can only choose from a vetted pool, so it never
 * invents Scripture. Works even before the AI key is set (graceful fallback).
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
    <section className="mb-8 rounded-md border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6 md:p-8">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        Bring it to the Word
      </p>
      <h3 className="mb-2 font-display text-2xl font-light text-ivory">
        A verse for what you are carrying
      </h3>
      <p className="mb-5 max-w-xl text-sm leading-relaxed text-silver">
        Say what is on you, in your own words. We will find a verse to sit with and a few honest
        lines to go with it. This stays between you and God.
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

      <button
        type="button"
        onClick={ask}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-gold-lt disabled:opacity-60"
      >
        {loading ? 'Finding a verse…' : 'Find a verse'}
      </button>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.reference + result.reflection.slice(0, 8)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 rounded-sm border-l-2 border-gold bg-black-2/60 p-5"
          >
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
            {result.reflection && (
              <p className="mt-4 text-sm leading-relaxed text-ivory-dim">{result.reflection}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
