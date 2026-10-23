import { Router } from 'express';
import health from './routes/health';
import profile from './routes/profile';
import ships from './routes/ships';
import economy from './routes/economy';
import stations from './routes/stations';
import world from './routes/world';

const api = Router();
api.use('/health', health);
api.use('/profile', profile);
api.use('/ships', ships);
api.use('/economy', economy);
api.use('/stations', stations);
api.use('/world', world);
api.get('/config', (_req, res) => {
  res.json({
    service: 'nohast-server-api',
    version: '1.0.0-mvp',
    features: ['auth', 'ships', 'modules', 'mining', 'market', 'stations', 'nohast', 'chat', 'presence', 'offline-progression'],
    note: 'Server là nguồn dữ liệu có thẩm quyền (spec §5). Client không ghi trực tiếp Firestore.',
  });
});
export default api;
