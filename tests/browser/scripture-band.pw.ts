import { expect, test, type Locator } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:3000', reducedMotion: 'no-preference' });
test.setTimeout(60_000);
test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview();
});

// Frozen from the pre-change phrase/reference arrays in ScriptureMarquee.tsx,
// app/faithflow/page.tsx and app/scholarflow/page.tsx. These are transcription
// expectations, not an assertion that the excerpts or editions are verified.
const pages = [
  {
    path: '/',
    pairs: [
      ['Iron sharpens iron', 'Proverbs 27:17'],
      ['Be still, and know', 'Psalm 46:10'],
      ['Come to me, and rest', 'Matthew 11:28'],
      ['His mercies are new every morning', 'Lamentations 3:23'],
      ['Your word, a lamp to my feet', 'Psalm 119:105'],
      ['No condemnation in Christ', 'Romans 8:1'],
      ['Bear one another’s burdens', 'Galatians 6:2'],
      ['He rejoices over you', 'Zephaniah 3:17'],
    ],
  },
  {
    path: '/faithflow',
    pairs: [
      ['Iron sharpens iron', 'Proverbs 27:17'],
      ['Two are better than one', 'Ecclesiastes 4:9'],
      ['Exhort one another, build each other up', '1 Thessalonians 5:11'],
      ['Where two or three are gathered', 'Matthew 18:20'],
      ['Confess, and pray for one another', 'James 5:16'],
      ['Steadfast in teaching and fellowship', 'Acts 2:42'],
      ['A threefold cord is not quickly broken', 'Ecclesiastes 4:12'],
      ['Love one another, as I have loved you', 'John 13:34'],
    ],
  },
  {
    path: '/scholarflow',
    pairs: [
      ['Wisdom is supreme. Get wisdom', 'Proverbs 4:7'],
      ['If any of you lacks wisdom, ask', 'James 1:5'],
      ['Properly handling the Word of Truth', '2 Timothy 2:15'],
      ['Skill brings success', 'Ecclesiastes 10:10'],
      ['In a multitude of counselors', 'Proverbs 15:22'],
      ['The wise hear, and increase in learning', 'Proverbs 1:5'],
      ['Better to get wisdom than gold', 'Proverbs 16:16'],
      ['Instruct the wise, and they will be wiser', 'Proverbs 9:9'],
    ],
  },
] as const;

async function staticProblems(band: Locator) {
  return band.evaluate((section) => {
    const elements = [section, ...section.querySelectorAll('*')];
    const problems: string[] = [];
    for (const element of elements) {
      const style = getComputedStyle(element);
      if (style.maskImage !== 'none' || style.webkitMaskImage !== 'none') problems.push(`${element.tagName}:mask`);
      if (style.animationName !== 'none') problems.push(`${element.tagName}:animation`);
      if (style.transform !== 'none') problems.push(`${element.tagName}:transform`);
      if (style.opacity !== '1') problems.push(`${element.tagName}:opacity`);
      if (element.getAttribute('aria-hidden') === 'true') problems.push(`${element.tagName}:aria-hidden`);
    }
    for (let ancestor = section.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor.getAttribute('aria-hidden') === 'true' || ancestor.inert) problems.push('hidden-ancestor');
    }
    if (section.getAnimations({ subtree: true }).length) problems.push('active-animation');
    return problems;
  });
}

for (const width of [390, 1280]) {
  for (const source of pages) {
    test(`${source.path} preserves all eight static Scripture pairs at ${width}px`, async ({ page }) => {
      await page.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())
        ? route.continue() : route.abort());
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(source.path);
      await page.evaluate(() => document.fonts.ready);

      const band = page.locator('[data-scripture-band]');
      await expect(band).toHaveCount(1);
      await expect(band).toHaveAccessibleName('Scripture');
      await expect(band.locator('figure')).toHaveCount(8);
      const actual = await band.locator('figure').evaluateAll(figures => figures.map(figure => [
        figure.querySelector('blockquote p')?.textContent,
        figure.querySelector('figcaption')?.textContent,
      ]));
      expect(actual).toEqual(source.pairs);

      const typography = await band.locator('blockquote p, figcaption').evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element);
        const range = document.createRange();
        range.selectNodeContents(element);
        const rect = range.getBoundingClientRect();
        return {
          caption: element.tagName === 'FIGCAPTION',
          size: parseFloat(style.fontSize),
          userSelect: style.userSelect,
          left: rect.left, right: rect.right,
          ownOverflow: element.scrollWidth > element.clientWidth,
        };
      }));
      for (const label of typography) {
        expect(label.size).toBeGreaterThanOrEqual(label.caption ? 13 : 14);
        expect(label.userSelect).not.toBe('none');
        expect(label.left).toBeGreaterThanOrEqual(0);
        expect(label.right).toBeLessThanOrEqual(width);
        expect(label.ownOverflow).toBe(false);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await staticProblems(band)).toEqual([]);

      const phrase = band.locator('blockquote p').first();
      const selected = await phrase.evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges(); selection?.addRange(range);
        const text = selection?.toString();
        selection?.removeAllRanges();
        return text;
      });
      expect(selected).toBe(source.pairs[0][0]);

      await band.locator('figure').last().scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      expect(await staticProblems(band)).toEqual([]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(await staticProblems(band)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}
