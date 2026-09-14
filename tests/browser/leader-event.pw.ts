import { expect, test, type Locator, type Page } from '@playwright/test';
import { eventTextContrast } from './helpers/event-contrast';

const ORIGIN = 'http://127.0.0.1:3100';
const faults = new WeakMap<Page, { requests: string[]; exceptions: string[] }>();
test.use({ baseURL: ORIGIN, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
test.setTimeout(60_000);
test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview(ORIGIN);
});
test.beforeEach(async ({ page }) => {
  const errors = { requests: [] as string[], exceptions: [] as string[] };
  faults.set(page, errors);
  page.on('pageerror', error => errors.exceptions.push(error.message));
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === ORIGIN && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    errors.requests.push(`${request.method()} ${url.origin}${url.pathname}`);
    return route.abort('blockedbyclient');
  });
  await page.clock.setFixedTime(new Date('2026-09-14T18:00:00Z'));
});
test.afterEach(async ({ page }, testInfo) => {
  const errors = faults.get(page)!;
  await testInfo.attach('leader-event-fixture-scope', { contentType: 'application/json', body: JSON.stringify({
    ...errors,
    scope: 'Actual LeaderStrip JSX with synthetic action results and a fixture reread on router.refresh. All nonlocal requests and HTTP mutations blocked.',
    excluded: 'Authenticated authorization, real member data, RSC transport, database writes, notifications and clipboard permissions on a real device.',
  }, null, 2) });
  expect(errors.requests, 'Unexpected external or mutating request').toEqual([]);
  expect(errors.exceptions, 'Unhandled browser exceptions').toEqual([]);
});

async function openPage(page: Page, variant = 'started', extra: Record<string, string> = {}) {
  await page.goto(`/leader.html?${new URLSearchParams({ variant, shell: '1', mode: 'manual', ...extra })}`);
  const family = page.getByTestId('leader-family');
  await expect(family.getByText('You lead this', { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return family;
}
async function ledger(page: Page) {
  return JSON.parse(await page.getByTestId('leader-action-state').textContent() ?? '{}');
}
async function calls(page: Page, action: string): Promise<number> {
  return (await ledger(page)).calls?.[action] ?? 0;
}
async function settle(page: Page, success: boolean) {
  // Settling a service stub must not steal focus from the interface under test.
  await page.getByRole('button', { name: success ? 'Resolve pending leader action' : 'Reject pending leader action', exact: true }).dispatchEvent('click');
}
async function activate(target: Locator) {
  await expect(target).toBeEnabled();
  await target.focus();
  await target.press('Enter');
}
async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 55; index += 1) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target, 'Reachable through a bounded native Tab walk').toBeFocused();
}
async function visibleFocus(target: Locator) {
  await expect(target).toBeFocused();
  await expect(target).toHaveCSS('outline-style', 'solid');
  await expect(target).toHaveCSS('outline-width', '2px');
  await expect(target).toHaveCSS('outline-color', 'rgb(201, 165, 72)');
}
function liveMessage(family: Locator, text: RegExp) {
  return family.locator('[aria-live="polite"]').filter({ hasText: text });
}
function thanksInput(family: Locator) {
  return family.getByLabel('A line of thanks (everyone sees it on Home for a week)', { exact: true });
}
async function openCancel(family: Locator) {
  const opener = family.getByRole('button', { name: 'Call it off', exact: true });
  await activate(opener);
  const reason = family.getByLabel(/Why is it off/);
  await expect(reason).toBeVisible();
  return { opener, reason };
}

