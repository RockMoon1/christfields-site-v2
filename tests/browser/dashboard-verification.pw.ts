import { expect, test, type Locator, type Page } from '@playwright/test';

const FIXTURE_ORIGIN = 'http://127.0.0.1:3100';
const PROBE_PATH = '/__dashboard_verification_guard__';
type BlockedRequest = { method: string; origin: string; path: string };
const blockedByPage = new WeakMap<Page, BlockedRequest[]>();

test.use({ baseURL: FIXTURE_ORIGIN, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
test.setTimeout(60_000);
test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview(FIXTURE_ORIGIN);
});

test.beforeEach(async ({ page }) => {
  const blocked: BlockedRequest[] = [];
  blockedByPage.set(page, blocked);
  // Services are replaced by the fixture loader before this guard is applied.
  // This second boundary permits only local reads; it never records bodies,
  // query strings, credentials, or real user data.
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === FIXTURE_ORIGIN && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
    return route.abort('blockedbyclient');
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const blocked = blockedByPage.get(page) ?? [];
  const unexpected = blocked.filter(request => request.path !== PROBE_PATH);
  await testInfo.attach('fixture-service-boundary', {
    contentType: 'application/json',
    body: JSON.stringify({
      expectedBlockedProbes: blocked.filter(request => request.path === PROBE_PATH),
      unexpectedBlockedRequests: unexpected,
      scope: 'Real components with synthetic actions and Clerk/Next presentation mocks; no authenticated member flow.',
      fonts: 'Local production Latin Inter/Cormorant font files served by the isolated fixture; no remote font requests.',
      excluded: 'Authentication, RSC transport/router refresh persistence, PushSetup and care-card behavior.',
    }, null, 2),
  });
  expect(unexpected, 'A fixture attempted an unplanned external request or mutation').toEqual([]);
});

async function openFixture(page: Page, which: string, route?: string) {
  await page.goto(`/?case=${which}${route ? `&route=${encodeURIComponent(route)}` : ''}`);
  await expect(page.getByText(/Browser fixture · synthetic data/)).toBeVisible();
  await page.evaluate(async () => {
    await Promise.all([document.fonts.load('400 16px Inter'), document.fonts.load('400 24px "Cormorant Garamond"')]);
    await document.fonts.ready;
  });
}

