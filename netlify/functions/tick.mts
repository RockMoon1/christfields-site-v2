import type { Config } from '@netlify/functions';

/**
 * Netlify Scheduled Function: the hourly heartbeat that drives
 * /api/cron/tick. Free on every plan; @hourly is the finest schedule Netlify
 * offers. The route does about six seconds of work per call and says whether
 * more remains, so this runs it at most twice with a 12s abort each, inside
 * the 30s function limit. (An abort only stops waiting; the route finishes
 * the event it is on and its dedupe rows keep the next hour honest.)
 *
 * Env: CRON_SECRET (same value as the site), URL (set by Netlify).
 */
export default async () => {
  const base = (process.env.URL || 'https://christfields2717.com').replace(/\/$/, '');
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('tick: CRON_SECRET is not set');
    return new Response('CRON_SECRET missing', { status: 500 });
  }
  const results: unknown[] = [];
  let remaining = true;
  for (let i = 0; i < 2 && remaining; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const res = await fetch(`${base}/api/cron/tick`, {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}` },
        signal: ctrl.signal,
      });
      const json = (await res.json().catch(() => ({}))) as { remaining?: boolean };
      results.push({ status: res.status, ...json });
      remaining = res.ok && !!json.remaining;
    } catch (err) {
      results.push({ error: err instanceof Error ? err.message : String(err) });
      remaining = false;
    } finally {
      clearTimeout(timer);
    }
  }
  console.log('tick', JSON.stringify(results));
  return new Response(JSON.stringify(results), { headers: { 'content-type': 'application/json' } });
};

export const config: Config = {
  schedule: '@hourly',
};
