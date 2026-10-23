// Lightweight runtime validators for client action payloads.
// Server re-validates everything (client input is never trusted — spec §5).
import type { ResourceId, ModuleSlot } from '../types';
import { RESOURCE_IDS } from '../game-data/resources';

export function isStr(v: unknown, max = 200): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}
export function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
export function isInt(v: unknown): v is number {
  return isNum(v) && Number.isInteger(v);
}
export function isPositiveNum(v: unknown): v is number {
  return isNum(v) && v > 0;
}
export function isResourceId(v: unknown): v is ResourceId {
  return typeof v === 'string' && (RESOURCE_IDS as string[]).includes(v);
}
export function isSlot(v: unknown): v is ModuleSlot {
  const slots = ['hull', 'engine', 'reactor', 'weapon', 'shield', 'cargo', 'sensor', 'mining', 'lab', 'habitat', 'computer'];
  return typeof v === 'string' && slots.includes(v);
}
export function safeStr(v: unknown, max = 500): string {
  if (typeof v !== 'string') return '';
  return v.slice(0, max).replace(/[<>]/g, ''); // basic sanitization for chat/names
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateProfile(body: unknown): { ok: true; commanderName: string } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const b = (body || {}) as Record<string, unknown>;
  if (!isStr(b.commanderName, 40) || !/^[\p{L}\p{N} _.-]+$/u.test(b.commanderName)) {
    errors.push({ field: 'commanderName', message: 'Tên chỉ huy phải là chuỗi 1–40 ký tự (chữ, số, space, _.-).' });
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, commanderName: (b.commanderName as string).trim() };
}

export function validateTrade(body: unknown): { ok: true; resourceId: ResourceId; amount: number; side: 'buy' | 'sell' } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const b = (body || {}) as Record<string, unknown>;
  if (!isResourceId(b.resourceId)) errors.push({ field: 'resourceId', message: 'Mã tài nguyên không hợp lệ.' });
  if (!isInt(b.amount) || (b.amount as number) <= 0 || (b.amount as number) > 1_000_000) errors.push({ field: 'amount', message: 'Số lượng phải là nguyên dương (≤ 1.000.000).' });
  if (b.side !== 'buy' && b.side !== 'sell') errors.push({ field: 'side', message: 'side phải là buy hoặc sell.' });
  if (errors.length) return { ok: false, errors };
  return { ok: true, resourceId: b.resourceId as ResourceId, amount: b.amount as number, side: b.side as 'buy' | 'sell' };
}
