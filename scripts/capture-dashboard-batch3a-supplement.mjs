import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

// After-only detail evidence. This does not replace the frozen comparison.
const output = '.claude/recon/shots/dashboard-batch3a/supplement';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
const blocked = [], captures = [];
await context.route('**/*', route => {
  const r = route.request();
  if (new URL(r.url()).origin === 'http://127.0.0.1:3100' && ['GET', 'HEAD'].includes(r.method())) return route.continue();
  blocked.push(r.method() + ' ' + new URL(r.url()).pathname);
  return route.abort('blockedbyclient');
});
const page = await context.newPage();
async function shot(name, locator) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const bytes = await page.screenshot({ path: `${output}/${name}.png` });
  captures.push({ name, sha256: createHash('sha256').update(bytes).digest('hex'), scrollY: await page.evaluate(() => scrollY) });
}
try {
  await page.goto('http://127.0.0.1:3100/?case=availability&shell=1&route=%2Fdashboard%2Favailability', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await shot('390-weekly-grid', page.getByRole('button', { name: 'Thu Morning not free', exact: true }));
  await page.goto('http://127.0.0.1:3100/?case=settings&shell=1&route=%2Fdashboard%2Fsettings', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const feedback = page.getByLabel('Your feedback', { exact: true });
  await shot('390-feedback-controls', feedback);
  // Real Tab from the textarea lands on its submit button; no action is sent.
  await feedback.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Send feedback', exact: true })).toHaveCSS('outline-color', 'rgb(201, 165, 72)');
  await shot('390-feedback-keyboard', page.getByRole('button', { name: 'Send feedback', exact: true }));
  const fonts = await (await page.request.get('http://127.0.0.1:3100/fixture-fonts.json')).json();
  await fs.writeFile(`${output}/measurements.json`, JSON.stringify({ scope: 'After-only phone detail views, synthetic services, real local fonts.', captures, blocked, fonts }, null, 2));
} finally { await browser.close(); }
if (blocked.length) process.exitCode = 1;