async function openDashboardFamily(page: Page, which: 'settings' | 'availability', variant = 'disconnected') {
  await page.goto(`/?case=${which}&mode=manual&shell=1&variant=${variant}`);
  const family = page.getByTestId('dashboard-family');
  await expect(family.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return family;
}

async function actionCount(page: Page, name: string) {
  const raw = await page.getByTestId('action-state').textContent();
  return (JSON.parse(raw ?? '{}') as { calls?: Record<string, number> }).calls?.[name] ?? 0;
}

async function settle(page: Page, success: boolean) {
  // A server result should not steal keyboard focus. Dispatch only to the
  // fixture controller; all member-facing interactions use real key presses.
  await page.getByRole('button', {
    name: success ? 'Resolve pending action' : 'Reject pending action', exact: true,
  }).dispatchEvent('click');
}

/** Measure the rendered solid-color stack, not a token/background guess.
 * Unsupported effects explicitly fail this measurement instead of disappearing
 * from the math. Canvas resolves computed CSS colors to the browser's sRGB. */
async function measureNotice(notice: Locator) {
  await expect(notice).toBeVisible();
  return notice.evaluate(element => {
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
    const over = (foreground: number[], background: number[]) =>
      foreground.slice(0, 3).map((channel, index) => channel * foreground[3] + background[index] * (1 - foreground[3]));
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
      if (style.mixBlendMode !== 'normal') unsupported.push(`${node.tagName}:blend`);
      const color = rgba(style.backgroundColor);
      background = over(color, background);
      return { tag: node.tagName, background: color };
    });
    const style = getComputedStyle(element);
    const foreground = over(rgba(style.color), background);
    const luminance = (rgb: number[]) => rgb.reduce((sum, channel, index) => {
      const srgb = channel / 255;
      return sum + (srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    const first = luminance(foreground), second = luminance(background);
    return {
      foreground, background, layers, unsupported,
      contrast: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05),
      fontSize: parseFloat(style.fontSize), fontFamily: style.fontFamily,
      textShadow: style.textShadow,
    };
  });
}

async function expectProblemNotice(notice: Locator) {
  const report = await measureNotice(notice);
  expect(report.unsupported, 'Contrast requires a separately verified compositing method for these effects').toEqual([]);
  expect(report.foreground).toEqual([227, 154, 143]);
  expect(report.fontSize).toBeGreaterThanOrEqual(14);
  expect(report.textShadow).toBe('none');
  expect(report.contrast).toBeGreaterThanOrEqual(4.5);
  return report;
}

test('local and external synthetic POST probes are aborted before reaching services', async ({ page }) => {
  await openFixture(page, 'event');
  const rejected = await page.evaluate(async ({ origin, path }) => {
    const probe = (url: string) => fetch(url, { method: 'POST', mode: 'no-cors', body: 'blocked synthetic probe' })
      .then(() => false, () => true);
    return [await probe(`${origin}${path}`), await probe(`https://example.invalid${path}`)];
  }, { origin: FIXTURE_ORIGIN, path: PROBE_PATH });
  expect(rejected).toEqual([true, true]);
  expect(blockedByPage.get(page)).toEqual([
    { method: 'POST', origin: FIXTURE_ORIGIN, path: PROBE_PATH },
    { method: 'POST', origin: 'https://example.invalid', path: PROBE_PATH },
  ]);
  expect(await actionCount(page, 'rsvp')).toBe(0);
});

test('keyboard prayer failure preserves the exact draft and announces readable feedback before retry', async ({ page }, testInfo) => {
  await openFixture(page, 'community');
  const live = page.getByTestId('fixture-content').locator('[aria-live="polite"]').first();
  const liveHandle = await live.elementHandle();
  await expect(live).toBeEmpty();
  const trigger = page.getByRole('button', { name: 'Share a prayer request', exact: true });
  await trigger.focus();
  await expect(trigger).toHaveCSS('outline-width', '2px');
  await trigger.press('Enter');
  const title = page.getByPlaceholder('What are you bringing before God?');
  const body = page.getByPlaceholder('A little more context, if you would like to share it. (Optional)');
  const original = { title: '  Synthetic keyboard draft  ', body: '  Keep this line.\nAnd the next line.  ' };
  await expect(title).toBeFocused();
  await title.fill(original.title);
  await page.keyboard.press('Tab');
  await expect(body).toBeFocused();
  await body.fill(original.body);
  await page.keyboard.press('Tab');
  const submit = page.getByRole('button', { name: 'Share request', exact: true });
  await expect(submit).toBeFocused();
  await submit.press('Enter');
  await expect.poll(() => actionCount(page, 'post')).toBe(1);
  await settle(page, false);
  await expect(title).toHaveValue(original.title);
  await expect(body).toHaveValue(original.body);
  await expect(title).toBeFocused();
  const failureFocus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    label: document.activeElement?.getAttribute('aria-label'),
    placeholder: document.activeElement?.getAttribute('placeholder'),
  }));
  const error = live.locator('p');
  await expect(error).toHaveText('Could not share your request. Your words are still here. Please try again.');
  await expect(live).toHaveAttribute('aria-atomic', 'true');
  expect(await liveHandle!.evaluate(node => node.isConnected)).toBe(true);
  const contrast = await expectProblemNotice(error);
  await testInfo.attach('community-failure-contrast', { contentType: 'application/json', body: JSON.stringify(contrast, null, 2) });
  await testInfo.attach('community-failure-focus-restored', {
    contentType: 'application/json', body: JSON.stringify({
      failureFocus,
      scope: 'The rejected keyboard submission restores focus to its preserved title input when focus has not been deliberately moved elsewhere.',
    }, null, 2),
  });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();
  await submit.press('Enter');
  await expect.poll(() => actionCount(page, 'post')).toBe(2);
  await settle(page, true);
  await expect(page.getByRole('heading', { name: original.title.trim(), exact: true })).toHaveCount(1);
  await expect(live).toBeEmpty();
  await trigger.focus();
  await trigger.press('Enter');
  await expect(title).toHaveValue('');
  await expect(body).toHaveValue('');
});

