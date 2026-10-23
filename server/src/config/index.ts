// Centralized server config (spec §43). All URLs/env in one place.
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v !== undefined && v !== '') return v;
  if (fallback !== undefined) return fallback;
  // Fail fast in production; in dev allow placeholder with warning.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[config] Thiếu biến môi trường bắt buộc: ${name}`);
  }
  console.warn(`[config] Thiếu ${name}, dùng giá trị mẫu (chỉ chạy được với MEMORY_STORE=1).`);
  return `MISSING_${name}`;
}

export const config = {
  port: parseInt(process.env.PORT || '10000', 10),
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  isProd: process.env.NODE_ENV === 'production',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL || 'https://nohast-galaxy-c6c9f.web.app',
  apiUrl: process.env.API_URL || 'https://nohast-game.onrender.com',
  firebase: {
    projectId: required('FIREBASE_PROJECT_ID', 'nohast-galaxy-c6c9f'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    // Private key may contain literal \n from Render env -> normalize.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  // MEMORY_STORE=1: run without Firebase credentials (local dev / CI tests).
  memoryStore: process.env.MEMORY_STORE === '1' || !process.env.FIREBASE_PRIVATE_KEY,
  rateLimitPerMin: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '120', 10),
  chatRatePerMin: parseInt(process.env.CHAT_RATE_PER_MIN || '20', 10),
};

export type ServerConfig = typeof config;
