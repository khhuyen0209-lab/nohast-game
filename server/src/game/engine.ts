// Pure game-logic functions (no I/O) — easy to unit-test.
import type { Ship, ShipModuleDef, ModuleSlot, CelestialBody, ResourceId } from '../../../shared/types';
import { getModule, HULL_EXTRAS } from '../../../shared/game-data/modules';
import { GAME_LIMITS, dailyMaintenanceCredits, dailyMaintenanceFuel } from '../../../shared/constants';
import { getBody } from '../../../shared/game-data/world';

export interface AggregatedStats {
  powerProduced: number;
  powerConsumed: number;
  powerBalance: number; // negative = overload
  totalMass: number;
  cargoCapacity: number; // m^3
  warpSpeed: number; // region units / hour
  thrust: number;
  miningRate: number; // units/hour
  shieldMax: number;
  crewCapacity: number;
  automation: number;
  sensorRange: number;
  weaponDamage: number;
  weaponCount: number;
}

export function aggregateShipStats(ship: Ship): AggregatedStats {
  let powerProduced = 0, powerConsumed = 0, totalMass = 0, cargoCapacity = 0;
  let warpSpeed = 0, thrust = 0, miningRate = 0, shieldMax = 0, crewCapacity = 0;
  let automation = 0, sensorRange = 0, weaponDamage = 0, weaponCount = 0;
  const hull = getModule(ship.hullDefId);
  if (hull) {
    totalMass += hull.mass;
    const extra = HULL_EXTRAS[hull.id];
    if (extra) cargoCapacity += extra.baseCargo;
  }
  for (const inst of Object.values(ship.modules)) {
    if (!inst) continue;
    const def = getModule(inst.defId);
    if (!def) continue;
    totalMass += def.mass;
    if (def.powerDraw < 0) powerProduced += -def.powerDraw; else powerConsumed += def.powerDraw;
    const s = def.stats;
    if (s.warpSpeed) warpSpeed = Math.max(warpSpeed, s.warpSpeed); // best engine
    if (s.thrust) thrust += s.thrust;
    if (s.miningRate) miningRate += s.miningRate;
    if (s.shieldHp) shieldMax += s.shieldHp;
    if (s.cargoCapacity) cargoCapacity += s.cargoCapacity;
    if (s.crewCapacity) crewCapacity += s.crewCapacity;
    if (s.automation) automation = Math.max(automation, s.automation);
    if (s.sensorRange) sensorRange = Math.max(sensorRange, s.sensorRange);
    if (s.weaponDamage) { weaponDamage += s.weaponDamage; weaponCount += 1; }
  }
  return {
    powerProduced, powerConsumed, powerBalance: powerProduced - powerConsumed,
    totalMass, cargoCapacity, warpSpeed: warpSpeed || 0.2, thrust, miningRate, shieldMax,
    crewCapacity, automation, sensorRange, weaponDamage, weaponCount,
  };
}

export function cargoUsed(ship: Ship): number {
  let used = 0;
  for (const [rid, amt] of Object.entries(ship.cargo)) {
    // volume lookup via resource defs (imported lazily to avoid cycle)
    used += (amt || 0) * GAME_LIMITS.CARGO_VOLUME_PER_UNIT * 10; // rough
  }
  return used;
}

export function bodyPos(b: CelestialBody): { x: number; y: number } {
  const rad = (b.orbitAngleDeg * Math.PI) / 180;
  return { x: b.orbitRadius * Math.cos(rad), y: b.orbitRadius * Math.sin(rad) };
}

export function distanceBetweenBodies(regionId: string, aId: string, bId: string): number {
  const a = getBody(regionId, aId);
  const b = getBody(regionId, bId);
  if (!a || !b) return Infinity;
  const pa = bodyPos(a), pb = bodyPos(b);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

// Travel time in ms. MVP: instant-ish warp scaled to seconds for playability.
// Real scale: distance (Mkm) / warpSpeed (Mkm/h) * 3600_000. We compress by WARP_TIME_SCALE.
const WARP_TIME_SCALE = 0.01; // 1% of real time for playability (configurable)
export function travelTimeMs(ship: Ship, regionId: string, fromId: string, toId: string): number {
  const stats = aggregateShipStats(ship);
  const dist = distanceBetweenBodies(regionId, fromId, toId);
  if (!isFinite(dist) || stats.warpSpeed <= 0) return Infinity;
  return (dist / stats.warpSpeed) * 3600_000 * WARP_TIME_SCALE;
}

export function warpFuelCost(regionId: string, fromId: string, toId: string): number {
  const dist = distanceBetweenBodies(regionId, fromId, toId);
  return Math.max(1, Math.ceil(dist * GAME_LIMITS.WARP_FUEL_PER_UNIT_DIST / 10));
}

export function miningYieldFor(ship: Ship, body: CelestialBody, durationMs: number): Partial<Record<ResourceId, number>> {
  const stats = aggregateShipStats(ship);
  if (stats.miningRate <= 0 || !body.resources) return {};
  const hours = durationMs / 3600_000;
  const out: Partial<Record<ResourceId, number>> = {};
  for (const [rid, coeff] of Object.entries(body.resources)) {
    out[rid as ResourceId] = Math.floor(stats.miningRate * hours * (coeff || 0));
  }
  return out;
}

export function maintenanceFor(shipCount: number, stationLevel: number, elapsedMs: number) {
  const days = elapsedMs / (24 * 3600_000);
  return {
    credits: Math.ceil(dailyMaintenanceCredits(shipCount, stationLevel) * days),
    fuel: Math.ceil(dailyMaintenanceFuel(shipCount) * days),
  };
}

export interface InstallValidation {
  ok: boolean;
  reason?: string;
}

export function validateModuleInstall(ship: Ship, slot: ModuleSlot, def: ShipModuleDef): InstallValidation {
  if (def.slot !== slot) return { ok: false, reason: 'Module không khớp khe cắm.' };
  const hull = getModule(ship.hullDefId);
  const extra = hull ? HULL_EXTRAS[hull.id] : undefined;
  if (extra && !extra.allowedSlots.includes(slot)) return { ok: false, reason: 'Khe cắm này không tồn tại trên thân tàu.' };
  // Weapon can be multiple; others single slot. For MVP allow 2 weapons on gunship.
  if (slot !== 'weapon' && ship.modules[slot]) return { ok: false, reason: 'Khe cắm đã có module, hãy gỡ ra trước.' };
  // Power balance after install
  const projected = { ...ship.modules, [slot]: { defId: def.id, hp: def.durability } };
  const stats = aggregateShipStats({ ...ship, modules: projected });
  if (stats.powerBalance < 0) return { ok: false, reason: `Công suất không đủ (cần thêm ${-stats.powerBalance} MW).` };
  return { ok: true };
}
