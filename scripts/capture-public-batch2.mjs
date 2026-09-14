import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLocalPreview } from './lib/local-preview-health.mjs';

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after.');
const origin = 'http://127.0.0.1:3000';
const health = await assertLocalPreview(origin);
const root = path.resolve('.claude/recon/shots/public-batch2');
const output = path.join(root, phase);
await fs.mkdir(output, { recursive: true });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const selfPath = fileURLToPath(import.meta.url);
const helperPath = fileURLToPath(new URL('./lib/local-preview-health.mjs', import.meta.url));
const instrument = { version: 1, scriptSha256: hash(await fs.readFile(selfPath)), helperSha256: hash(await fs.readFile(helperPath)) };
const instrumentPath = path.join(root, 'instrument.json');
let frozen;
try { frozen = JSON.parse(await fs.readFile(instrumentPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (frozen && JSON.stringify(frozen) !== JSON.stringify(instrument)) throw new Error('Capture instrument changed. Record an explicit new comparison baseline before continuing.');
if (!frozen) {
  if (phase !== 'before') throw new Error('Capture the before baseline first.');
  await fs.writeFile(instrumentPath, JSON.stringify(instrument, null, 2) + '\n');
  await fs.copyFile(selfPath, path.join(root, 'capture-public-batch2.frozen.mjs'));
  await fs.copyFile(helperPath, path.join(root, 'local-preview-health.frozen.mjs'));
}
const sourcePaths = ['components/sections/JourneyScroll.tsx', 'components/motion/ScriptureMarquee.tsx', 'components/sections/faithflow/DashboardPreview.tsx', 'components/sections/DashboardInvite.tsx', 'lib/content/faithflow.ts', 'app/globals.css'];
async function sourceHashes() { return Object.fromEntries(await Promise.all(sourcePaths.map(async (file) => [file, hash(await fs.readFile(file))]))); }
const sourcesBefore = await sourceHashes();
const buildId = (await fs.readFile('.next/BUILD_ID', 'utf8')).trim();
const browser = await chromium.launch({ headless: true });
const captures = [];
const errors = [];
const blockedMutations = [];
const omissions = [];
const titles = ['A quiet yes.', 'You start to grow.', 'Roots grow down.', 'You bear fruit.'];

async function ready(page, route) {
  await assertLocalPreview(origin);
  await page.goto(origin + route, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1400);
}

async function center(locator) {
  await locator.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
}

async function capture(page, name, purpose, locator = null, extra = {}) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(950);
  const metadata = await page.evaluate(() => ({
    url: location.href, title: document.title, viewport: { width: innerWidth, height: innerHeight },
    devicePixelRatio, userAgent: navigator.userAgent, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    pointerFine: matchMedia('(pointer: fine)').matches, fontsStatus: document.fonts.status,
    fonts: [...document.fonts].map(({ family, weight, status }) => ({ family, weight, status })),
    scroll: { x: scrollX, y: scrollY }, documentWidth: document.documentElement.scrollWidth,
    journeyHeadings: [...document.querySelectorAll('#walk h3')].map((heading) => {
      const rect = heading.getBoundingClientRect();
      let opacity = 1;
      for (let node = heading; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
      return { text: heading.textContent, opacity, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
    journeyImages: [...document.querySelectorAll('#walk img')].map((image) => ({ src: image.currentSrc, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })),
  }));
  const filename = `${name}.png`;
  const bytes = locator ? await locator.screenshot({ path: path.join(output, filename) }) : await page.screenshot({ path: path.join(output, filename) });
  const item = { filename, purpose, kind: locator ? 'element-crop' : 'viewport', sha256: hash(bytes), ...metadata, ...extra };
  captures.push(item);
  console.log(JSON.stringify({ captured: filename, purpose, sha256: item.sha256 }));
}

async function journey(page, width, reduced = false) {
  await ready(page, '/#walk');
  const walk = page.locator('#walk');
  await center(walk.locator('h2'));
  await capture(page, `${width}-journey-${reduced ? 'reduced' : 'normal'}-intro`, 'Growth story heading and introductory illustration; viewport view.');
  const pinned = await walk.evaluate((section) => {
    const sticky = [...section.querySelectorAll('*')].find((node) => getComputedStyle(node).position === 'sticky');
    if (!sticky || !sticky.parentElement) return null;
    const track = sticky.parentElement.getBoundingClientRect();
    return track.height > innerHeight * 1.5 ? { top: track.top + scrollY, height: track.height, span: track.height - innerHeight } : null;
  });
  for (let index = 0; index < titles.length; index++) {
    const heading = walk.getByRole('heading', { name: titles[index], exact: true });
    const fraction = [0.1, 0.3, 0.55, 0.8][index];
    if (pinned) await page.evaluate(({ top, span, fraction }) => scrollTo({ top: top + span * fraction, behavior: 'instant' }), { ...pinned, fraction });
    else await center(heading);
    await capture(page, `${width}-journey-${reduced ? 'reduced' : 'normal'}-${index + 1}`, `Growth stage ${index + 1}: ${titles[index]} ${pinned ? 'Pinned desktop track at recorded fractional position.' : 'Ordinary stacked content centered on its heading.'}`, null, { pinned, trackFraction: pinned ? fraction : null, expectedHeading: titles[index] });
  }
}

try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'no-preference', serviceWorkers: 'block' });
    await context.route('**/*', (route) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
      blockedMutations.push({ width, method: route.request().method(), pathname: new URL(route.request().url()).pathname });
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push({ width, message: error.message }));
    await journey(page, width);
    // Static reduced-motion mode gives a second, repeatable band comparison;
    // it does not certify every normal-motion marquee frame.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [route, label] of [['/', 'home'], ['/faithflow', 'faithflow'], ['/scholarflow', 'scholarflow']]) {
      await ready(page, route);
      let band = page.locator('[data-scripture-band]').first();
      if (!await band.count()) band = page.locator('section').filter({ has: page.locator('.cf-marquee') }).first();
      if (!await band.count()) throw new Error(`Scripture band not found on ${route}`);
      await center(band);
      await capture(page, `${width}-${label}-scripture-band`, `${label} Scripture band with all existing phrase/reference wording retained; reduced-motion element crop.`, band, { distinctText: [...new Set((await band.innerText()).split('\n').map((text) => text.trim()).filter(Boolean))] });
    }
    await ready(page, '/faithflow#dashboard');
    const dashboard = page.locator('#dashboard');
    await center(dashboard);
    await capture(page, `${width}-faithflow-dashboard-section`, 'FaithFlow dashboard marketing section including surrounding claims; full element crop.', dashboard);
    let preview = dashboard.locator('[data-dashboard-preview]').first();
    if (!await preview.count()) preview = dashboard.locator('[role="tablist"]').locator('..');
    if (!await preview.count()) preview = dashboard;
    await center(preview);
    await capture(page, `${width}-faithflow-dashboard-preview`, 'Initial local illustrative preview, captured in full rather than clipped to the viewport.', preview);
    const scriptureTab = dashboard.getByRole('tab', { name: 'Scripture', exact: true });
    if (await scriptureTab.count()) {
      await scriptureTab.click();
      await capture(page, `${width}-faithflow-dashboard-scripture`, 'Existing local-only Scripture tab, recording original wording and attribution before the preview changes.', preview);
    } else omissions.push({ width, scenario: 'dashboard Scripture tab', reason: 'No Scripture tab in this preview; expected after removal of obsolete teaching UI.' });
    if (width === 1280) await journey(page, width, true);
    await context.close();
  }
} finally {
  const sourcesAfter = await sourceHashes();
  const duplicates = new Map();
  for (const item of captures) duplicates.set(item.sha256, [...(duplicates.get(item.sha256) ?? []), item.filename]);
  const duplicateGroups = [...duplicates.entries()].filter(([, files]) => files.length > 1).map(([sha256, files]) => ({ sha256, files }));
  const manifest = { phase, capturedAt: new Date().toISOString(), instrument, health, buildId, browserVersion: browser.version(), sourcesBefore, sourcesAfter, sourceStableDuringCapture: JSON.stringify(sourcesBefore) === JSON.stringify(sourcesAfter), screenshotCount: captures.length, uniqueScreenshotCount: duplicates.size, duplicateGroups, omissions, blockedMutations, errors, limitations: ['Actual public Next production preview only; no authenticated dashboard coverage.', 'Viewport PNGs and full element crops are labelled separately.', 'Normal-motion journey captures are sampled states, not exhaustive animation verification.', 'Scripture bands use reduced motion for a stable comparison; old overflow masks may still hide phrases.', 'No automated visual-diff approval is claimed. Repeated frame hashes are disclosed explicitly.'], captures };
  await fs.writeFile(path.join(output, 'capture.json'), JSON.stringify(manifest, null, 2) + '\n');
  await browser.close();
  if (!manifest.sourceStableDuringCapture) throw new Error('Source changed during capture; baseline is not stable.');
}
if (errors.length) throw new Error('Browser page errors recorded; inspect capture.json.');
