import { expect, test, type Locator, type Page } from '@playwright/test';
import { eventTextContrast } from './helpers/event-contrast';

const ORIGIN = 'http://127.0.0.1:3100';
const errorsByPage = new WeakMap<Page, { requests: string[]; pageErrors: string[] }>();
test.use({ baseURL: ORIGIN, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
test.setTimeout(60_000);
test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview(ORIGIN);
});
test.beforeEach(async ({ page }) => {
  const errors = { requests: [] as string[], pageErrors: [] as string[] };
  errorsByPage.set(page, errors);
  page.on('pageerror', error => errors.pageErrors.push(error.message));
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === ORIGIN && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    errors.requests.push(`${request.method()} ${url.origin}${url.pathname}`);
    return route.abort('blockedbyclient');
  });
  await page.clock.setFixedTime(new Date('2026-09-14T18:00:00Z'));
});
test.afterEach(async ({ page }, testInfo) => {
  const errors = errorsByPage.get(page)!;
  await testInfo.attach('member-event-fixture-scope', { contentType: 'application/json', body: JSON.stringify({
    ...errors,
    scope: 'Actual EventPage/component JSX, synthetic action return values and fixture-only reread after refresh. External requests and HTTP mutations blocked.',
    excluded: 'Authenticated authorization, real data, RSC transport, notifications, token minting and calendar download execution.',
  }, null, 2) });
  expect(errors.requests, 'Unexpected external or mutating browser request').toEqual([]);
  expect(errors.pageErrors, 'Unhandled browser exceptions').toEqual([]);
});

async function openPage(page: Page, variant = 'answered', extra: Record<string, string> = {}) {
  const query = new URLSearchParams({ case: 'event-page', shell: '1', mode: 'manual', variant, ...extra });
  await page.goto(`/?${query}`);
  const family = page.getByTestId('dashboard-family');
  await expect(family.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return { family, card: family.locator('article').first() };
}
async function calls(page: Page, action: string) {
  const snapshot = JSON.parse(await page.getByTestId('action-state').textContent() ?? '{}');
  return snapshot.calls?.[action] ?? 0;
}
async function settle(page: Page, success: boolean) {
  // Deliberately preserve the app's active element when settling the mock.
  await page.getByRole('button', { name: success ? 'Resolve pending action' : 'Reject pending action', exact: true }).dispatchEvent('click');
}
async function activate(button: Locator) {
  await expect(button).toBeEnabled();
  await button.focus();
  await button.press('Enter');
}
async function tabTo(page: Page, target: Locator) {
  for (let count = 0; count < 55; count += 1) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target, 'Reachable through a bounded native Tab walk').toBeFocused();
}
async function keyboardFocus(target: Locator) {
  await expect(target).toBeFocused();
  await expect(target).toHaveCSS('outline-style', 'solid');
  await expect(target).toHaveCSS('outline-width', '2px');
  await expect(target).toHaveCSS('outline-color', 'rgb(201, 165, 72)');
}
function planSection(family: Locator) {
  return family.locator('section').filter({ hasText: 'When will you head out?' });
}
function slot(family: Locator, label: string) {
  return family.locator('li').filter({ hasText: label });
}
async function openRide(page: Page, family: Locator) {
  const opener = family.getByRole('button', { name: 'I can drive', exact: true });
  await activate(opener);
  const origin = family.getByLabel('Leaving from (optional)', { exact: true });
  await expect(origin).toBeVisible();
  return { opener, origin };
}

test('RSVP keyboard path rolls back exact answer and faces, then confirms and restores the selected choice', async ({ page }) => {
  const { card } = await openPage(page);
  const going = card.getByRole('button', { name: 'I’m in', exact: true });
  const maybe = card.getByRole('button', { name: 'Not sure yet', exact: true });
  const faces = card.getByText('Alex and Jordan are in, 1 not sure', { exact: true });
  await expect(going).toHaveAttribute('aria-pressed', 'true');
  await tabTo(page, maybe);
  await keyboardFocus(maybe);
  await maybe.press('Enter');
  await expect(maybe).toBeDisabled();
  await expect(going).toBeDisabled();
  await expect(card.getByText(/^You are in\./)).toHaveCount(0);
  await settle(page, false);
  await expect(going).toHaveAttribute('aria-pressed', 'true');
  await expect(maybe).toHaveAttribute('aria-pressed', 'false');
  await expect(faces).toBeVisible();
  await keyboardFocus(maybe);
  await expect(card.locator('[aria-live="polite"]')).toContainText('Could not save your answer.');
  await activate(going);
  await expect.poll(() => calls(page, 'rsvp')).toBe(2);
  await settle(page, true);
  const confirmation = card.getByText(/^You are in\./);
  await expect(confirmation).toBeFocused();
  await expect(card.getByRole('link', { name: 'Put it on my Google Calendar', exact: true })).toBeVisible();
  const ics = card.getByRole('link', { name: 'Apple or Outlook', exact: true });
  await expect(ics).toHaveAttribute('href', '/api/ics/event/fixture-event');
  await activate(card.getByRole('button', { name: 'Change my answer', exact: true }));
  await keyboardFocus(going);
});

