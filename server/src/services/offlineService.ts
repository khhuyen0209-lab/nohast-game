// Offline progression (spec §8): time continues while player is away.
// On login, compute elapsed time, apply maintenance + any auto-mining, cap work.
import type { GameRepository } from '../repositories/types';
import type { OfflineReport } from '../../../shared/types';
import { GAME_LIMITS } from '../../../shared/constants';
import { maintenanceFor } from '../game/engine';
import { resolveShipState } from './shipService';

export async function processOfflineCatchUp(repo: GameRepository, uid: string): Promise<OfflineReport> {
  const profile = await repo.getProfile(uid);
  const now = Date.now();
  const report: OfflineReport = { elapsedMs: 0, maintenanceCredits: 0, maintenanceFuel: 0, miningYield: {}, capped: false, notes: [] };
  if (!profile) return report;
  let elapsed = now - profile.lastSeenAt;
  if (elapsed < 60_000) { profile.lastSeenAt = now; await repo.upsertProfile(profile); return report; }
  if (elapsed > GAME_LIMITS.MAX_OFFLINE_MS) { elapsed = GAME_LIMITS.MAX_OFFLINE_MS; report.capped = true; report.notes.push('Thời gian ngoại tuyến bị giới hạn ở 7 ngày (spec §8).'); }
  report.elapsedMs = elapsed;

  const ships = await repo.listShips(uid);
  for (const s of ships) await resolveShipState(repo, s);
  const stations = await repo.listStations(uid);
  const m = maintenanceFor(ships.length, stations[0]?.level || 0, elapsed);
  report.maintenanceCredits = m.credits;
  report.maintenanceFuel = m.fuel;

  if (m.credits > 0 || m.fuel > 0) {
    try {
      await repo.mutateWallet(uid, (w) => {
        const fuelHave = w.resources.fuel || 0;
        const fuelPaid = Math.min(fuelHave, m.fuel);
        if (fuelPaid < m.fuel) report.notes.push('Không đủ nhiên liệu bảo trì — một phần tàu bị giảm hiệu suất.');
        return { deltaCredits: -Math.min(w.credits, m.credits), deltaResources: { fuel: -fuelPaid }, kind: 'maintenance_fee', note: 'Bảo trì ngoại tuyến' };
      });
    } catch {
      report.notes.push('Không đủ tín dụng để trả bảo trì — tài sản bị tạm thời hạ cấp.');
    }
  }
  profile.lastSeenAt = now;
  await repo.upsertProfile(profile);
  return report;
}
