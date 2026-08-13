import { cookies } from 'next/headers';
import { dayKeyInZone, isValidTimeZone, TZ_COOKIE } from './timezone';

/**
 * Server-only half of the timezone helpers. Kept apart from timezone.ts
 * because that module is imported by a client component (TimeZoneSync), and
 * anything touching next/headers cannot be bundled for the browser.
 */

/** The signed-in member's timezone, or UTC when the browser has not said. */
export async function getMemberTimeZone(): Promise<string> {
  try {
    const store = await cookies();
    const tz = store.get(TZ_COOKIE)?.value ?? '';
    return isValidTimeZone(tz) ? tz : 'UTC';
  } catch {
    return 'UTC';
  }
}

/** The member's today, as the YYYY-MM-DD key the streak helpers expect. */
export async function getMemberToday(): Promise<string> {
  return dayKeyInZone(await getMemberTimeZone());
}
