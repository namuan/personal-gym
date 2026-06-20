import { test, expect } from '@playwright/test';

/**
 * End-to-end smoke test for the core MVP flow:
 *   1. Land on the home page (no plan yet).
 *   2. Create a one-exercise plan in the editor.
 *   3. Start a workout, mark a set complete, and end via skip-rest.
 *   4. See the completed session in history.
 *
 * Each test starts with a clean storage state by clearing IndexedDB
 * and Service Worker caches before navigation.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    // Drop any persisted plan / sessions from previous runs so tests
    // are independent. The app uses Dexie over IndexedDB.
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
});

test('home page shows the create-plan CTA when no plan exists', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /welcome back/i }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /create your plan/i })).toBeVisible();
});

test('navigation links reach the editor, workout, and history pages', async ({ page }) => {
  await page.getByRole('link', { name: /create your plan/i }).click();
  await expect(
    page.getByRole('heading', { name: /your workout plan/i }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Workout', exact: true }).first().click();
  // No plan yet, so the "no plan" guard should appear.
  await expect(page.getByRole('heading', { name: /no plan to start/i })).toBeVisible();

  await page.getByRole('link', { name: 'History', exact: true }).first().click();
  // No sessions yet, so the empty-state heading shows.
  await expect(
    page.getByRole('heading', { name: /no sessions yet/i }),
  ).toBeVisible();
});

test('create a plan, run a workout, and see the session in history', async ({ page }) => {
  // 1. Create a plan with one exercise, single set, no rest.
  await page.goto('/plan');
  await expect(
    page.getByRole('heading', { name: /your workout plan/i }),
  ).toBeVisible();

  await page.getByLabel('Name', { exact: true }).fill('Push-ups');
  await page.getByLabel('Sets', { exact: true }).fill('1');
  await page.getByLabel('Rest (s)').fill('0');
  await page.getByLabel('Instructions').fill('Keep your core tight.');

  await page.getByRole('button', { name: /save plan/i }).click();
  // Editor shows "Saved" once the save promise resolves.
  await expect(page.getByRole('button', { name: /saved/i })).toBeVisible();

  // 2. Start the workout from the home page.
  await page.goto('/');
  await expect(page.getByRole('link', { name: /start workout/i })).toBeVisible();
  await page.getByRole('link', { name: /start workout/i }).click();
  await expect(page.getByRole('heading', { name: /ready to work out/i })).toBeVisible();

  await page.getByRole('button', { name: /^start workout$/i }).click();

  // 3. We are on the in-progress view for the only exercise/set.
  await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
  await expect(page.getByLabel('Reps completed')).toHaveValue('10');

  await page.getByRole('button', { name: /mark set complete/i }).click();

  // 4. With 1 set / 1 exercise, we jump straight to the summary.
  await expect(
    page.getByRole('heading', { name: /nice work/i }),
  ).toBeVisible();
  await expect(page.getByText('Workout complete')).toBeVisible();
  // Summary stats live in stat tiles; assert by the total reps count.
  await expect(page.getByText('10', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Reps', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /view history/i }).click();
  await expect(
    page.getByRole('heading', { name: /workout history/i }),
  ).toBeVisible();
  await expect(page.getByText(/1 sets? ·/)).toBeVisible();
});
