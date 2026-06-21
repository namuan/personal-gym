/**
 * App-wide constants shared between the runtime, the share pipeline,
 * and the e2e test paths helper. Keep this list small.
 */

/**
 * The path prefix the app is mounted at. Mirrors the `BASE` constant in
 * `vite.config.js` and `e2e/paths.js`. For a GitHub Pages project site
 * the app lives at `/<repo-name>/`; for local dev and user/org pages
 * it is `/`.
 */
export const APP_PATH = '/personal-gym/';
