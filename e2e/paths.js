/**
 * The app is mounted at /personal-gym/ on GitHub Pages. Local tests
 * (running against `vite preview` on port 4173) and the deployed
 * site use the same path so we can exercise the production-routing
 * behaviour end-to-end. The path constant lives in `src/config.js` so
 * the runtime and the e2e tests agree; this file re-exports it for
 * convenience and adds the route helpers.
 */
import { APP_PATH } from '../src/config.js';

export { APP_PATH };

export const paths = {
  home: APP_PATH,
  plan: `${APP_PATH}plan`,
  session: `${APP_PATH}session`,
  history: `${APP_PATH}history`,
  share: `${APP_PATH}share`,
};
