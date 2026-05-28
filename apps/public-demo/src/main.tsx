import React from 'react';
import { createRoot } from 'react-dom/client';
import { installMockFetch } from './mocks/installMocks.js';
import './setupPackages.js';
import { applyToolkitTheme } from './theme.js';
import { App } from './App.js';
import './index.css';

installMockFetch();
applyToolkitTheme();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
