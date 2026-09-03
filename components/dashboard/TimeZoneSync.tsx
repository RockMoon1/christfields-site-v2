'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TZ_COOKIE } from '@/lib/dashboard/timezone';
import { syncMemberTimeZone } from '@/app/dashboard/(app)/settings/actions';

/**
 * Tells the server which day the member is actually living in.
 *
 * Writes the browser IANA zone to a cookie so server components can render
 * "Thursday, 7pm" in the right zone, and stores it on member_prefs so reminders
 * sent by the hourly job (which has no cookie) land in the member's evening,
 * not the server's. Runs once per load, only when the value changed. Renders
 * nothing.
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
      void syncMemberTimeZone(tz).catch(() => undefined);
      // The very first render happened before this cookie existed, so it used
      // UTC. Refresh once so the member sees their real day. Only on the first
      // ever visit, and only when the cookie actually took, so never a loop.
      if (hadNone && document.cookie.includes(`${TZ_COOKIE}=`)) router.refresh();
    } catch {
      // No timezone available: the server keeps using UTC.
    }
  }, [router]);

  return null;
}
