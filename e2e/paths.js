/**
 * The app is mounted at /personal-gym/ on GitHub Pages. Local tests
 * (running against `vite preview` on port 4173) and the deployed
 * site use the same path so we can exercise the production-routing
 * behaviour end-to-end.
 */
export const APP_PATH = '/personal-gym/';

export const paths = {
  home: APP_PATH,
  plan: `${APP_PATH}plan`,
  session: `${APP_PATH}session`,
  history: `${APP_PATH}history`,
};
