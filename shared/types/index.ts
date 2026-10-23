// ============================================================
// NOHAST — Shared type definitions (client & server)
// Single source of truth for the game domain model.
// ============================================================

export type ResourceId =
  | 'credits'
  | 'fuel'
  | 'energy_cell'
  | 'iron_ore'
  | 'rare_ore'
  | 'ice'
  | 'biomass'
  | 'alloy_plate'
  | 'ship_module'
  | 'exotic_matter';

export type ModuleSlot =
  | 'hull'
  | 'engine'
  | 'reactor'
  | 'weapon'
  | 'shield'
  | 'cargo'
  | 'sensor'
  | 'mining'
  | 'lab'
  | 'habitat'
  | 'computer';

export type TechTier = 'basic' | 'specialized' | 'strategic' | 'breakthrough';

export interface ShipModuleDef {
  id: string;
  name: string;
  slot: ModuleSlot;
  tier: TechTier;
  mass: number; // tonnes
  volume: number; // m^3 cargo used when in hold
  powerDraw: number; // MW, negative = produces power
  durability: number; // HP
  cost: number; // credits
  techRequired?: string;
  // slot-specific stats
  stats: {
    thrust?: number; // engine: m/s^2 effective
    warpSpeed?: number; // engine: AU/h
    powerOutput?: number; // reactor: MW
    weaponDamage?: number;
    weaponRange?: number;
    shieldHp?: number;
    cargoCapacity?: number; // m^3
    sensorRange?: number; // AU
    miningRate?: number; // units/hour
    labBonus?: number; // research speed multiplier
    crewCapacity?: number;
    automation?: number; // 0..1
    [key: string]: number | undefined;
  };
  description: string;
}

export interface InstalledModule {
  defId: string;
  hp: number; // current durability
}

export type ShipStatus = 'docked' | 'in_space' | 'warping' | 'mining' | 'disabled' | 'destroyed';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ShipPosition {
  regionId: string;
  // In-region coordinates (game units, 1 = 1 Mkm). For MVP a 2D plane is enough; z kept for future.
  x: number;
  y: number;
  z: number;
  dockedAtBodyId?: string;
  warp?: {
    fromBodyId: string;
    toBodyId: string;
    startedAt: number; // epoch ms (server clock)
    arrivesAt: number; // epoch ms
  };
  mining?: {
    targetBodyId: string;
    startedAt: number;
    ratePerHour: number;
    resourceId: ResourceId;
  };
}

export interface Ship {
  id: string;
  ownerUid: string;
  name: string;
  hullDefId: string; // references a module with slot 'hull'
  modules: Partial<Record<ModuleSlot, InstalledModule>>;
  position: ShipPosition;
  status: ShipStatus;
  hullHp: number;
  maxHullHp: number;
  shieldHp: number;
  fuel: number;
  maxFuel: number;
  cargo: Partial<Record<ResourceId, number>>;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerProfile {
  uid: string;
  commanderName: string;
  createdAt: number;
  lastSeenAt: number;
  credits: number;
  factionId?: string;
  allianceId?: string;
  tutorialStep: number; // 0 = not started, advances through onboarding
  respawns: number;
  // commander death / respawn flow (spec §14–15)
  commanderStatus: 'alive' | 'dead_pending' | 'respawned';
  commanderDiedAt?: number;
  appointedOfficerCrewId?: string;
  performanceMode?: 'low' | 'medium' | 'high';
}

export interface Wallet {
  uid: string;
  credits: number;
  resources: Partial<Record<ResourceId, number>>;
  updatedAt: number;
}

export type TxKind =
  | 'market_buy'
  | 'market_sell'
  | 'module_purchase'
  | 'module_install'
  | 'mining_yield'
  | 'maintenance_fee'
  | 'respawn_fee'
  | 'storage_fee'
  | 'crew_hire'
  | 'station_build'
  | 'transfer'
  | 'adjustment';

export interface Transaction {
  id: string;
  uid: string;
  kind: TxKind;
  deltaCredits: number;
  deltaResources: Partial<Record<ResourceId, number>>;
  balanceCreditsAfter: number;
  note?: string;
  createdAt: number;
}

export interface CrewMember {
  id: string;
  ownerUid: string;
  name: string;
  role: 'captain' | 'officer' | 'pilot' | 'engineer' | 'gunner' | 'miner' | 'medic' | 'science';
  skill: number; // 0..100
  loyalty: number; // 0..100
  salaryPerDay: number;
  assignedShipId?: string;
  appointedCommander?: boolean;
  createdAt: number;
}

export interface PersonalStation {
  id: string;
  ownerUid: string;
  name: string;
  regionId: string;
  x: number;
  y: number;
  z: number;
  level: number;
  hasRespawnBay: boolean;
  storage: Partial<Record<ResourceId, number>>;
  storageFeePaidUntil: number;
  hp: number;
  maxHp: number;
  createdAt: number;
  updatedAt: number;
}

export interface CelestialBody {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'moon' | 'asteroid_field' | 'station' | 'anomaly' | 'gate';
  // orbital position in region units (simplified circular orbit, radius + angle)
  orbitRadius: number; // region units
  orbitAngleDeg: number; // static for MVP; real ephemeris deferred
  radius: number; // display radius
  color: string;
  realAstronomy?: boolean; // Lớp 1: known astronomy vs fictional
  description: string;
  resources?: Partial<Record<ResourceId, number>>; // minable yield coefficients
  market?: boolean; // has a market
  dockable?: boolean;
  danger?: number; // 0..1
  factionId?: string;
}

export interface Region {
  id: string;
  name: string;
  description: string;
  bodies: CelestialBody[];
  // distance scale: 1 region unit = 1 Mkm. Used by movement formulas.
  unitMkm: number;
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  homeRegionId: string;
  reputation: number; // -100..100 default standing
  isNPC: boolean;
}

export interface Alliance {
  id: string;
  name: string;
  founderUid: string;
  memberUids: string[];
  createdAt: number;
}

export type ChatChannel = 'region' | 'global' | 'faction' | 'alliance' | 'nohast' | 'private';

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  regionId?: string;
  fromUid: string;
  fromName: string;
  toUid?: string; // for private
  text: string;
  createdAt: number;
}

export interface PresenceInfo {
  uid: string;
  commanderName: string;
  regionId: string;
  shipId?: string;
  online: boolean;
  lastSeenAt: number;
}

export interface WorldEvent {
  id: string;
  kind: string;
  regionId?: string;
  title: string;
  description: string;
  startsAt: number;
  endsAt: number;
  severity: 'info' | 'warning' | 'danger';
}

// Nohast central station + Nahast-Rules weapon (spec §16–22).
// All numeric thresholds are CONFIGURABLE PLACEHOLDERS, not canon.
export interface NohastState {
  control: 'gm' | 'contested' | 'occupied';
  occupierAllianceId?: string;
  occupiedSince?: number;
  reinforcementETA?: number; // epoch ms when GM relief arrives
  nahastDischarge?: {
    startedAt: number;
    completesAt: number; // TEMPORARY placeholder duration
    mode: 'charging' | 'microstream' | 'full_discharge';
    targetId?: string;
  };
  updatedAt: number;
}

export interface MarketPrice {
  resourceId: ResourceId;
  buyPrice: number; // price player pays
  sellPrice: number; // price player receives
  supply: number; // drift state
}

export interface OfflineReport {
  elapsedMs: number;
  maintenanceCredits: number;
  maintenanceFuel: number;
  miningYield: Partial<Record<ResourceId, number>>;
  capped: boolean; // true if offline work was capped to MAX_OFFLINE_MS
  notes: string[];
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
