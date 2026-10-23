// API client: attaches Firebase ID token. Server is authoritative (spec §5).
import { auth } from '../config/firebase';
import { API_BASE } from '../config/runtime';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function token(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, 'Chưa đăng nhập.', 'NO_USER');
  return user.getIdToken(true);
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${await token()}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `HTTP ${res.status}`, data.code);
  return data as T;
}

export async function apiPost<T = any>(path: string, body: unknown = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `HTTP ${res.status}`, data.code);
  return data as T;
}

export async function apiPatch<T = any>(path: string, body: unknown = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `HTTP ${res.status}`, data.code);
  return data as T;
}

export async function publicGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `HTTP ${res.status}`);
  return data as T;
}
