import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import './index.css';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';
import { isNative } from './lib/native';

// Caches the app for offline use and quietly updates it when a new version is deployed.
// (Inside the Android app everything is already bundled, so no service worker is needed.)
if (!isNative) registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
