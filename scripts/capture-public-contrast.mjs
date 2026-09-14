import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { assertLocalPreview } from './lib/local-preview-health.mjs';

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after.');
await assertLocalPreview();
const output = path.resolve('.claude/recon/shots/public-contrast', phase);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
const errors = [];
const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
const luminance = (v) => v.map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
const round = (n) => Math.round(n * 1000) / 1000;

async function readPixels(buffer, clip) {
  const { data, info } = await sharp(buffer).extract(clip).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, channels: info.channels };
}

async function captureLabel(page, label, identity, width) {
  await label.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
  await page.waitForTimeout(900);
  const meta = await label.evaluate((el) => {
    const style = getComputedStyle(el);
    const range = document.createRange(); range.selectNodeContents(el);
    const textBox = range.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const ancestors = [];
    for (let node = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.opacity !== '1' || s.maskImage !== 'none' || s.filter !== 'none' || s.mixBlendMode !== 'normal') {
        ancestors.push({ tag: node.tagName, className: String(node.className), opacity: s.opacity, maskImage: s.maskImage, filter: s.filter, mixBlendMode: s.mixBlendMode });
      }
    }
    return {
      text: el.textContent.trim(), color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight,
      fontFamily: style.fontFamily, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing,
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      textBox: { x: textBox.x, y: textBox.y, width: textBox.width, height: textBox.height },
      ancestors, scrollX: window.scrollX, scrollY: window.scrollY,
      railScrollLeft: el.closest('[data-practice]')?.parentElement?.parentElement?.scrollLeft ?? null,
      documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, viewportHeight: innerHeight,
      backgroundColor: style.backgroundColor,
      fontsLoaded: document.fonts.status,
      interLoaded: [...document.fonts].some((face) => face.family.replaceAll('"', '').toLowerCase() === 'inter' && face.status === 'loaded'),
    };
  });
  const b = meta.textBox;
  if (b.x < 0 || b.y < 0 || b.x + b.width > width || b.y + b.height > meta.viewportHeight) {
    throw new Error(`${identity} not fully in viewport: ${JSON.stringify(b)}`);
  }
  const pixelClip = { left: Math.ceil(b.x) + 1, top: Math.ceil(b.y) + 1, width: Math.max(1, Math.floor(b.width) - 3), height: Math.max(1, Math.floor(b.height) - 3) };
  const original = await label.getAttribute('style');
  const actual = await page.screenshot({ path: path.join(output, `${width}-${identity}.png`), animations: 'disabled' });
  const samples = {};
  try {
    for (const [name, background] of [['background', null], ['black', 'rgb(0,0,0)'], ['white', 'rgb(255,255,255)']]) {
      await label.evaluate((el, background) => {
        el.style.setProperty('color', 'transparent', 'important');
        el.style.setProperty('text-shadow', 'none', 'important');
        if (background) el.style.setProperty('background-color', background, 'important');
      }, background);
      samples[name] = await readPixels(await page.screenshot({ animations: 'disabled' }), pixelClip);
    }
  } finally {
    await label.evaluate((el, original) => { if (original === null) el.removeAttribute('style'); else el.setAttribute('style', original); }, original);
  }
  const foreground = rgb(meta.color);
  let minimum = Infinity, maximum = 0, coverageMin = 1, coverageMax = 0;
  let worst = null;
  const backgrounds = new Map();
  for (let i = 0; i < samples.background.data.length; i += samples.background.channels) {
    const bg = Array.from(samples.background.data.subarray(i, i + 3));
    const black = Array.from(samples.black.data.subarray(i, i + 3));
    const white = Array.from(samples.white.data.subarray(i, i + 3));
    const coverage = white.map((v, c) => Math.max(0, Math.min(1, (v - black[c]) / 255)));
    const effective = foreground.map((v, c) => black[c] + coverage[c] * v);
    const value = contrast(effective, bg);
    coverageMin = Math.min(coverageMin, ...coverage); coverageMax = Math.max(coverageMax, ...coverage);
    if (value < minimum) { minimum = value; worst = { background: bg, effectiveForeground: effective.map(round), coverage: coverage.map(round) }; }
    maximum = Math.max(maximum, value);
    const key = bg.join(','); backgrounds.set(key, (backgrounds.get(key) ?? 0) + 1);
  }
  const mostCommon = [...backgrounds.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
  const result = {
    identity, viewport: { width, height: meta.viewportHeight }, ...meta,
    contrast: { minimum: round(minimum), maximum: round(maximum), nominalAgainstMostCommonBackground: round(contrast(foreground, mostCommon)), required: 4.5 },
    coverage: { minimum: round(coverageMin), maximum: round(coverageMax) }, worst,
    mostCommonBackground: mostCommon, sampledPixels: pixelClip.width * pixelClip.height,
    screenshot: `${width}-${identity}.png`, pixelClip,
  };
  results.push(result);
  console.log(JSON.stringify({ width, identity, fontSize: meta.fontSize, contrast: result.contrast.minimum, coverage: result.coverage.minimum }));
  return actual;
}