test('roster disclosures work by keyboard and preserve the focused count button', async ({ page }) => {
  const family = await openPage(page, 'future');
  const going = family.getByRole('button', { name: /^\d+ in$/ });
  await tabTo(page, going);
  await visibleFocus(going);
  await expect(going).toHaveAttribute('aria-expanded', 'false');
  await going.press('Enter');
  await expect(going).toHaveAttribute('aria-expanded', 'true');
  await expect(family.getByText('Alex, Jordan', { exact: true })).toBeVisible();
  await visibleFocus(going);
  await going.press('Enter');
  await expect(going).toHaveAttribute('aria-expanded', 'false');
  const silent = family.getByRole('button', { name: /^\d+ (?:has|have) not answered$/ });
  await tabTo(page, silent);
  await visibleFocus(silent);
  await silent.press('Enter');
  await expect(silent).toHaveAttribute('aria-expanded', 'true');
  expect((await ledger(page)).pending).toEqual([]);
});

for (const transport of ['returned', 'throw']) {
  test(`thanks ${transport} failure preserves the exact draft and allows a confirmed retry`, async ({ page }) => {
    const family = await openPage(page, 'started', { transport, partial: '1' });
    const input = thanksInput(family);
    const submit = family.locator('form').filter({ has: page.getByLabel('A line of thanks (everyone sees it on Home for a week)', { exact: true }) }).locator('button[type="submit"]');
    await input.fill('  Thank you for making room for one another.  ');
    const refreshes = (await ledger(page)).refreshes;
    const liveRegions = await family.locator('[aria-live="polite"]').count();
    expect(liveRegions, 'A region must exist before an asynchronous result arrives').toBeGreaterThan(0);
    await activate(submit);
    await expect(input).toBeDisabled();
    await expect(submit).toBeDisabled();
    await submit.dispatchEvent('click');
    expect(await calls(page, 'postThanks')).toBe(1);
    await settle(page, false);
    await expect(input).toHaveValue('  Thank you for making room for one another.  ');
    await expect(submit).toBeEnabled();
    await expect(liveMessage(family, /Could not confirm/)).toBeVisible();
    expect(await family.locator('[aria-live="polite"]').count()).toBe(liveRegions);
    expect((await ledger(page)).refreshes).toBe(refreshes);
    await activate(submit);
    await settle(page, true);
    await expect(submit).toBeEnabled();
    await expect.poll(async () => (await ledger(page)).refreshes).toBe(refreshes + 1);
    await expect(liveMessage(family, /Could not confirm/)).toHaveCount(0);
    expect(await calls(page, 'postThanks')).toBe(2);
  });

  test(`cancellation ${transport} failure keeps its reason and never announces a completed cancellation`, async ({ page }) => {
    const family = await openPage(page, 'future', { transport, partial: '1' });
    const { reason } = await openCancel(family);
    await expect(reason).toBeFocused();
    await reason.fill('  The room is unavailable. Please keep this wording.  ');
    const confirm = family.locator('form').filter({ has: page.getByLabel(/Why is it off/) }).locator('button[type="submit"]');
    const keep = family.getByRole('button', { name: 'Keep it', exact: true });
    const refreshes = (await ledger(page)).refreshes;
    await activate(confirm);
    await expect(reason).toBeDisabled();
    await expect(keep).toBeDisabled();
    await expect(confirm).toBeDisabled();
    await confirm.dispatchEvent('click');
    expect(await calls(page, 'cancelEvent')).toBe(1);
    await settle(page, false);
    await expect(reason).toHaveValue('  The room is unavailable. Please keep this wording.  ');
    await expect(confirm).toBeEnabled();
    await expect(liveMessage(family, /Could not confirm/)).toBeVisible();
    expect((await ledger(page)).refreshes).toBe(refreshes);
    await activate(confirm);
    await settle(page, true);
    await expect(reason).toHaveCount(0);
    await expect(family.getByRole('link', { name: 'Change it', exact: true })).toHaveCount(0);
    await expect(family.getByRole('button', { name: 'Call it off', exact: true })).toHaveCount(0);
    await expect.poll(async () => (await ledger(page)).refreshes).toBe(refreshes + 1);
    expect(await calls(page, 'cancelEvent')).toBe(2);
    const focused = family.locator(':focus');
    await expect(focused).toHaveCount(1);
    await expect(focused).toContainText(/You lead this|Called off|called off/);
  });
}

