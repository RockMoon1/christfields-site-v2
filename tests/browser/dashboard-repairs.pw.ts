import { expect, test, type Page } from '@playwright/test';

// Every application action is replaced before loading. This additional guard
// prevents external HTTP and all HTTP mutations even if a fixture regresses.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === 'http://127.0.0.1:3100' && ['GET', 'HEAD'].includes(request.method())) {
      await route.continue();
    } else {
      await route.abort('blockedbyclient');
    }
  });
});

async function openFixture(page: Page, which: string) {
  await page.goto(`/?case=${which}`);
  await expect(page.getByText(/Browser fixture · synthetic data/)).toBeVisible();
}

async function callCount(page: Page, action: string) {
  const text = await page.getByTestId('action-state').textContent();
  return (JSON.parse(text ?? '{}') as { calls?: Record<string, number> }).calls?.[action] ?? 0;
}

test('fields preserve names, descriptions, invalid state, and one-line error space', async ({ page }) => {
  await openFixture(page, 'foundations');
  const field = page.getByLabel('Fixture name');
  await field.fill('Synthetic words');
  await expect(field).toHaveAttribute('aria-describedby', 'fixture-name-hint fixture-name-error');
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
  expect(await field.evaluate((element) => getComputedStyle(element).fontSize)).toBe('16px');
  expect(await field.evaluate((element) => getComputedStyle(element).colorScheme)).toBe('dark');
  const before = await page.locator('#fixture-name-error').boundingBox();
  await page.getByRole('button', { name: 'Show field error' }).click();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#fixture-name-error')).toHaveText('Enter a fixture name.');
  const after = await page.locator('#fixture-name-error').boundingBox();
  expect(after?.height).toBe(before?.height);
  await expect(page.getByRole('button', { name: 'Disabled fixture' })).toBeDisabled();
});

test('pending buttons keep their width and report a rejected save without losing input', async ({ page }) => {
  await openFixture(page, 'foundations');
  const field = page.getByLabel('Fixture name');
  await field.fill('Keep these fixture words');
  const save = page.getByRole('button', { name: 'Save fixture', exact: true });
  const before = await save.boundingBox();
  await save.click();
  const pending = page.getByRole('button', { name: 'Saving fixture…', exact: true });
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  expect((await pending.boundingBox())?.width).toBe(before?.width);
  await page.getByRole('button', { name: 'Reject pending action' }).click();
  await expect(page.getByText('Fixture save failed. Your words are still here.')).toBeVisible();
  await expect(field).toHaveValue('Keep these fixture words');
  await expect(save).toBeEnabled();
});

test('disabled and pending links have no navigable destination, including middle-click', async ({ page, context }) => {
  await openFixture(page, 'links');
  const active = page.getByRole('link', { name: 'Fixture destination', exact: true });
  await expect(active).toHaveAttribute('href', '#fixture-active');
  const before = await active.boundingBox();
  await page.getByRole('button', { name: 'Start link work', exact: true }).click();
  const pending = page.getByRole('link', { name: 'Opening fixture…', exact: true });
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  expect((await pending.boundingBox())?.width).toBe(before?.width);
  for (const link of [page.getByRole('link', { name: 'Disabled link', exact: true }), pending]) {
    await expect(link).toHaveAttribute('aria-disabled', 'true');
    await expect(link).toHaveAttribute('tabindex', '0');
    expect(await link.getAttribute('href')).toBeNull();
    // Forced clicks deliberately exercise browser defaults on an aria-disabled
    // element; no application/service action is involved.
    await link.click({ force: true });
    await link.click({ button: 'middle', force: true });
    await link.click({ button: 'right', force: true });
    await page.keyboard.press('Escape');
  }
  expect(context.pages()).toHaveLength(1);
  await expect(page).toHaveURL(/\?case=links$/);
  await expect(page.getByTestId('link-activations')).toHaveText('0');
  await page.getByRole('button', { name: 'Resolve pending action' }).click();
  await expect(active).toHaveAttribute('href', '#fixture-active');
  await expect(active).not.toHaveAttribute('aria-disabled', 'true');
  await active.click();
  await expect(page.getByTestId('link-activations')).toHaveText('1');
});