test('RSVP settlement respects a deliberate move to the header instead of stealing focus', async ({ page }) => {
  for (const success of [false, true]) {
    const { card } = await openPage(page, 'member');
    await activate(card.getByRole('button', { name: 'I’m in', exact: true }));
    const home = page.locator('header').getByRole('link', { name: 'Home', exact: true });
    await tabTo(page, home);
    await keyboardFocus(home);
    await settle(page, success);
    if (success) await expect(card.getByText(/^You are in\./)).toBeVisible();
    else await expect(card.locator('[aria-live="polite"]')).toContainText('Could not save your answer.');
    await expect(home).toBeFocused();
  }
});

for (const transport of ['returned', 'throw']) {
  test(`plan ${transport} failure restores the exact previous choice and blocks duplicate input`, async ({ page }) => {
    const { family } = await openPage(page, 'answered', { transport });
    const plan = planSection(family);
    const original = plan.getByRole('button', { name: 'Right after work', exact: true });
    const next = plan.getByRole('button', { name: 'About an hour before', exact: true });
    await expect(original).toHaveAttribute('aria-pressed', 'true');
    await activate(next);
    for (const button of await plan.getByRole('button').all()) await expect(button).toBeDisabled();
    await next.dispatchEvent('click');
    expect(await calls(page, 'plan')).toBe(1);
    await settle(page, false);
    await expect(original).toHaveAttribute('aria-pressed', 'true');
    await expect(next).toHaveAttribute('aria-pressed', 'false');
    await expect(plan.locator('[aria-live="polite"]')).not.toBeEmpty();
    await activate(next);
    await settle(page, true);
    await expect(next).toHaveAttribute('aria-pressed', 'true');
    await expect(next).toBeEnabled();
    // Deselecting the current choice must roll back to that same saved choice.
    await activate(next);
    await settle(page, false);
    await expect(next).toHaveAttribute('aria-pressed', 'true');
    await expect(original).toHaveAttribute('aria-pressed', 'false');
  });

  test(`ride ${transport} failure preserves origin and seats; retry refreshes the synthetic slot`, async ({ page }) => {
    const { family } = await openPage(page);
    if (transport === 'throw') await openPage(page, 'answered', { transport });
    const { opener, origin } = await openRide(page, family);
    await expect(origin).toBeFocused();
    await origin.fill('  The old library  ');
    const seats = family.getByRole('button', { name: '4 seats', exact: true });
    await activate(seats);
    await expect(seats).toHaveAttribute('aria-pressed', 'true');
    const offer = family.getByRole('button', { name: 'Offer seats', exact: true });
    await activate(offer);
    await expect(origin).toBeDisabled();
    await expect(seats).toBeDisabled();
    await expect(family.getByRole('button', { name: 'Never mind', exact: true })).toBeDisabled();
    await expect.poll(() => calls(page, 'ride')).toBe(1);
    await settle(page, false);
    await expect(origin).toHaveValue('  The old library  ');
    await expect(seats).toHaveAttribute('aria-pressed', 'true');
    await expect(family.locator('[aria-live="polite"]').filter({ hasText: /Could not/ })).toBeVisible();
    await expect(offer).toBeEnabled();
    await activate(offer);
    await settle(page, true);
    await expect(origin).toHaveCount(0);
    await expect(opener).toBeFocused();
    const offered = family.locator('li').filter({ hasText: /From\s+The old library\s+with You/ });
    await expect(offered).toBeVisible();
    await expect(offered).toContainText('4 open');
    expect(await calls(page, 'ride')).toBe(2);
  });
}