test('keyboard RSVP failure restores the prior answer and faces with readable feedback', async ({ page }, testInfo) => {
  await openFixture(page, 'event');
  const live = page.getByTestId('fixture-content').locator('[aria-live="polite"]');
  const liveHandle = await live.elementHandle();
  await expect(live).toBeEmpty();
  const going = page.getByRole('button', { name: 'I’m in', exact: true });
  const maybe = page.getByRole('button', { name: 'Not sure yet', exact: true });
  await expect(maybe).toHaveAttribute('aria-pressed', 'true');
  await going.focus();
  await expect(going).toHaveCSS('outline-style', 'solid');
  await going.press('Enter');
  await expect(going).toBeDisabled();
  await expect.poll(() => actionCount(page, 'rsvp')).toBe(1);
  await settle(page, false);
  await expect(going).toBeEnabled();
  await expect(going).toHaveAttribute('aria-pressed', 'false');
  await expect(maybe).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Alex is in', { exact: true })).toBeVisible();
  await expect(page.getByText('You are in. Friday evening.', { exact: true })).toHaveCount(0);
  const error = live.locator('p');
  await expect(error).toHaveText('Could not save your answer. Your previous answer is still in place. Please try again.');
  expect(await liveHandle!.evaluate(node => node.isConnected)).toBe(true);
  const contrast = await expectProblemNotice(error);
  await testInfo.attach('rsvp-failure-contrast', { contentType: 'application/json', body: JSON.stringify(contrast, null, 2) });
  await going.focus();
  await going.press('Space');
  await expect.poll(() => actionCount(page, 'rsvp')).toBe(2);
  await settle(page, true);
  await expect(page.getByText('You are in. Friday evening.', { exact: true })).toBeVisible();
  await expect(page.getByText('Alex and You are in', { exact: true })).toBeVisible();
  await expect(live).toBeEmpty();
});

