import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLocalPreview } from './lib/local-preview-health.mjs';

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after.');
const origin = 'http://127.0.0.1:3100';
await assertLocalPreview(origin);
const root = path.resolve('.claude/recon/shots/dashboard-batch3a');
const output = path.join(root, phase);
await fs.mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const self = fileURLToPath(import.meta.url);
const files = ['components/dashboard/YouCards.tsx', 'components/dashboard/FeedbackCard.tsx', 'components/dashboard/GoogleCards.tsx', 'components/dashboard/AvailabilityBoard.tsx', 'components/dashboard/InstallAppCard.tsx', 'app/dashboard/(app)/settings/page.tsx', 'app/dashboard/(app)/availability/page.tsx'];
const sourceHashes = async () => Object.fromEntries(await Promise.all(files.map(async file => [file, hash(await fs.readFile(file))])));
const sources = await sourceHashes();
const fixtureFiles = (await fs.readdir('tests/browser/fixture', { withFileTypes: true })).filter(entry => entry.isFile()).map(entry => entry.name).sort();
const instrument = {
  scriptSha256: hash(await fs.readFile(self)),
  fixtureFiles: Object.fromEntries(await Promise.all(fixtureFiles.map(async name => [name, hash(await fs.readFile(path.join('tests/browser/fixture', name)))]))),
  serverSha256: hash(await fs.readFile('scripts/serve-browser-fixture.mjs')),
};
const instrumentPath = path.join(root, 'instrument.json');
let frozen;
try { frozen = JSON.parse(await fs.readFile(instrumentPath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
if (frozen && JSON.stringify(frozen) !== JSON.stringify(instrument)) throw new Error('Capture/fixture instrument changed; establish an explicit new baseline.');
if (!frozen) {
  if (phase !== 'before') throw new Error('Capture before first.');
  await fs.writeFile(instrumentPath, JSON.stringify(instrument, null, 2));
  await fs.copyFile(self, path.join(root, 'capture.frozen.mjs'));
}
const browser = await chromium.launch({ headless: true });
const captures = [], errors = [], blocked = [];
async function capture(page, name, locator) {
  if (locator) await locator.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.evaluate(() => {
    const scope = document.querySelector('[data-testid="dashboard-route-shell"]') ?? document.querySelector('[data-testid="fixture-content"]');
    const visible = el => {
      const r = el.getBoundingClientRect();
      for (let node = el; node; node = node.parentElement) {
        const s = getComputedStyle(node);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
      }
      return r.width > 0 && r.height > 0;
    };
    const describe = el => ({ tag: el.tagName, label: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 100), fontSize: parseFloat(getComputedStyle(el).fontSize), inFamily: !!el.closest('[data-testid="dashboard-family"]') });
    const targets = [...scope.querySelectorAll('button,a[href],input:not([type=hidden]),textarea,select,summary,[tabindex="0"]')].filter(visible).map(el => {
      const r = el.getBoundingClientRect(); return { ...describe(el), width: r.width, height: r.height, disabled: !!el.disabled };
    });
    const text = [...scope.querySelectorAll('*')].filter(el => visible(el) && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())).map(describe);
    const inputs = [...scope.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(visible).map(el => ({ ...describe(el), id: el.id, labels: [...(el.labels ?? [])].map(label => label.textContent.trim()), colorScheme: getComputedStyle(el).colorScheme }));
    return {
      viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth,
      scrollY, targets, smallTargets: targets.filter(t => t.width < 43.99 || t.height < 43.99),
      below13px: text.filter(t => t.fontSize < 13), inputs,
      fontFamily: getComputedStyle(document.body).fontFamily,
      fonts: [...document.fonts].map(({ family, status, weight }) => ({ family, status, weight })),
    };
  });
  const filename = `${name}.png`;
  const bytes = await page.screenshot({ path: path.join(output, filename) });
  captures.push({ filename, sha256: hash(bytes), url: page.url(), ...metrics });
  console.log(JSON.stringify({ filename, smallTargets: metrics.smallTargets.length, below13px: metrics.below13px.length }));
}
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin === origin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
      blocked.push({ method: request.method(), origin: url.origin, pathname: url.pathname });
      return route.abort('blockedbyclient');
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const open = async (which, variant = '') => {
      await page.goto(`${origin}/?case=${which}&shell=1&route=${encodeURIComponent(`/dashboard/${which}`)}${variant ? `&variant=${variant}` : ''}`, { waitUntil: 'networkidle' });
      await page.getByTestId('dashboard-family').waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    await open('settings');
    await capture(page, `${width}-settings-overview`);
    await capture(page, `${width}-settings-calendar`, page.locator('input[readonly]').first());
    await capture(page, `${width}-settings-feedback`, page.getByRole('heading', { name: 'Tell us what to build next' }));
    await open('settings', 'revoked');
    await capture(page, `${width}-settings-revoked`, page.getByRole('heading', { name: 'Put our events on your Google Calendar' }));
    await open('availability');
    await capture(page, `${width}-availability-grid`);
    await page.getByRole('button', { name: 'Paste my calendar link', exact: true }).click();
    await page.getByText('Where do I find my link?', { exact: true }).click();
    await capture(page, `${width}-availability-link`, page.getByPlaceholder('https://… your private calendar link'));
    await open('availability', 'connected');
    await capture(page, `${width}-availability-connected`, page.getByRole('button', { name: 'Check again', exact: true }));
    await context.close();
  }
} finally {
  await browser.close();
  const finalSources = await sourceHashes();
  const report = { phase, recordedAt: new Date().toISOString(), node: process.version, scope: 'Synthetic settings/availability fixtures. No authenticated verification.', instrument, sources, sourcesUnchanged: JSON.stringify(sources) === JSON.stringify(finalSources), captures, errors, blocked };
  await fs.writeFile(path.join(output, 'measurements.json'), JSON.stringify(report, null, 2));
  if (errors.length || blocked.length || !report.sourcesUnchanged) process.exitCode = 1;
}
