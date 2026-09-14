import { expect, test, type Locator, type Page } from '@playwright/test';

const ORIGIN = 'http://127.0.0.1:3100';
const unexpectedByPage = new WeakMap<Page, { method: string; path: string }[]>();

test.use({ baseURL: ORIGIN, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
test.setTimeout(60_000);
test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview(ORIGIN);
});
test.beforeEach(async ({ page }) => {
  const blocked: { method: string; path: string }[] = [];
  unexpectedByPage.set(page, blocked);
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === ORIGIN && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    blocked.push({ method: request.method(), path: url.pathname });
    return route.abort('blockedbyclient');
  });
});
test.afterEach(async ({ page }, testInfo) => {
  const blocked = unexpectedByPage.get(page) ?? [];
  await testInfo.attach('prayer-fixture-scope', { contentType: 'application/json', body: JSON.stringify({
    unexpectedRequests: blocked,
    scope: 'Actual community page/component JSX with deterministic data and synthetic manual actions. HTTP mutations and external reads blocked.',
    excluded: 'Authenticated services, notification delivery, real member data, care card, and RSC transport.',
  }, null, 2) });
  expect(blocked, 'Prayer verification attempted a service or external request').toEqual([]);
});

async function openPage(page: Page, empty = false) {
  await page.goto(`/?case=community-page&shell=1&mode=manual&variant=${empty ? 'empty' : 'populated'}`);
  const family = page.getByTestId('dashboard-family');
  await expect(family.getByRole('heading', { name: 'Prayer wall', level: 1, exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const wall = family.locator('[data-prayer-wall]');
  await expect(wall).toBeVisible();
  return { family, wall };
}

async function count(page: Page, name: string) {
  const text = await page.getByTestId('action-state').textContent();
  return (JSON.parse(text ?? '{}') as { calls?: Record<string, number> }).calls?.[name] ?? 0;
}

async function settle(page: Page, success: boolean) {
  await page.getByRole('button', { name: success ? 'Resolve pending action' : 'Reject pending action', exact: true }).dispatchEvent('click');
}

async function activate(control: Locator) {
  // A fixture promise can settle before React commits its enabled state.
  // Keyboard activation must wait for the control, not only the mock ledger.
  await expect(control).toBeEnabled();
  await control.focus();
  await expect(control).toBeFocused();
  await control.press('Enter');
}

async function expectKeyboardFocus(control: Locator) {
  await expect(control).toBeFocused();
  // Let the existing 200ms interaction transition settle before measuring it.
  await control.page().waitForTimeout(220);
  await expect(control).toHaveCSS('outline-style', 'solid');
  await expect(control).toHaveCSS('outline-width', '2px');
  await expect(control).toHaveCSS('outline-color', 'rgb(201, 165, 72)');
}

async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 35; step += 1) {
    if (await target.evaluate(node => node === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target, 'Target must be reachable within the bounded native Tab walk').toBeFocused();
}

function form(wall: Locator) {
  return {
    title: wall.getByLabel('Prayer request', { exact: true }),
    body: wall.getByLabel('More context (optional)', { exact: true }),
    submit: wall.getByRole('button', { name: 'Share request', exact: true }),
    cancel: wall.getByRole('button', { name: 'Cancel', exact: true }),
  };
}

for (const empty of [false, true]) {
  test(`keyboard open/cancel restores the ${empty ? 'empty-state' : 'top'} share opener and retains the draft`, async ({ page }) => {
    const { wall } = await openPage(page, empty);
    const opener = wall.getByRole('button', { name: empty ? 'Share a request' : 'Share a prayer request', exact: true });
    await tabTo(page, opener);
    await expectKeyboardFocus(opener);
    await opener.press('Enter');
    const fields = form(wall);
    await expectKeyboardFocus(fields.title);
    await fields.title.fill('  A synthetic request to keep  ');
    await page.keyboard.press('Tab');
    await expectKeyboardFocus(fields.body);
    await fields.body.fill('  Keep the draft when I cancel.  ');
    await page.keyboard.press('Tab');
    await expect(fields.submit).toBeFocused();
    await page.keyboard.press('Tab');
    await expectKeyboardFocus(fields.cancel);
    await fields.cancel.press('Enter');
    await expect(fields.title).toHaveCount(0);
    await expectKeyboardFocus(opener);
    await opener.press('Space');
    await expect(fields.title).toHaveValue('  A synthetic request to keep  ');
    await expect(fields.body).toHaveValue('  Keep the draft when I cancel.  ');
    await expect(fields.title).toBeFocused();
    if (empty) {
      // The empty-state opener remains available while the inline form is open.
      // Repeating that action must return to the existing draft, not do nothing.
      await tabTo(page, opener);
      await opener.press('Enter');
      await expectKeyboardFocus(fields.title);
      await expect(wall.locator('form')).toHaveCount(1);
      await expect(fields.title).toHaveValue('  A synthetic request to keep  ');
      await expect(fields.body).toHaveValue('  Keep the draft when I cancel.  ');
    }
    expect(await count(page, 'post')).toBe(0);
  });
}

test('failed post removes its temporary card, restores exact words and focus, and successful retry focuses the confirmed card', async ({ page }) => {
  const { wall } = await openPage(page);
  const initialCards = await wall.locator('article').count();
  const live = wall.locator('[aria-live="polite"]').first();
  const originalRegion = await live.elementHandle();
  await expect(live).toBeEmpty();
  const opener = wall.getByRole('button', { name: 'Share a prayer request', exact: true });
  await activate(opener);
  const fields = form(wall);
  const draft = { title: '  Synthetic precise draft  ', body: '  Keep this spacing.\nAnd this second line.  ' };
  await fields.title.fill(draft.title);
  await fields.body.fill(draft.body);
  await activate(fields.submit);
  await expect.poll(() => count(page, 'post')).toBe(1);
  await expect(wall.locator('article')).toHaveCount(initialCards + 1);
  await expect(wall.getByRole('heading', { name: draft.title.trim(), exact: true })).toHaveCount(1);
  await settle(page, false);
  await expect(wall.locator('article')).toHaveCount(initialCards);
  await expect(fields.title).toHaveValue(draft.title);
  await expect(fields.body).toHaveValue(draft.body);
  await expectKeyboardFocus(fields.title);
  await expect(live).toHaveText('Could not share your request. Your words are still here. Please try again.');
  await expect(live).toHaveAttribute('aria-atomic', 'true');
  expect(await originalRegion!.evaluate(node => node.isConnected)).toBe(true);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await fields.submit.press('Enter');
  await expect.poll(() => count(page, 'post')).toBe(2);
  await settle(page, true);
  const confirmed = wall.getByRole('heading', { name: draft.title.trim(), exact: true });
  await expect(confirmed).toHaveCount(1);
  await expect(wall.locator('article')).toHaveCount(initialCards + 1);
  await expectKeyboardFocus(confirmed);
  await expect(live).toBeEmpty();
  await activate(opener);
  await expect(fields.title).toHaveValue('');
  await expect(fields.body).toHaveValue('');
});

test('async prayer results preserve deliberate focus outside the wall', async ({ page }) => {
  const { wall } = await openPage(page);
  await activate(wall.getByRole('button', { name: 'Share a prayer request', exact: true }));
  const fields = form(wall);
  await fields.title.fill('Synthetic moved-focus draft');
  await fields.body.fill('Keep these words while I move to navigation.');
  await activate(fields.submit);
  await expect.poll(() => count(page, 'post')).toBe(1);
  const outside = page.getByTestId('dashboard-route-shell').locator('header').getByRole('link', { name: 'Home', exact: true });
  await tabTo(page, outside);
  await expectKeyboardFocus(outside);
  await settle(page, false);
  await expect(fields.title).toHaveValue('Synthetic moved-focus draft');
  await expect(fields.body).toHaveValue('Keep these words while I move to navigation.');
  await expect(outside).toBeFocused();
  await expect(wall.getByText('Could not share your request. Your words are still here. Please try again.', { exact: true })).toBeVisible();

  const alex = wall.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic request from Alex', exact: true }) });
  const mine = wall.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic request of mine', exact: true }) });
  for (const scenario of [
    { action: 'pray', control: alex.getByRole('button', { name: 'Pray with them', exact: true }), success: false },
    { action: 'answered', control: mine.getByRole('button', { name: 'Mark answered', exact: true }), success: true },
    { action: 'remove', control: mine.getByRole('button', { name: 'Remove', exact: true }), success: false },
  ]) {
    await activate(scenario.control);
    await expect.poll(() => count(page, scenario.action)).toBe(1);
    await tabTo(page, outside);
    await expect(outside).toBeFocused();
    await settle(page, scenario.success);
    await expect(page.getByTestId('action-state')).toContainText('"pending":[]');
    await expect(outside).toBeFocused();
  }
});

test('pray, answered and remove preserve rollback semantics and intentional keyboard destinations', async ({ page }) => {
  const { wall } = await openPage(page);
  const originalCards = await wall.locator('article').count();
  const alex = wall.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic request from Alex', exact: true }) });
  const mine = wall.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic request of mine', exact: true }) });
  const pray = alex.getByRole('button', { name: 'Pray with them', exact: true });
  await activate(pray);
  await expect(alex.getByText('1 person praying', { exact: true })).toBeVisible();
  await settle(page, false);
  await expect(alex.getByText('1 person praying', { exact: true })).toHaveCount(0);
  await expect(wall.getByText('Could not save that you are praying. Please try again.', { exact: true })).toBeVisible();
  await expectKeyboardFocus(pray);
  await pray.press('Enter');
  await settle(page, true);
  await expect(alex.getByText('1 person praying', { exact: true })).toBeVisible();
  await expectKeyboardFocus(alex.getByRole('heading'));
  expect(await count(page, 'pray')).toBe(2);

  const answered = mine.getByRole('button', { name: 'Mark answered', exact: true });
  await activate(answered);
  await expect(mine.getByText('Answered', { exact: true })).toBeVisible();
  await settle(page, false);
  await expect(mine.getByText('Answered', { exact: true })).toHaveCount(0);
  await expect(wall.getByText('Could not mark this request as answered. It is still on the wall. Please try again.', { exact: true })).toBeVisible();
  await expectKeyboardFocus(answered);
  await answered.press('Enter');
  await settle(page, true);
  const remove = mine.getByRole('button', { name: 'Remove', exact: true });
  await expectKeyboardFocus(remove);
  await expect(mine.getByText('Answered', { exact: true })).toBeVisible();
  expect(await count(page, 'answered')).toBe(2);

  await remove.press('Enter');
  await expect(mine).toHaveCount(0);
  await settle(page, false);
  await expect(mine).toBeVisible();
  await expect(wall.locator('article')).toHaveCount(originalCards);
  await expect(wall.getByText('Could not remove this request. It has been restored to the wall. Please try again.', { exact: true })).toBeVisible();
  await expectKeyboardFocus(remove);
  // The existing rollback prepends the restored card. Record the next card
  // from the resulting order rather than promising an order change here.
  const nextHeading = wall.locator('article').nth(1).getByRole('heading');
  const nextText = await nextHeading.textContent();
  await remove.press('Enter');
  await settle(page, true);
  await expect(mine).toHaveCount(0);
  await expect(wall.locator('article')).toHaveCount(originalCards - 1);
  await expectKeyboardFocus(wall.getByRole('heading', { name: nextText!.trim(), exact: true }));
  expect(await count(page, 'remove')).toBe(2);
});

test('removing the last card focuses its previous heading, or the share opener when the wall becomes empty', async ({ page }) => {
  // The existing two-card component fixture puts the owned card last.
  await page.goto('/?case=community&mode=manual');
  const componentWall = page.locator('[data-prayer-wall]');
  const last = componentWall.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic request of mine', exact: true }) });
  await activate(last.getByRole('button', { name: 'Remove', exact: true }));
  await expect.poll(() => count(page, 'remove')).toBe(1);
  await settle(page, true);
  await expect(last).toHaveCount(0);
  await expectKeyboardFocus(componentWall.getByRole('heading', { name: 'Synthetic request from Alex', exact: true }));

  const { wall } = await openPage(page, true);
  await activate(wall.getByRole('button', { name: 'Share a request', exact: true }));
  const fields = form(wall);
  await fields.title.fill('Synthetic only request');
  await activate(fields.submit);
  await expect.poll(() => count(page, 'post')).toBe(1);
  await settle(page, true);
  const only = wall.getByRole('heading', { name: 'Synthetic only request', exact: true });
  await expectKeyboardFocus(only);
  await expect(wall.locator('article')).toHaveCount(1);
  await activate(wall.getByRole('button', { name: 'Remove', exact: true }));
  await expect.poll(() => count(page, 'remove')).toBe(1);
  await settle(page, true);
  await expect(wall.locator('article')).toHaveCount(0);
  await expectKeyboardFocus(wall.getByRole('button', { name: 'Share a prayer request', exact: true }));
});

async function familyMeasurements(family: Locator) {
  return family.evaluate(root => {
    const visible = (element: Element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
    const smallTargets = Array.from(root.querySelectorAll('button, input, textarea, a[href]')).filter(visible).flatMap(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44 ? [] : [{ tag: element.tagName, label: element.getAttribute('aria-label') ?? element.textContent?.trim(), width: rect.width, height: rect.height }];
    });
    const inputSizes = Array.from(root.querySelectorAll('input, textarea')).map(element => parseFloat(getComputedStyle(element).fontSize));
    const smallText: { text: string; actual: number; minimum: number }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || !visible(parent) || parent.closest('[aria-hidden="true"]')) continue;
      const actual = parseFloat(getComputedStyle(parent).fontSize);
      const minimum = parent.closest('.text-meta') ? 13 : 14;
      if (actual < minimum) smallText.push({ text: node.textContent.trim().slice(0, 70), actual, minimum });
    }
    return { smallTargets, inputSizes, smallText, pageWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
      familyScrollWidth: root.scrollWidth, familyClientWidth: root.clientWidth };
  });
}

test('prayer family controls and text meet the size floors across the bounded responsive matrix', async ({ page }, testInfo) => {
  const reports = [];
  for (const viewport of [
    { width: 390, height: 844 }, { width: 768, height: 1024 },
    { width: 1280, height: 900 }, { width: 1920, height: 1080 }, { width: 320, height: 844 },
    { width: 820, height: 1180 }, { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const { family, wall } = await openPage(page);
    await activate(wall.getByRole('button', { name: 'Share a prayer request', exact: true }));
    const metrics = await familyMeasurements(family);
    expect(metrics.smallTargets, `Prayer targets at ${viewport.width}px`).toEqual([]);
    expect(metrics.inputSizes).toEqual([16, 16]);
    expect(metrics.smallText, `Prayer typography at ${viewport.width}px`).toEqual([]);
    expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.familyScrollWidth).toBeLessThanOrEqual(metrics.familyClientWidth);
    reports.push({ viewport, ...metrics });
  }
  await testInfo.attach('prayer-responsive-matrix', { contentType: 'application/json', body: JSON.stringify({ reports,
    scope: 'Actual community page family, including form and populated answered/already-prayed fixtures. Navigation and care are outside this size check.',
  }, null, 2) });
});

test('prayer wall and its open form remain usable under 200% CSS zoom emulation', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { family, wall } = await openPage(page);
  await activate(wall.getByRole('button', { name: 'Share a prayer request', exact: true }));
  await page.addStyleTag({ content: '[data-testid="dashboard-family"] { zoom: 2; }' });
  const metrics = await familyMeasurements(family);
  expect(metrics.smallTargets).toEqual([]);
  expect(metrics.inputSizes).toEqual([16, 16]);
  expect(metrics.smallText).toEqual([]);
  expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.familyScrollWidth).toBeLessThanOrEqual(metrics.familyClientWidth);
  const fields = form(wall);
  await fields.title.fill('Synthetic zoom draft');
  await tabTo(page, fields.cancel);
  await fields.cancel.press('Enter');
  await expectKeyboardFocus(wall.getByRole('button', { name: 'Share a prayer request', exact: true }));
  expect(await count(page, 'post')).toBe(0);
  await testInfo.attach('prayer-css-zoom', { contentType: 'application/json', body: JSON.stringify({ ...metrics, zoom: 2,
    limitation: 'CSS zoom applies only to the prayer page family. This checks enlarged layout and keyboard use, not browser-toolbar zoom, OS text scaling, or a physical device.',
  }, null, 2) });
});

