// Firebase Admin init + auth middleware. Server is authoritative (spec §5).
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

let admin: any = null;
let initialized = false;
let initError: string | null = null;

export function initFirebaseAdmin() {
  if (initialized || config.memoryStore) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
    }
    initialized = true;
    console.log('[auth] Firebase Admin initialized.');
  } catch (e: any) {
    initError = e?.message || 'unknown';
    console.error('[auth] Firebase Admin init failed:', initError);
  }
}

export async function verifyIdToken(idToken: string): Promise<{ uid: string } | null> {
  if (config.memoryStore) {
    // Dev mode: accept "dev-token-<uid>" tokens. NEVER in production.
    if (idToken.startsWith('dev-token-')) return { uid: idToken.slice('dev-token-'.length) };
    return null;
  }
  if (!initialized || !admin) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export interface AuthedRequest extends Request {
  uid?: string;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Thiếu token xác thực.', code: 'NO_TOKEN' });
  const decoded = await verifyIdToken(token);
  if (!decoded) return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.', code: 'BAD_TOKEN' });
  req.uid = decoded.uid;
  next();
}
