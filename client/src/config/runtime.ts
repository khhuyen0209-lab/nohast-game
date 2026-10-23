// Reads window.__NOHAST_CONFIG__ injected by public/config.js (runtime, no rebuild).
declare global {
  interface Window {
    __NOHAST_CONFIG__?: {
      API_URL?: string;
      FIREBASE?: Record<string, string>;
      HOSTING_URLS?: string[];
    };
  }
}

const cfg = window.__NOHAST_CONFIG__ || {};

// In dev, use relative paths (Vite proxy). In prod, use configured API_URL.
const isDev = import.meta.env.DEV;
export const API_BASE = isDev ? '' : (cfg.API_URL || 'https://nohast-game.onrender.com');
export const WS_URL = isDev ? '' : (cfg.API_URL || 'https://nohast-game.onrender.com').replace(/^http/, 'ws');
export const FIREBASE_CONFIG = cfg.FIREBASE || {
  apiKey: 'AIzaSyBSjkUtnSAe9KJiRyO7HA5CwQhJACOxP5Q',
  authDomain: 'nohast-galaxy-c6c9f.firebaseapp.com',
  projectId: 'nohast-galaxy-c6c9f',
  storageBucket: 'nohast-galaxy-c6c9f.firebasestorage.app',
  messagingSenderId: '899103073859',
  appId: '1:899103073859:web:9140c65c85e053cb9916f6',
};
export const HOSTING_URLS = cfg.HOSTING_URLS || [];
