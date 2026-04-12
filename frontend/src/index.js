import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * Global Initialization
 * Standardizing the render root for the Eco-Seat AI framework.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* The App component now manages the global routing and layout structure */}
    <App />
  </React.StrictMode>
);