test('cancellation keyboard dismissal returns focus; an intentional focus move survives settlement', async ({ page }) => {
  const family = await openPage(page, 'future');
  const opener = family.getByRole('button', { name: 'Call it off', exact: true });
  await tabTo(page, opener);
  await visibleFocus(opener);
  await opener.press('Enter');
  const reason = family.getByLabel(/Why is it off/);
  await visibleFocus(reason);
  await reason.fill('Keep the draft until I decide.');
  await activate(family.getByRole('button', { name: 'Keep it', exact: true }));
  await visibleFocus(opener);
  expect(await calls(page, 'cancelEvent')).toBe(0);
  await opener.press('Enter');
  await expect(reason).toHaveValue('Keep the draft until I decide.');
  await activate(family.getByRole('button', { name: 'Yes, call it off', exact: true }));
  const home = page.locator('header').getByRole('link', { name: 'Home', exact: true });
  await tabTo(page, home);
  await visibleFocus(home);
  await settle(page, true);
  await expect(reason).toHaveCount(0);
  await expect(home).toBeFocused();
});

test('individual attendance failures roll back each prior value and serialize writes', async ({ page }) => {
  for (const transport of ['returned', 'throw']) {
    const family = await openPage(page, 'started', { transport });
    const unmarked = family.getByRole('button', { name: /Alex$/ });
    const other = family.getByRole('button', { name: /Jordan$/ });
    await activate(unmarked);
    await expect(unmarked).toHaveAttribute('aria-pressed', 'true');
    await expect(unmarked).toBeDisabled();
    await expect(other).toBeDisabled();
    await other.dispatchEvent('click');
    expect(await calls(page, 'markAttendance')).toBe(1);
    await settle(page, false);
    await expect(unmarked).toHaveAttribute('aria-pressed', 'false');
    await expect(liveMessage(family, /Could not confirm/)).toBeVisible();
    const persisted = JSON.parse(await page.getByTestId('leader-view-state').textContent() ?? '{}');
    expect(persisted.going.find((person: { userId: string }) => person.userId === 'leader-alex').present).toBeNull();
    const marked = family.getByRole('button', { name: /Sam$/ });
    await activate(marked);
    await settle(page, false);
    await expect(marked).toHaveAttribute('aria-pressed', 'true');
    await activate(unmarked);
    await settle(page, true);
    await expect(unmarked).toHaveAttribute('aria-pressed', 'true');
    expect((await ledger(page)).history.filter((entry: { name: string }) => entry.name === 'markAttendance').map((entry: { args: unknown[] }) => entry.args))
      .toEqual([
        ['fixture-leader-event', 'leader-alex', true],
        ['fixture-leader-event', 'leader-sam', false],
        ['fixture-leader-event', 'leader-alex', true],
      ]);
    expect(await calls(page, 'markAttendance')).toBe(3);
  }
});

test('bulk attendance reports failure, then uses refreshed service data for only the going members', async ({ page }) => {
  const family = await openPage(page, 'started');
  const before = await family.locator('button[aria-pressed="false"]').allTextContents();
  const bulk = family.getByRole('button', { name: 'Everyone who said yes came', exact: true });
  const refreshes = (await ledger(page)).refreshes;
  await activate(bulk);
  await expect(family.locator('button[aria-pressed="false"]').first()).toBeDisabled();
  await settle(page, false);
  expect(await family.locator('button[aria-pressed="false"]').allTextContents()).toEqual(before);
  await expect(liveMessage(family, /Could not confirm/)).toBeVisible();
  expect((await ledger(page)).refreshes).toBe(refreshes);
  await activate(bulk);
  await settle(page, true);
  await expect.poll(async () => (await ledger(page)).refreshes).toBe(refreshes + 1);
  for (const name of ['Alex', 'Jordan', 'Sam']) await expect(family.getByRole('button', { name: new RegExp(`${name}$`) })).toHaveAttribute('aria-pressed', 'true');
  for (const name of ['Riley', 'Morgan', 'Taylor', 'Drew']) await expect(family.getByRole('button', { name: new RegExp(`${name}$`) })).toHaveAttribute('aria-pressed', 'false');
  expect(await calls(page, 'markEveryoneCame')).toBe(2);
});

