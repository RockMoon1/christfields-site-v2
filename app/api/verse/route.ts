import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { VERSES_OF_DAY, verseForToday } from '@/lib/dashboard/content';

/**
 * "A verse for what you are carrying."
 *
 * A signed-in member describes what is on them; we return a fitting verse and a
 * short, grounded reflection. The model runs on NVIDIA's free endpoint, called
 * SERVER-SIDE only (the key never touches the browser).
 *
 * Grounding: the model may ONLY choose a verse by index from our vetted pool,
 * and we re-resolve the text from the pool ourselves. It cannot invent a
 * reference or quote Scripture wrongly. If the key is missing or the call
 * fails, we fall back to today's verse, so the feature never breaks.
 *
 * Env (set in Netlify -> Environment variables):
 *   NVIDIA_API_KEY        the build.nvidia.com key (required to turn AI on)
 *   NVIDIA_VERSE_MODEL    optional model id (defaults to llama-3.3-70b-instruct)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';
const MODEL = process.env.NVIDIA_VERSE_MODEL || 'meta/llama-3.3-70b-instruct';

const SYSTEM = [
  'You are a gentle, biblically grounded companion for Christ Fields, a Christian community.',
  'You help a person bring what they are carrying to Scripture.',
  'Rules you must never break:',
  '1. You may ONLY use the verses in the provided list. Never invent or quote any other reference.',
  '2. Never invent doctrine. Stay close to the plain meaning of the chosen verse.',
  '3. Be warm, plain, and short. Grace first. Never shame the person.',
  '4. Point to Christ and his sufficiency, not to self-improvement or trying harder.',
  '5. Do not use em dashes.',
].join('\n');

// Best-effort in-memory rate limit (per warm instance): 6 asks / 5 min / user.
const RATE_LIMIT = 6;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(userId, recent);
    return true;
  }
  recent.push(now);
  hits.set(userId, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

function fallback(reflection = '') {
  const v = verseForToday();
  return NextResponse.json({
    reference: v.reference,
    text: v.verse_text,
    translation: v.translation,
    reflection,
    grounded: false,
  });
}

/** Pull the first JSON object out of a model response, defensively. */
function extractJson(content: string): { index?: number; reflection?: string } | null {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }
  if (rateLimited(userId)) {
    return NextResponse.json(
      { error: 'Give it a moment, then bring him the next thing.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const situation = String((body as { situation?: unknown })?.situation ?? '')
    .trim()
    .slice(0, 500);
  if (situation.length < 2) {
    return NextResponse.json({ error: 'Tell me a little about what you are carrying.' }, { status: 400 });
  }

  // No key yet: the feature still works, just without the AI match.
  if (!process.env.NVIDIA_API_KEY) {
    return fallback(
      'Sit with this for a moment. You do not have to fix anything right now. Just bring it to him.',
    );
  }

  const poolText = VERSES_OF_DAY.map(
    (v, i) => `${i + 1}. ${v.reference} — "${v.verse_text}"`,
  ).join('\n');

  try {
    const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 320,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: `These are the only verses you may choose from:\n${poolText}\n\nWhat the person is carrying: "${situation}"\n\nChoose the single most fitting verse. Respond with ONLY a JSON object, no other text: {"index": <the number of the verse from the list>, "reflection": "<two or three warm, plain sentences connecting that verse to what they are carrying, grounded only in Scripture, pointing them to Christ>"}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) throw new Error(`NVIDIA returned ${res.status}`);
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(content);
    if (!parsed) throw new Error('Could not parse model output');

    const idx = Number(parsed.index) - 1;
    const chosen = VERSES_OF_DAY[idx] ?? verseForToday();
    const reflection = String(parsed.reflection ?? '').trim().slice(0, 700);

    return NextResponse.json({
      reference: chosen.reference,
      text: chosen.verse_text,
      translation: chosen.translation,
      reflection,
      grounded: true,
    });
  } catch (err) {
    console.error('verse route failed', err);
    return fallback(
      'Here is a word to carry for now. Read it slowly, and let it sit with what you are holding.',
    );
  }
}