/** This is rendered solid-background compositing, not a token comparison or
 * screenshot pixel analysis. Unsupported paint effects fail explicitly. */
async function measureTextContrast(scope: Locator) {
  return scope.evaluate(root => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      return [pixel[0], pixel[1], pixel[2], pixel[3] / 255];
    };
    const over = (front: number[], back: number[]) => front.slice(0, 3)
      .map((channel, index) => channel * front[3] + back[index] * (1 - front[3]));
    const luminance = (rgb: number[]) => rgb.reduce((sum, channel, index) => {
      const srgb = channel / 255;
      return sum + (srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    const visible = (element: Element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility === 'visible'
      && !element.closest('[aria-hidden="true"]');
    const candidates: { element: Element; text: string; kind: 'text' | 'value' | 'placeholder' }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (parent && node.textContent?.trim() && visible(parent)) candidates.push({ element: parent, text: node.textContent.trim(), kind: 'text' });
    }
    const inputs = [...(root.matches('input, textarea') ? [root] : []), ...root.querySelectorAll('input, textarea')];
    for (const input of inputs) {
      if (!visible(input)) continue;
      const control = input as HTMLInputElement | HTMLTextAreaElement;
      if (control.value) candidates.push({ element: control, text: control.value, kind: 'value' });
      else if (control.placeholder) candidates.push({ element: control, text: control.placeholder, kind: 'placeholder' });
    }
    const disabled = new Set<string>();
    const samples = [];
    for (const { element, text, kind } of candidates) {
      const disabledControl = element.closest(':disabled, [aria-disabled="true"]');
      if (disabledControl) {
        disabled.add(disabledControl.getAttribute('aria-label') ?? disabledControl.textContent?.trim() ?? disabledControl.tagName);
        continue;
      }
      const ancestors: Element[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
      const unsupported: string[] = [];
      let background = [255, 255, 255];
      const layers = ancestors.map(node => {
        const style = getComputedStyle(node);
        if (style.backgroundImage !== 'none') unsupported.push(`${node.tagName}:background-image`);
        if (style.maskImage !== 'none' || style.webkitMaskImage !== 'none') unsupported.push(`${node.tagName}:mask`);
        if (style.opacity !== '1') unsupported.push(`${node.tagName}:opacity=${style.opacity}`);
        if (style.filter !== 'none' || style.backdropFilter !== 'none') unsupported.push(`${node.tagName}:filter`);
        if (style.mixBlendMode !== 'normal' || style.backgroundBlendMode !== 'normal') unsupported.push(`${node.tagName}:blend`);
        if (style.clipPath !== 'none') unsupported.push(`${node.tagName}:clip-path`);
        if (style.textShadow !== 'none') unsupported.push(`${node.tagName}:text-shadow`);
        for (const pseudo of ['::before', '::after']) {
          const paint = getComputedStyle(node, pseudo);
          if (!['none', 'normal'].includes(paint.content) && paint.display !== 'none' && paint.visibility === 'visible' && Number(paint.opacity) > 0) {
            unsupported.push(`${node.tagName}${pseudo}:generated-paint`);
          }
        }
        const color = rgba(style.backgroundColor);
        background = over(color, background);
        return { tag: node.tagName, background: color };
      });
      const style = getComputedStyle(element, kind === 'placeholder' ? '::placeholder' : null);
      if (style.textShadow !== 'none') unsupported.push(`${kind}:text-shadow`);
      const color = rgba(style.color);
      // Placeholder opacity applies to its own glyph paint, unlike ancestor
      // group opacity; compose it with the foreground's actual alpha.
      const placeholderOpacity = kind === 'placeholder' ? Number(style.opacity) : 1;
      color[3] *= placeholderOpacity;
      const foreground = over(color, background);
      const first = luminance(foreground), second = luminance(background);
      const fontSize = parseFloat(style.fontSize), fontWeight = Number(style.fontWeight);
      const threshold = fontSize >= 24 || (fontSize >= 18.666666 && fontWeight >= 700) ? 3 : 4.5;
      samples.push({ text, kind, tag: element.tagName, foreground, background, layers,
        fontSize, fontWeight, fontFamily: style.fontFamily, placeholderOpacity, threshold,
        contrast: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05), unsupported,
      });
    }
    return { samples, exemptDisabledControls: [...disabled] };
  });
}

async function checkedContrast(scope: Locator, state: string) {
  // Allow direct-interaction color feedback to finish before reading colors.
  await scope.page().waitForTimeout(220);
  const report = await measureTextContrast(scope);
  expect(report.samples.length, `${state} must contain measured text`).toBeGreaterThan(0);
  const unsupported = report.samples.filter(sample => sample.unsupported.length > 0);
  expect(unsupported, `${state} needs a separate paint-compositing method for these effects`).toEqual([]);
  expect(report.samples.filter(sample => !Number.isFinite(sample.contrast) || sample.contrast < sample.threshold), `${state} rendered text contrast`).toEqual([]);
  return { state, ...report };
}

async function walkEnabledWallControls(page: Page, wall: Locator) {
  const selector = 'button, input, textarea, a[href]';
  const expectedCount = await wall.evaluate((root, selector) => Array.from(root.querySelectorAll(selector)).filter(element => {
    const control = element as HTMLElement & { disabled?: boolean };
    return control.getClientRects().length > 0 && getComputedStyle(control).visibility === 'visible' && !control.disabled && control.tabIndex >= 0;
  }).length, selector);
  await page.getByRole('button', { name: 'Reject pending action', exact: true }).focus();
  const visited = new Set<number>();
  const stops = [];
  for (let press = 0; press < expectedCount + 35 && visited.size < expectedCount; press += 1) {
    await page.keyboard.press('Tab');
    const index = await wall.evaluate((root, selector) => Array.from(root.querySelectorAll(selector)).indexOf(document.activeElement!), selector);
    if (index < 0) continue;
    const active = wall.locator(selector).nth(index);
    await expectKeyboardFocus(active);
    expect(await active.evaluate(node => node.matches(':focus-visible'))).toBe(true);
    const contrast = await checkedContrast(active, `keyboard-focus-${index}`);
    const label = await active.evaluate(node => node.getAttribute('aria-label') ?? node.getAttribute('placeholder') ?? node.textContent?.trim());
    stops.push({ index, label, ...contrast });
    visited.add(index);
  }
  expect(visited.size, 'Native Tab traversal must reach every enabled wall control').toBe(expectedCount);
  return { expectedCount, visited: visited.size, stops };
}

test('prayer text and placeholders retain rendered contrast and every enabled control has keyboard feedback at 390 and 1280', async ({ page }, testInfo) => {
  const reports = [];
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const { family, wall } = await openPage(page);
    const states = [await checkedContrast(family, 'populated-with-answered-and-already-prayed-cards')];
    const closedWalk = await walkEnabledWallControls(page, wall);
    await activate(wall.getByRole('button', { name: 'Share a prayer request', exact: true }));
    states.push(await checkedContrast(family, 'empty-form-with-placeholders'));
    expect(states.at(-1)!.samples.filter(sample => sample.kind === 'placeholder')).toHaveLength(2);
    const fields = form(wall);
    await fields.title.fill('Synthetic readable request');
    await fields.body.fill('A synthetic draft for contrast verification.');
    states.push(await checkedContrast(family, 'filled-form-with-enabled-submit'));
    const openWalk = await walkEnabledWallControls(page, wall);
    expect(await count(page, 'post')).toBe(0);
    expect(await count(page, 'pray')).toBe(0);
    expect(await count(page, 'answered')).toBe(0);
    expect(await count(page, 'remove')).toBe(0);
    await activate(fields.submit);
    await expect.poll(() => count(page, 'post')).toBe(1);
    states.push(await checkedContrast(family, 'optimistic-pending-post-disabled-controls-exempt'));
    await settle(page, false);
    await expect(fields.title).toHaveValue('Synthetic readable request');
    states.push(await checkedContrast(family, 'failed-post-with-preserved-draft-and-notice'));
    const empty = await openPage(page, true);
    states.push(await checkedContrast(empty.family, 'empty-wall'));
    reports.push({ width, states, closedWalk, openWalk });
  }
  await testInfo.attach('prayer-rendered-text-contrast-and-keyboard', { contentType: 'application/json', body: JSON.stringify({ reports,
    method: 'Browser-computed foreground and ancestor solid-background colors resolved to sRGB by canvas and alpha-composited. Weight-aware text thresholds; disabled control text explicitly exempt.',
    scope: 'Real prayer family JSX, local production fonts, default and keyboard-focused active control text, values, visible placeholders, pending state, failure notice, answered and empty states.',
    limitation: 'This is solid-background text contrast and computed keyboard-ring verification, not screenshot pixel analysis or an authenticated service test. Unsupported paint effects fail. Decorative icons and non-text control border contrast are not scored.',
  }, null, 2) });
});

