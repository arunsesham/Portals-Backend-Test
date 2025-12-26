// --- The Entry Point ---
// This file is the "Ignition Key" for the application.
// When the website loads, this script runs first.
// It looks for a specific <div> in the HTML called 'root' and tells React:
// "Take over this empty div and build the entire App inside it."

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Step 1: Find the empty container in index.html
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Step 2: Create the React application root
const root = ReactDOM.createRoot(rootElement);

// Step 3: Render the main <App /> component inside the container
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);