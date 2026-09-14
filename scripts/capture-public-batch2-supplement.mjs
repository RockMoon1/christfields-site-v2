import { chromium } from '@playwright/test';
import { assertLocalPreview } from './lib/local-preview-health.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// After-only framing and metrics, separate from the frozen comparison script.
// Real viewport screenshots; no header hiding or stylesheet overrides.
await assertLocalPreview();
const output = '.claude/recon/shots/public-batch2/supplement';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
const captures = [];
const measurements = [];
async function ready(route) {
  await assertLocalPreview();
  await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Let the site's initial route/hash scroll finish before choosing framing.
  await page.waitForTimeout(1400);
}
async function shot(name, purpose) {
  await page.waitForTimeout(300);
  const bytes = await page.screenshot({ path: `${output}/${name}.png` });
  const previewBounds = await page.locator('[data-dashboard-preview]').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom };
  }));
  captures.push({ name, purpose, viewport: page.viewportSize(), previewBounds, sha256: createHash('sha256').update(bytes).digest('hex') });
}
async function textMetrics(selector, surface) {
  const rows = await page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    let background = 'transparent';
    let ancestor = node;
    let opacity = 1;
    let masked = false;
    while (ancestor) {
      const computed = getComputedStyle(ancestor);
      opacity *= Number(computed.opacity);
      masked ||= computed.maskImage !== 'none';
      if (background === 'transparent' && /^rgb\(/.test(computed.backgroundColor)) background = computed.backgroundColor;
      ancestor = ancestor.parentElement;
    }
    return { text: node.textContent.trim(), color: style.color, background, fontSize: parseFloat(style.fontSize), fontWeight: style.fontWeight, opacity, masked };
  }));
  const luminance = color => {
    const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => v / 255)
      .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  for (const row of rows) {
    if (row.background === 'transparent') throw new Error('No opaque background found');
    const a = luminance(row.color), b = luminance(row.background);
    row.contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    // This bounded check covers small, settled text on solid surfaces only.
    if (row.opacity !== 1 || row.masked || row.contrast < 4.5 || row.fontSize < 13) throw new Error(`Unreadable settled text: ${row.text}`);
  }
  measurements.push({ surface, rows });
}
try {
  await ready('/faithflow#dashboard');
  const preview = page.locator('[data-dashboard-preview]');
  await preview.evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - 108, behavior: 'instant' }));
  await page.waitForFunction(() => Math.abs(document.querySelector('[data-dashboard-preview]').getBoundingClientRect().top - 108) < 3);
  await shot('390-preview-top', 'Phone upper preview beneath the visible fixed navigation; normal 390x844 viewport.');
  await preview.evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().bottom + scrollY - innerHeight + 28, behavior: 'instant' }));
  await shot('390-preview-bottom', 'Phone lower preview, completing the portion outside the upper viewport.');
  await preview.locator('summary').filter({ hasText: 'Scripture in this example' }).click();
  await preview.locator('details').last().evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - 110, behavior: 'instant' }));
  await shot('390-preview-scripture', 'Native disclosure retaining both existing quotations; no edition verification claim.');
  await textMetrics('[data-dashboard-preview] [class*="text-meta"]', 'FaithFlow preview metadata');
  for (const route of ['/', '/faithflow', '/scholarflow']) {
    await ready(route);
    await textMetrics('[data-scripture-band] figcaption', `${route} band references`);
  }
  await ready('/#walk');
  await textMetrics('[data-journey-scene] p:first-child, [data-journey-scene] .text-meta', 'Linear growth eyebrows');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator('[data-journey-scene="sprout"]').scrollIntoViewIfNeeded();
  await shot('768-growth', 'Tablet ordinary reading layout; actual 768x1024 viewport.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForSelector('#walk[data-journey-layout="pinned"]');
  await page.locator('#walk').evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY + (node.getBoundingClientRect().height - innerHeight) * 0.55, behavior: 'instant' }));
  await page.waitForTimeout(1200);
  await shot('1920-growth', 'Wide desktop pinned growth stage 3.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready('/faithflow#dashboard');
  await page.locator('#dashboard').evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - 80, behavior: 'instant' }));
  await shot('1920-faithflow', 'Wide desktop public preview and corrected surrounding claims.');
} finally {
  await writeFile(`${output}/capture.json`, JSON.stringify({ buildId: (await readFile('.next/BUILD_ID', 'utf8')).trim(), browserVersion: browser.version(), capturedAt: new Date().toISOString(), captures, measurements, errors,
    limitations: ['After-only supplement; not part of frozen before/after comparison.', 'No page style changes or automatic pixel-diff approval.', 'Contrast calculations use browser-computed settled colors over nearest opaque background; restricted to these unmasked solid surfaces.', '640x450 layout test elsewhere approximates 200% desktop zoom reflow; actual browser zoom and physical iOS were not verified.'] }, null, 2) + '\n');
  await browser.close();
}
if (errors.length) throw new Error('Supplement recorded browser errors');