test('bulk ok without changed service data never fabricates attendance', async ({ page }) => {
  const family = await openPage(page, 'started', { bulk: 'no-change' });
  const before = await family.locator('button[aria-pressed="false"]').allTextContents();
  await activate(family.getByRole('button', { name: 'Everyone who said yes came', exact: true }));
  await settle(page, true);
  await expect.poll(async () => (await ledger(page)).refreshes).toBe(1);
  expect(await family.locator('button[aria-pressed="false"]').allTextContents()).toEqual(before);
});

test('failed clipboard write exposes labelled, selected share text; retry confirms copying', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text: string) => {
        const state = window as typeof window & { copyAttempts?: string[]; copyAllowed?: boolean };
        (state.copyAttempts ??= []).push(text);
        if (!state.copyAllowed) throw new Error('Synthetic clipboard denial');
      },
    } });
  });
  const family = await openPage(page, 'future');
  const copy = family.getByRole('button', { name: 'Copy for the group chat', exact: true });
  await activate(copy);
  const fallback = family.getByLabel('Share text for the group chat', { exact: true });
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveAttribute('readonly', '');
  await expect(fallback).toBeFocused();
  expect(await fallback.evaluate(element => {
    const input = element as HTMLTextAreaElement;
    return input.selectionStart === 0 && input.selectionEnd === input.value.length && input.value.length > 0;
  })).toBe(true);
  await expect(liveMessage(family, /copy|clipboard/i)).toBeVisible();
  await page.evaluate(() => { (window as typeof window & { copyAllowed?: boolean }).copyAllowed = true; });
  await activate(copy);
  await expect(family.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  const attempts = await page.evaluate(() => (window as typeof window & { copyAttempts: string[] }).copyAttempts);
  expect(attempts).toHaveLength(2);
  expect(attempts[1]).toBe(attempts[0]);
});

test('nudge outcomes preserve exact delivery counts and announce without stealing deliberate focus', async ({ page }) => {
  const expected = {
    sent: /Sent 1 phone alert and 1 email\. 1 could not be emailed today; 1 has no way to be reached\. Paste the share text into the group chat for them\./,
    already: /Already nudged for this one\./,
    none: /Nobody could be reached right now\. Paste the share text into the group chat\./,
  };
  for (const nudge of ['sent', 'already', 'none'] as const) {
    const family = await openPage(page, 'future', { nudge, transport: nudge === 'already' ? 'throw' : 'returned' });
    // The visible pending label changes; the stable button keeps the original
    // label in its hidden sizing span until the request completes.
    const button = family.locator('button').filter({ hasText: /^Nudge / });
    await activate(button);
    await expect(button).toBeDisabled();
    await settle(page, false);
    await expect(button).toBeEnabled();
    await expect(liveMessage(family, /Could not/)).toBeVisible();
    await activate(button);
    const home = page.locator('header').getByRole('link', { name: 'Home', exact: true });
    await tabTo(page, home);
    await settle(page, true);
    await expect(liveMessage(family, expected[nudge])).toBeVisible();
    await expect(button).toHaveCount(0);
    await expect(home).toBeFocused();
    expect(await calls(page, 'nudgeEvent')).toBe(2);
  }
});

