import React from 'react';
import ReactDOM from 'react-dom/client';

// Must come before anything that touches Monaco — it decides which copy of the
// editor the whole app (and y-monaco) will use.
import './lib/monacoSetup.js';

import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
