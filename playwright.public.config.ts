import { defineConfig } from '@playwright/test';

// Public-page verification uses the preview explicitly owned by this session.
// No automatic server startup: a missing preview must fail the health guard.
export default defineConfig({
  testDir: './tests/browser',
  testMatch: ['public-motion.pw.ts', 'journey-images.pw.ts', 'public-batch2.pw.ts',
    'faithflow-preview.pw.ts', 'scripture-band.pw.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  outputDir: '.claude/recon/verification/public-browser-results',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
