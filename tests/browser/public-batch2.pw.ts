import { expect, test, type Page } from '@playwright/test';

test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview();
});
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())
    ? route.continue() : route.abort());
});

const titles = ['A quiet yes.', 'You start to grow.', 'Roots grow down.', 'You bear fruit.'];
const stages = ['seed', 'sprout', 'roots', 'fruit'];

async function expectLinearReading(page: Page) {
  await expect(page.locator('#walk')).toHaveAttribute('data-journey-layout', 'linear');
  for (let index = 0; index < 4; index++) {
    const scene = page.locator(`[data-journey-scene="${stages[index]}"]`);
    await scene.scrollIntoViewIfNeeded();
    await expect(scene.getByRole('heading', { name: titles[index], exact: true })).toBeVisible();
    await expect(scene).toHaveCSS('opacity', '1');
    await expect(scene).toHaveCSS('position', 'static');
    await expect(scene).toHaveCSS('transform', 'none');
    await expect.poll(() => scene.locator('img').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await scene.locator('p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(13);
  }
  const bounds = await page.locator('[data-journey-scene]').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom };
  }));
  for (let i = 1; i < bounds.length; i++) expect(bounds[i].top).toBeGreaterThanOrEqual(bounds[i - 1].bottom);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('desktop shows every growth season within a four-viewport track', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  await expect(page.locator('#walk')).toHaveAttribute('data-journey-layout', 'pinned');
  const geometry = await page.locator('#walk').evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { top: rect.top + scrollY, height: rect.height, viewport: innerHeight };
  });
  expect(geometry.height).toBeLessThanOrEqual(geometry.viewport * 4);
  for (let index = 0; index < 4; index++) {
    const fraction = [0.1, 0.3, 0.55, 0.8][index];
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), geometry.top + (geometry.height - geometry.viewport) * fraction);
    const scene = page.locator(`[data-journey-scene="${stages[index]}"]`);
    await expect(scene).toHaveCSS('opacity', '1');
    await expect(scene.getByRole('heading', { name: titles[index], exact: true })).toBeInViewport({ ratio: 1 });
    await expect(scene.locator('img')).toBeInViewport({ ratio: 1 });
    await expect.poll(() => scene.locator('img').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await scene.locator('p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(13);
  }
  // A live OS preference change must restore all content, not leave the last
  // pinned panel as the only visible passage.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectLinearReading(page);
  // Lenis 1.3.23 schedules a 400ms native-scroll reset. Check beyond that
  // window so a class restored after destruction cannot pass by timing luck.
  await page.waitForTimeout(550);
  await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
  expect(await page.evaluate(() => {
    const wheel = new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true });
    document.body.dispatchEvent(wheel);
    return wheel.defaultPrevented;
  })).toBe(false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#walk')).toHaveAttribute('data-journey-layout', 'pinned');
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
});

test('phones, tablet, short screens and zoom-equivalent widths use ordinary reading flow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  for (const size of [{ width: 390, height: 844 }, { width: 768, height: 1024 },
    { width: 1280, height: 700 }, { width: 320, height: 844 }, { width: 640, height: 450 },
    { width: 820, height: 600 }]) {
    await page.setViewportSize(size);
    await expectLinearReading(page);
  }
});

test('the practice rail has a visible inset keyboard ring beyond its edge fade', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const rail = page.locator('#practices .overflow-x-auto');
  await rail.scrollIntoViewIfNeeded();
  // Enter from the preceding focusable element with Tab, using the browser's
  // native scroll-container focusability, not a synthetic tabindex mutation.
  await rail.evaluate(node => {
    const candidates = [...document.querySelectorAll<HTMLElement>('a[href],button,input,textarea,summary,[tabindex]')]
      .filter(el => el.tabIndex >= 0 && el.getBoundingClientRect().height > 0
        && Boolean(el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
    candidates.at(-1)?.focus();
  });
  for (let attempt = 0; attempt < 8 && !(await rail.evaluate(node => node === document.activeElement)); attempt++) {
    await page.keyboard.press('Tab');
  }
  await expect(rail).toBeFocused();
  expect(await rail.evaluate(node => node.matches(':focus-visible'))).toBe(true);
  await expect(rail).toHaveCSS('outline-style', 'solid');
  await expect(rail).toHaveCSS('outline-width', '2px');
  await expect(rail).toHaveCSS('outline-offset', '-28px');
  expect(await rail.locator('..').evaluate(node => getComputedStyle(node).maskImage)).toContain('24px');
  await rail.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.claude/recon/verification/batch2-practice-focus-390.png' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(rail).toBeFocused();
  await rail.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.claude/recon/verification/batch2-practice-focus-1280.png' });
});
