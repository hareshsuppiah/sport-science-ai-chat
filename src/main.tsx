import React from 'react';
import { createRoot } from 'react-dom/client';
import './lib/polyfill';  // Import polyfills before other imports
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);