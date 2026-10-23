// ============================================================
// NOHAST — Runtime config (public, safe to expose).
// Edit THIS FILE after deploy if URLs change — no rebuild needed (spec §43).
// This is Firebase WEB config (public by design). NEVER put Admin private key here.
// ============================================================
window.__NOHAST_CONFIG__ = {
  // Backend API on Render
  API_URL: 'https://nohast-game.onrender.com',
  // Firebase Web App config (project: nohast-galaxy-c6c9f)
  FIREBASE: {
    apiKey: 'AIzaSyBSjkUtnSAe9KJiRyO7HA5CwQhJACOxP5Q',
    authDomain: 'nohast-galaxy-c6c9f.firebaseapp.com',
    projectId: 'nohast-galaxy-c6c9f',
    storageBucket: 'nohast-galaxy-c6c9f.firebasestorage.app',
    messagingSenderId: '899103073859',
    appId: '1:899103073859:web:9140c65c85e053cb9916f6',
  },
  // Expected hosting origins (for reference / CORS alignment)
  HOSTING_URLS: [
    'https://nohast-galaxy-c6c9f.web.app',
    'https://nohast-galaxy-c6c9f.firebaseapp.com',
  ],
};