async function installMotionObserver(page: Page) {
  await page.addInitScript(() => {
    const result = { sawWall: false, checks: 0, problems: [] as string[] };
    (window as unknown as { prayerMotion: typeof result }).prayerMotion = result;
    const scan = () => {
      const wall = document.querySelector('[data-prayer-wall]');
      if (!wall || result.checks > 600) return;
      result.sawWall = true; result.checks += 1;
      const roots = [wall, ...wall.querySelectorAll('form, article, p, h2, h3, label, input, textarea')];
      for (const root of roots) {
        if (!root.getClientRects().length || getComputedStyle(root).visibility === 'hidden') continue;
        for (let node: Element | null = root; node && wall.contains(node); node = node.parentElement) {
          const style = getComputedStyle(node);
          const problem = style.opacity !== '1' ? `opacity:${style.opacity}`
            : style.transform !== 'none' ? `transform:${style.transform}`
              : style.filter !== 'none' ? `filter:${style.filter}`
                : style.clipPath !== 'none' ? `clip:${style.clipPath}`
                  : style.animationName !== 'none' ? `animation:${style.animationName}` : null;
          if (problem && result.problems.length < 30) result.problems.push(`${node.tagName}:${problem}`);
        }
      }
    };
    new MutationObserver(scan).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });
    const frame = () => { scan(); if (result.checks <= 600) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  });
}

