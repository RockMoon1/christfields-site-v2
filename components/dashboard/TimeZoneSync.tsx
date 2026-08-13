'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TZ_COOKIE } from '@/lib/dashboard/timezone';

/**
 * Tells the server which day the member is actually living in.
 *
 * Writes the browser's IANA timezone to a cookie so server components and
 * actions can decide "today" the way the member would. Runs once per load,
 * only writing when the value changed, so travelling or moving zones corrects
 * itself on the next page view. Renders nothing.
 *
 * Not marked Secure so it still works on http://localhost during development;
 * it holds a timezone name, which is not sensitive, and Lax keeps it off
 * cross-site requests.
 */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const current = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${TZ_COOKIE}=`))
        ?.split('=')[1];
      if (current === encodeURIComponent(tz)) return;

      const hadNone = current === undefined;
      document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
      // The very first render happened before this cookie existed, so it used
      // UTC. Refresh once so the member's real day is what they see. Only on
      // the first ever visit, and only when the cookie actually took, so this
      // can never become a loop.
      if (hadNone && document.cookie.includes(`${TZ_COOKIE}=`)) router.refresh();
    } catch {
      // No timezone available: the server keeps using UTC, as before.
    }
  }, [router]);

  return null;
}
