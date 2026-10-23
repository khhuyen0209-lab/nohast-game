"use strict";
// ============================================================
// NOHAST — Game balance constants & limits (server-authoritative)
// Change here, both client and server follow.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGION_UNIT_MKM = exports.TECH_TIERS = exports.NOHAST_STATION = exports.NAHAST_CONFIG = exports.GAME_LIMITS = void 0;
exports.dailyMaintenanceCredits = dailyMaintenanceCredits;
exports.dailyMaintenanceFuel = dailyMaintenanceFuel;
exports.GAME_LIMITS = {
    MAX_SHIPS_PER_PLAYER: 3, // spec §10
    MAX_STATIONS_PER_PLAYER: 1, // spec §10
    COMMANDER_DEATH_PENDING_MS: 30 * 60 * 1000, // spec §14: 30 minutes game-time
    RESPAWN_FEE_CREDITS: 5000, // spec §15: fee at Nohast (configurable)
    STARTER_CREDITS: 10000,
    STARTER_FUEL: 100,
    MAX_OFFLINE_MS: 7 * 24 * 60 * 60 * 1000, // cap offline catch-up at 7 days
    CHAT_RATE_PER_MIN: 20,
    CHAT_MAX_LENGTH: 500,
    CARGO_VOLUME_PER_UNIT: 0.1, // m^3 per resource unit (approx)
    WARP_FUEL_PER_UNIT_DIST: 0.4,
    MINING_FUEL_PER_HOUR: 2,
};
// Maintenance cost scales non-linearly with ship count + station level (spec §12).
// cost = base * (1 + 0.5*(ships-1)) * stationFactor, stationFactor = 1 + 0.3*level
function dailyMaintenanceCredits(shipCount, stationLevel) {
    const perShip = 120;
    const shipPart = perShip * shipCount * (1 + 0.5 * Math.max(0, shipCount - 1));
    const stationPart = stationLevel > 0 ? 400 * (1 + 0.3 * (stationLevel - 1)) : 0;
    return shipPart + stationPart;
}
function dailyMaintenanceFuel(shipCount) {
    return 8 * shipCount;
}
// Nahast-Rules weapon — ALL VALUES BELOW ARE TEMPORARY PLACEHOLDERS (spec §22).
// They exist so the code compiles and runs; they are NOT confirmed lore numbers.
// Tune later in one place.
exports.NAHAST_CONFIG = {
    // Threshold of Nohast control loss (0..1) that triggers auto-discharge.
    OCCUPATION_TRIGGER_RATIO: 0.75, // TEMPORARY
    // Full discharge duration once triggered (cannot be stopped — spec §20).
    DISCHARGE_DURATION_MS: 30 * 60 * 1000, // TEMPORARY: 30 min
    // GM reinforcement arrival after occupation begins.
    REINFORCEMENT_ETA_MS: 60 * 60 * 1000, // TEMPORARY: 60 min
    // Microstream damage falloff per region unit (spec §21: very fast falloff).
    MICROSTREAM_DAMAGE_FALLOFF: 0.9, // multiplier per unit distance — TEMPORARY
    MICROSTREAM_MAX_RANGE_UNITS: 5, // TEMPORARY
    // Post-discharge weapon state: 'depleted' until recharged (recharge not specified -> undefined).
    POST_DISCHARGE_STATE: 'depleted', // TEMPORARY
    RECHARGE_NOT_SPECIFIED: true, // explicit marker: recharge rules undefined by spec
};
exports.NOHAST_STATION = {
    id: 'nohast-central',
    name: 'Nohast',
    regionId: 'sol-inner',
    // parked near Earth-Moon L2 in region units
    x: 0.38,
    y: 0.02,
    z: 0,
    services: ['market', 'storage', 'respawn', 'galaxy_data', 'shipyard', 'crew_recruitment', 'chat_lobby'],
    storageFeePerDayPerUnit: 2, // credits per m^3 per day
};
exports.TECH_TIERS = ['basic', 'specialized', 'strategic', 'breakthrough'];
exports.REGION_UNIT_MKM = 1; // 1 region unit = 1 Mkm (million km)
