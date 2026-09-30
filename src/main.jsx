import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';

// Initialize Capacitor native features when ready
const initApp = async () => {
  const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined && window.Capacitor.isNativePlatform?.();

  if (isCapacitor) {
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      const { Keyboard } = await import('@capacitor/keyboard');

      // ✅ KEY FIX: Overlay webview so content renders UNDER the status bar
      // This makes the app truly full-screen / edge-to-edge
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Light }); // Light icons on dark bg

      // Hide splash screen smoothly
      await SplashScreen.hide({ fadeOutDuration: 400 });

      // Keyboard: shrink body so content isn't hidden behind keyboard
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
        document.documentElement.classList.add('keyboard-open');
      });
      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.setProperty('--keyboard-height', '0px');
        document.documentElement.classList.remove('keyboard-open');
      });
    } catch (err) {
      console.warn('Capacitor plugin init error:', err);
    }
  }

  // Add mobile-app class for CSS targeting (safe area insets, etc.)
  if (isCapacitor || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    document.documentElement.classList.add('is-mobile-app');
  }

  const root = createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Capacitor: wait for native bridge to be ready
if (typeof window !== 'undefined' && window.Capacitor) {
  // initApp immediately — bridge is ready synchronously in Capacitor v6
  initApp();
} else {
  initApp();
}
