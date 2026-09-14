import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assertLocalPreview } from './lib/local-preview-health.mjs';

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after.');
const root = '.claude/recon/shots/prayer-wall';
const output = `${root}/${phase}`;
const origin = 'http://127.0.0.1:3100';
await assertLocalPreview(origin);
await fs.mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const self = fileURLToPath(import.meta.url);
const paths = ['components/dashboard/CommunityWall.tsx', 'app/dashboard/(app)/community/page.tsx'];
const hashes = async () => Object.fromEntries(await Promise.all(paths.map(async name => [name, hash(await fs.readFile(name))])));
const sources = await hashes();
const fixtureFiles = (await fs.readdir('tests/browser/fixture', { withFileTypes: true })).filter(f => f.isFile()).map(f => f.name).sort();
const instrument = {
  script: hash(await fs.readFile(self)),
  fixture: Object.fromEntries(await Promise.all(fixtureFiles.map(async f => [f, hash(await fs.readFile(`tests/browser/fixture/${f}`))]))),
  server: hash(await fs.readFile('scripts/serve-browser-fixture.mjs')),
};
let previous;
try { previous = JSON.parse(await fs.readFile(`${root}/instrument.json`, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
if (previous && JSON.stringify(previous) !== JSON.stringify(instrument)) throw new Error('Capture instrument changed. Establish an explicit new baseline.');
if (!previous) {
  if (phase !== 'before') throw new Error('Before evidence required.');
  await fs.writeFile(`${root}/instrument.json`, JSON.stringify(instrument, null, 2));
  await fs.copyFile(self, `${root}/capture.frozen.mjs`);
}
const browser = await chromium.launch();
const captures = [], errors = [], blocked = [];
async function capture(page, name, target) {
  await target.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.evaluate(() => document.fonts.ready);
  // Baseline includes old opacity/list entrances; compare their settled view.
  await page.waitForTimeout(600);
  const metrics = await page.getByTestId('dashboard-family').evaluate(root => {
    const visible = element => {
      if (!element.getClientRects().length) return false;
      for (let el = element; el; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
      }
      return true;
    };
    const targets = [...root.querySelectorAll('a[href],button,input,textarea,summary')].filter(visible).map(el => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, label: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 80), width: r.width, height: r.height, fontSize: parseFloat(getComputedStyle(el).fontSize) };
    });
    const smallText = [...root.querySelectorAll('*')].filter(el => visible(el) && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 13).map(el => ({ text: el.textContent.trim().slice(0, 80), fontSize: parseFloat(getComputedStyle(el).fontSize) }));
    return { viewport: { width: innerWidth, height: innerHeight }, scrollY, documentWidth: document.documentElement.scrollWidth,
      targets, smallTargets: targets.filter(t => t.width < 43.99 || t.height < 43.99), smallText,
      inputs: [...root.querySelectorAll('input,textarea')].filter(visible).map(el => ({ fontSize: getComputedStyle(el).fontSize, colorScheme: getComputedStyle(el).colorScheme, labelCount: el.labels?.length ?? 0 })),
      fonts: [...document.fonts].map(({ family, status, weight }) => ({ family, status, weight })),
    };
  });
  const filename = `${name}.png`;
  const bytes = await page.screenshot({ path: `${output}/${filename}` });
  captures.push({ filename, sha256: hash(bytes), ...metrics });
  console.log(JSON.stringify({ filename, smallTargets: metrics.smallTargets.length, smallText: metrics.smallText.length }));
}
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const r = route.request();
      if (new URL(r.url()).origin === origin && ['GET', 'HEAD'].includes(r.method())) return route.continue();
      blocked.push({ method: r.method(), path: new URL(r.url()).pathname });
      return route.abort('blockedbyclient');
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.setFixedTime(new Date('2026-09-09T18:00:00Z'));
    const open = async variant => {
      await page.goto(`${origin}/?case=community-page&shell=1&route=%2Fdashboard%2Fcommunity&variant=${variant}`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: 'Prayer wall', exact: true }).waitFor();
    };
    await open('default');
    await capture(page, `${width}-wall`, page.locator('article').first());
    await capture(page, `${width}-author-actions`, page.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic request of mine', exact: true }) }));
    await page.getByRole('button', { name: 'Share a prayer request', exact: true }).click();
    await capture(page, `${width}-form`, page.locator('form'));
    await open('empty');
    await capture(page, `${width}-empty`, page.getByText('No requests yet.', { exact: true }));
    await context.close();
  }
} finally {
  await browser.close();
  const finalSources = await hashes();
  const report = { phase, recordedAt: new Date().toISOString(), fixedDate: '2026-09-09T18:00:00Z', scope: 'Actual prayer-page JSX with synthetic data/actions; no authenticated flow.', instrument, sources, sourcesUnchanged: JSON.stringify(sources) === JSON.stringify(finalSources), captures, errors, blocked };
  await fs.writeFile(`${output}/measurements.json`, JSON.stringify(report, null, 2));
  if (errors.length || blocked.length || !report.sourcesUnchanged) process.exitCode = 1;
}
