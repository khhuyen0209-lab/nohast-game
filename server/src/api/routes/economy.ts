import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../../auth/firebaseAdmin';
import { getRepository } from '../../repositories';
import { asyncHandler } from '../middleware';
import { ensureMarket, buyResource, sellResource } from '../../services/marketService';
import { validateTrade } from '../../../../shared/schemas/validators';

const r = Router();
r.use(requireAuth);

r.get('/market/prices', asyncHandler(async (_req, res) => {
  const m = await ensureMarket(getRepository());
  res.json({ prices: Object.values(m) });
}));

r.post('/market/trade', asyncHandler(async (req: AuthedRequest, res) => {
  const v = validateTrade(req.body);
  if (!v.ok) return res.status(400).json({ error: 'Giao dịch không hợp lệ.', errors: v.errors });
  const repo = getRepository();
  if (v.side === 'buy') {
    const result = await buyResource(repo, req.uid!, v.resourceId, v.amount);
    return res.json({ ok: true, side: 'buy', total: result.total, wallet: result.wallet, transaction: result.transaction });
  }
  const result = await sellResource(repo, req.uid!, v.resourceId, v.amount);
  return res.json({ ok: true, side: 'sell', total: result.total, wallet: result.wallet, transaction: result.transaction });
}));

r.get('/wallet', asyncHandler(async (req: AuthedRequest, res) => {
  const repo = getRepository();
  const wallet = await repo.getWallet(req.uid!);
  const txs = await repo.listTransactions(req.uid!, 30);
  res.json({ wallet, transactions: txs });
}));

export default r;