test('future, cancelled, empty and already-nudged states retain their conditional content', async ({ page }) => {
  let family = await openPage(page, 'future');
  await expect(thanksInput(family)).toHaveCount(0);
  await expect(family.getByRole('button', { name: 'Everyone who said yes came', exact: true })).toHaveCount(0);
  await expect(family.getByRole('link', { name: 'Change it', exact: true })).toBeVisible();
  family = await openPage(page, 'cancelled');
  await expect(thanksInput(family)).toHaveCount(0);
  await expect(family.getByRole('button', { name: 'Call it off', exact: true })).toHaveCount(0);
  await expect(family.getByRole('link', { name: 'Change it', exact: true })).toHaveCount(0);
  await expect(family.getByText('Questions that might come up', { exact: true })).toHaveCount(0);
  family = await openPage(page, 'empty');
  await activate(family.getByRole('button', { name: '0 in', exact: true }));
  await expect(family.getByText('Nobody.', { exact: true })).toBeVisible();
  family = await openPage(page, 'nudged');
  await expect(family.getByRole('button', { name: /^Nudge / })).toHaveCount(0);
  await expect(family.getByText('Nudged once already. Once is the limit.', { exact: true })).toBeVisible();
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
  test(`leader controls, error text and cancellation remain readable at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const family = await openPage(page);
    const reports = [await layoutReport(family)];
    await openCancel(family);
    reports.push(await layoutReport(family));
    await activate(family.getByRole('button', { name: 'Yes, call it off', exact: true }));
    await settle(page, false);
    const error = liveMessage(family, /Could not confirm/).locator('p');
    await expect(error).toBeVisible();
    const targets = [error, family.getByRole('button', { name: 'Yes, call it off', exact: true }), family.getByText('You lead this', { exact: true })];
    const contrast = [];
    for (const target of targets) {
      await target.scrollIntoViewIfNeeded();
      const measurement = await eventTextContrast(target);
      expect(measurement.unsupported).toEqual([]);
      expect(measurement.contrast).toBeGreaterThanOrEqual(measurement.threshold);
      contrast.push(measurement);
    }
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
    await testInfo.attach(`leader-event-layout-${width}`, { contentType: 'application/json', body: JSON.stringify({
      reports, contrast,
      contrastMethod: 'Browser-resolved solid-color alpha compositing. Unsupported paint effects fail; this is not screenshot pixel analysis.',
    }, null, 2) });
  });
}

test('long names and copy wrap at 320px and remain usable at a 200% CSS zoom reflow proxy', async ({ page }, testInfo) => {
  const reports = [];
  for (const zoom of [1, 2]) {
    await page.setViewportSize({ width: zoom === 1 ? 320 : 1280, height: 900 });
    const family = await openPage(page, 'long', { phase: 'started' });
    if (zoom === 2) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    await openCancel(family);
    const report = await layoutReport(family);
    expect(report.smallText).toEqual([]);
    expect(report.smallTargets).toEqual([]);
    const clipped = await family.evaluate(root => [...root.querySelectorAll('h1,h2,p,label,button,a')]
      .filter(element => element.getClientRects().length && element.scrollWidth > element.clientWidth + 1)
      .map(element => ({ text: element.textContent?.trim(), width: element.clientWidth, scrollWidth: element.scrollWidth })));
    expect(clipped, 'Text must wrap without clipping').toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    reports.push({ zoom, ...report });
  }
  await testInfo.attach('leader-event-reflow', { contentType: 'application/json', body: JSON.stringify({
    reports, limitation: 'CSS zoom is a reflow proxy, not a real browser UI zoom or a device test.',
  }, null, 2) });
});

test('routine leader content and cancellation appear immediately without entrance animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const family = await openPage(page);
  const unfinished = await family.evaluate(root => root.getAnimations({ subtree: true }).filter(animation => animation.playState !== 'finished').length);
  expect(unfinished).toBe(0);
  const { reason } = await openCancel(family);
  await expect(reason).toBeFocused();
  const entrance = await family.evaluate(root => {
    const style = getComputedStyle(root);
    return { opacity: style.opacity, transform: style.transform, clip: style.clipPath,
      animations: root.getAnimations({ subtree: true }).filter(animation => {
        if (animation.playState === 'finished') return false;
        const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
        return frames.some(frame => ['opacity', 'transform', 'translate', 'scale', 'clipPath', 'filter'].some(key => key in frame));
      }).length };
  });
  expect(entrance).toEqual({ opacity: '1', transform: 'none', clip: 'none', animations: 0 });
});
