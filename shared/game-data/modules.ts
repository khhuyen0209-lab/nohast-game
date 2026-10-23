import type { ShipModuleDef, ModuleSlot } from '../types';

// Data-driven module catalog (spec §11). Add new modules here — no code change needed.
// Hull modules define base ship stats (maxHull, maxFuel, baseCargo, allowedSlots).
export interface HullExtra {
  maxHull: number;
  maxFuel: number;
  baseCargo: number;
  allowedSlots: ModuleSlot[];
}

export const HULL_EXTRAS: Record<string, HullExtra> = {
  'hull-scout-mk1': { maxHull: 200, maxFuel: 120, baseCargo: 20, allowedSlots: ['engine', 'reactor', 'weapon', 'shield', 'cargo', 'sensor', 'mining', 'computer'] },
  'hull-freighter-mk1': { maxHull: 320, maxFuel: 180, baseCargo: 80, allowedSlots: ['engine', 'reactor', 'weapon', 'shield', 'cargo', 'sensor', 'mining', 'habitat', 'computer'] },
  'hull-gunship-mk1': { maxHull: 260, maxFuel: 140, baseCargo: 15, allowedSlots: ['engine', 'reactor', 'weapon', 'weapon', 'shield', 'sensor', 'computer'] },
};

export const MODULE_CATALOG: ShipModuleDef[] = [
  // ---- Hulls ----
  { id: 'hull-scout-mk1', name: 'Thân tàu trinh sát Mk.I', slot: 'hull', tier: 'basic', mass: 40, volume: 0, powerDraw: 0, durability: 200, cost: 4000, stats: {}, description: 'Thân nhẹ, nhanh, ít chỗ chứa hàng.' },
  { id: 'hull-freighter-mk1', name: 'Thân tàu chở hàng Mk.I', slot: 'hull', tier: 'basic', mass: 90, volume: 0, powerDraw: 0, durability: 320, cost: 8000, stats: {}, description: 'Kho hàng lớn, tốc độ vừa phải.' },
  { id: 'hull-gunship-mk1', name: 'Thân tàu pháo Mk.I', slot: 'hull', tier: 'specialized', mass: 70, volume: 0, powerDraw: 0, durability: 260, cost: 12000, stats: {}, description: '2 giá vũ khí, giáp dày.' },
  // ---- Engines ----
  { id: 'engine-ion-mk1', name: 'Động cơ ion Mk.I', slot: 'engine', tier: 'basic', mass: 8, volume: 4, powerDraw: 2, durability: 80, cost: 1500, stats: { thrust: 12, warpSpeed: 0.6 }, description: 'Động cơ cơ bản, tiết kiệm nhiên liệu.' },
  { id: 'engine-fusion-mk2', name: 'Động cơ nhiệt hạch Mk.II', slot: 'engine', tier: 'specialized', mass: 14, volume: 6, powerDraw: 4, durability: 120, cost: 5000, stats: { thrust: 28, warpSpeed: 1.4 }, description: 'Nhanh hơn, tiêu hao nhiên liệu nhiều hơn.' },
  // ---- Reactors ----
  { id: 'reactor-fission-mk1', name: 'Lò phân hạch Mk.I', slot: 'reactor', tier: 'basic', mass: 12, volume: 5, powerDraw: -16, durability: 100, cost: 2000, stats: { powerOutput: 16 }, description: 'Nguồn điện cơ bản 16 MW.' },
  { id: 'reactor-fusion-mk2', name: 'Lò nhiệt hạch Mk.II', slot: 'reactor', tier: 'specialized', mass: 18, volume: 7, powerDraw: -25, durability: 140, cost: 7000, stats: { powerOutput: 25 }, description: 'Công suất cao 25 MW.' },
  // ---- Weapons ----
  { id: 'weapon-laser-mk1', name: 'Laser tia đỏ Mk.I', slot: 'weapon', tier: 'basic', mass: 5, volume: 2, powerDraw: 3, durability: 60, cost: 1800, stats: { weaponDamage: 15, weaponRange: 2 }, description: 'Vũ khí cơ bản.' },
  { id: 'weapon-railgun-mk2', name: 'Súng ray điện từ Mk.II', slot: 'weapon', tier: 'specialized', mass: 10, volume: 3, powerDraw: 8, durability: 90, cost: 6000, stats: { weaponDamage: 40, weaponRange: 3.5 }, description: 'Sát thương cao, tốn điện.' },
  // ---- Shields ----
  { id: 'shield-deflector-mk1', name: 'Khiên làm lệch Mk.I', slot: 'shield', tier: 'basic', mass: 6, volume: 3, powerDraw: 4, durability: 80, cost: 2200, stats: { shieldHp: 100 }, description: 'Khiên 100 HP.' },
  { id: 'shield-aegis-mk2', name: 'Khiên Aegis Mk.II', slot: 'shield', tier: 'specialized', mass: 10, volume: 4, powerDraw: 9, durability: 120, cost: 6500, stats: { shieldHp: 260 }, description: 'Khiên nặng 260 HP.' },
  // ---- Cargo ----
  { id: 'cargo-hold-mk1', name: 'Kho hàng mở rộng Mk.I', slot: 'cargo', tier: 'basic', mass: 4, volume: 0, powerDraw: 0, durability: 50, cost: 1200, stats: { cargoCapacity: 40 }, description: '+40 m^3 kho.' },
  { id: 'cargo-hold-mk2', name: 'Kho hàng mở rộng Mk.II', slot: 'cargo', tier: 'basic', mass: 8, volume: 0, powerDraw: 0, durability: 70, cost: 3000, stats: { cargoCapacity: 90 }, description: '+90 m^3 kho.' },
  // ---- Sensors ----
  { id: 'sensor-basic-mk1', name: 'Cảm biến cơ bản', slot: 'sensor', tier: 'basic', mass: 2, volume: 1, powerDraw: 1, durability: 40, cost: 800, stats: { sensorRange: 8 }, description: 'Phát hiện mục tiêu trong phạm vi 8 AU.' },
  // ---- Mining ----
  { id: 'mining-laser-mk1', name: 'Laser khai thác Mk.I', slot: 'mining', tier: 'basic', mass: 6, volume: 3, powerDraw: 5, durability: 70, cost: 2500, stats: { miningRate: 12 }, description: 'Khai thác 12 đơn vị/giờ.' },
  { id: 'mining-drill-mk2', name: 'Máy khoan bề mặt Mk.II', slot: 'mining', tier: 'specialized', mass: 12, volume: 5, powerDraw: 10, durability: 110, cost: 7500, stats: { miningRate: 30 }, description: 'Khai thác 30 đơn vị/giờ.' },
  // ---- Lab ----
  { id: 'lab-basic-mk1', name: 'Phòng nghiên cứu cơ bản', slot: 'lab', tier: 'basic', mass: 8, volume: 10, powerDraw: 3, durability: 60, cost: 4000, stats: { labBonus: 1.2 }, description: 'Tăng tốc nghiên cứu 20% (hệ thống nghiên cứu giai đoạn sau).' },
  // ---- Habitat ----
  { id: 'habitat-basic-mk1', name: 'Khu sinh hoạt thủy thủ', slot: 'habitat', tier: 'basic', mass: 10, volume: 15, powerDraw: 2, durability: 80, cost: 3500, stats: { crewCapacity: 6 }, description: 'Chứa 6 thủy thủ.' },
  // ---- Computer / automation ----
  { id: 'computer-autopilot-mk1', name: 'Máy tự lái Mk.I', slot: 'computer', tier: 'basic', mass: 1, volume: 0.5, powerDraw: 1, durability: 50, cost: 1500, stats: { automation: 0.6 }, description: 'Tự động lái ổn định, ưu tiên an toàn (spec §27).' },
];

export const MODULE_MAP: Record<string, ShipModuleDef> = Object.fromEntries(MODULE_CATALOG.map((m) => [m.id, m]));

export function getModule(id: string): ShipModuleDef | undefined {
  return MODULE_MAP[id];
}
