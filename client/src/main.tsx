import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { GameProvider } from './systems/GameContext';
import './styles/global.css';

// Register service worker (PWA) — only in production build.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
);
