'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Verse } from '@/lib/dashboard/verses';
import { bibleUrl } from '@/lib/dashboard/bible';
import {
  saveReflection,
  confirmReflectionThemes,
  deleteReflection,
  revealToLeaders,
  setShareThemes,
  type QuietView,
} from '@/app/dashboard/(app)/quiet/actions';

/**
 * One question, one box, one button. Afterwards: a verse that fits, the theme
 * we heard with a way to correct it, and, when the words call for it, the
 * care card. Past entries are listed for the author only, with delete.
 */
export function QuietQuestion({ view }: { view: QuietView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [share, setShare] = useState(view.shareThemes);
  const [result, setResult] = useState<{ id: string; themes: string[]; safety: boolean; notified: boolean; verse: Verse | null } | null>(null);
  const [picking, setPicking] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [themeError, setThemeError] = useState('');
  const label = (key: string) => view.themeChoices.find((t) => t.key === key)?.label ?? key;

  function keep() {
    setError('');
    startTransition(async () => {
      const res = await saveReflection(view.question.key, body).catch(() => ({
        ok: false as const,
        themes: [],
        safety: false,
        notified: false,
        verse: null,
        error: 'Something went wrong.',
      }));
      if (!res.ok || !res.id) {
        setError(res.error ?? 'Could not keep that.');
        return;
      }
      setResult({ id: res.id, themes: res.themes, safety: res.safety, notified: res.notified, verse: res.verse });
      setBody('');
    });
  }

  function toggleTheme(key: string) {
    if (!result) return;
    const prev = result.themes;
    const has = prev.includes(key);
    const next = has ? prev.filter((t) => t !== key) : [...prev, key].slice(-2);
    setThemeError('');
    setResult({ ...result, themes: next });
    startTransition(async () => {
      const r = await confirmReflectionThemes(result.id, next).catch(() => ({ ok: false, verse: null }));
      if (r.ok) setResult((cur) => (cur ? { ...cur, verse: r.verse ?? cur.verse } : cur));
      else {
        setResult((cur) => (cur ? { ...cur, themes: prev } : cur));
        setThemeError('Could not save that change. Try again.');
      }
    });
  }

  /** Done also means "yes, that word fits": only confirmed words can ever reach a leader. */
  function finish() {
    if (!result) return;
    const current = result;
    startTransition(async () => {
      if (!current.safety) await confirmReflectionThemes(current.id, current.themes).catch(() => undefined);
      setResult(null);
      setPicking(false);
      router.refresh();
    });
  }

  if (!view.ready) {
    return (
      <section className="rounded-sm border border-border-sub bg-black-3 p-6">
        <p className="text-sm text-silver">This is not switched on for the site yet.</p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {!result ? (
        <section className="rounded-sm border border-border-gold bg-black-3 p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">This week</p>
          <h3 className="mt-1 font-display text-2xl font-light leading-snug text-ivory">{view.question.text}</h3>
          <p className="mt-2 text-sm leading-relaxed text-silver">
            Nobody reads this. It is kept scrambled, and only you can open it. Your leader may see only a theme word,
            never your words, never your name, and you can turn even that off below.
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="However much or little you want."
            className="mt-4 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-base leading-relaxed text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending || body.trim().length < 2}
              onClick={keep}
              className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt disabled:opacity-60"
            >
              {pending ? 'Keeping' : 'Keep this'}
            </button>
            {view.answeredThisWeek && <span className="text-xs text-muted">You already answered this week. Another is fine.</span>}
          </div>
        </section>
      ) : (
        <section className="rounded-sm border border-border-gold bg-gold/[0.05] p-6">
          {result.safety ? (
            <div className="rounded-sm border border-red-500/40 bg-red-500/[0.06] p-5">
              <p className="font-display text-2xl font-light text-ivory">You matter. Please do not carry this alone.</p>
              <p className="mt-3 text-base leading-relaxed text-ivory-dim">
                If you are thinking about ending your life or hurting yourself, call or text <span className="text-ivory">988</span>{' '}
                (the Suicide &amp; Crisis Lifeline) any time, day or night. If you are in danger right now, call 911.
              </p>
              <p className="mt-3 text-base leading-relaxed text-ivory-dim">
                If someone is hurting you, you deserve to be safe.{' '}
                {result.notified
                  ? 'Your leaders have been told that someone in the group needs a person this week. They do not know it is you, and they have none of your words.'
                  : 'We could not reach a leader automatically right now. Please text your leader directly, or call or text 988.'}
              </p>
              {!revealed ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await revealToLeaders(result.id).catch(() => ({ ok: false }));
                      if (r.ok) setRevealed(true);
                    })
                  }
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-sm bg-gold px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt disabled:opacity-60"
                >
                  Let my leader know it was me
                </button>
              ) : (
                <p className="mt-4 text-sm text-gold-lt">Done. Your leader has your first name and will reach out gently.</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Kept</p>
              {result.verse && (
                <div className="mt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">{result.verse.ref}</p>
                  <p className="mt-1 font-display text-xl font-light leading-relaxed text-ivory">{result.verse.text}</p>
                  <a href={bibleUrl(result.verse.ref)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-gold">
                    Read it in context &rarr;
                  </a>
                </div>
              )}
              <div className="mt-5">
                <p className="text-sm text-silver">
                  {result.themes.length ? 'Sounds like:' : 'We could not tell what this is about. Pick a word if you like:'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(picking ? view.themeChoices.map((t) => t.key) : result.themes).map((key) => {
                    const on = result.themes.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleTheme(key)}
                        aria-pressed={on}
                        className={cn(
                          'min-h-[44px] rounded-full border px-4 text-sm',
                          on ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver hover:text-ivory',
                        )}
                      >
                        {label(key)}
                      </button>
                    );
                  })}
                  {!picking && (
                    <button type="button" onClick={() => setPicking(true)} className="min-h-[44px] px-3 text-sm text-muted hover:text-silver">
                      Not quite?
                    </button>
                  )}
                </div>
                {themeError && <p className="mt-2 text-sm text-red-300">{themeError}</p>}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Only the word can reach your leader, and only as part of the whole group, never as yours. Tapping Done
                keeps the words shown.
              </p>
            </>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={finish}
            className="mt-5 inline-flex min-h-[44px] items-center rounded-sm border border-gold/45 px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:bg-gold hover:text-black disabled:opacity-60"
          >
            {result.safety ? 'Done' : 'That fits, done'}
          </button>
        </section>
      )}

      <section className="rounded-sm border border-border-sub bg-black-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-light text-ivory">Let my leader see the theme</h3>
            <p className="mt-1 text-sm text-silver">A word like &ldquo;grief&rdquo;, only once three people have written. Never your words.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={share}
            disabled={pending}
            onClick={() => {
              const next = !share;
              setShare(next);
              startTransition(async () => {
                const r = await setShareThemes(next).catch(() => ({ ok: false }));
                if (!r.ok) setShare(!next);
              });
            }}
            className={cn(
              'inline-flex min-h-[44px] items-center gap-3 rounded-sm border px-4 text-sm',
              share ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
            )}
          >
            <span aria-hidden className={cn('relative inline-block h-5 w-9 rounded-full', share ? 'bg-gold' : 'bg-black-4')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform', share ? 'left-4' : 'left-0.5')} />
            </span>
            {share ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      {view.recent.length > 0 && (
        <section>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Only you can see these</p>
          <ul className="space-y-3">
            {view.recent.map((r) => (
              <li key={r.id} className="rounded-sm border border-border-sub bg-black-3 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs text-muted">
                    {r.dateText}
                    {r.question ? ` · ${r.question}` : ''}
                  </p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteReflection(r.id).catch(() => undefined);
                        router.refresh();
                      })
                    }
                    className="inline-flex min-h-[44px] items-center px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ivory-dim">{r.text || '(could not be opened)'}</p>
                {r.themes.length > 0 && !r.safety && (
                  <p className="mt-2 text-xs text-muted">{r.themes.map(label).join(', ')}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