try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await context.route('**/*', (route) => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push({ width, message: e.message }));
    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle', timeout: 90_000 });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
    await page.waitForTimeout(1200);
    const practices = page.locator('#practices [data-practice]');
    await expect(practices).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const card = practices.nth(i);
      await card.evaluate((el) => {
        const rail = el.parentElement.parentElement;
        rail.scrollTo({ left: Math.max(0, el.parentElement.offsetLeft - 28), behavior: 'instant' });
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      });
      await captureLabel(page, card.locator('p').last(), `practice-${i + 1}`, width);
    }
    const day = page.locator('#day p[style*="color"]');
    await expect(day).toHaveCount(6);
    for (let i = 0; i < 6; i++) await captureLabel(page, day.nth(i), `day-${i + 1}`, width);
    const hint = page.locator('#practices span').filter({ hasText: /^Scroll/ }).last();
    await captureLabel(page, hint, 'scroll-hint', width);
    await context.close();
  }
} finally {
  await browser.close();
  const report = {
    phase, generatedAt: new Date().toISOString(), sourceUrl: 'http://127.0.0.1:3000/', browser: 'Playwright Chromium', actualSite: true,
    method: 'Loaded actual Next page, waited for document.fonts.ready and hydration/native reduced-motion state. Each label was scrolled fully into the viewport and allowed to settle. Original screenshot records appearance. Text was temporarily transparent to sample the actual composited background. Black and white backgrounds were painted on that same label in successive screenshots, with transparent text, then original inline style restored. Per-channel white-minus-black divided by255 estimates inherited mask/opacity coverage. Effective opaque foreground equals black endpoint plus coverage times computed foreground. Reported min/max sample across the inset text-range rectangle, including gradients and mask variation. No source files or server data are changed.',
    limitations: ['Raster values are quantized to8-bit sRGB; values near a threshold need margin.', 'This measures intended opaque text color, not antialiased edge pixels.', 'Sampling includes the text range rectangle, not only glyph interiors; conservative minimum can come from inter-character space.', 'Reduced-motion settled screenshots do not certify every animation state or hover spotlight position.', 'Synthetic black/white calibration assumes ordinary source-over painting; ancestor filters and blend modes are recorded for inspection. Unhandled effects invalidate exact interpretation.', 'Authenticated dashboard and physical phone/browser differences are out of scope.'],
    errors, results,
  };
  await fs.writeFile(path.join(output, 'measurements.json'), JSON.stringify(report, null, 2) + '\n');
}
if (phase === 'after') {
  if (results.length !== 24 || errors.length) throw new Error('Capture incomplete or browser errors recorded.');
  for (const result of results) {
    if (result.contrast.minimum < 4.5 || result.coverage.minimum < 0.99) throw new Error(`${result.identity} fails contrast or settled opacity/mask coverage.`);
    if (result.fontSize !== (result.identity === 'scroll-hint' ? '14px' : '13px')) throw new Error(`${result.identity} unexpected label size.`);
    if (!result.interLoaded || result.documentWidth > result.viewport.width) throw new Error(`${result.identity} font unavailable or document overflow.`);
  }
}
