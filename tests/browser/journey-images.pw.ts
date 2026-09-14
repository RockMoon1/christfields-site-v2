import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:3000', reducedMotion: 'no-preference' });
test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview();
});

for (const density of [1, 2]) {
  test.describe(`growth illustrations at ${density}x pixel density`, () => {
    test.use({ deviceScaleFactor: density });

    test('all four images decode when resizing from phone to desktop and back', async ({ page }) => {
      await page.route('**/*', route =>
        ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())
          ? route.continue() : route.abort());
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');
      await expect(page.locator('html')).toHaveClass(/\blenis\b/);

      for (const width of [390, 768, 1280, 1920, 390]) {
        await page.setViewportSize({ width, height: width < 1000 ? 844 : 900 });
        // Each linear season now owns its image. Scroll all four into view so
        // native lazy loading runs; pinned layers occupy the same visible area.
        const globes = page.locator('#walk img');
        await expect(globes).toHaveCount(4);
        for (let i = 0; i < 4; i++) await globes.nth(i).scrollIntoViewIfNeeded();
        await expect.poll(() => page.locator('#walk img').evaluateAll(images =>
          images.filter(image => {
            const img = image as HTMLImageElement;
            return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
          }).length), { message: `All four globe images must decode at ${width}px / ${density}x` }).toBe(4);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });
  });
}
