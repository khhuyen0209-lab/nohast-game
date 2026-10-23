import { Router } from 'express';
import { config } from '../../config';
import { getRepository } from '../../repositories';
import { getOnlineCount } from '../../multiplayer/wsServer';

const r = Router();

r.get('/', async (_req, res) => {
  const repo = getRepository();
  res.json({
    status: 'ok',
    service: 'nohast-server-api',
    time: new Date().toISOString(),
    store: repo.kind,
    env: config.nodeEnv,
    onlinePlayers: getOnlineCount(),
    memoryStore: config.memoryStore,
  });
});

export default r;
