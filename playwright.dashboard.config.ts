import { defineConfig } from '@playwright/test';

// Run against the explicitly started synthetic fixture. This config never
// starts, stops, or reuses the public Next.js server and never reads app env.
export default defineConfig({
  testDir: './tests/browser',
  testMatch: ['dashboard-repairs.pw.ts', 'dashboard-verification.pw.ts', 'prayer-wall.pw.ts', 'member-event.pw.ts', 'leader-event.pw.ts', 'post-form.pw.ts'],
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3100', reducedMotion: 'reduce', serviceWorkers: 'block' },
  outputDir: 'test-results/dashboard',
});
