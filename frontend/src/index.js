// File: frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App';

/* ============================================================
   ECO-SEAT
   React Application Entry Point
============================================================ */

const container = document.getElementById('root');

if (!container) {
  throw new Error(
    'Application root element was not found. Ensure public/index.html contains <div id="root"></div>.'
  );
}

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);