for (const preference of ['no-preference', 'reduce'] as const) {
  test(`populated, form, rollback and empty prayer content has no entrance or list motion under ${preference}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: preference });
    await installMotionObserver(page);
    const { wall } = await openPage(page);
    await activate(wall.getByRole('button', { name: 'Share a prayer request', exact: true }));
    const fields = form(wall);
    await fields.title.fill('Synthetic motion check');
    await activate(fields.submit);
    await expect.poll(() => count(page, 'post')).toBe(1);
    await settle(page, false);
    await expect(fields.title).toHaveValue('Synthetic motion check');
    await page.waitForTimeout(220);
    const populated = await page.evaluate(() => (window as unknown as { prayerMotion: { sawWall: boolean; checks: number; problems: string[] } }).prayerMotion);
    expect(populated.sawWall).toBe(true);
    expect(populated.checks).toBeGreaterThan(0);
    expect(populated.problems).toEqual([]);
    const emptyPage = await openPage(page, true);
    await expect(emptyPage.wall.getByText('No requests yet.', { exact: true })).toBeVisible();
    await expect(emptyPage.wall.getByText('Be the first to share something you are carrying. Others will pray with you.', { exact: true })).toBeVisible();
    await page.waitForTimeout(220);
    const empty = await page.evaluate(() => (window as unknown as { prayerMotion: { sawWall: boolean; checks: number; problems: string[] } }).prayerMotion);
    expect(empty.sawWall).toBe(true);
    expect(empty.problems).toEqual([]);
    await testInfo.attach(`prayer-motion-${preference}`, { contentType: 'application/json', body: JSON.stringify({ populated, empty,
      scope: 'Observation begins before page scripts and samples meaningful content and its ancestors. Brief color feedback and decorative icons are outside this entrance/list check.',
    }, null, 2) });
  });
}
