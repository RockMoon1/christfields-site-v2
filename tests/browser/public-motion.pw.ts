import { expect, test, type Page } from '@playwright/test';

// The public dev server is already owned by the implementation session.
// Do not start another server or point these tests at the live site.
test.use({ baseURL: 'http://127.0.0.1:3000' });
test.setTimeout(60_000);
test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview();
});

test.beforeEach(async ({ page }) => {
  // Verification never submits a prayer, form, notification, or server action.
  await page.route('**/*', (route) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.abort();
    return route.continue();
  });
});

test('marketing Button keeps client navigation, Enter activation and native modified-click navigation', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expectNativeScrolling(page);
  await page.evaluate(() => { document.documentElement.dataset.navigationFixture = 'preserved'; });
  const destination = page.getByRole('link', { name: /Discover ScholarFlow/i });
  const newTab = context.waitForEvent('page');
  await destination.click({ modifiers: ['Control'] });
  const opened = await newTab;
  await opened.waitForURL('**/scholarflow');
  await opened.close();
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await destination.click();
  await expect(page).toHaveURL('http://127.0.0.1:3000/scholarflow');
  await expect(page.locator('html')).toHaveAttribute('data-navigation-fixture', 'preserved');
  await page.goBack();
  await destination.focus();
  await destination.press('Enter');
  await expect(page).toHaveURL('http://127.0.0.1:3000/scholarflow');
  await expect(page.locator('html')).toHaveAttribute('data-navigation-fixture', 'preserved');
});

async function expectNativeScrolling(page: Page) {
  await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
}

async function expectVisibleReducedEntrances(page: Page) {
  // Only repaired shared wrappers are asserted here. This intentionally does
  // not certify unreviewed animations elsewhere in the public composition.
  await expect.poll(() => page.locator('[data-motion-reveal], [data-motion-token]').evaluateAll((nodes) =>
    nodes.filter((node) => {
      const style = getComputedStyle(node);
      if (style.display === 'none') return false;
      return style.opacity !== '1' || style.clipPath !== 'none' || style.filter !== 'none' || style.transform !== 'none';
    }).map((node) => `${node.tagName}.${node.className}`),
  )).toEqual([]);
}

test('normal-motion projects heading enters its visible clipping window', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  // Wait for mount effects before scrolling; the initial scroll reset may
  // otherwise overwrite a very early test scroll on a fast production build.
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  await page.evaluate(() => document.getElementById('projects')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
  const heading = page.locator('#projects h2');
  await expect(heading).toHaveText('The whole field.');
  // toBeVisible alone does not detect text translated out of overflow:hidden.
  await expect.poll(() => heading.evaluate((node) => {
    const headingRect = node.getBoundingClientRect();
    const maskRect = node.parentElement!.getBoundingClientRect();
    return Math.max(0, Math.min(headingRect.bottom, maskRect.bottom) - Math.max(headingRect.top, maskRect.top)) / headingRect.height;
  })).toBeGreaterThan(0.99);
  await expect(heading).toHaveCSS('transform', 'none');
});

test('initial reduced motion uses native scrolling and immediately readable shared entrances', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expectNativeScrolling(page);
  await expectVisibleReducedEntrances(page);
  await expect(page.locator('#projects').getByRole('heading', { name: 'FaithFlow', exact: true })).toBeVisible();

  const logo = page.locator('.logo-fire-wrap').first();
  const before = await logo.evaluate((node) => ({ filter: getComputedStyle(node).filter, opacity: getComputedStyle(node).opacity }));
  await page.waitForTimeout(400);
  expect(await logo.evaluate((node) => ({ filter: getComputedStyle(node).filter, opacity: getComputedStyle(node).opacity }))).toEqual(before);
});

test('changing reduced motion live removes Lenis and preserves an unsent draft', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  const email = page.getByLabel('Your email address', { exact: true });
  await email.fill('motion-test@example.invalid');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectNativeScrolling(page);
  await expectVisibleReducedEntrances(page);
  await expect(email).toHaveValue('motion-test@example.invalid');
  await expect(email).toHaveCSS('font-size', '16px');
  await expect(email).toHaveCSS('color-scheme', 'dark');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  await expect(email).toHaveValue('motion-test@example.invalid');
});

for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1024 }, { width: 390, height: 400 }]) {
  test(`menu contains focus and restores it on Escape at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Open menu', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Menu', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link').first()).toBeFocused();

    for (let index = 0; index < 10; index += 1) {
      await page.keyboard.press('Tab');
      await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }
    for (let index = 0; index < 10; index += 1) {
      await page.keyboard.press('Shift+Tab');
      await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });
}

test('short menus scroll internally and a section link moves focus to its destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 400 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu', exact: true });
  expect(await dialog.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  await dialog.getByRole('link', { name: 'Join the Journey', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/#join$/);
  await expect(page.locator('#join')).toBeFocused();
  await expect(page.getByLabel('Your email address', { exact: true })).toBeVisible();
});

test('resizing an open tablet menu releases its modal state', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1024 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu', exact: true });
  await expect(dialog).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'FaithFlow', exact: true })).toBeVisible();
});

test('keyboard focus holds the desktop navigation in view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  const link = navigation.getByRole('link', { name: 'FaithFlow', exact: true });
  await link.focus();
  await page.evaluate(() => window.scrollTo({ top: 650, behavior: 'instant' }));
  await expect(link).toBeFocused();
  await expect.poll(() => navigation.evaluate((node) => node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
});

test('field links expose their focus ring and hairline to keyboard users', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const field = page.locator('#projects a[href="/faithflow"]');
  await field.focus();
  await expect(field).toBeFocused();
  await expect(field).toHaveCSS('outline-style', 'solid');
  await expect(field).toHaveCSS('outline-width', '2px');
  await expect(field.locator('[aria-hidden][class*="via-gold-lt"]')).toHaveCSS('opacity', '1');
});

test('ScholarFlow preview fills have fixed layout widths and static reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/scholarflow');
  await expectNativeScrolling(page);
  const bars = page.locator('[data-preview-fill]');
  await expect(bars).toHaveCount(3);
  const before = await bars.evaluateAll((nodes) => nodes.map((node) => ({ width: getComputedStyle(node).width, transform: getComputedStyle(node).transform })));
  await page.waitForTimeout(400);
  expect(await bars.evaluateAll((nodes) => nodes.map((node) => ({ width: getComputedStyle(node).width, transform: getComputedStyle(node).transform })))).toEqual(before);
  expect(before.every((bar) => bar.transform === 'none')).toBe(true);
});
