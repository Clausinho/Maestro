import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/electron/renderer';
import MaestroConsole from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayerStackProvider } from './contexts/LayerStackContext';
import { ToastProvider } from './contexts/ToastContext';
import { WizardProvider } from './components/Wizard';
import { logger } from './utils/logger';
import './index.css';

// Initialize Sentry for the renderer process
// The main process handles the enabled/disabled check and initializes Sentry there
// Renderer Sentry will automatically connect to main process Sentry
// We initialize unconditionally here - if main process didn't init, this is a no-op
Sentry.init({});

// Set up global error handlers for uncaught exceptions in renderer process
window.addEventListener('error', (event: ErrorEvent) => {
  logger.error(
    `Uncaught Error: ${event.message}`,
    'UncaughtError',
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack || String(event.error),
    }
  );
  // Prevent default browser error handling
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  logger.error(
    `Unhandled Promise Rejection: ${event.reason?.message || String(event.reason)}`,
    'UnhandledRejection',
    {
      reason: event.reason,
      stack: event.reason?.stack,
    }
  );
  // Prevent default browser error handling
  event.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <LayerStackProvider>
          <WizardProvider>
            <MaestroConsole />
          </WizardProvider>
        </LayerStackProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
