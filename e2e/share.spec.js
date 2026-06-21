import { test, expect } from '@playwright/test';
import { paths } from './paths.js';

/**
 * End-to-end test for the share-via-URL feature.
 *
 *  Sender flow:
 *    1. Open the editor, save a plan with two named exercises.
 *    2. Click Share, copy the URL from the modal.
 *
 *  Recipient flow:
 *    3. Open the URL in a fresh context (no IndexedDB).
 *    4. Confirm the share page shows both exercises.
 *    5. Click Import, confirm the editor shows the imported plan.
 *    6. Confirm the URL hash is cleared.
 *
 *  Error case:
 *    7. Visit a share URL with a corrupt payload and confirm the
 *       friendly error message appears.
 */

async function clearStorage(page) {
  await page.goto(paths.home);
  await page.evaluate(async () => {
    if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
      const dbs = await window.indexedDB.databases();
      await Promise.all(
        (dbs ?? [])
          .filter((db) => db.name)
          .map(
            (db) =>
              new Promise((resolve) => {
                const req = window.indexedDB.deleteDatabase(db.name);
                req.onsuccess = req.onerror = req.onblocked = () => resolve();
              }),
          ),
      );
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  });
}

test.describe.configure({ mode: 'serial' });

test.describe('share plan via URL', () => {
  test('sender creates a plan and produces a shareable URL', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await clearStorage(page);

    await page.goto(paths.plan);
    await expect(
      page.getByRole('heading', { name: /your workout plan/i }),
    ).toBeVisible();

    // First exercise: fill in name + sets + reps.
    const firstName = page.getByLabel('Name', { exact: true }).first();
    await firstName.fill('Push-ups');
    await page.getByLabel('Sets', { exact: true }).first().fill('3');
    await page.getByLabel('Reps', { exact: true }).first().fill('10');
    await page.getByLabel('Rest (s)').first().fill('60');

    // Add a second exercise.
    await page.getByRole('button', { name: /add exercise/i }).click();
    const cards = page.locator('.card');
    await cards.nth(1).getByLabel('Name', { exact: true }).fill('Squats');
    await cards.nth(1).getByLabel('Sets', { exact: true }).fill('4');
    await cards.nth(1).getByLabel('Reps', { exact: true }).fill('12');
    await cards.nth(1).getByLabel('Rest (s)').fill('90');

    await page.getByRole('button', { name: /save plan/i }).click();
    await expect(page.getByRole('button', { name: /saved/i })).toBeVisible();

    // Share button is now enabled.
    const shareBtn = page.getByRole('button', { name: /^share$/i });
    await expect(shareBtn).toBeEnabled();
    await shareBtn.click();

    // Modal opens with the URL.
    const urlInput = page.getByLabel('Share link');
    await expect(urlInput).toBeVisible();
    const url = await urlInput.inputValue();
    expect(url).toMatch(/^http.*\/personal-gym\/share#data=[A-Za-z0-9_-]+$/);
    expect(url.length).toBeLessThan(2000);

    // Copy and verify the clipboard.
    await page.getByRole('button', { name: /copy link/i }).click();
    await expect(page.getByRole('button', { name: /copied!/i })).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(url);
  });

  test('recipient opens a share URL, previews, and imports', async ({ page, context, browser }) => {
    // 1. Build a share URL in a fresh context.
    const senderContext = await browser.newContext();
    const sender = await senderContext.newPage();
    await clearStorage(sender);

    await sender.goto(paths.plan);
    await sender.getByLabel('Name', { exact: true }).first().fill('Lunges');
    await sender.getByLabel('Sets', { exact: true }).first().fill('3');
    await sender.getByLabel('Rest (s)').first().fill('45');
    await sender.getByRole('button', { name: /save plan/i }).click();
    await expect(sender.getByRole('button', { name: /saved/i })).toBeVisible();
    await sender.getByRole('button', { name: /^share$/i }).click();
    const url = await sender.getByLabel('Share link').inputValue();
    await senderContext.close();

    // 2. Recipient: brand-new context with no plan.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await clearStorage(page);

    await page.goto(url);
    await expect(
      page.getByRole('heading', { name: /^shared plan$/i }),
    ).toBeVisible();
    await expect(page.getByText('Lunges')).toBeVisible();
    await expect(page.getByText('3 × 10 · 45s rest').first()).toBeVisible();

    await page.getByRole('button', { name: /import this plan/i }).click();

    // 3. After import we land on the editor and the new plan is there.
    await expect(
      page.getByRole('heading', { name: /your workout plan/i }),
    ).toBeVisible();
    await expect(page.getByLabel('Name', { exact: true }).first()).toHaveValue('Lunges');
    // URL hash is cleared.
    expect(page.url()).not.toMatch(/#data=/);
  });

  test('corrupt share URL shows a friendly error', async ({ page }) => {
    await clearStorage(page);
    await page.goto(`${paths.share}#data=***not-base64***`);
    await expect(
      page.getByRole('heading', { name: /^shared plan$/i }),
    ).toBeVisible();
    await expect(page.getByText(/invalid or corrupted/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /import this plan/i }),
    ).toHaveCount(0);
    // "Back to home" link works.
    await page.getByRole('button', { name: /back to home/i }).click();
    await expect(
      page.getByRole('heading', { name: /welcome back/i }),
    ).toBeVisible();
  });
});