test('generic confirmation failure returns keyboard focus and uses readable problem feedback', async ({ page }, testInfo) => {
  // This is the shared confirmation component with a synthetic callback.
  // QuietQuestion and its care branch are deliberately not mounted here.
  await openFixture(page, 'delete');
  const live = page.getByTestId('fixture-content').locator('[aria-live="polite"]');
  const liveHandle = await live.elementHandle();
  await expect(live).toBeEmpty();
  const trigger = page.getByRole('button', { name: 'Delete fixture reflection', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const keep = page.getByRole('button', { name: 'Keep', exact: true });
  const confirm = page.getByRole('button', { name: 'Delete', exact: true });
  await expect(keep).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirm).toBeFocused();
  await confirm.press('Enter');
  await expect(page.getByRole('button', { name: 'Deleting…', exact: true })).toBeDisabled();
  await expect(keep).toBeDisabled();
  await expect.poll(() => actionCount(page, 'delete')).toBe(1);
  await settle(page, false);
  await expect(confirm).toBeFocused();
  const error = live.locator('p');
  await expect(error).toHaveText('Could not delete that. Please try again.');
  expect(await liveHandle!.evaluate(node => node.isConnected)).toBe(true);
  const contrast = await expectProblemNotice(error);
  await testInfo.attach('confirmation-failure-contrast', { contentType: 'application/json', body: JSON.stringify(contrast, null, 2) });
  await confirm.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(live).toBeEmpty();
  expect(await actionCount(page, 'delete')).toBe(1);
});

for (const width of [390, 1280]) {
  test(`injected 47px safe area preserves the row, title and header keyboard controls at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await openFixture(page, 'header', '/dashboard/lead/post');
    const header = page.getByTestId('safe-area-shell').locator('header');
    const row = header.locator(':scope > div');
    // Explicitly compare 0px and 47px injections. This validates the CSS layout,
    // not an actual iOS safe-area value, installed PWA, or native Clerk popup.
    const noInset = await page.addStyleTag({ content: '[data-testid="safe-area-shell"] > header { padding-top: 0px; }' });
    expect((await header.boundingBox())?.height).toBe(64);
    await noInset.evaluate(element => element.parentNode?.removeChild(element));
    await expect(header).toHaveCSS('padding-top', '47px');
    const headerBox = await header.boundingBox();
    const rowBox = await row.boundingBox();
    const title = header.getByText('Post something', { exact: true });
    const titleBox = await title.boundingBox();
    expect(headerBox?.height).toBe(111);
    expect(rowBox?.height).toBe(64);
    expect(rowBox!.y - headerBox!.y).toBe(47);
    expect(titleBox!.y).toBeGreaterThanOrEqual(rowBox!.y);
    expect(titleBox!.y + titleBox!.height).toBeLessThanOrEqual(rowBox!.y + rowBox!.height);
    expect(titleBox!.x).toBeGreaterThanOrEqual(rowBox!.x);
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width);
    await expect(header).toHaveCSS('backdrop-filter', 'none');
    await expect(page.getByTestId('fixture-content').getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.getByRole('button', { name: 'Reject pending action', exact: true }).focus();
    await page.keyboard.press('Tab');
    if (width < 1024) {
      const home = header.getByRole('link', { name: 'Home', exact: true });
      await expect(home).toBeFocused();
      await expect(home).toHaveCSS('outline-width', '2px');
      await page.keyboard.press('Tab');
    }
    const account = header.getByRole('button', { name: 'Account fixture', exact: true });
    await expect(account).toBeFocused();
    await expect(account).toHaveCSS('outline-style', 'solid');
    const smallTargets = await header.locator('a, button').evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      return rect.width >= 44 && rect.height >= 44 ? [] : [{ label: element.getAttribute('aria-label'), width: rect.width, height: rect.height }];
    }));
    expect(smallTargets).toEqual([]);
    await testInfo.attach('safe-area-geometry', {
      contentType: 'application/json',
      body: JSON.stringify({ width, header: headerBox, row: rowBox, title: titleBox, smallTargets, injectedInset: 47, physicalDevice: false }, null, 2),
    });
  });
}

test('email preference failure restores its previous value and announces the reason', async ({ page }, testInfo) => {
  const family = await openDashboardFamily(page, 'settings');
  const toggle = family.getByRole('switch');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.focus();
  await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(toggle).toBeDisabled();
  await expect(toggle).toHaveAttribute('aria-busy', 'true');
  await expect.poll(() => actionCount(page, 'email')).toBe(1);
  await settle(page, false);
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(toggle).toBeEnabled();
  const error = family.getByText('Could not save your email preference. Your previous setting is still in place. Please try again.', { exact: true });
  const contrast = await expectProblemNotice(error);
  await expect(error.locator('..')).toHaveAttribute('aria-live', 'polite');
  await testInfo.attach('email-failure-contrast', { contentType: 'application/json', body: JSON.stringify(contrast, null, 2) });
  await toggle.focus();
  await toggle.press('Enter');
  await settle(page, true);
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(toggle).toBeEnabled();
  await expect(error).toHaveCount(0);
  expect(await actionCount(page, 'email')).toBe(2);
});

test('clipboard rejection leaves a labelled selectable calendar link and readable recovery', async ({ page }, testInfo) => {
  // Replace only this fresh context's clipboard interface. No OS clipboard is
  // read or written, and the fixture URL contains no real subscription token.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new DOMException('Synthetic clipboard rejection', 'NotAllowedError'); },
    } });
  });
  const family = await openDashboardFamily(page, 'settings');
  const field = family.locator('input[readonly]');
  await expect(field).toHaveValue('https://calendar.example.invalid/fixture-feed.ics');
  expect(await field.getAttribute('aria-label') || await field.evaluate(element => (element as HTMLInputElement).labels?.length)).toBeTruthy();
  await expect(field).toHaveCSS('font-size', '16px');
  const copy = family.getByRole('button', { name: 'Copy my calendar link', exact: true });
  await copy.focus();
  await copy.press('Enter');
  const error = family.getByText('Could not copy the link. Select the calendar link above and copy it.', { exact: true });
  const contrast = await expectProblemNotice(error);
  await testInfo.attach('clipboard-failure-contrast', { contentType: 'application/json', body: JSON.stringify(contrast, null, 2) });
  await field.focus();
  const selection = await field.evaluate(element => {
    const input = element as HTMLInputElement;
    return { start: input.selectionStart, end: input.selectionEnd, length: input.value.length };
  });
  expect(selection.start).toBe(0);
  expect(selection.end).toBe(selection.length);
  expect((await copy.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect((await field.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

test('weekly availability disables overlapping input, rolls back failure and keeps 21 accessible targets', async ({ page }, testInfo) => {
  const family = await openDashboardFamily(page, 'availability');
  const cells = family.getByRole('button', { name: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Morning|Afternoon|Evening) (free|not free)$/ });
  await expect(cells).toHaveCount(21);
  const smallTargets = await cells.evaluateAll(elements => elements.flatMap(element => {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44 ? [] : [{ label: element.getAttribute('aria-label'), width: rect.width, height: rect.height }];
  }));
  expect(smallTargets).toEqual([]);
  const monday = family.getByRole('button', { name: /^Mon Morning / });
  await expect(monday).toHaveAttribute('aria-pressed', 'true');
  await monday.focus();
  await monday.press('Enter');
  await expect(monday).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => cells.evaluateAll(elements => elements.filter(element => (element as HTMLButtonElement).disabled).length)).toBe(21);
  await expect.poll(() => actionCount(page, 'weekly')).toBe(1);
  await monday.press('Space');
  expect(await actionCount(page, 'weekly')).toBe(1);
  await settle(page, false);
  await expect(monday).toHaveAttribute('aria-pressed', 'true');
  await expect(monday).toBeEnabled();
  const error = family.getByText('Could not save that time. Your previous availability is still in place. Please try again.', { exact: true });
  const contrast = await expectProblemNotice(error);
  await testInfo.attach('weekly-failure-contrast', { contentType: 'application/json', body: JSON.stringify({ ...contrast, targets: 21, smallTargets }, null, 2) });
  await monday.focus();
  await monday.press('Space');
  await settle(page, true);
  await expect(monday).toHaveAttribute('aria-pressed', 'false');
  await expect(monday).toBeEnabled();
  await expect(error).toHaveCount(0);
  expect(await actionCount(page, 'weekly')).toBe(2);
});

test('calendar connection failure keeps the exact synthetic URL available for correction', async ({ page }, testInfo) => {
  const family = await openDashboardFamily(page, 'availability');
  const open = family.getByRole('button', { name: 'Paste my calendar link', exact: true });
  await open.focus();
  await open.press('Enter');
  const field = family.getByLabel('Calendar link', { exact: true });
  await expect(field).toHaveCSS('font-size', '16px');
  const url = '  https://calendar.example.invalid/synthetic.ics  ';
  await field.fill(url);
  const connect = family.getByRole('button', { name: 'Connect', exact: true });
  await connect.focus();
  await connect.press('Enter');
  await expect.poll(() => actionCount(page, 'calendar-connect')).toBe(1);
  await expect(family.getByRole('button', { name: 'Connecting…', exact: true })).toBeDisabled();
  await settle(page, false);
  await expect(field).toHaveValue(url);
  await expect(connect).toBeEnabled();
  const error = family.getByText('Could not connect that calendar.', { exact: true });
  const contrast = await expectProblemNotice(error);
  await testInfo.attach('calendar-connect-failure-contrast', { contentType: 'application/json', body: JSON.stringify(contrast, null, 2) });
});

for (const operation of [
  { action: 'calendar-refresh', label: 'Check again', error: 'Could not check your calendar. Please try again.' },
  { action: 'calendar-disconnect', label: 'Disconnect', error: 'Could not disconnect your calendar. Please try again.' },
]) {
  test(`${operation.action} failure retains the connected calendar and announces recovery`, async ({ page }, testInfo) => {
    const family = await openDashboardFamily(page, 'availability', 'connected');
    const action = family.getByRole('button', { name: operation.label, exact: true });
    await expect(family.getByText('calendar.example.invalid', { exact: true })).toBeVisible();
    await action.focus();
    await action.press('Enter');
    await expect.poll(() => actionCount(page, operation.action)).toBe(1);
    await settle(page, false);
    await expect(action).toBeEnabled();
    await expect(family.getByText('calendar.example.invalid', { exact: true })).toBeVisible();
    const error = family.getByText(operation.error, { exact: true });
    const contrast = await expectProblemNotice(error);
    await testInfo.attach(`${operation.action}-contrast`, { contentType: 'application/json', body: JSON.stringify(contrast, null, 2) });
  });
}

test('feedback preserves category and exact draft on failure and clears only after confirmed success', async ({ page }, testInfo) => {
  const family = await openDashboardFamily(page, 'settings');
  const section = family.locator('section').filter({ has: page.getByRole('heading', { name: 'Tell us what to build next', exact: true }) });
  const category = section.getByRole('button', { name: 'Something is confusing', exact: true });
  await category.focus();
  await category.press('Space');
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  const field = section.getByLabel('Your feedback', { exact: true });
  await expect(field).toHaveCSS('font-size', '16px');
  const draft = '  Synthetic feedback with spacing.\nKeep the next line too.  ';
  await field.fill(draft);
  const send = section.getByRole('button', { name: 'Send feedback', exact: true });
  await send.focus();
  await send.press('Enter');
  await expect.poll(() => actionCount(page, 'feedback')).toBe(1);
  await expect(section.getByRole('button', { name: 'Sending…', exact: true })).toBeDisabled();
  await expect(section.getByText('Thank you. We read every one.', { exact: true })).toHaveCount(0);
  await settle(page, false);
  await expect(field).toHaveValue(draft);
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  const error = section.getByText('Could not send right now. Please try again.', { exact: true });
  const contrast = await expectProblemNotice(error);
  await testInfo.attach('feedback-failure-contrast', { contentType: 'application/json', body: JSON.stringify(contrast, null, 2) });
  await send.focus();
  await send.press('Enter');
  await settle(page, true);
  await expect(section.getByText('Thank you. We read every one.', { exact: true })).toBeVisible();
  const again = section.getByRole('button', { name: 'Send another', exact: true });
  expect((await again.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await expect(section.getByRole('status')).toHaveText('Feedback sent.');
  await expect(again).toBeFocused();
  await again.press('Enter');
  await expect(field).toHaveValue('');
  await expect(field).toBeFocused();
  expect(await actionCount(page, 'feedback')).toBe(2);
});

test('Google disconnect failure reports a readable error without claiming success', async ({ page }, testInfo) => {
  const family = await openDashboardFamily(page, 'settings', 'connected');
  const disconnect = family.getByRole('button', { name: 'Disconnect Google', exact: true });
  await disconnect.focus();
  await disconnect.press('Enter');
  await expect.poll(() => actionCount(page, 'google-disconnect')).toBe(1);
  await expect(family.getByRole('button', { name: 'Disconnecting', exact: true })).toBeDisabled();
  await settle(page, false);
  await expect(disconnect).toBeEnabled();
  const error = family.getByText('Something went wrong on the way back from Google. Try once more.', { exact: true });
  const contrast = await expectProblemNotice(error);
  await expect(error.locator('..')).toHaveAttribute('aria-live', 'polite');
  await expect(family.getByText('Disconnected. The Christ Fields calendar was removed from your Google Calendar.', { exact: true })).toHaveCount(0);
  await testInfo.attach('google-disconnect-failure', {
    contentType: 'application/json', body: JSON.stringify({ ...contrast,
      limitation: 'The synthetic rejection verifies failure presentation only. Router refresh is mocked; this does not establish the external connection state.',
    }, null, 2),
  });
});

test('a failed automatic calendar refresh clears its notice after a successful manual retry', async ({ page }) => {
  const family = await openDashboardFamily(page, 'availability', 'stale');
  await expect.poll(() => actionCount(page, 'calendar-refresh')).toBe(1);
  await settle(page, false);
  const error = family.getByText('Could not check your calendar. Please try again.', { exact: true });
  await expect(error).toBeVisible();
  const retry = family.getByRole('button', { name: 'Check again', exact: true });
  await retry.focus();
  await retry.press('Enter');
  await expect.poll(() => actionCount(page, 'calendar-refresh')).toBe(2);
  await settle(page, true);
  await expect(retry).toBeEnabled();
  await expect(error).toHaveCount(0);
});

const FAMILY_CONTROLS = 'a[href], button, input:not([type="hidden"]), textarea, select, summary, [tabindex]';

async function familyMeasurements(family: Locator) {
  return family.evaluate((root, selector) => {
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      return element.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const controls = Array.from(root.querySelectorAll(selector)).filter(visible);
    const smallTargets = controls.flatMap(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44 ? [] : [{
        tag: element.tagName, label: element.getAttribute('aria-label') ?? element.textContent?.trim(), width: rect.width, height: rect.height,
      }];
    });
    const smallInputs = controls.filter(element => ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
      .flatMap(element => parseFloat(getComputedStyle(element).fontSize) >= 16 ? [] : [{ tag: element.tagName, size: getComputedStyle(element).fontSize }]);
    const smallText: { text: string; size: number }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || !visible(parent) || parent.closest('[aria-hidden="true"]')) continue;
      const size = parseFloat(getComputedStyle(parent).fontSize);
      if (size < 13) smallText.push({ text: node.textContent.trim().slice(0, 70), size });
    }
    return { controls: controls.length, smallTargets, smallInputs, smallText,
      scrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
      familyScrollWidth: root.scrollWidth, familyClientWidth: root.clientWidth,
    };
  }, FAMILY_CONTROLS);
}

async function exposeCalendarForm(family: Locator) {
  const open = family.getByRole('button', { name: 'Paste my calendar link', exact: true });
  await open.focus();
  await open.press('Enter');
  await expect(family.getByLabel('Calendar link', { exact: true })).toBeVisible();
}

for (const which of ['settings', 'availability'] as const) {
  test(`${which} family fits the bounded phone, tablet, desktop and landscape matrix`, async ({ page }, testInfo) => {
    const reports = [];
    for (const viewport of [
      { width: 390, height: 844 }, { width: 768, height: 1024 },
      { width: 1280, height: 900 }, { width: 1920, height: 1080 },
      { width: 320, height: 844 }, { width: 820, height: 1180 }, { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      const family = await openDashboardFamily(page, which);
      if (which === 'availability') await exposeCalendarForm(family);
      const report = await familyMeasurements(family);
      reports.push({ viewport, ...report });
      expect(report.smallTargets, `${which} ${viewport.width}px targets`).toEqual([]);
      expect(report.smallInputs, `${which} ${viewport.width}px input text`).toEqual([]);
      expect(report.smallText, `${which} ${viewport.width}px text below 13px`).toEqual([]);
      expect(report.scrollWidth, `${which} ${viewport.width}px page overflow`).toBeLessThanOrEqual(report.viewportWidth);
      expect(report.familyScrollWidth, `${which} ${viewport.width}px family overflow`).toBeLessThanOrEqual(report.familyClientWidth);
      expect(await actionCount(page, 'weekly')).toBe(0);
      expect(await actionCount(page, 'email')).toBe(0);
      expect(await actionCount(page, 'calendar-connect')).toBe(0);
    }
    await testInfo.attach(`${which}-responsive-matrix`, { contentType: 'application/json', body: JSON.stringify({
      reports, scope: 'Only dashboard-family content; existing navigation typography debt and omitted PushSetup are excluded.',
    }, null, 2) });
  });

  test(`${which} family exposes a gold keyboard focus ring at every enabled control without activating services`, async ({ page }, testInfo) => {
    const family = await openDashboardFamily(page, which);
    if (which === 'availability') await exposeCalendarForm(family);
    const expectedCount = await family.evaluate((root, selector) => Array.from(root.querySelectorAll(selector)).filter(element => {
      const control = element as HTMLElement & { disabled?: boolean };
      return control.getClientRects().length > 0 && getComputedStyle(control).visibility !== 'hidden' && !control.disabled && control.tabIndex >= 0;
    }).length, FAMILY_CONTROLS);
    await page.getByRole('button', { name: 'Reject pending action', exact: true }).focus();
    const visited = new Set<number>();
    const stops = [];
    for (let press = 0; press < expectedCount + 30 && visited.size < expectedCount; press += 1) {
      await page.keyboard.press('Tab');
      // transition-colors also interpolates outline-color for 200ms. Await
      // the focused element's settled ring instead of sampling its first frame
      // (whose starting color is currentColor, e.g. the lighter gold text).
      await expect(page.locator(':focus')).toHaveCSS('outline-color', 'rgb(201, 165, 72)');
      const stop = await family.evaluate((root, selector) => {
        const controls = Array.from(root.querySelectorAll(selector)).filter(element => {
          const control = element as HTMLElement & { disabled?: boolean };
          return control.getClientRects().length > 0 && getComputedStyle(control).visibility !== 'hidden' && !control.disabled && control.tabIndex >= 0;
        });
        const index = controls.indexOf(document.activeElement!);
        if (index < 0) return null;
        const active = document.activeElement!;
        const style = getComputedStyle(active);
        return { index, tag: active.tagName, label: active.getAttribute('aria-label') ?? active.textContent?.trim(),
          focusVisible: active.matches(':focus-visible'), outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth), outlineColor: style.outlineColor,
        };
      }, FAMILY_CONTROLS);
      if (!stop) continue;
      visited.add(stop.index);
      stops.push(stop);
      expect(stop.focusVisible).toBe(true);
      expect(stop.outlineStyle).toBe('solid');
      expect(stop.outlineWidth).toBeGreaterThanOrEqual(2);
      expect(stop.outlineColor).toBe('rgb(201, 165, 72)');
    }
    expect(visited.size, 'The bounded native Tab walk must reach every enabled family control').toBe(expectedCount);
    const raw = await page.getByTestId('action-state').textContent();
    expect((JSON.parse(raw ?? '{}') as { calls?: object }).calls).toEqual({});
    await testInfo.attach(`${which}-keyboard-walk`, { contentType: 'application/json', body: JSON.stringify({
      expectedCount, visited: visited.size, stops, scope: 'Native Tab traversal and computed gold outlines; no service controls were activated.',
    }, null, 2) });
  });
}

test('settings remains usable under 200% CSS zoom emulation', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const family = await openDashboardFamily(page, 'settings');
  await page.addStyleTag({ content: '[data-testid="dashboard-family"] { zoom: 2; }' });
  const report = await familyMeasurements(family);
  expect(report.smallTargets).toEqual([]);
  expect(report.smallInputs).toEqual([]);
  expect(report.scrollWidth).toBeLessThanOrEqual(report.viewportWidth);
  expect(report.familyScrollWidth).toBeLessThanOrEqual(report.familyClientWidth);
  await testInfo.attach('settings-css-zoom', { contentType: 'application/json', body: JSON.stringify({
    ...report, zoom: 2,
    limitation: 'CSS zoom applied to dashboard-family content only. This is layout emulation, not browser-toolbar zoom, OS text scaling, or a physical-device test.',
  }, null, 2) });
});
