import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

/**
 * Security headers applied to EVERY response (static and dynamic/SSR) via
 * Next's headers(). They live here, not in netlify.toml, because Netlify's
 * [[headers]] do not reliably reach the Next plugin's function (SSR) responses,
 * which left the authenticated dashboard with no headers. headers() covers it.
 *
 * The CSP allowlists only the third parties this app actually uses:
 *   - Clerk: auth UI + Frontend API + avatars. Allowed on the dev domain
 *     (*.clerk.accounts.dev), clerk.com, and our own subdomain (in case a
 *     custom Clerk domain like clerk.christfields2717.com is used), plus
 *     clerk-telemetry.com and Cloudflare Turnstile (Clerk bot check).
 *   - Supabase: REST + realtime websocket (*.supabase.co / wss).
 *   - Google Fonts (defensive; next/font self-hosts, so usually 'self').
 * 'unsafe-inline' stays in script-src because Next emits inline hydration
 * scripts without nonces; moving to nonces is a later hardening pass.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://*.christfields2717.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.christfields2717.com https://clerk-telemetry.com https://*.supabase.co wss://*.supabase.co",
  "img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const permissionsPolicy =
  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=(), ambient-light-sensor=(), bluetooth=(), serial=(), hid=(), nfc=(), screen-wake-lock=(), xr-spatial-tracking=(), browsing-topics=(), join-ad-interest-group=(), run-ad-auction=(), attribution-reporting=(), private-aggregation=(), shared-storage=(), shared-storage-select-url=(), identity-credentials-get=()';

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: permissionsPolicy },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // node-ical (calendar feed parsing) is server-only; keep it out of the client
  // bundle and let it load from node_modules at runtime.
  serverExternalPackages: ['node-ical'],
  // Treat .mdx files as page extensions so journal posts can sit anywhere in app/.
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  webpack: (config, { dev }) => {
    // The B: drive on Windows blocks webpack from renaming its filesystem
    // cache packs, which produces noisy EPERM warnings during dev. Use an
    // in-memory cache in dev mode to avoid that. Production builds still
    // use the default fast filesystem cache.
    if (dev) {
      config.cache = { type: 'memory' };
    }
    return config;
  },
};

const withMDX = createMDX({
  // MDX options happen later in mdx-components.tsx and lib/journal.ts.
});

export default withMDX(nextConfig);
