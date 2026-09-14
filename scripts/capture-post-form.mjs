import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const root = '.claude/recon/shots/post-form', output = `${root}/${phase}`;
await fs.mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = async paths => Object.fromEntries(await Promise.all(paths.map(async name => [name, hash(await fs.readFile(name))])));
const files = ['components/lead/PostForm.tsx', 'components/lead/WhoIsFree.tsx'];
const sources = await digest(files);
const instrument = await digest(['scripts/capture-post-form.mjs', 'scripts/serve-browser-fixture.mjs', ...(await fs.readdir('tests/browser/fixture')).sort().map(name => `tests/browser/fixture/${name}`)]);
if (phase === 'before') {
  await fs.writeFile(`${root}/instrument.json`, JSON.stringify(instrument, null, 2));
  for (const file of files) await fs.copyFile(file, `${root}/${file.split('/').at(-1)}.before`);
} else if (JSON.stringify(instrument) !== JSON.stringify(JSON.parse(await fs.readFile(`${root}/instrument.json`, 'utf8')))) throw new Error('Capture instrument changed since baseline');
const browser = await chromium.launch();
const captures = [], errors = [], blocked = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, timezoneId: 'America/Denver', reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const r = route.request();
      if (new URL(r.url()).origin === 'http://127.0.0.1:3100' && ['GET', 'HEAD'].includes(r.method())) return route.continue();
      blocked.push(r.url()); return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-14T18:00:00Z'));
    const family = page.getByTestId('post-family');
    const open = async form => {
      await page.goto(`http://127.0.0.1:3100/post.html?form=${form}&shell=1`, { waitUntil: 'networkidle' });
      await family.getByLabel('What', { exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    const capture = async (name, target) => {
      await target.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(400);
      const metrics = await family.evaluate(root => {
        const visible = el => el.getClientRects().length && getComputedStyle(el).visibility === 'visible';
        const targets = [...root.querySelectorAll('button,a[href],input,textarea')].filter(visible).map(el => {
          const hit = el.matches('input[type="checkbox"]') ? el.closest('label') || el : el;
          const r = hit.getBoundingClientRect();
          return { label: el.getAttribute('aria-label') || el.id || el.textContent.trim(), width: r.width, height: r.height, font: getComputedStyle(el).fontSize };
        });
        const smallText = [...root.querySelectorAll('*')].filter(el => visible(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 13).map(el => ({ text: el.textContent.trim(), size: getComputedStyle(el).fontSize }));
        return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, targets, smallTargets: targets.filter(t => t.width < 43.99 || t.height < 43.99), smallText,
          fonts: [...document.fonts].map(({ family, status, weight }) => ({ family, status, weight })) };
      });
      const filename = `${width}-${name}.png`;
      const bytes = await page.screenshot({ path: `${output}/${filename}` });
      captures.push({ filename, sha256: hash(bytes), ...metrics });
      console.log(JSON.stringify({ filename, smallTargets: metrics.smallTargets.length, smallText: metrics.smallText.length }));
    };
    await open('create');
    await capture('overview', family.getByLabel('When', { exact: true }));
    await family.getByRole('button', { name: /^More/ }).click();
    await capture('more', family.getByLabel('Ends (optional)', { exact: true }));
    await family.getByRole('button', { name: /^From the Word/ }).click();
    await capture('word', family.getByLabel('Passage', { exact: true }));
    await open('series');
    await capture('series', family.getByRole('button', { name: 'This and the following ones', exact: true }));
    await context.close();
  }
} finally {
  await browser.close();
  const sourcesUnchanged = JSON.stringify(sources) === JSON.stringify(await digest(files));
  await fs.writeFile(`${output}/measurements.json`, JSON.stringify({ phase, recordedAt: new Date().toISOString(), scope: 'Actual PostForm + WhoIsFree with synthetic data/services and navigation intents. No auth, RSC, persistence or notifications.', instrument, sources, sourcesUnchanged, captures, errors, blocked }, null, 2));
  if (errors.length || blocked.length || !sourcesUnchanged) process.exitCode = 1;
}
