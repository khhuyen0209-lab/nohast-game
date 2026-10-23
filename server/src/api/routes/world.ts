import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../../auth/firebaseAdmin';
import { getRepository } from '../../repositories';
import { asyncHandler } from '../middleware';
import { REGIONS, FACTIONS } from '../../../../shared/game-data/world';
import { hireCrew } from '../../services/crewService';

const r = Router();

// Public world data (no auth needed)
r.get('/regions', (_req, res) => res.json({ regions: REGIONS }));
r.get('/factions', (_req, res) => res.json({ factions: FACTIONS }));

r.use(requireAuth);

r.get('/presence/:regionId', asyncHandler(async (req, res) => {
  const repo = getRepository();
  const list = await repo.presenceInRegion(req.params.regionId);
  res.json({ presence: list });
}));

r.get('/chat/:channel', asyncHandler(async (req: AuthedRequest, res) => {
  const repo = getRepository();
  const channel = req.params.channel as any;
  const regionId = typeof req.query.regionId === 'string' ? req.query.regionId : undefined;
  const msgs = await repo.recentChat(channel, regionId, 50);
  res.json({ messages: msgs });
}));

r.get('/crew', asyncHandler(async (req: AuthedRequest, res) => {
  const crew = await getRepository().listCrew(req.uid!);
  res.json({ crew });
}));

r.post('/crew/hire', asyncHandler(async (req: AuthedRequest, res) => {
  const c = await hireCrew(getRepository(), req.uid!);
  res.status(201).json({ crew: c });
}));

export default r;
