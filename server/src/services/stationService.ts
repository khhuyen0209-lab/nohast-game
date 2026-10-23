// Personal stations (max 1 per player, spec §10) + Nohast central services.
import type { GameRepository } from '../repositories/types';
import type { PersonalStation } from '../../../shared/types';
import { GAME_LIMITS, NOHAST_STATION } from '../../../shared/constants';
import { newId } from './shipService';

const STATION_BUILD_COST = 50000;

export async function buildStation(repo: GameRepository, uid: string, name: string): Promise<PersonalStation> {
  const count = await repo.countStations(uid);
  if (count >= GAME_LIMITS.MAX_STATIONS_PER_PLAYER) {
    throw new Error(`Đã đạt giới hạn ${GAME_LIMITS.MAX_STATIONS_PER_PLAYER} trạm cá nhân (xác thực ở backend).`);
  }
  await repo.mutateWallet(uid, () => ({ deltaCredits: -STATION_BUILD_COST, deltaResources: {}, kind: 'station_build', note: 'Xây trạm cá nhân' }));
  const station: PersonalStation = {
    id: newId('station'),
    ownerUid: uid,
    name: name || `Trạm ${uid.slice(0, 6)}`,
    regionId: NOHAST_STATION.regionId,
    x: NOHAST_STATION.x + 0.05, y: NOHAST_STATION.y + 0.03, z: 0,
    level: 1,
    hasRespawnBay: false,
    storage: {},
    storageFeePaidUntil: Date.now(),
    hp: 1000, maxHp: 1000,
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  await repo.upsertStation(station);
  return station;
}

export async function upgradeRespawnBay(repo: GameRepository, uid: string, stationId: string): Promise<PersonalStation> {
  const stations = await repo.listStations(uid);
  const s = stations.find((x) => x.id === stationId);
  if (!s) throw new Error('Không tìm thấy trạm.');
  const cost = 30000;
  await repo.mutateWallet(uid, () => ({ deltaCredits: -cost, deltaResources: {}, kind: 'station_build', note: 'Lắp buồng nhân bản hồi sinh' }));
  s.hasRespawnBay = true;
  await repo.upsertStation(s);
  return s;
}

// Nohast respawn (spec §15). Fee charged; does NOT restore lost ships/stations.
export async function respawnAtNohast(repo: GameRepository, uid: string): Promise<{ credits: number; fee: number }> {
  const fee = GAME_LIMITS.RESPAWN_FEE_CREDITS;
  const { wallet } = await repo.mutateWallet(uid, () => ({ deltaCredits: -fee, deltaResources: {}, kind: 'respawn_fee', note: 'Hồi sinh tại Nohast' }));
  const profile = await repo.getProfile(uid);
  if (profile) {
    profile.commanderStatus = 'respawned';
    profile.respawns += 1;
    await repo.upsertProfile(profile);
  }
  return { credits: wallet.credits, fee };
}
