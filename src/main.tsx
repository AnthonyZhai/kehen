import { createRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import App from './App.tsx';
import './index.css';

// Initialize PostHog
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
