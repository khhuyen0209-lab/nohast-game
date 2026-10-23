// Nohast server entry: Express API + WebSocket on the same port (Render-friendly).
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import http from 'node:http';
import { config } from './config';
import { initFirebaseAdmin } from './auth/firebaseAdmin';
import { getRepository } from './repositories';
import { ensureMarket } from './services/marketService';
import api from './api';
import { errorHandler, notFound } from './api/middleware';
import { attachWebSocket } from './multiplayer/wsServer';

initFirebaseAdmin();
const repo = getRepository();
ensureMarket(repo).catch((e) => console.warn('[market] init warning:', e.message));

const app = express();
app.disable('x-powered-by');

const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
    if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origin không được phép (CORS).'));
  },
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

if (config.rateLimitPerMin > 0) {
  app.use('/api/', rateLimit({
    windowMs: 60_000, limit: config.rateLimitPerMin, standardHeaders: true, legacyHeaders: false,
    message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
  }));
}

app.use('/api', api);
app.get('/', (_req, res) => res.json({ service: 'nohast-server-api', health: '/api/health', docs: 'xem README.md' }));
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
attachWebSocket(server);

server.listen(config.port, () => {
  console.log(`[server] Nohast API + WS chạy tại http://localhost:${config.port}`);
  console.log(`[server] NODE_ENV=${config.nodeEnv}, store=${repo.kind}, CORS=${config.corsOrigins.join(',')}`);
  if (config.memoryStore) console.warn('[server] Đang chạy MEMORY_STORE — dữ liệu mất khi restart. Đặt FIREBASE_* env để dùng Firestore.');
});

process.on('SIGTERM', () => { console.log('[server] SIGTERM, đóng...'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { server.close(() => process.exit(0)); });

export default app;
