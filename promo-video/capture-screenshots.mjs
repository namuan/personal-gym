/**
 * Playwright screenshot capture script for Personal Gym product video.
 *
 * This script:
 * 1. Starts the personal-gym dev server (or uses one already running)
 * 2. Seeds a plan and session via IndexedDB
 * 3. Takes screenshots of each app state
 * 4. Saves them to the promo-video/public/ directory
 *
 * Usage:
 *   node capture-screenshots.mjs
 *
 * Requires: personal-gym dev server running on http://localhost:5173
 * or set DEV_URL=http://localhost:4173/personal-gym/ for production preview.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'public', 'screenshots');
const DEV_URL = process.env.DEV_URL || 'http://localhost:5173';
const APP = (path) => {
  const base = DEV_URL.endsWith('/') ? DEV_URL : DEV_URL + '/';
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${p}`;
};

mkdirSync(OUT_DIR, { recursive: true });

async function screenshot(page, name, opts = {}) {
  const path = resolve(OUT_DIR, `${name}.png`);
  console.log(`  📸 ${name}.png`);
  await page.screenshot({ path, fullPage: false, ...opts });
  return path;
}

async function clearIndexedDB(page) {
  await page.evaluate(async () => {
    if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
      const dbs = await window.indexedDB.databases();
      await Promise.all(
        (dbs ?? []).filter((db) => db.name).map(
          (db) => new Promise((resolve) => {
            const req = window.indexedDB.deleteDatabase(db.name);
            req.onsuccess = req.onerror = req.onblocked = () => resolve();
          }),
        ),
      );
    }
  });
}

async function main() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    // -------- 1. Home page - empty state --------
    console.log('\n📋 Home page (empty state)');
    await page.goto(APP(''), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot(page, 'home-empty');

    // -------- 2. Plan editor - create exercises --------
    console.log('\n📋 Plan editor - creating a workout plan');
    await page.goto(APP('plan'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Wait for plan editor to load - look for the first input
    await page.waitForTimeout(1000);
    const inputs = page.locator('input[type="text"]');
    await inputs.first().waitFor({ state: 'visible', timeout: 8000 });

    // Fill in first exercise using nth locators
    // Card layout: [Name text], [Sets number], [Reps number], [Rest number], [Instructions textarea]
    const textInputs = page.locator('input[type="text"]');
    const numInputs = page.locator('input[type="number"]');
    const textareas = page.locator('textarea');

    await textInputs.nth(0).fill('Push-ups');
    await numInputs.nth(0).fill('3');
    await numInputs.nth(1).fill('15');
    await numInputs.nth(2).fill('60');
    await textareas.nth(0).fill('Keep your core tight and lower your chest to the ground.');

    // Add a second exercise
    await page.getByRole('button', { name: /add exercise/i }).click();
    await page.waitForTimeout(500);

    // Fill in second exercise
    await textInputs.nth(1).fill('Squats');
    await numInputs.nth(3).fill('3');
    await numInputs.nth(4).fill('12');
    await numInputs.nth(5).fill('45');
    await textareas.nth(1).fill('Keep your chest up and drive through your heels.');

    await page.waitForTimeout(300);
    await screenshot(page, 'plan-editor');

    // -------- 3. Save plan and see saved state --------
    console.log('\n📋 Saving plan...');
    await page.getByRole('button', { name: /save plan/i }).click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'plan-saved');

    // -------- 4. Home page - with plan --------
    console.log('\n📋 Home page (with plan)');
    await page.goto(APP(''), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot(page, 'home-with-plan');

    // -------- 5. Session - ready state --------
    console.log('\n📋 Workout session - ready to start');
    await page.goto(APP('session'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot(page, 'session-ready');

    // -------- 6. Session - in progress --------
    console.log('\n📋 Workout session - in progress');
    // Click "Start workout" button
    const startBtn = page.getByRole('button', { name: /^start workout$/i });
    await startBtn.waitFor({ state: 'visible', timeout: 5000 });
    await startBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'session-in-progress');

    // -------- 7. Complete all sets, capturing rest timer and summary --------
    console.log('\n📋 Session - working through sets...');
    let seenRest = false;
    let reachedSummary = false;

    for (let attempt = 0; attempt < 20; attempt++) {
      // Check if we're at the summary
      const summary = page.getByRole('heading', { name: /nice work/i });
      if (await summary.isVisible().catch(() => false)) {
        reachedSummary = true;
        break;
      }

      // Check for rest timer (it shows "Rest" heading and "Skip rest" button)
      const skipBtn = page.getByRole('button', { name: /skip rest/i });
      if (await skipBtn.isVisible().catch(() => false)) {
        if (!seenRest) {
          await screenshot(page, 'session-rest');
          seenRest = true;
        }
        await skipBtn.click();
        await page.waitForTimeout(300);
        continue;
      }

      // Mark set complete
      const markBtn = page.getByRole('button', { name: /mark set complete/i });
      if (await markBtn.isVisible().catch(() => false)) {
        await markBtn.click();
        await page.waitForTimeout(400);
        continue;
      }

      // If nothing matches, wait briefly
      await page.waitForTimeout(500);
    }

    // -------- 8. Session - summary --------
    console.log('\n📋 Workout session - summary');
    await page.waitForTimeout(1500);
    await screenshot(page, 'session-summary');

    // -------- 9. History page --------
    console.log('\n📋 History page');
    // Go to history from summary
    const viewHistoryBtn = page.getByRole('button', { name: /view history/i });
    if (await viewHistoryBtn.isVisible().catch(() => false)) {
      await viewHistoryBtn.click();
    } else {
      await page.goto(APP('history'), { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(1500);
    await screenshot(page, 'history');

    // -------- 10. History detail --------
    console.log('\n📋 History detail');
    const sessionLink = page.locator('a[href*="history/"]').first();
    if (await sessionLink.isVisible().catch(() => false)) {
      await sessionLink.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'history-detail');
    }

    // -------- 11. Take a desktop screenshot too --------
    console.log('\n📋 Desktop screenshots...');
    // Resize to desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(APP(''), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot(page, 'home-desktop');

    await page.goto(APP('plan'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot(page, 'plan-desktop');

    await page.goto(APP('session'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot(page, 'session-desktop');

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`   Saved to: ${OUT_DIR}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    // Take a debug screenshot
    await page.screenshot({ path: resolve(OUT_DIR, 'debug-error.png') });
    console.log('   Debug screenshot saved');
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
