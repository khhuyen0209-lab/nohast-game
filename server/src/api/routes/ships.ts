import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../../auth/firebaseAdmin';
import { getRepository } from '../../repositories';
import { asyncHandler } from '../middleware';
import { startWarp, startMining, stopActivity, installModule, resolveShipState, sellCargo } from '../../services/shipService';
import { aggregateShipStats } from '../../game/engine';
import { MODULE_CATALOG } from '../../../../shared/game-data/modules';
import { GAME_LIMITS } from '../../../../shared/constants';
import { isStr, isSlot, isResourceId, isPositiveNum } from '../../../../shared/schemas/validators';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const repo = getRepository();
  const ships = await repo.listShips(req.uid!);
  const resolved = await Promise.all(ships.map((s) => resolveShipState(repo, s)));
  res.json({ ships: resolved.map((s) => ({ ...s, stats: aggregateShipStats(s) })), maxShips: GAME_LIMITS.MAX_SHIPS_PER_PLAYER });
}));

r.post('/:shipId/warp', asyncHandler(async (req: AuthedRequest, res) => {
  if (!isStr(req.body.toBodyId, 60)) return res.status(400).json({ error: 'Thiếu toBodyId.' });
  const ship = await startWarp(getRepository(), req.uid!, req.params.shipId, req.body.toBodyId);
  res.json({ ship });
}));

r.post('/:shipId/mining/start', asyncHandler(async (req: AuthedRequest, res) => {
  const ship = await startMining(getRepository(), req.uid!, req.params.shipId);
  res.json({ ship });
}));

r.post('/:shipId/stop', asyncHandler(async (req: AuthedRequest, res) => {
  const ship = await stopActivity(getRepository(), req.uid!, req.params.shipId);
  res.json({ ship });
}));

r.post('/:shipId/modules', asyncHandler(async (req: AuthedRequest, res) => {
  if (!isSlot(req.body.slot) || !isStr(req.body.moduleDefId, 60)) return res.status(400).json({ error: 'slot hoặc moduleDefId không hợp lệ.' });
  const ship = await installModule(getRepository(), req.uid!, req.params.shipId, req.body.slot, req.body.moduleDefId);
  res.json({ ship, stats: aggregateShipStats(ship) });
}));

r.post('/:shipId/sell-cargo', asyncHandler(async (req: AuthedRequest, res) => {
  if (!isResourceId(req.body.resourceId) || !isPositiveNum(req.body.amount)) return res.status(400).json({ error: 'Dữ liệu bán hàng không hợp lệ.' });
  if (!isPositiveNum(req.body.pricePerUnit)) return res.status(400).json({ error: 'Giá phải do server quyết định — gửi pricePerUnit từ bảng giá server.' });
  const ship = await sellCargo(getRepository(), req.uid!, req.params.shipId, req.body.resourceId, Math.floor(req.body.amount), req.body.pricePerUnit);
  res.json({ ship });
}));

r.get('/catalog/modules', (_req, res) => res.json({ modules: MODULE_CATALOG }));

export default r;
