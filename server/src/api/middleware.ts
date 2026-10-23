import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Centralized error handler (spec §41). Never leaks secrets in logs/responses.
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const msg = err?.message || 'Lỗi server.';
  const status = err?.status || (msg.includes('không đủ') || msg.includes('Không') || msg.includes('giới hạn') ? 400 : 500);
  if (status >= 500) console.error('[error]', msg);
  if (res.headersSent) return;
  res.status(status).json({ error: config.isProd ? msg : msg, code: err?.code });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Endpoint không tồn tại.' });
}

export function asyncHandler(fn: (req: any, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}
