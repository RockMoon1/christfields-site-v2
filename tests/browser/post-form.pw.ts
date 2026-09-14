import { expect, test, type Locator, type Page } from '@playwright/test';
import { eventTextContrast } from './helpers/event-contrast';

const ORIGIN = 'http://127.0.0.1:3100';
const faults = new WeakMap<Page, { requests: string[]; exceptions: string[] }>();
test.use({ baseURL: ORIGIN, viewport: { width: 390, height: 844 }, timezoneId: 'America/Denver', reducedMotion: 'reduce', serviceWorkers: 'block' });
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
  await testInfo.attach('post-form-fixture-scope', { contentType: 'application/json', body: JSON.stringify({
    ...errors,
    scope: 'Actual PostForm and WhoIsFree JSX with synthetic create/update/availability boundaries. Router navigation is recorded as an intent only. Nonlocal requests and HTTP mutations blocked.',
    excluded: 'Authentication, real data, RSC transport, actual Next.js navigation, persistence, notifications, Bible text fetching and device-native date pickers.',
  }, null, 2) });
  expect(errors.requests, 'Unexpected external or mutating request').toEqual([]);
  expect(errors.exceptions, 'Unhandled browser exceptions').toEqual([]);
});

async function openPage(page: Page, form = 'create', extra: Record<string, string> = {}) {
  await page.goto(`/post.html?${new URLSearchParams({ form, shell: '1', mode: 'manual', ...extra })}`);
  const family = page.getByTestId('post-family');
  await expect(family.getByLabel('What', { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return family;
}
async function ledger(page: Page) {
  return JSON.parse(await page.getByTestId('post-action-state').textContent() ?? '{}');
}
async function settle(page: Page, success: boolean, name?: string, id?: number) {
  // Resolve the synthetic boundary without moving focus into fixture controls.
  await page.evaluate(detail => window.dispatchEvent(new CustomEvent('fixture-post-settle', { detail })), { success, name, id });
}
async function activate(target: Locator) {
  await expect(target).toBeEnabled();
  await target.focus();
  await target.press('Enter');
}
async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 75; index += 1) {
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
const primary = (family: Locator) => family.locator('button[type="submit"]');
const more = (family: Locator) => family.getByRole('button', { name: /^(?:More|Less)\b/ });
const word = (family: Locator) => family.getByRole('button', { name: /^From the Word\b/ });
const message = (family: Locator, text: RegExp) => family.locator('[aria-live="polite"]').filter({ hasText: text });
const input = (family: Locator, label: string) => family.getByLabel(label, { exact: true });
const group = (family: Locator, name: string) => family.getByRole('group', { name: 'Group', exact: true }).getByRole('button', { name, exact: true });
async function expand(family: Locator, scripture = false) {
  if (await more(family).getAttribute('aria-expanded') !== 'true') await activate(more(family));
  if (scripture && await word(family).getAttribute('aria-expanded') !== 'true') await activate(word(family));
}
async function draft(family: Locator) {
  return family.locator('input,textarea').evaluateAll(elements => elements.map(element => {
    const control = element as HTMLInputElement;
    return { id: control.id, value: control.value, checked: control.type === 'checkbox' ? control.checked : undefined };
  }));
}
async function noPost(page: Page) {
  const state = await ledger(page);
  expect(state.calls.createEvent).toBe(0);
  expect(state.calls.updateEvent).toBe(0);
  expect(state.navigations).toEqual([]);
  expect(state.refreshes).toBe(0);
}

test('required What and When errors focus and identify the field before any action', async ({ page }) => {
  const family = await openPage(page, 'create', { variant: 'empty' });
  const title = input(family, 'What'), when = input(family, 'When');
  await tabTo(page, primary(family));
  await visibleFocus(primary(family));
  await primary(family).press('Enter');
  await visibleFocus(title);
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  await expect(message(family, /Give it a name/)).toBeVisible();
  await title.fill('An evening at the table');
  await activate(primary(family));
  await visibleFocus(when);
  await expect(when).toHaveAttribute('aria-invalid', 'true');
  await expect(message(family, /Pick a day and time/)).toBeVisible();
  await noPost(page);
});

test('invalid hidden passage reopens More and Word, preserves the draft and focuses Passage', async ({ page }) => {
  const family = await openPage(page);
  await expand(family, true);
  await input(family, 'Passage').fill('not a passage reference');
  await input(family, 'The words (paste them if you want people to read them here)').fill('Synthetic supplied wording to keep.');
  await activate(more(family));
  await expect(input(family, 'Passage')).not.toBeVisible();
  await expect(word(family)).toHaveAttribute('aria-expanded', 'false');
  await activate(primary(family));
  await expect(more(family)).toHaveAttribute('aria-expanded', 'true');
  await expect(word(family)).toHaveAttribute('aria-expanded', 'true');
  await visibleFocus(input(family, 'Passage'));
  await expect(input(family, 'Passage')).toHaveAttribute('aria-invalid', 'true');
  await expect(input(family, 'Passage')).toHaveValue('not a passage reference');
  await expect(input(family, 'The words (paste them if you want people to read them here)')).toHaveValue('Synthetic supplied wording to keep.');
  await expect(message(family, /Write the passage/)).toBeVisible();
  await noPost(page);
});

test('end at or before start is rejected without silently changing either time', async ({ page }) => {
  const family = await openPage(page);
  await expand(family);
  const when = input(family, 'When'), ends = input(family, 'Ends (optional)');
  for (const value of ['2026-09-18T18:00', '2026-09-18T19:00']) {
    await ends.fill(value);
    await activate(primary(family));
    await visibleFocus(ends);
    await expect(ends).toHaveAttribute('aria-invalid', 'true');
    await expect(ends).toHaveValue(value);
    await expect(when).toHaveValue('2026-09-18T19:00');
    await expect(message(family, /end|finish/i)).toBeVisible();
    await noPost(page);
  }
  await ends.fill('2026-09-18T20:00');
  await activate(primary(family));
  await expect.poll(async () => (await ledger(page)).calls.createEvent).toBe(1);
});

for (const form of ['create', 'edit']) {
  for (const transport of ['returned', 'throw']) {
    test(`${form} ${transport} failure preserves every draft field and blocks duplicate posting`, async ({ page }) => {
      const family = await openPage(page, form, { transport, partial: '1', variant: 'multigroup' });
      await expand(family, true);
      await input(family, 'What').fill('  A carefully worded invitation  ');
      await input(family, 'Passage').fill('Romans 12:1-2');
      await input(family, 'The words (paste them if you want people to read them here)').fill('Keep these synthetic supplied words.\nAnd this second line.');
      const before = await draft(family);
      const liveRegions = await family.locator('[aria-live="polite"]').count();
      expect(liveRegions).toBeGreaterThan(0);
      await primary(family).focus();
      await primary(family).evaluate(element => {
        const submit = element as HTMLButtonElement;
        // Two native submit requests in one browser task exercise the guard
        // before a render can be relied on to disable a second interaction.
        submit.form!.requestSubmit(submit);
        submit.form!.requestSubmit(submit);
      });
      const editable = family.locator('input,textarea,button');
      for (const control of await editable.all()) await expect(control).toBeDisabled();
      await family.locator('form').evaluate(element => {
        element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      const action = form === 'create' ? 'createEvent' : 'updateEvent';
      expect((await ledger(page)).calls[action]).toBe(1);
      await settle(page, false, action);
      await expect(primary(family)).toBeEnabled();
      expect(await draft(family)).toEqual(before);
      await expect(message(family, /Could not confirm|could not confirm/)).toBeVisible();
      if (transport === 'throw') await expect(message(family, /Could not confirm|could not confirm/)).not.toContainText('transport failure');
      expect(await family.locator('[aria-live="polite"]').count()).toBe(liveRegions);
      const state = await ledger(page);
      expect(state.navigations).toEqual([]);
      expect(state.refreshes).toBe(0);
      expect(state.history.find((item: { name: string }) => item.name === action).persisted).toBe(true);
      // A partial write is possible: the UI must retain uncertainty, not claim
      // nothing was saved or automatically repeat the request.
      expect(state.calls[action]).toBe(1);
    });
  }
}

for (const quiet of [false, true]) {
  test(`create ${quiet ? 'quiet' : 'announced'} preserves the complete supplied payload and records success navigation`, async ({ page }) => {
    const family = await openPage(page);
    await expand(family, true);
    const supplied = {
      title: '  Come share a table  ', location: '  The community room  ', description: 'One supplied line, unchanged.',
      memberNote: '  First member prompt\nSecond member prompt  ', leaderNote: 'Private leader preparation, exactly as supplied.',
      scriptureText: '  Synthetic supplied words.\nSecond line.  ', scriptureWhy: 'A supplied reason, not generated interpretation.',
      discussion: 'First supplied question?\nSecond supplied question?', contextNotes: '  Synthetic private context.  ',
    };
    await input(family, 'What').fill(supplied.title);
    await input(family, 'Where').fill(supplied.location);
    await input(family, 'One line for people').fill(supplied.description);
    await input(family, 'Ends (optional)').fill('2026-09-18T20:00');
    await input(family, 'Two things people could ask each other').fill(supplied.memberNote);
    await input(family, 'Questions that might come up (only you see this)').fill(supplied.leaderNote);
    await input(family, 'Passage').fill('  Romans 12:1-2  ');
    await input(family, 'The words (paste them if you want people to read them here)').fill(supplied.scriptureText);
    await input(family, 'Why this passage, in one line').fill(supplied.scriptureWhy);
    await input(family, 'Questions for the group (up to three, one per line)').fill(supplied.discussion);
    await input(family, 'Context for you (history, who wrote it and why; only leaders see this)').fill(supplied.contextNotes);
    await input(family, 'Bring something (one per line)').fill(' Bread\nFruit, Cups\n\n ');
    await input(family, 'Let people offer and ask for rides').uncheck();
    await activate(family.getByRole('button', { name: '12 weeks', exact: true }));
    await activate(quiet ? family.getByRole('button', { name: 'Save quietly', exact: true }) : primary(family));
    const state = await ledger(page);
    expect(state.history.find((item: { name: string }) => item.name === 'createEvent').args).toEqual([{
      orgId: 'fixture-post-group-a', ...supplied, type: 'gathering', startsAt: '2026-09-19T01:00:00.000Z',
      endsAt: '2026-09-19T02:00:00.000Z', tz: 'America/Denver', weeks: 12, bringItems: ['Bread', 'Fruit', 'Cups'],
      ridesEnabled: false, notify: !quiet, scriptureRef: 'Romans 12:1-2',
    }]);
    expect(state.navigations).toEqual([]);
    await settle(page, true, 'createEvent');
    await expect.poll(async () => (await ledger(page)).navigations).toEqual([{ method: 'push', destination: '/dashboard/e/fixture-post-created' }]);
    expect((await ledger(page)).refreshes).toBe(1);
    expect(new URL(page.url()).pathname, 'Fixture records routing intent; it does not verify real navigation').toBe('/post.html');
  });
}

test('series edit preserves supplied content while sending following scope and the selected notification setting', async ({ page }) => {
  const family = await openPage(page, 'series');
  await expand(family, true);
  await expect(family.getByRole('group', { name: 'Group', exact: true })).toHaveCount(0);
  await expect(input(family, 'Bring something (one per line)')).toHaveCount(0);
  await activate(family.getByRole('button', { name: 'This and the following ones', exact: true }));
  await input(family, 'Tell everyone about this change (only if the time or place moved)').uncheck();
  const fields = {
    scriptureRef: await input(family, 'Passage').inputValue(),
    scriptureText: await input(family, 'The words (paste them if you want people to read them here)').inputValue(),
    scriptureWhy: await input(family, 'Why this passage, in one line').inputValue(),
    discussion: await input(family, 'Questions for the group (up to three, one per line)').inputValue(),
    contextNotes: await input(family, 'Context for you (history, who wrote it and why; only leaders see this)').inputValue(),
    memberNote: await input(family, 'Two things people could ask each other').inputValue(),
    leaderNote: await input(family, 'Questions that might come up (only you see this)').inputValue(),
  };
  await activate(primary(family));
  const action = (await ledger(page)).history.find((item: { name: string }) => item.name === 'updateEvent');
  expect(action.args[0]).toBe('fixture-post-existing');
  expect(action.args[1]).toEqual({ title: 'A table for the whole group', type: 'gathering', startsAt: '2026-09-19T01:00:00.000Z', endsAt: null,
    location: 'Synthetic community room', description: 'Bring a little food, meet someone new, and leave room for conversation.',
    ridesEnabled: true, notify: false, scope: 'following', ...fields });
  await settle(page, true, 'updateEvent');
  await expect.poll(async () => (await ledger(page)).navigations).toEqual([{ method: 'push', destination: '/dashboard/e/fixture-post-existing' }]);
  expect((await ledger(page)).refreshes).toBe(1);
});

test('kind defaults update only before a leader touches notes, and editing preserves existing notes', async ({ page }) => {
  let family = await openPage(page);
  await expand(family);
  const members = () => input(family, 'Two things people could ask each other');
  const leaders = () => input(family, 'Questions that might come up (only you see this)');
  await activate(family.getByRole('group', { name: 'Kind', exact: true }).getByRole('button', { name: 'Meal', exact: true }));
  await expect(members()).toHaveValue('Ask someone what the best thing they ate this month was.\nAsk who taught them to cook, or who they wish had.');
  const mealLeaders = await leaders().inputValue();
  expect(mealLeaders).toContain('Make sure nobody eats alone at the end of the table.');
  await members().fill('My own prompt.');
  await activate(family.getByRole('group', { name: 'Kind', exact: true }).getByRole('button', { name: 'Outing', exact: true }));
  await expect(members()).toHaveValue('My own prompt.');
  await expect(leaders()).toHaveValue(mealLeaders);
  await members().fill('');
  await activate(family.getByRole('group', { name: 'Kind', exact: true }).getByRole('button', { name: 'Gathering', exact: true }));
  await expect(members()).toHaveValue('');
  family = await openPage(page, 'edit');
  const original = { members: await members().inputValue(), leaders: await leaders().inputValue() };
  await activate(family.getByRole('group', { name: 'Kind', exact: true }).getByRole('button', { name: 'Meal', exact: true }));
  await expect(members()).toHaveValue(original.members);
  await expect(leaders()).toHaveValue(original.leaders);
});

test('More and Word expansion always describes visible content along a native keyboard path', async ({ page }) => {
  const family = await openPage(page);
  await expect(more(family)).toHaveAttribute('aria-expanded', 'false');
  await expect(word(family)).toHaveAttribute('aria-expanded', 'false');
  await tabTo(page, word(family));
  await visibleFocus(word(family));
  await word(family).press('Enter');
  await expect(more(family)).toHaveAttribute('aria-expanded', 'true');
  await expect(word(family)).toHaveAttribute('aria-expanded', 'true');
  await expect(input(family, 'Passage')).toBeVisible();
  await activate(more(family));
  await expect(word(family)).toHaveAttribute('aria-expanded', 'false');
  await expect(input(family, 'Passage')).not.toBeVisible();
  await activate(word(family));
  await expect(word(family)).toHaveAttribute('aria-expanded', 'true');
  await expect(input(family, 'Passage')).toBeVisible();
  await noPost(page);
});

for (const transport of ['returned', 'throw']) {
  test(`availability ${transport} failure clears old group information, offers retry and does not block posting`, async ({ page }) => {
    const family = await openPage(page, 'create', { variant: 'multigroup', availability: 'manual', 'availability-transport': transport });
    await expect(family.getByText('2 of 8', { exact: true })).toBeVisible();
    await activate(group(family, 'Synthetic Southside group'));
    await expect(group(family, 'Synthetic Southside group')).toHaveAttribute('aria-pressed', 'true');
    await expect(family.getByText('2 of 8', { exact: true })).toHaveCount(0);
    await expect(family.getByText(/Also that day:/)).toHaveCount(0);
    await expect(family.getByRole('button', { name: /^Move to / })).toHaveCount(0);
    await expect(message(family, /Checking|Loading/i)).toBeVisible();
    await settle(page, false, 'getOrgAvailability');
    // Button keeps its original sizing span while the visible pending label
    // changes. The selector therefore stays on the same mounted control.
    const retry = family.locator('button').filter({ hasText: /^Try again/ });
    await expect(retry).toBeVisible();
    await expect(message(family, /Could not|could not/)).toBeVisible();
    await activate(primary(family));
    await expect.poll(async () => (await ledger(page)).calls.createEvent).toBe(1);
    await settle(page, false, 'createEvent');
    await expect(primary(family)).toBeEnabled();
    await activate(retry);
    await expect.poll(async () => (await ledger(page)).calls.getOrgAvailability).toBe(2);
    await expect(retry).toHaveCount(1);
    await expect(retry).toBeDisabled();
    await settle(page, false, 'getOrgAvailability');
    await visibleFocus(retry);
    await activate(retry);
    await expect(retry).toBeDisabled();
    await settle(page, true, 'getOrgAvailability');
    await expect(family.getByText('3 of 12', { exact: true })).toBeVisible();
    await visibleFocus(input(family, 'When'));
    await expect(family.getByText('2 of 8', { exact: true })).toHaveCount(0);
    // A leader can deliberately leave the pending retry. Successful data
    // arrival must not then pull focus back into the form.
    await activate(group(family, 'Synthetic Northside group'));
    await settle(page, false, 'getOrgAvailability');
    await activate(retry);
    const outside = page.getByTestId('outside-post-control');
    await tabTo(page, outside);
    await visibleFocus(outside);
    await settle(page, true, 'getOrgAvailability');
    await expect(family.getByText('2 of 8', { exact: true })).toBeVisible();
    await expect(outside).toBeFocused();
  });
}

test('A to B to A availability responses use request identity, not merely the current group id', async ({ page }) => {
  const family = await openPage(page, 'create', { variant: 'multigroup', availability: 'manual', 'initial-availability': 'none' });
  await expect.poll(async () => (await ledger(page)).calls.getOrgAvailability).toBe(1);
  await activate(group(family, 'Synthetic Southside group'));
  await expect.poll(async () => (await ledger(page)).calls.getOrgAvailability).toBe(2);
  await activate(group(family, 'Synthetic Northside group'));
  await expect.poll(async () => (await ledger(page)).calls.getOrgAvailability).toBe(3);
  const requests = (await ledger(page)).history.filter((item: { name: string }) => item.name === 'getOrgAvailability');
  expect(requests.map((item: { args: unknown[] }) => item.args)).toEqual([['fixture-post-group-a'], ['fixture-post-group-b'], ['fixture-post-group-a']]);
  await settle(page, true, undefined, requests[2].id);
  await expect(family.getByText(new RegExp(`request ${requests[2].id}`))).toBeVisible();
  await settle(page, true, undefined, requests[0].id);
  await settle(page, false, undefined, requests[1].id);
  await expect.poll(async () => (await ledger(page)).pending).toEqual([]);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(family.getByText(new RegExp(`request ${requests[2].id}`))).toBeVisible();
  await expect(family.getByText(new RegExp(`request ${requests[0].id}`))).toHaveCount(0);
  await expect(family.getByText('2 of 8', { exact: true })).toBeVisible();
  await expect(family.getByRole('button', { name: /Try again|Retry/i })).toHaveCount(0);
});

test('the best-time action preserves the existing slot choice, is keyboard reachable and cannot change a pending post', async ({ page }) => {
  const family = await openPage(page);
  const move = family.getByRole('button', { name: 'Move to Sat, Sep 19 afternoon (6 free)', exact: true });
  await tabTo(page, move);
  await visibleFocus(move);
  await move.press('Enter');
  await expect(input(family, 'When')).toHaveValue('2026-09-19T14:00');
  await expect(family.getByText('6 of 8', { exact: true })).toBeVisible();
  await expect(move).toHaveCount(0);
  await input(family, 'When').fill('2026-09-18T19:00');
  await activate(primary(family));
  await expect(move).toBeDisabled();
  await move.dispatchEvent('click');
  await expect(input(family, 'When')).toHaveValue('2026-09-18T19:00');
  expect((await ledger(page)).history.find((item: { name: string }) => item.name === 'createEvent').args[0].startsAt).toBe('2026-09-19T01:00:00.000Z');
});

async function layoutReport(family: Locator) {
  return family.evaluate(root => {
    const visible = (element: Element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility === 'visible'
      && !element.closest('[aria-hidden="true"]');
    const controls = [...root.querySelectorAll('a[href],button,input,textarea,summary')].filter(visible).map(element => {
      const field = element as HTMLInputElement;
      // A checkbox's wrapping label is the effective native click target.
      const target = field.type === 'checkbox' ? field.labels?.[0] ?? field : element;
      const rect = target.getBoundingClientRect();
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
    const inputs = [...root.querySelectorAll('input:not([type="checkbox"]),textarea')].filter(visible).map(element => ({
      size: parseFloat(getComputedStyle(element).fontSize), labels: (element as HTMLInputElement).labels?.length ?? 0,
      scheme: getComputedStyle(element).colorScheme,
    }));
    return { smallText, smallTargets: controls.filter(control => control.width < 43.99 || control.height < 43.99), inputs,
      viewport: innerWidth, documentWidth: document.documentElement.scrollWidth };
  });
}

for (const width of [390, 1280]) {
  test(`all posting controls and errors remain readable at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const family = await openPage(page, 'create', { variant: 'multigroup' });
    const reports = [await layoutReport(family)];
    await expand(family, true);
    await input(family, 'Passage').fill('Romans 12:1-2');
    reports.push(await layoutReport(family));
    await activate(primary(family));
    await settle(page, false, 'createEvent');
    const error = message(family, /Could not confirm|could not confirm/).locator('p');
    await expect(error).toBeVisible();
    await error.scrollIntoViewIfNeeded();
    const contrast = await eventTextContrast(error);
    expect(contrast.unsupported).toEqual([]);
    expect(contrast.contrast).toBeGreaterThanOrEqual(contrast.threshold);
    for (const report of reports) {
      expect(report.smallText).toEqual([]);
      expect(report.smallTargets).toEqual([]);
      expect(report.documentWidth).toBeLessThanOrEqual(width);
      for (const field of report.inputs) {
        expect(field.size).toBeGreaterThanOrEqual(16);
        expect(field.labels).toBeGreaterThanOrEqual(1);
        expect(field.scheme).toBe('dark');
      }
    }
    await testInfo.attach(`post-form-layout-${width}`, { contentType: 'application/json', body: JSON.stringify({
      reports, contrast, contrastMethod: 'Browser-resolved solid-color alpha compositing. Unsupported effects fail; not screenshot pixel analysis.',
    }, null, 2) });
  });
}

test('long posting labels wrap at 320px and the 640px reflow width equivalent to 1280px at 200% zoom', async ({ page }, testInfo) => {
  const reports = [];
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 900 });
    const family = await openPage(page, 'create', { variant: 'long' });
    const report = await layoutReport(family);
    expect(report.smallText).toEqual([]);
    expect(report.smallTargets).toEqual([]);
    const clipped = await family.evaluate(root => [...root.querySelectorAll('h2,h3,p,label,legend,button,a')]
      // The fieldset has a deliberately screen-reader-only legend. Its 1px
      // clipped box is the accessibility label, not visible content overflow.
      .filter(element => !element.matches('legend.sr-only') && element.getClientRects().length && element.scrollWidth > element.clientWidth + 1)
      .map(element => ({ text: element.textContent?.trim(), width: element.clientWidth, scrollWidth: element.scrollWidth })));
    expect(clipped, 'Non-input text must wrap rather than be clipped').toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    reports.push({ width, ...report });
  }
  await testInfo.attach('post-form-reflow', { contentType: 'application/json', body: JSON.stringify({
    reports, limitation: '640 CSS pixels is the responsive width of a 1280-pixel window at 200% browser zoom. This verifies equivalent-width reflow, not actual browser UI zoom. CSS zoom was rejected as a proxy because it retained desktop media queries. Native text inputs may scroll their own long values.',
  }, null, 2) });
});

test('routine posting fields and expanded content are immediately visible without entrance animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const family = await openPage(page);
  await expand(family, true);
  const entrance = await family.evaluate(root => {
    const style = getComputedStyle(root);
    return { opacity: style.opacity, transform: style.transform, clip: style.clipPath,
      animations: root.getAnimations({ subtree: true }).filter(animation => {
        if (animation.playState === 'finished') return false;
        const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
        return frames.some(frame => ['opacity', 'transform', 'translate', 'scale', 'clipPath', 'filter'].some(key => key in frame));
      }).length };
  });
  await expect(input(family, 'Passage')).toBeVisible();
  expect(entrance).toEqual({ opacity: '1', transform: 'none', clip: 'none', animations: 0 });
});