test('ride keyboard open and cancel restore focus and keep its draft without sending anything', async ({ page }) => {
  const { family } = await openPage(page);
  const opener = family.getByRole('button', { name: 'I can drive', exact: true });
  await tabTo(page, opener);
  await keyboardFocus(opener);
  await opener.press('Enter');
  const origin = family.getByLabel('Leaving from (optional)', { exact: true });
  await keyboardFocus(origin);
  await origin.fill('Keep this place');
  await page.keyboard.press('Tab');
  await keyboardFocus(family.getByRole('button', { name: 'Offer seats', exact: true }));
  await page.keyboard.press('Tab');
  const cancel = family.getByRole('button', { name: 'Never mind', exact: true });
  await keyboardFocus(cancel);
  await cancel.press('Enter');
  await keyboardFocus(opener);
  await opener.press('Enter');
  await expect(origin).toHaveValue('Keep this place');
  expect(await calls(page, 'ride')).toBe(0);
});

for (const transport of ['returned', 'throw']) {
  test(`slot ${transport} failures stay visible; successful claim and undo survive fixture refresh`, async ({ page }) => {
    const { family } = await openPage(page, 'answered', { transport });
    const row = slot(family, 'Something green for the table');
    const claim = row.getByRole('button', { name: 'I will bring it', exact: true });
    await activate(claim);
    await expect(row.getByRole('button')).toBeDisabled();
    await expect(row.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    await settle(page, false);
    await expect(claim).toBeEnabled();
    await expect(row.locator('[aria-live="polite"]')).not.toBeEmpty();
    await expect(row).toContainText('Nobody yet');
    await activate(claim);
    await settle(page, true);
    const undo = row.getByRole('button', { name: 'Undo', exact: true });
    await expect(undo).toBeEnabled();
    await expect(row).toContainText('You are bringing this');
    await activate(undo);
    await settle(page, false);
    await expect(undo).toBeEnabled();
    await expect(row).toContainText('You are bringing this');
    await activate(undo);
    await settle(page, true);
    await expect(claim).toBeEnabled();
    await expect(row).toContainText('Nobody yet');
    expect(await calls(page, 'claim')).toBe(2);
    expect(await calls(page, 'unclaim')).toBe(2);
    await expect(slot(family, 'Bread to share').getByRole('button', { name: 'Taken', exact: true })).toBeDisabled();
  });
}

test('member, later and cancelled variants retain their existing conditional content', async ({ page }) => {
  let { family, card } = await openPage(page, 'member');
  await expect(card.getByRole('button', { pressed: true })).toHaveCount(0);
  await expect(family.getByText('When will you head out?', { exact: true })).toHaveCount(0);
  await expect(family.getByText('Bring something', { exact: true })).toBeVisible();
  ({ family, card } = await openPage(page, 'later'));
  await expect(family.getByText('When will you head out?', { exact: true })).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'I’m in', exact: true })).toHaveAttribute('aria-pressed', 'true');
  ({ family, card } = await openPage(page, 'cancelled'));
  await expect(card.getByText('Called off', { exact: true })).toBeVisible();
  await expect(card).toContainText('The room is unavailable. We will find another evening.');
  await expect(card.getByRole('button')).toHaveCount(0);
  await expect(family.getByText('Bring something', { exact: true })).toHaveCount(0);
  await expect(family.getByText('When will you head out?', { exact: true })).toHaveCount(0);
  await expect(family.getByRole('button', { name: 'I can drive', exact: true })).toHaveCount(0);
});

async function layoutReport(family: Locator) {
  return family.evaluate(root => {
    const visible = (element: Element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility === 'visible'
      && !element.closest('[aria-hidden="true"]');
    const controls = [...root.querySelectorAll('a[href],button,input,textarea,summary')].filter(visible).map(element => {
      const rect = element.getBoundingClientRect();
      return { text: element.getAttribute('aria-label') ?? element.textContent?.trim(), width: rect.width, height: rect.height };
    });
    const smallText: { text: string; size: number }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || !visible(parent)) continue;
      const size = parseFloat(getComputedStyle(parent).fontSize);
      if (size < 13) smallText.push({ text: node.textContent.trim(), size });
    }
    const inputs = [...root.querySelectorAll('input,textarea')].filter(visible).map(element => ({
      size: parseFloat(getComputedStyle(element).fontSize), labels: (element as HTMLInputElement).labels?.length ?? 0,
      scheme: getComputedStyle(element).colorScheme,
    }));
    return { smallText, smallTargets: controls.filter(control => control.width < 43.99 || control.height < 43.99), inputs,
      viewport: innerWidth, documentWidth: document.documentElement.scrollWidth };
  });
}

