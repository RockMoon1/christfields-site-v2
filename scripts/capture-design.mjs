import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { assertLocalPreview } from './lib/local-preview-health.mjs';

const phase = process.argv[2] ?? 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after.');
const origin = process.env.DESIGN_BASE_URL ?? 'http://127.0.0.1:3000';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Local review only.');
await assertLocalPreview(origin);
const dir = `.claude/recon/shots/${phase}`;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [390, 768, 1280, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: width < 1000 ? 844 : 900 }, serviceWorkers: 'block' });
    // Never send member actions, forms, or notifications during visual review.
    await page.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
    for (const path of ['/', '/faithflow', '/scholarflow', '/journal/iron-and-ember-our-community']) {
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1800);
      const slug = path === '/' ? 'home' : path.split('/').filter(Boolean).join('-');
      await page.screenshot({ path: `${dir}/${slug}-${width}.png` });
      results.push({ path, width, title: await page.title(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
      if (width === 390 || width === 1280) {
        const selectors = path === '/' ? ['#vision', '#projects', '#walk', '#join'] : path === '/faithflow' ? ['#dashboard'] : [];
        for (const selector of selectors) {
          const region = page.locator(selector);
          if (!await region.count()) continue;
          await region.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1100);
          await page.screenshot({ path: `${dir}/${slug}-${selector.slice(1)}-${width}.png` });
        }
      }
    }
    await page.close();
  }
  await writeFile(`${dir}/capture.json`, JSON.stringify({ phase, capturedAt: new Date().toISOString(), origin, results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
