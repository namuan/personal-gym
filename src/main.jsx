import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProviders } from './context/AppProviders.jsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Register the service worker for PWA install + offline support.
const updateSW = registerSW({
  onNeedRefresh() {
    // Hook for "new version available" toast in a future iteration.
  },
  onOfflineReady() {
    // Hook for "ready to work offline" toast in a future iteration.
  },
});
// Expose for debugging only.
if (typeof window !== 'undefined') {
  window.__updateSW = updateSW;
}

// basename must match Vite's `base` config so React Router's `<Link to="/plan" />`
// resolves to `/personal-gym/plan` on the deployed site. In dev, Vite sets
// BASE_URL to "/" so the app mounts at the dev server root.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