test('link pending state retains the same focused anchor and forwards its native props and ref', async ({ page }) => {
  await openFixture(page, 'link-focus');
  const link = page.getByRole('link', { name: 'Open fixture', exact: true });
  await page.getByRole('button', { name: 'Reject pending action' }).focus();
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute('id', 'focus-link');
  await expect(link).toHaveAttribute('data-fixture', 'forwarded');
  await expect(link).toHaveAttribute('aria-describedby', 'focus-link-hint');
  await expect(link).toHaveAttribute('title', 'Link attribute fixture');
  await expect(page.getByTestId('link-ref')).toHaveText('focus-link');
  const original = await link.elementHandle();
  await page.keyboard.press('Enter');
  const pending = page.getByRole('link', { name: 'Opening fixture…', exact: true });
  await expect(pending).toHaveAttribute('aria-disabled', 'true');
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  expect(await pending.getAttribute('href')).toBeNull();
  await expect(pending).toBeFocused();
  expect(await original!.evaluate(node => node.isConnected && node === document.activeElement)).toBe(true);
  await page.keyboard.press('Enter');
  expect(await callCount(page, 'focused-link')).toBe(1);
  // Settle the mock response without a pointer click stealing focus. This
  // represents the server finishing while the user stays on the same link.
  await page.getByRole('button', { name: 'Resolve pending action' }).dispatchEvent('click');
  await expect(link).toHaveAttribute('href', '/fixture-destination');
  await expect(link).not.toHaveAttribute('aria-disabled', 'true');
  await expect(link).toBeFocused();
  expect(await original!.evaluate(node => node.isConnected && node === document.activeElement)).toBe(true);
});

test('disabled link remains discoverable in the keyboard tab order', async ({ page }) => {
  await openFixture(page, 'links');
  await page.getByRole('button', { name: 'Reject pending action' }).focus();
  await page.keyboard.press('Tab');
  const disabled = page.getByRole('link', { name: 'Disabled link', exact: true });
  await expect(disabled).toBeFocused();
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('link-activations')).toHaveText('0');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Fixture destination', exact: true })).toBeFocused();
});

test('notices preserve their live regions and distinguish failure, saved, and information tones', async ({ page }) => {
  await openFixture(page, 'notices');
  const problem = page.getByRole('region', { name: 'Problem notice' });
  const saved = page.getByRole('region', { name: 'Saved notice' });
  const info = page.getByRole('region', { name: 'Information notice' });
  const region = await problem.locator('[aria-live="polite"]').elementHandle();
  await expect(problem.locator('p')).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle messages' }).click();
  await expect(problem.getByText('Fixture request failed. Try again.')).toBeVisible();
  await expect(problem.locator('p')).toHaveCSS('color', 'rgb(227, 154, 143)');
  expect(await problem.locator('p').evaluate(node => getComputedStyle(node).borderColor))
    .not.toBe(await saved.locator('p').evaluate(node => getComputedStyle(node).borderColor));
  expect(await info.locator('p').evaluate(node => getComputedStyle(node).backgroundColor))
    .not.toBe(await saved.locator('p').evaluate(node => getComputedStyle(node).backgroundColor));
  await expect(problem.locator('[aria-live]')).toHaveAttribute('aria-atomic', 'true');
  await page.getByRole('button', { name: 'Toggle messages' }).click();
  await expect(problem.locator('p')).toHaveCount(0);
  expect(await region!.evaluate(node => node.isConnected)).toBe(true);
});

test('failed prayer submission restores the form and exact original draft; successful retry clears it', async ({ page }) => {
  await openFixture(page, 'community');
  const title = '  A synthetic difficult week  ';
  const body = '  Keep these exact fixture words.\nAnd this line.  ';
  await page.getByRole('button', { name: 'Share a prayer request', exact: true }).click();
  const titleInput = page.getByPlaceholder('What are you bringing before God?');
  const bodyInput = page.getByPlaceholder('A little more context, if you would like to share it. (Optional)');
  await titleInput.fill(title);
  await bodyInput.fill(body);
  await page.getByRole('button', { name: 'Share request', exact: true }).click();
  await expect(page.getByRole('heading', { name: title.trim() })).toBeVisible();
  await page.getByRole('button', { name: 'Reject pending action' }).click();
  await expect(page.getByText('Could not share your request. Your words are still here. Please try again.')).toBeVisible();
  await expect(titleInput).toHaveValue(title);
  await expect(bodyInput).toHaveValue(body);
  await expect(page.getByRole('heading', { name: title.trim() })).toHaveCount(0);
  await page.getByRole('button', { name: 'Share request', exact: true }).click();
  await expect.poll(() => callCount(page, 'post')).toBe(2);
  await page.getByRole('button', { name: 'Resolve pending action' }).click();
  await expect(page.getByRole('heading', { name: title.trim() })).toHaveCount(1);
  await page.getByRole('button', { name: 'Share a prayer request', exact: true }).click();
  await expect(titleInput).toHaveValue('');
  await expect(bodyInput).toHaveValue('');
});

