"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStr = isStr;
exports.isNum = isNum;
exports.isInt = isInt;
exports.isPositiveNum = isPositiveNum;
exports.isResourceId = isResourceId;
exports.isSlot = isSlot;
exports.safeStr = safeStr;
exports.validateCreateProfile = validateCreateProfile;
exports.validateTrade = validateTrade;
const resources_1 = require("../game-data/resources");
function isStr(v, max = 200) {
    return typeof v === 'string' && v.length > 0 && v.length <= max;
}
function isNum(v) {
    return typeof v === 'number' && Number.isFinite(v);
}
function isInt(v) {
    return isNum(v) && Number.isInteger(v);
}
function isPositiveNum(v) {
    return isNum(v) && v > 0;
}
function isResourceId(v) {
    return typeof v === 'string' && resources_1.RESOURCE_IDS.includes(v);
}
function isSlot(v) {
    const slots = ['hull', 'engine', 'reactor', 'weapon', 'shield', 'cargo', 'sensor', 'mining', 'lab', 'habitat', 'computer'];
    return typeof v === 'string' && slots.includes(v);
}
function safeStr(v, max = 500) {
    if (typeof v !== 'string')
        return '';
    return v.slice(0, max).replace(/[<>]/g, ''); // basic sanitization for chat/names
}
function validateCreateProfile(body) {
    const errors = [];
    const b = (body || {});
    if (!isStr(b.commanderName, 40) || !/^[\p{L}\p{N} _.-]+$/u.test(b.commanderName)) {
        errors.push({ field: 'commanderName', message: 'Tên chỉ huy phải là chuỗi 1–40 ký tự (chữ, số, space, _.-).' });
    }
    if (errors.length)
        return { ok: false, errors };
    return { ok: true, commanderName: b.commanderName.trim() };
}
function validateTrade(body) {
    const errors = [];
    const b = (body || {});
    if (!isResourceId(b.resourceId))
        errors.push({ field: 'resourceId', message: 'Mã tài nguyên không hợp lệ.' });
    if (!isInt(b.amount) || b.amount <= 0 || b.amount > 1_000_000)
        errors.push({ field: 'amount', message: 'Số lượng phải là nguyên dương (≤ 1.000.000).' });
    if (b.side !== 'buy' && b.side !== 'sell')
        errors.push({ field: 'side', message: 'side phải là buy hoặc sell.' });
    if (errors.length)
        return { ok: false, errors };
    return { ok: true, resourceId: b.resourceId, amount: b.amount, side: b.side };
}
