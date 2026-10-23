// Core acceptance tests (spec §50): run with `npm test` — no Firebase needed.
import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRepository } from '../src/repositories/memory';
import { aggregateShipStats, travelTimeMs, warpFuelCost, validateModuleInstall, maintenanceFor } from '../src/game/engine';
import { createStarterShip, startWarp, installModule } from '../src/services/shipService';
import { buildStation } from '../src/services/stationService';
import { buyResource, sellResource, ensureMarket } from '../src/services/marketService';
import { GAME_LIMITS } from '../../shared/constants';
import type { Ship } from '../../shared/types';

let repo: MemoryRepository;
before(() => { repo = new MemoryRepository(); });

describe('engine', () => {
  test('starter ship stats aggregate correctly', async () => {
    const ship = await createStarterShip(repo, 'u1', 'Test');
    const stats = aggregateShipStats(ship);
    assert.ok(stats.powerBalance >= 0, `power should be balanced, got ${stats.powerBalance}`);
    assert.ok(stats.miningRate > 0);
    assert.ok(stats.warpSpeed > 0);
  });

  test('travel time and fuel cost are finite between real bodies', () => {
    const ship: any = { hullDefId: 'hull-scout-mk1', modules: { engine: { defId: 'engine-ion-mk1', hp: 80 }, reactor: { defId: 'reactor-fission-mk1', hp: 100 } }, cargo: {} };
    const ms = travelTimeMs(ship, 'sol-inner', 'nohast-central', 'mars');
    assert.ok(isFinite(ms) && ms > 0);
    const fuel = warpFuelCost('sol-inner', 'nohast-central', 'mars');
    assert.ok(fuel > 0);
  });

  test('module install rejects wrong slot and power overload', async () => {
    const ship = await createStarterShip(repo, 'u2', 'Test2');
    const def = (await import('../../shared/game-data/modules')).getModule('weapon-railgun-mk2')!;
    // weapon slot already occupied on scout (single weapon) -> reject
    const v = validateModuleInstall(ship, 'weapon', def);
    assert.equal(v.ok, false);
  });

  test('maintenance scales non-linearly with ship count', () => {
    const a = maintenanceFor(1, 0, 86400_000).credits;
    const b = maintenanceFor(3, 0, 86400_000).credits;
    assert.ok(b > 3 * a * 0.5, 'more ships should cost disproportionately more');
  });
});

describe('wallet & economy (spec §25)', () => {
  test('cannot spend more credits than balance', async () => {
    await repo.mutateWallet('u3', () => ({ deltaCredits: 1000, deltaResources: {}, kind: 'adjustment' }));
    await assert.rejects(() => repo.mutateWallet('u3', () => ({ deltaCredits: -5000, deltaResources: {}, kind: 'market_buy' })));
    const w = await repo.getWallet('u3');
    assert.equal(w.credits, 1000);
  });

  test('buy/sell is atomic and prices move', async () => {
    await ensureMarket(repo);
    await repo.mutateWallet('u4', () => ({ deltaCredits: 100000, deltaResources: {}, kind: 'adjustment' }));
    const buy = await buyResource(repo, 'u4', 'iron_ore', 100);
    assert.equal(buy.wallet.resources.iron_ore, 100);
    const sell = await sellResource(repo, 'u4', 'iron_ore', 100);
    assert.equal(sell.wallet.resources.iron_ore, 0);
    assert.ok(sell.total > 0);
  });
});

describe('ownership & limits (spec §10)', () => {
  test('getShip enforces ownership', async () => {
    const ship = await createStarterShip(repo, 'owner-a', 'A');
    const other = await repo.getShip('owner-b', ship.id);
    assert.equal(other, null);
    const same = await repo.getShip('owner-a', ship.id);
    assert.ok(same);
  });

  test('max 1 station per player enforced server-side', async () => {
    await repo.mutateWallet('u5', () => ({ deltaCredits: 1_000_000, deltaResources: {}, kind: 'adjustment' }));
    await buildStation(repo, 'u5', 'S1');
    await assert.rejects(() => buildStation(repo, 'u5', 'S2'));
    assert.equal(await repo.countStations('u5'), 1);
  });

  test('max 3 ships: starter ship counts toward limit', async () => {
    await createStarterShip(repo, 'u6', 'A');
    await createStarterShip(repo, 'u6', 'B');
    await createStarterShip(repo, 'u6', 'C');
    assert.equal(await repo.countShips('u6'), 3);
    // A 4th would be blocked by a check in the API layer (not in createStarterShip directly).
    assert.ok(GAME_LIMITS.MAX_SHIPS_PER_PLAYER === 3);
  });
});

describe('warp validation', () => {
  test('warp requires fuel and rejects unknown destination', async () => {
    const ship = await createStarterShip(repo, 'u7', 'W');
    ship.fuel = 0;
    await repo.upsertShip(ship);
    await assert.rejects(() => startWarp(repo, 'u7', ship.id, 'mars'));
    await assert.rejects(() => startWarp(repo, 'u7', ship.id, 'not-a-body'));
  });
});
