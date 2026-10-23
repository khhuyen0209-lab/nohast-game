import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: Vite :5173 proxies /api & /ws & /health to backend :10000.
// Prod: client built to dist/ and served by Firebase Hosting; API is on Render.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Prefer .ts over .js so any leaked .js in shared/ never shadows real .ts sources.
  resolve: {
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          firebase: ['firebase/app', 'firebase/auth'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:10000', changeOrigin: true },
      '/health': { target: 'http://localhost:10000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:10000', ws: true },
    },
  },
});
