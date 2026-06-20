import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Base path for GitHub Pages project sites. Override at the command line
// for a user/org site (e.g. nnn.github.io) with:
//   vite build --base=/
// or locally for development with the default '/'.
const REPO_NAME = 'personal-gym';
const BASE = `/${REPO_NAME}/`;

/**
 * Vite plugin: after the build, copy index.html to 404.html so that
 * GitHub Pages serves the SPA shell for any unknown route. React Router
 * then reads window.location and renders the right page. This is the
 * standard SPA workaround for project sites on GitHub Pages.
 */
function spa404Fallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist');
      const indexPath = resolve(outDir, 'index.html');
      const notFoundPath = resolve(outDir, '404.html');
      if (existsSync(indexPath)) {
        copyFileSync(indexPath, notFoundPath);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    spa404Fallback(),
    VitePWA({
      // The service worker must be served from the same scope as the
      // pages it controls. Without this, Workbox emits a SW at /sw.js
      // which can't control /personal-gym/ pages.
      base: BASE,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Personal Gym',
        short_name: 'Personal Gym',
        description: 'A web-based Personal Exercise Gym Instructor for home workouts.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        // start_url needs the same base path as the app.
        start_url: BASE,
        scope: BASE,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: 'index.html',
        // Don't precache the dev server HTML.
        navigateFallbackDenylist: [/^\/dev-/],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