for (const width of [390, 1280]) {
  test(`member event and ride controls remain readable and at least 44px at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const { family, card } = await openPage(page);
    const reports = [await layoutReport(family)];
    await openRide(page, family);
    reports.push(await layoutReport(family));
    await activate(family.getByRole('button', { name: 'Never mind', exact: true }));
    await activate(card.getByRole('button', { name: 'I’m in', exact: true }));
    await settle(page, true);
    await expect(card.getByText(/^You are in\./)).toBeVisible();
    reports.push(await layoutReport(family));
    for (const report of reports) {
      expect(report.smallText).toEqual([]);
      expect(report.smallTargets).toEqual([]);
      expect(report.documentWidth).toBeLessThanOrEqual(width);
      for (const input of report.inputs) {
        expect(input.size).toBeGreaterThanOrEqual(16);
        expect(input.labels).toBeGreaterThanOrEqual(1);
        expect(input.scheme).toBe('dark');
      }
    }
    await testInfo.attach(`member-event-layout-${width}`, { contentType: 'application/json', body: JSON.stringify(reports, null, 2) });
  });
}

test('long content remains contained and readable at 320px including the five-seat selector', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const { family } = await openPage(page, 'long');
  await openRide(page, family);
  const report = await layoutReport(family);
  expect(report.documentWidth).toBeLessThanOrEqual(320);
  expect(report.smallTargets).toEqual([]);
  expect(report.smallText).toEqual([]);
  const clipped = await family.evaluate(root => [...root.querySelectorAll('h1,p,label,button,a')]
    .filter(element => element.getClientRects().length && element.scrollWidth > element.clientWidth + 1)
    .map(element => ({ text: element.textContent?.trim(), width: element.clientWidth, scrollWidth: element.scrollWidth })));
  expect(clipped, 'Text must wrap without horizontal clipping').toEqual([]);
});

test('all five event chips meet rendered text contrast in their composited card background', async ({ page }, testInfo) => {
  const reports = [];
  for (const type of ['gathering', 'meal', 'outing', 'serve', 'celebration']) {
    const { card } = await openPage(page, 'member', { type });
    const chip = card.getByText(type[0].toUpperCase() + type.slice(1), { exact: true });
    await chip.scrollIntoViewIfNeeded();
    const report = await eventTextContrast(chip);
    reports.push({ type, ...report });
    expect(report.unsupported).toEqual([]);
    expect(report.fontSize).toBeGreaterThanOrEqual(13);
    expect(report.contrast).toBeGreaterThanOrEqual(report.threshold);
  }
  await testInfo.attach('member-event-chip-contrast', { contentType: 'application/json', body: JSON.stringify({
    reports, method: 'Browser-resolved solid foreground/background colors with alpha compositing. Not screenshot pixel analysis; unsupported paint effects fail.',
  }, null, 2) });
});

test('routine event content and ride form are immediately available without entrance animation under normal motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const { family } = await openPage(page);
  const unfinished = await family.evaluate(root => root.getAnimations({ subtree: true }).filter(animation => animation.playState !== 'finished').map(animation => animation.playState));
  expect(unfinished).toEqual([]);
  const { origin } = await openRide(page, family);
  await expect(origin).toBeFocused();
  const entrance = await origin.evaluate(input => {
    const form = input.closest('form') ?? input.parentElement!;
    return { opacity: getComputedStyle(form).opacity, transform: getComputedStyle(form).transform,
      clip: getComputedStyle(form).clipPath, animations: form.getAnimations({ subtree: true }).filter(animation => {
        if (animation.playState === 'finished') return false;
        const keyframes = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
        // Input focus can legitimately animate border/color feedback. Entrance
        // effects would animate one of these properties on content instead.
        return keyframes.some(frame => ['opacity', 'transform', 'translate', 'scale', 'clipPath', 'filter'].some(key => key in frame));
      }).length };
  });
  expect(entrance).toEqual({ opacity: '1', transform: 'none', clip: 'none', animations: 0 });
});
