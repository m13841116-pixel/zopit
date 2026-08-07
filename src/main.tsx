import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastContext';
import { CartProvider } from './components/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <CartProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker for Progressive Web App (PWA) support
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if ((import.meta as any).env?.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('🚀 PWA Service Worker registered successfully on scope:', reg.scope);
        })
        .catch((err) => {
          console.error('❌ PWA Service Worker registration failed:', err);
        });
    });
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("wheel", (e) => {
    if (e.target && (e.target as HTMLInputElement).type === "number") {
      (e.target as HTMLInputElement).blur();
    }
  }, { passive: false });
}
