import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const root = '.claude/recon/shots/leader-event', output = `${root}/${phase}`;
await fs.mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = async paths => Object.fromEntries(await Promise.all(paths.map(async name => [name, hash(await fs.readFile(name))])));
const source = 'components/lead/LeaderStrip.tsx';
const sources = await digest([source]);
const instrument = await digest(['scripts/capture-leader-event.mjs', 'scripts/serve-browser-fixture.mjs', ...(await fs.readdir('tests/browser/fixture')).sort().map(name => `tests/browser/fixture/${name}`)]);
if (phase === 'before') {
  await fs.writeFile(`${root}/instrument.json`, JSON.stringify(instrument, null, 2));
  await fs.copyFile(source, `${root}/LeaderStrip.before.tsx`);
} else if (JSON.stringify(instrument) !== JSON.stringify(JSON.parse(await fs.readFile(`${root}/instrument.json`, 'utf8')))) throw new Error('Capture instrument changed since baseline');
const browser = await chromium.launch();
const captures = [], errors = [], blocked = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const r = route.request();
      if (new URL(r.url()).origin === 'http://127.0.0.1:3100' && ['GET', 'HEAD'].includes(r.method())) return route.continue();
      blocked.push(r.url()); return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-14T18:00:00Z'));
    const family = page.getByTestId('leader-family');
    const open = async variant => {
      await page.goto(`http://127.0.0.1:3100/leader.html?variant=${variant}&shell=1`, { waitUntil: 'networkidle' });
      await family.getByText('You lead this', { exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    const capture = async (name, target) => {
      await target.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(400);
      const metrics = await family.evaluate(root => {
        const visible = el => el.getClientRects().length && getComputedStyle(el).visibility === 'visible';
        const targets = [...root.querySelectorAll('button,a[href],input,textarea')].filter(visible).map(el => {
          const r = el.getBoundingClientRect();
          return { label: el.getAttribute('aria-label') || el.textContent.trim(), width: r.width, height: r.height, font: getComputedStyle(el).fontSize };
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
    await open('future');
    await capture('overview', family.getByText('You lead this', { exact: true }));
    await family.getByRole('button', { name: /\d+ in$/, exact: true }).click();
    await capture('roster', family.getByText('Questions that might come up', { exact: true }));
    await family.getByRole('button', { name: 'Call it off', exact: true }).click();
    await capture('cancel', family.getByRole('button', { name: 'Yes, call it off', exact: true }));
    await open('started');
    await capture('attendance', family.getByText('Who came?', { exact: true }));
    await context.close();
  }
} finally {
  await browser.close();
  const sourcesUnchanged = JSON.stringify(sources) === JSON.stringify(await digest([source]));
  await fs.writeFile(`${output}/measurements.json`, JSON.stringify({ phase, recordedAt: new Date().toISOString(), scope: 'Actual LeaderStrip with synthetic services/refresh. No auth, RSC, notifications or real member data.', instrument, sources, sourcesUnchanged, captures, errors, blocked }, null, 2));
  if (errors.length || blocked.length || !sourcesUnchanged) process.exitCode = 1;
}