test('praying failure announces and rolls back the count', async ({ page }) => {
  await openFixture(page, 'community');
  await page.getByRole('button', { name: 'Pray with them', exact: true }).click();
  await expect(page.getByText('1 person praying', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reject pending action' }).click();
  await expect(page.getByText('Could not save that you are praying. Please try again.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pray with them', exact: true })).toBeEnabled();
  await expect(page.getByText('1 person praying', { exact: true })).toHaveCount(0);
});

test('marking answered failure restores the prior request state', async ({ page }) => {
  await openFixture(page, 'community');
  const mine = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic request of mine' }) });
  await mine.getByRole('button', { name: 'Mark answered' }).click();
  await expect(mine.getByText('Answered', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reject pending action' }).click();
  await expect(page.getByText('Could not mark this request as answered. It is still on the wall. Please try again.')).toBeVisible();
  await expect(mine.getByRole('button', { name: 'Mark answered' })).toBeEnabled();
  await expect(mine.getByText('Answered', { exact: true })).toHaveCount(0);
});

test('removing a prayer failure restores its card and announces the failure', async ({ page }) => {
  await openFixture(page, 'community');
  const mine = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic request of mine' }) });
  await mine.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(mine).toHaveCount(0);
  await page.getByRole('button', { name: 'Reject pending action' }).click();
  await expect(mine).toBeVisible();
  await expect(page.getByText('Could not remove this request. It has been restored to the wall. Please try again.')).toBeVisible();
});

test('RSVP failure restores status and faces; only confirmed success celebrates', async ({ page }) => {
  await openFixture(page, 'event');
  const maybe = page.getByRole('button', { name: 'Not sure yet', exact: true });
  const going = page.getByRole('button', { name: 'I’m in', exact: true });
  await expect(maybe).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Alex is in', { exact: true })).toBeVisible();
  await going.click();
  await expect(going).toHaveAttribute('aria-pressed', 'true');
  await expect(going).toBeDisabled();
  await expect(page.getByText('You are in. Friday evening.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reject pending action' }).click();
  await expect(maybe).toHaveAttribute('aria-pressed', 'true');
  await expect(going).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('Alex is in', { exact: true })).toBeVisible();
  await expect(page.getByText('Could not save your answer. Your previous answer is still in place. Please try again.')).toBeVisible();
  await going.click();
  await page.getByRole('button', { name: 'Resolve pending action' }).click();
  await expect(page.getByText('You are in. Friday evening.')).toBeVisible();
  await expect(page.getByText('Alex and You are in', { exact: true })).toBeVisible();
});

test('deletion confirms, manages focus, blocks duplicate pending work, and supports retry', async ({ page }) => {
  await openFixture(page, 'delete');
  const trigger = page.getByRole('button', { name: 'Delete fixture reflection', exact: true });
  await trigger.click();
  const keep = page.getByRole('button', { name: 'Keep', exact: true });
  await expect(keep).toBeFocused();
  await keep.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  const confirm = page.getByRole('button', { name: 'Delete', exact: true });
  for (const control of [confirm, keep]) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await confirm.click();
  await expect(page.getByRole('button', { name: 'Deleting…', exact: true })).toBeDisabled();
  await expect(keep).toBeDisabled();
  await expect.poll(() => callCount(page, 'delete')).toBe(1);
  await page.getByRole('button', { name: 'Reject pending action' }).click();
  await expect(page.getByText('Could not delete that. Please try again.')).toBeVisible();
  await expect(confirm).toBeFocused();
  await confirm.click();
  await expect.poll(() => callCount(page, 'delete')).toBe(2);
  await page.getByRole('button', { name: 'Resolve pending action' }).click();
  await expect(page.getByText('Fixture reflection deleted.')).toBeVisible();
});

test('47px safe-area inset leaves a separate 64px row and one content heading', async ({ page }) => {
  await openFixture(page, 'header');
  const header = page.getByTestId('safe-area-shell').locator('header');
  expect((await header.boundingBox())?.height).toBe(111);
  expect((await header.locator(':scope > div').boundingBox())?.height).toBe(64);
  await expect(header.getByText('Home', { exact: true })).toBeVisible();
  await expect(page.getByTestId('fixture-content').getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(await header.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe('none');
});

for (const [route, width] of [['/dashboard', 672], ['/dashboard/community', 768], ['/dashboard/lead/group', 896]] as const) {
  test(`loading skeleton matches ${route} width without additional padding`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/?case=skeleton&route=${encodeURIComponent(route)}`);
    const container = page.getByTestId('fixture-content').locator(':scope > div');
    await expect(page.getByTestId('fixture-content').getByRole('status')).toHaveText('Loading page');
    expect((await container.boundingBox())?.width).toBe(width);
    expect(await container.evaluate((element) => getComputedStyle(element).paddingLeft)).toBe('0px');
  });
}

for (const width of [390, 768, 1280, 1920]) {
  test(`foundation fixture renders without horizontal overflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await openFixture(page, 'foundations');
    await expect(page.getByRole('heading', { name: 'Foundation controls' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`foundations-${width}.png`), fullPage: true });
  });
}
