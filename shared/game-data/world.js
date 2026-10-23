"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FACTIONS = exports.REGIONS = exports.STARTER_REGION = void 0;
exports.getBody = getBody;
// Starter region: inner Solar System (Lớp 1 — known astronomy, clearly marked).
// Orbits are simplified (static angle) for MVP; real ephemeris deferred.
// Distances in region units (1 unit = 1 Mkm, see REGION_UNIT_MKM).
exports.STARTER_REGION = {
    id: 'sol-inner',
    name: 'Hệ Mặt Trời — nội tâm',
    description: 'Khu vực khởi đầu an toàn gần trạm Nohast. Dữ liệu thiên thể thực được phân biệt với nội dung hư cấu (spec §6).',
    unitMkm: 1,
    bodies: [
        { id: 'sol', name: 'Mặt Trời', type: 'star', orbitRadius: 0, orbitAngleDeg: 0, radius: 0.18, color: '#ffcc66', realAstronomy: true, description: 'Sao chủ. Cực kỳ nóng, không thể tiếp cận gần.', danger: 1 },
        { id: 'mercury', name: 'Sao Thủy', type: 'planet', orbitRadius: 58, orbitAngleDeg: 20, radius: 0.04, color: '#a08c7a', realAstronomy: true, description: 'Hành tinh trong cùng, giàu kim loại.', resources: { iron_ore: 1.2, rare_ore: 0.4 }, dockable: false },
        { id: 'venus', name: 'Sao Kim', type: 'planet', orbitRadius: 108, orbitAngleDeg: 75, radius: 0.06, color: '#e8c07a', realAstronomy: true, description: 'Khí quy dày, nhiệt độ cao.', danger: 0.4, dockable: false },
        { id: 'earth', name: 'Trái Đất', type: 'planet', orbitRadius: 150, orbitAngleDeg: 140, radius: 0.065, color: '#4a90d9', realAstronomy: true, description: 'Hành tinh quê hương. Có thương cảng quy mô.', market: true, dockable: true, factionId: 'gm' },
        { id: 'moon', name: 'Mặt Trăng', type: 'moon', orbitRadius: 150.4, orbitAngleDeg: 140, radius: 0.02, color: '#cccccc', realAstronomy: true, description: 'Vệ tinh Trái Đất, cơ sở hạ tầng cũ.', resources: { iron_ore: 0.8 }, dockable: true },
        { id: 'mars', name: 'Sao Hỏa', type: 'planet', orbitRadius: 228, orbitAngleDeg: 210, radius: 0.05, color: '#c1502e', realAstronomy: true, description: 'Thuộc địa đầu tiên của nhân loại.', market: true, dockable: true, resources: { iron_ore: 1.0, ice: 0.6 }, factionId: 'mars-colony' },
        { id: 'belt-inner', name: 'Vành đai tiểu hành tinh trong', type: 'asteroid_field', orbitRadius: 350, orbitAngleDeg: 300, radius: 0.12, color: '#8a7a6a', realAstronomy: true, description: 'Khu vực khai thác quặng phong phú.', resources: { iron_ore: 1.5, rare_ore: 0.8, ice: 0.3 }, dockable: false, danger: 0.2 },
        { id: 'nohast-central', name: 'Trạm Nohast', type: 'station', orbitRadius: 150.6, orbitAngleDeg: 140, radius: 0.05, color: '#6FA8FF', realAstronomy: false, description: 'Trạm trung tâm của GM (spec §16). An toàn, dịch vụ đầy đủ.', market: true, dockable: true, factionId: 'gm' },
        // Lớp 2/3 — fictional content, clearly not real astronomy
        { id: 'anomaly-whisper', name: 'Dị thường thì thầm', type: 'anomaly', orbitRadius: 420, orbitAngleDeg: 30, radius: 0.07, color: '#8F7CFF', realAstronomy: false, description: 'Hiện tượng chưa giải thích (Lớp 3). Cực kỳ hiếm. Có thể tìm thấy vật chất dị thường.', resources: { exotic_matter: 0.05 }, dockable: false, danger: 0.8 },
        { id: 'gate-proto', name: 'Cổng dịch chuyển Proto', type: 'gate', orbitRadius: 500, orbitAngleDeg: 180, radius: 0.06, color: '#55e0c0', realAstronomy: false, description: 'Cổng dịch chuyển cổ (hư cấu). Chưa kích hoạt được trong MVP.', dockable: true, danger: 0.3 },
    ],
};
exports.REGIONS = [exports.STARTER_REGION];
function getBody(regionId, bodyId) {
    const r = exports.REGIONS.find((x) => x.id === regionId);
    return r?.bodies.find((b) => b.id === bodyId);
}
exports.FACTIONS = [
    { id: 'gm', name: 'Tổng cục Quản lí Ngân hà (GM)', description: 'Đơn vị vận hành trạm Nohast. Không phải phe NPC thông thường (spec §16).', homeRegionId: 'sol-inner', reputation: 0, isNPC: true },
    { id: 'mars-colony', name: 'Thuộc địa Sao Hỏa', description: 'Chính quyền thuộc địa đầu tiên, nghiêng về độc lập kinh tế.', homeRegionId: 'sol-inner', reputation: 10, isNPC: true },
    { id: 'belt-miners', name: 'Hiệp hội thợ mỏ Vành đai', description: 'Liên minh các công ty khai thác độc lập.', homeRegionId: 'sol-inner', reputation: 5, isNPC: true },
];
