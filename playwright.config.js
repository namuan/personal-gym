import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Personal Gym end-to-end tests.
 *
 * The preview server is managed outside Playwright via the
 * `start-server-and-test` helper (see the `e2e:report` and
 * `test:e2e:full` npm scripts). This keeps the server lifecycle
 * obvious in CI logs and lets a single command build, serve, test,
 * and report.
 *
 * `baseURL` is the served origin (no path). The app is mounted at
 * `/personal-gym/` to mirror the production GitHub Pages URL, so
 * tests navigate to that path explicitly (see `e2e/paths.js`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Default reporter is the suite's; scripts can override with --reporter.
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
