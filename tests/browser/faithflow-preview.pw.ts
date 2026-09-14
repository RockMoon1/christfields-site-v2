import { expect, test, type Page } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:3000', reducedMotion: 'reduce' });
test.setTimeout(60_000);
test.beforeAll(async () => {
  const { assertLocalPreview } = await import('../../scripts/lib/local-preview-health.mjs');
  await assertLocalPreview();
});

/** Compare same-origin storage without returning keys or values to the runner.
 * Fresh unauthenticated contexts keep other users' browser data out of this test. */
async function storageFingerprint(page: Page) {
  return page.evaluate(async () => {
    async function fingerprint(storage: Storage) {
      const entries = Object.keys(storage).sort().map(key => [key, storage.getItem(key)]);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(entries)));
      return {
        count: entries.length,
        sha256: Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''),
      };
    }
    return { local: await fingerprint(localStorage), session: await fingerprint(sessionStorage) };
  });
}

for (const width of [390, 1280]) {
  test(`FaithFlow example is keyboard usable and local-only at ${width}px`, async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const mutations: { method: string; path: string }[] = [];
    let downloads = 0;
    let popups = 0;

    // Every write is blocked before it can leave this fresh test page. Keep
    // only method/path in diagnostics: never request bodies, cookies or tokens.
    await page.route('**/*', route => {
      const request = route.request();
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.continue();
      mutations.push({ method: request.method(), path: new URL(request.url()).pathname });
      return route.abort('blockedbyclient');
    });
    page.on('download', () => { downloads += 1; });
    page.on('popup', () => { popups += 1; });
    await page.goto('/faithflow');
    await page.evaluate(() => document.fonts.ready);
    const preview = page.getByRole('region', { name: 'FaithFlow illustrative dashboard' });
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toBeVisible();
    await expect(preview.getByText('Sample details. Try the actions here; nothing is saved or sent.')).toBeVisible();

    // Prove interception is active with a synthetic POST that has no route or
    // payload in the product. Its failure happens in Playwright, not a service.
    const probeBlocked = await page.evaluate(() => fetch('/__faithflow_preview_guard__', {
      method: 'POST', body: 'blocked fixture probe',
    }).then(() => false, () => true));
    expect(probeBlocked).toBe(true);
    expect(mutations.filter(entry => entry.path === '/__faithflow_preview_guard__')).toEqual([
      { method: 'POST', path: '/__faithflow_preview_guard__' },
    ]);
    const initialMutationCount = mutations.length;
    const initialStorage = await storageFingerprint(page);
    const initialUrl = page.url();
    const initialPages = context.pages().length;
    const live = preview.locator('[aria-live="polite"]');
    const liveHandle = await live.elementHandle();
    await expect(live).toHaveAttribute('aria-atomic', 'true');
    await expect(live).toBeEmpty();
    await expect(preview.locator('input, textarea, form, a, [role="tab"]')).toHaveCount(0);

    const reset = preview.getByRole('button', { name: 'Reset example', exact: true });
    const answers = [
      preview.getByRole('button', { name: 'I’m in', exact: true }),
      preview.getByRole('button', { name: 'Not sure yet', exact: true }),
      preview.getByRole('button', { name: 'I can’t make it', exact: true }),
    ];

    // Use native Tab, Space and Enter rather than DOM click() dispatches.
    await reset.focus();
    for (const [index, answer] of answers.entries()) {
      await page.keyboard.press('Tab');
      await expect(answer).toBeFocused();
      await expect(answer).toHaveCSS('outline-style', 'solid');
      await expect(answer).toHaveCSS('outline-width', '2px');
      await answer.press(index === 1 ? 'Enter' : 'Space');
      await expect(answer).toHaveAttribute('aria-pressed', 'true');
      await expect(answer).toBeFocused();
      for (const other of answers.filter((_, otherIndex) => otherIndex !== index)) {
        await expect(other).toHaveAttribute('aria-pressed', 'false');
      }
      await expect(live).toContainText('No RSVP has been sent.');
    }

    const calendar = preview.locator('summary').filter({ hasText: 'Put it on my calendar' });
    await page.keyboard.press('Tab');
    await expect(calendar).toBeFocused();
    await calendar.press('Enter');
    await expect(calendar.locator('..')).toHaveAttribute('open', '');
    for (const choice of ['Google Calendar', 'Apple or Outlook']) {
      const button = preview.getByRole('button', { name: choice, exact: true });
      await page.keyboard.press('Tab');
      await expect(button).toBeFocused();
      await button.press('Enter');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(button).toBeFocused();
      await expect(live).toHaveText(`Preview choice: ${choice}. Your real calendar has not changed.`);
    }

    const prayer = preview.getByRole('button', { name: 'Pray with them', exact: true });
    await page.keyboard.press('Tab');
    await expect(prayer).toBeFocused();
    await prayer.press('Space');
    const prayed = preview.getByRole('button', { name: 'Praying with you', exact: true });
    await expect(prayed).toHaveAttribute('aria-pressed', 'true');
    await expect(prayed).toHaveAttribute('aria-disabled', 'true');
    await expect(prayed).toBeFocused();
    const prayerMessage = 'Preview response: praying with Alex. No prayer response or notification has been sent.';
    await expect(live).toHaveText(prayerMessage);
    // Give the live region a different message, then try the already-answered
    // prayer again. A missing guard would replace it with prayerMessage.
    const googleChoice = preview.getByRole('button', { name: 'Google Calendar', exact: true });
    await googleChoice.focus();
    await googleChoice.press('Enter');
    await expect(live).toHaveText('Preview choice: Google Calendar. Your real calendar has not changed.');
    await prayed.focus();
    await prayed.press('Enter');
    await expect(live).toHaveText('Preview choice: Google Calendar. Your real calendar has not changed.');
    await expect(prayed).toBeFocused();

    const scripture = preview.locator('summary').filter({ hasText: 'Scripture in this example' });
    await expect(scripture.locator('..')).not.toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(scripture).toBeFocused();
    await scripture.press('Enter');
    await expect(scripture.locator('..')).toHaveAttribute('open', '');
    const figures = scripture.locator('..').locator('figure');
    await expect(figures).toHaveCount(2);
    await expect(figures.nth(0).locator('blockquote')).toHaveText('“They are new every morning. Great is your faithfulness.”');
    await expect(figures.nth(0).locator('figcaption')).toHaveText('Lamentations 3:23');
    await expect(figures.nth(1).locator('blockquote')).toHaveText('“As iron sharpens iron, so one person sharpens another.”');
    await expect(figures.nth(1).locator('figcaption')).toHaveText('Proverbs 27:17');
    await expect(preview).not.toContainText(/WEB|World English Bible|memory verse/i);

    // With both disclosures open, every preview control participates in this
    // measurement, including the initially hidden calendar choices.
    const smallTargets = await preview.locator('button, summary').evaluateAll(elements =>
      elements.flatMap(element => {
        const rect = element.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44 ? [] : [{
          label: element.textContent?.trim(), width: rect.width, height: rect.height,
        }];
      }));
    expect(smallTargets).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await reset.focus();
    await reset.press('Enter');
    await expect(reset).toBeFocused();
    for (const answer of answers) await expect(answer).toHaveAttribute('aria-pressed', 'false');
    await expect(preview.getByRole('button', { name: 'Pray with them', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
    await expect(calendar.locator('..')).not.toHaveAttribute('open', '');
    await expect(live).toHaveText('Example reset. Nothing was saved or sent.');
    expect(await liveHandle!.evaluate(element => element.isConnected)).toBe(true);

    expect(mutations.slice(initialMutationCount), 'Preview actions attempted a server mutation').toEqual([]);
    expect(await storageFingerprint(page), 'Preview actions changed same-origin browser storage').toEqual(initialStorage);
    expect(page.url()).toBe(initialUrl);
    expect(context.pages().length).toBe(initialPages);
    expect(downloads).toBe(0);
    expect(popups).toBe(0);
    await testInfo.attach('local-only-verification', {
      contentType: 'application/json',
      body: JSON.stringify({
        width,
        guardProbeBlocked: probeBlocked,
        mutationsDuringPreviewActions: mutations.length - initialMutationCount,
        sameOriginStorageUnchanged: true,
        downloads,
        popups,
        smallTargets,
        quotationsPreserved: 2,
        verification: 'Fresh unauthenticated public-page context; no authenticated member flow was exercised.',
      }, null, 2),
    });
  });
}
