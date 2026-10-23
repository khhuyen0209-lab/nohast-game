// Ship lifecycle: starter ship, movement (warp), mining, module install.
// All mutations go through repository; server is authoritative (spec §5).
import type { GameRepository } from '../repositories/types';
import type { Ship, PlayerProfile, ModuleSlot, ResourceId } from '../../../shared/types';
import { GAME_LIMITS, NOHAST_STATION } from '../../../shared/constants';
import { getModule, HULL_EXTRAS } from '../../../shared/game-data/modules';
import { getBody } from '../../../shared/game-data/world';
import { aggregateShipStats, travelTimeMs, warpFuelCost, miningYieldFor, validateModuleInstall, bodyPos } from '../game/engine';

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createStarterShip(repo: GameRepository, uid: string, name: string): Promise<Ship> {
  const hullDef = getModule('hull-scout-mk1')!;
  const extra = HULL_EXTRAS['hull-scout-mk1'];
  const dockBody = getBody(NOHAST_STATION.regionId, NOHAST_STATION.id);
  const dockPos = dockBody ? bodyPos(dockBody) : { x: NOHAST_STATION.x, y: NOHAST_STATION.y };
  const ship: Ship = {
    id: newId('ship'),
    ownerUid: uid,
    name,
    hullDefId: 'hull-scout-mk1',
    modules: {
      engine: { defId: 'engine-ion-mk1', hp: 80 },
      reactor: { defId: 'reactor-fission-mk1', hp: 100 },
      weapon: { defId: 'weapon-laser-mk1', hp: 60 },
      shield: { defId: 'shield-deflector-mk1', hp: 80 },
      cargo: { defId: 'cargo-hold-mk1', hp: 50 },
      sensor: { defId: 'sensor-basic-mk1', hp: 40 },
      mining: { defId: 'mining-laser-mk1', hp: 70 },
      computer: { defId: 'computer-autopilot-mk1', hp: 50 },
    },
    position: { regionId: NOHAST_STATION.regionId, x: dockPos.x, y: dockPos.y, z: 0, dockedAtBodyId: NOHAST_STATION.id },
    status: 'docked',
    hullHp: extra.maxHull,
    maxHullHp: extra.maxHull,
    shieldHp: 100,
    fuel: GAME_LIMITS.STARTER_FUEL,
    maxFuel: extra.maxFuel,
    cargo: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await repo.upsertShip(ship);
  return ship;
}

// Resolve any in-progress warp/mining based on server clock (spec §8).
export async function resolveShipState(repo: GameRepository, ship: Ship): Promise<Ship> {
  const now = Date.now();
  let changed = false;
  if (ship.status === 'warping' && ship.position.warp && now >= ship.position.warp.arrivesAt) {
    const body = getBody(ship.position.regionId, ship.position.warp.toBodyId);
    if (body) {
      ship.position.x = body.orbitRadius * Math.cos((body.orbitAngleDeg * Math.PI) / 180);
      ship.position.y = body.orbitRadius * Math.sin((body.orbitAngleDeg * Math.PI) / 180);
      ship.position.dockedAtBodyId = body.dockable ? body.id : undefined;
      ship.status = body.dockable ? 'docked' : 'in_space';
    }
    ship.position.warp = undefined;
    changed = true;
  }
  if (ship.status === 'mining' && ship.position.mining) {
    const body = getBody(ship.position.regionId, ship.position.mining.targetBodyId);
    const elapsed = now - ship.position.mining.startedAt;
    if (body && elapsed > 60_000) {
      const yield_ = miningYieldFor(ship, body, elapsed);
      const stats = aggregateShipStats(ship);
      let capacity = stats.cargoCapacity * 10; // units
      for (const [rid, amt] of Object.entries(yield_)) {
        const cur = ship.cargo[rid as ResourceId] || 0;
        const add = Math.min(amt || 0, Math.max(0, capacity - cur));
        if (add > 0) { ship.cargo[rid as ResourceId] = cur + add; changed = true; }
        capacity -= cur + add;
      }
      // fuel cost for mining
      const fuelCost = Math.ceil((elapsed / 3600_000) * GAME_LIMITS.MINING_FUEL_PER_HOUR);
      ship.fuel = Math.max(0, ship.fuel - fuelCost);
      ship.position.mining.startedAt = now; // reset window; client may stop mining
    }
  }
  if (changed) {
    ship.updatedAt = now;
    await repo.upsertShip(ship);
  }
  return ship;
}

export async function startWarp(repo: GameRepository, uid: string, shipId: string, toBodyId: string): Promise<Ship> {
  const ship = await repo.getShip(uid, shipId);
  if (!ship) throw new Error('Không tìm thấy tàu hoặc không có quyền sở hữu.');
  if (ship.status === 'warping') throw new Error('Tàu đang di chuyển.');
  if (ship.status === 'destroyed' || ship.status === 'disabled') throw new Error('Tàu không thể di chuyển.');
  const fromId = ship.position.dockedAtBodyId || (ship.position.warp?.toBodyId ?? '');
  if (!fromId) throw new Error('Không xác định được điểm xuất phát.');
  const toBody = getBody(ship.position.regionId, toBodyId);
  if (!toBody) throw new Error('Đích đến không tồn tại.');
  const fuelCost = warpFuelCost(ship.position.regionId, fromId, toBodyId);
  if (ship.fuel < fuelCost) throw new Error(`Không đủ nhiên liệu (cần ${fuelCost}, có ${Math.floor(ship.fuel)}).`);
  const ms = travelTimeMs(ship, ship.position.regionId, fromId, toBodyId);
  if (!isFinite(ms)) throw new Error('Không thể tính lộ trình.');
  ship.fuel -= fuelCost;
  ship.status = 'warping';
  ship.position.dockedAtBodyId = undefined;
  ship.position.mining = undefined;
  ship.position.warp = { fromBodyId: fromId, toBodyId, startedAt: Date.now(), arrivesAt: Date.now() + Math.max(3000, ms) };
  await repo.upsertShip(ship);
  return ship;
}

export async function startMining(repo: GameRepository, uid: string, shipId: string): Promise<Ship> {
  const ship = await repo.getShip(uid, shipId);
  if (!ship) throw new Error('Không tìm thấy tàu.');
  if (ship.status === 'warping') throw new Error('Tàu đang di chuyển, không thể khai thác.');
  const stats = aggregateShipStats(ship);
  if (stats.miningRate <= 0) throw new Error('Tàu không có thiết bị khai thác.');
  // Must be at an asteroid field / body with resources (not docked at station)
  const body = ship.position.dockedAtBodyId ? getBody(ship.position.regionId, ship.position.dockedAtBodyId) : undefined;
  const target = body && body.resources ? body : undefined;
  if (!target) throw new Error('Cần neo tại thiên thể có tài nguyên để khai thác.');
  ship.status = 'mining';
  ship.position.mining = { targetBodyId: target.id, startedAt: Date.now(), ratePerHour: stats.miningRate, resourceId: 'iron_ore' };
  await repo.upsertShip(ship);
  return ship;
}

export async function stopActivity(repo: GameRepository, uid: string, shipId: string): Promise<Ship> {
  const ship = await repo.getShip(uid, shipId);
  if (!ship) throw new Error('Không tìm thấy tàu.');
  const resolved = await resolveShipState(repo, ship);
  if (resolved.status === 'mining') { resolved.status = resolved.position.dockedAtBodyId ? 'docked' : 'in_space'; resolved.position.mining = undefined; await repo.upsertShip(resolved); }
  return resolved;
}

export async function installModule(repo: GameRepository, uid: string, shipId: string, slot: ModuleSlot, moduleDefId: string): Promise<Ship> {
  const ship = await repo.getShip(uid, shipId);
  if (!ship) throw new Error('Không tìm thấy tàu.');
  const def = getModule(moduleDefId);
  if (!def) throw new Error('Module không tồn tại.');
  const v = validateModuleInstall(ship, slot, def);
  if (!v.ok) throw new Error(v.reason);
  // Deduct module from inventory (ship_module) or charge credits — MVP: charge credits at shipyard.
  await repo.mutateWallet(uid, () => ({ deltaCredits: -def.cost, deltaResources: {}, kind: 'module_purchase', note: `Mua & lắp ${def.name}` }));
  ship.modules[slot] = { defId: def.id, hp: def.durability };
  await repo.upsertShip(ship);
  return ship;
}

export async function sellCargo(repo: GameRepository, uid: string, shipId: string, resourceId: ResourceId, amount: number, pricePerUnit: number): Promise<Ship> {
  const ship = await repo.getShip(uid, shipId);
  if (!ship) throw new Error('Không tìm thấy tàu.');
  if (!ship.position.dockedAtBodyId) throw new Error('Phải cập bến tại trạm có chợ để bán hàng.');
  const have = ship.cargo[resourceId] || 0;
  if (have < amount) throw new Error('Không đủ hàng trong kho.');
  ship.cargo[resourceId] = have - amount;
  await repo.upsertShip(ship);
  await repo.mutateWallet(uid, () => ({ deltaCredits: amount * pricePerUnit, deltaResources: {}, kind: 'market_sell', note: `Bán ${amount} ${resourceId}` }));
  return ship;
}
