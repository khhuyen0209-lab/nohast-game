"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCE_IDS = exports.RESOURCE_DEFS = void 0;
// spec §23: three groups — finite, renewable, manufactured (+ currency/fuel).
exports.RESOURCE_DEFS = {
    credits: { id: 'credits', name: 'Tín dụng GM', kind: 'currency', basePrice: 1, volumePerUnit: 0, description: 'Đơn vị tiền tệ chuẩn của Tổng cục Quản lí Ngân hà.' },
    fuel: { id: 'fuel', name: 'Nhiên liệu phản ứng', kind: 'fuel', basePrice: 25, volumePerUnit: 0.05, description: 'He-3 tinh chế, dùng cho động cơ warp và lò phản ứng.' },
    energy_cell: { id: 'energy_cell', name: 'Pin năng lượng', kind: 'manufactured', basePrice: 40, volumePerUnit: 0.02, description: 'Ắc quy quy mô lớn, lưu trữ năng lượng tàu.' },
    iron_ore: { id: 'iron_ore', name: 'Quặng sắt-niken', kind: 'finite', basePrice: 12, volumePerUnit: 0.1, description: 'Quặng phổ biến từ vành đai tiểu hành tinh.' },
    rare_ore: { id: 'rare_ore', name: 'Quặng hiếm', kind: 'finite', basePrice: 90, volumePerUnit: 0.1, description: 'Kim loại hiếm chỉ xuất hiện ở một số khu vực (spec §23).' },
    ice: { id: 'ice', name: 'Băng nước', kind: 'finite', basePrice: 8, volumePerUnit: 0.1, description: 'Nguồn nước và oxy, phổ biến ở vành đai ngoài.' },
    biomass: { id: 'biomass', name: 'Sinh khối', kind: 'renewable', basePrice: 30, volumePerUnit: 0.15, description: 'Vật liệu sinh học tái tạo được trong môi trường kiểm soát.' },
    alloy_plate: { id: 'alloy_plate', name: 'Tấm hợp kim', kind: 'manufactured', basePrice: 70, volumePerUnit: 0.08, description: 'Chế tạo từ quặng, dùng xây dựng và sửa chữa.' },
    ship_module: { id: 'ship_module', name: 'Module tàu', kind: 'manufactured', basePrice: 500, volumePerUnit: 2, description: 'Module lắp ráp hoàn chỉnh, mua ở xưởng tàu.' },
    exotic_matter: { id: 'exotic_matter', name: 'Vật chất dị thường', kind: 'finite', basePrice: 800, volumePerUnit: 0.01, description: 'Hiện vật từ dị thường không gian (Lớp 3). Rất hiếm.' },
};
exports.RESOURCE_IDS = Object.keys(exports.RESOURCE_DEFS);
