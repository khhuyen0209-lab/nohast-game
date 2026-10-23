import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../../auth/firebaseAdmin';
import { getRepository } from '../../repositories';
import { asyncHandler } from '../middleware';
import { buildStation, upgradeRespawnBay, respawnAtNohast } from '../../services/stationService';
import { getNohastState } from '../../services/nohastService';
import { NOHAST_STATION, GAME_LIMITS } from '../../../../shared/constants';
import { isStr } from '../../../../shared/schemas/validators';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const repo = getRepository();
  const stations = await repo.listStations(req.uid!);
  res.json({ stations, maxStations: GAME_LIMITS.MAX_STATIONS_PER_PLAYER, nohast: NOHAST_STATION });
}));

r.post('/build', asyncHandler(async (req: AuthedRequest, res) => {
  const name = isStr(req.body.name, 40) ? req.body.name.trim() : undefined;
  const station = await buildStation(getRepository(), req.uid!, name || '');
  res.status(201).json({ station });
}));

r.post('/:stationId/respawn-bay', asyncHandler(async (req: AuthedRequest, res) => {
  const station = await upgradeRespawnBay(getRepository(), req.uid!, req.params.stationId);
  res.json({ station });
}));

// Nohast central services
r.get('/nohast/state', asyncHandler(async (_req, res) => {
  const state = await getNohastState(getRepository());
  res.json({ state });
}));

r.post('/nohast/respawn', asyncHandler(async (req: AuthedRequest, res) => {
  const result = await respawnAtNohast(getRepository(), req.uid!);
  res.json({ ok: true, fee: result.fee, credits: result.credits });
}));

export default r;
