import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const root = '.claude/recon/shots/member-event', output = `${root}/${phase}`;
await fs.mkdir(output, { recursive: true });
const hash = value => createHash('sha256').update(value).digest('hex');
const sourcePaths = ['EventCard', 'GoingFaces', 'AddToCalendar', 'SlotList', 'PlanQuestion', 'Starters'].map(name => `components/dashboard/${name}.tsx`).concat('app/dashboard/(app)/e/[id]/page.tsx');
const digest = async paths => Object.fromEntries(await Promise.all(paths.map(async name => [name, hash(await fs.readFile(name))])));
const sources = await digest(sourcePaths);
const instrument = await digest(['scripts/capture-member-event.mjs', 'scripts/serve-browser-fixture.mjs', ...(await fs.readdir('tests/browser/fixture')).sort().map(name => `tests/browser/fixture/${name}`)]);
if (phase === 'before') {
  await fs.writeFile(`${root}/instrument.json`, JSON.stringify(instrument, null, 2));
  for (const name of sourcePaths) {
    const dest = `${root}/source-before/${name}`;
    await fs.mkdir(dest.slice(0, dest.lastIndexOf('/')), { recursive: true });
    await fs.copyFile(name, dest);
  }
} else if (JSON.stringify(instrument) !== JSON.stringify(JSON.parse(await fs.readFile(`${root}/instrument.json`, 'utf8')))) throw new Error('Capture instrument changed since baseline');
const browser = await chromium.launch();
const captures = [], errors = [], blocked = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const request = route.request();
      if (new URL(request.url()).origin === 'http://127.0.0.1:3100' && ['GET', 'HEAD'].includes(request.method())) return route.continue();
      blocked.push(request.url()); return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-14T18:00:00Z'));
    const open = async variant => {
      await page.goto(`http://127.0.0.1:3100/?case=event-page&shell=1&variant=${variant}&type=outing`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    const capture = async (name, target) => {
      await target.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(400);
      const metrics = await page.getByTestId('dashboard-family').evaluate(root => {
        const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
        const targets = [...root.querySelectorAll('button,a[href],input')].filter(visible).map(el => {
          const r = el.getBoundingClientRect();
          return { label: el.getAttribute('aria-label') || el.textContent.trim(), width: r.width, height: r.height, font: getComputedStyle(el).fontSize };
        });
        const smallText = [...root.querySelectorAll('*')].filter(el => visible(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 13).map(el => ({ text: el.textContent.trim(), size: getComputedStyle(el).fontSize }));
        const chip = root.querySelector('article span');
        return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, targets, smallTargets: targets.filter(t => t.width < 43.99 || t.height < 43.99), smallText,
          chip: chip && { text: chip.textContent, color: getComputedStyle(chip).color, background: getComputedStyle(chip).backgroundColor, parentBackground: getComputedStyle(root.querySelector('article')).backgroundColor },
          fonts: [...document.fonts].map(({ family, status, weight }) => ({ family, status, weight })) };
      });
      const filename = `${width}-${name}.png`;
      const bytes = await page.screenshot({ path: `${output}/${filename}` });
      captures.push({ filename, sha256: hash(bytes), ...metrics });
      console.log(JSON.stringify({ filename, smallText: metrics.smallText.length, smallTargets: metrics.smallTargets.length, chip: metrics.chip }));
    };
    await open('answered');
    await capture('event', page.locator('article'));
    await capture('planning', page.getByText('When will you head out?', { exact: true }));
    await page.getByRole('button', { name: 'I can drive', exact: true }).click();
    await capture('ride-form', page.getByText('How many seats?', { exact: true }));
    await open('cancelled');
    await capture('cancelled', page.locator('article'));
    await context.close();
  }
} finally {
  await browser.close();
  const sourcesUnchanged = JSON.stringify(sources) === JSON.stringify(await digest(sourcePaths));
  await fs.writeFile(`${output}/measurements.json`, JSON.stringify({ phase, recordedAt: new Date().toISOString(), scope: 'Actual member event JSX; synthetic services/refresh, no auth or RSC transport. Scripture and leader panels excluded.', instrument, sources, sourcesUnchanged, captures, errors, blocked }, null, 2));
  if (errors.length || blocked.length || !sourcesUnchanged) process.exitCode = 1;
}
