// Market: prices drift with supply; buy/sell are atomic wallet ops (spec §25).
import type { GameRepository } from '../repositories/types';
import type { ResourceId, MarketPrice } from '../../../shared/types';
import { RESOURCE_DEFS } from '../../../shared/game-data/resources';

export async function ensureMarket(repo: GameRepository): Promise<Record<string, MarketPrice>> {
  let m = await repo.getMarketState();
  if (!m || Object.keys(m).length === 0) {
    m = {};
    for (const def of Object.values(RESOURCE_DEFS)) {
      if (def.kind === 'currency') continue;
      m[def.id] = { resourceId: def.id, buyPrice: Math.round(def.basePrice * 1.15), sellPrice: def.basePrice, supply: 1000 };
    }
    await repo.setMarketState(m);
  }
  return m;
}

// Player buys (pays buyPrice) -> supply decreases -> price rises slightly.
export async function buyResource(repo: GameRepository, uid: string, resourceId: ResourceId, amount: number) {
  const m = await ensureMarket(repo);
  const price = m[resourceId];
  if (!price) throw new Error('Tài nguyên không giao dịch được.');
  const total = Math.ceil(price.buyPrice * amount);
  const { wallet, transaction } = await repo.mutateWallet(uid, () => ({
    deltaCredits: -total, deltaResources: { [resourceId]: amount }, kind: 'market_buy', note: `Mua ${amount} ${resourceId}`,
  }));
  price.supply = Math.max(0, price.supply - amount);
  price.buyPrice = Math.round(price.buyPrice * (1 + amount / (price.supply + 1000) * 0.01));
  await repo.setMarketState(m);
  return { wallet, transaction, total };
}

// Player sells (receives sellPrice) -> supply increases -> price drops slightly.
export async function sellResource(repo: GameRepository, uid: string, resourceId: ResourceId, amount: number) {
  const m = await ensureMarket(repo);
  const price = m[resourceId];
  if (!price) throw new Error('Tài nguyên không giao dịch được.');
  const total = Math.floor(price.sellPrice * amount);
  const { wallet, transaction } = await repo.mutateWallet(uid, () => ({
    deltaCredits: total, deltaResources: { [resourceId]: -amount }, kind: 'market_sell', note: `Bán ${amount} ${resourceId}`,
  }));
  price.supply += amount;
  price.sellPrice = Math.max(1, Math.round(price.sellPrice * (1 - amount / (price.supply + 1000) * 0.01)));
  await repo.setMarketState(m);
  return { wallet, transaction, total };
}
