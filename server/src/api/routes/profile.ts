import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../../auth/firebaseAdmin';
import { getRepository } from '../../repositories';
import { asyncHandler } from '../middleware';
import { validateCreateProfile } from '../../../../shared/schemas/validators';
import { GAME_LIMITS } from '../../../../shared/constants';
import { createStarterShip } from '../../services/shipService';
import { processOfflineCatchUp } from '../../services/offlineService';
import type { PlayerProfile } from '../../../../shared/types';

const r = Router();
r.use(requireAuth);

// GET /api/profile — full state snapshot for the logged-in player
r.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const repo = getRepository();
  const uid = req.uid!;
  let profile = await repo.getProfile(uid);
  if (!profile) return res.status(404).json({ error: 'Chưa tạo hồ sơ. Gọi POST /api/profile để tạo.', code: 'NO_PROFILE' });
  const offline = await processOfflineCatchUp(repo, uid);
  const wallet = await repo.getWallet(uid);
  const ships = await repo.listShips(uid);
  const stations = await repo.listStations(uid);
  const crew = await repo.listCrew(uid);
  res.json({ profile, wallet, ships, stations, crew, offline });
}));

// POST /api/profile — create commander profile + starter ship + starter credits (idempotent)
r.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  const repo = getRepository();
  const uid = req.uid!;
  const existing = await repo.getProfile(uid);
  if (existing) return res.status(409).json({ error: 'Hồ sơ đã tồn tại.', code: 'PROFILE_EXISTS' });
  const v = validateCreateProfile(req.body);
  if (!v.ok) return res.status(400).json({ error: 'Dữ liệu không hợp lệ.', errors: v.errors });
  const profile: PlayerProfile = {
    uid, commanderName: v.commanderName, createdAt: Date.now(), lastSeenAt: Date.now(),
    credits: 0, tutorialStep: 0, respawns: 0, commanderStatus: 'alive',
  };
  await repo.upsertProfile(profile);
  // Starter wallet (atomic)
  await repo.mutateWallet(uid, () => ({ deltaCredits: GAME_LIMITS.STARTER_CREDITS, deltaResources: { fuel: GAME_LIMITS.STARTER_FUEL }, kind: 'adjustment', note: 'Tài sản khởi đầu' }));
  const ship = await createStarterShip(repo, uid, `Tàu ${v.commanderName}`);
  res.status(201).json({ profile, ship, starterCredits: GAME_LIMITS.STARTER_CREDITS, starterFuel: GAME_LIMITS.STARTER_FUEL });
}));

// PATCH /api/profile — update tutorial step / performance mode only
r.patch('/', asyncHandler(async (req: AuthedRequest, res) => {
  const repo = getRepository();
  const uid = req.uid!;
  const profile = await repo.getProfile(uid);
  if (!profile) return res.status(404).json({ error: 'Chưa có hồ sơ.' });
  if (typeof req.body.tutorialStep === 'number') profile.tutorialStep = Math.max(0, Math.min(20, Math.floor(req.body.tutorialStep)));
  if (['low', 'medium', 'high'].includes(req.body.performanceMode)) profile.performanceMode = req.body.performanceMode;
  await repo.upsertProfile(profile);
  res.json({ profile });
}));

export default r;
