// In-memory repository for local dev + CI tests (no Firebase needed).
// Per-uid async mutex ensures wallet mutations are atomic (no double-spend).
import type { GameRepository, WalletTxResult } from './types';
import type {
  PlayerProfile, Wallet, Ship, PersonalStation, CrewMember, Transaction,
  ChatMessage, PresenceInfo, NohastState, ResourceId, MarketPrice,
} from '../../../shared/types';
import { RESOURCE_DEFS } from '../../../shared/game-data/resources';
import { NOHAST_STATION } from '../../../shared/constants';

const locks = new Map<string, Promise<any>>();
async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  locks.set(key, prev.then(() => next));
  try {
    await prev;
    return await fn();
  } finally {
    release();
    if (locks.get(key) === next) locks.delete(key);
  }
}

function emptyWallet(uid: string): Wallet {
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const id of Object.keys(RESOURCE_DEFS) as ResourceId[]) if (id !== 'credits') resources[id] = 0;
  return { uid, credits: 0, resources, updatedAt: Date.now() };
}

export class MemoryRepository implements GameRepository {
  kind = 'memory' as const;
  profiles = new Map<string, PlayerProfile>();
  wallets = new Map<string, Wallet>();
  ships = new Map<string, Ship>();
  stations = new Map<string, PersonalStation>();
  crew = new Map<string, CrewMember>();
  transactions: Transaction[] = [];
  market: Record<string, MarketPrice> = {};
  nohast: NohastState = { control: 'gm', updatedAt: Date.now() };
  chat: ChatMessage[] = [];
  presence = new Map<string, PresenceInfo>();

  async getProfile(uid: string) { return this.profiles.get(uid) || null; }
  async upsertProfile(p: PlayerProfile) { this.profiles.set(p.uid, { ...p, lastSeenAt: Date.now() }); }
  async getWallet(uid: string) { return this.wallets.get(uid) || emptyWallet(uid); }

  async mutateWallet(
    uid: string,
    fn: (w: Wallet) => { deltaCredits: number; deltaResources: Partial<Record<ResourceId, number>>; kind: Transaction['kind']; note?: string },
  ): Promise<WalletTxResult> {
    return withLock(`wallet:${uid}`, async () => {
      const w = this.wallets.get(uid) || emptyWallet(uid);
      const { deltaCredits, deltaResources, kind, note } = fn(w);
      const newCredits = w.credits + deltaCredits;
      if (newCredits < 0) throw new Error('Số dư không đủ (credits < 0).');
      const newResources = { ...w.resources };
      for (const [k, v] of Object.entries(deltaResources)) {
        const cur = newResources[k as ResourceId] || 0;
        const next = cur + (v || 0);
        if (next < 0) throw new Error(`Số dư tài nguyên ${k} không đủ.`);
        newResources[k as ResourceId] = next;
      }
      const updated: Wallet = { uid, credits: newCredits, resources: newResources, updatedAt: Date.now() };
      this.wallets.set(uid, updated);
      const tx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uid, kind, deltaCredits, deltaResources, balanceCreditsAfter: newCredits, note, createdAt: Date.now(),
      };
      this.transactions.push(tx);
      return { wallet: updated, transaction: tx };
    });
  }

  async listShips(uid: string) { return [...this.ships.values()].filter((s) => s.ownerUid === uid); }
  async getShip(uid: string, shipId: string) { const s = this.ships.get(shipId); return s && s.ownerUid === uid ? s : null; }
  async upsertShip(ship: Ship) { this.ships.set(ship.id, { ...ship, updatedAt: Date.now() }); }
  async countShips(uid: string) { return (await this.listShips(uid)).length; }

  async listStations(uid: string) { return [...this.stations.values()].filter((s) => s.ownerUid === uid); }
  async upsertStation(s: PersonalStation) { this.stations.set(s.id, { ...s, updatedAt: Date.now() }); }
  async countStations(uid: string) { return (await this.listStations(uid)).length; }

  async listCrew(uid: string) { return [...this.crew.values()].filter((c) => c.ownerUid === uid); }
  async upsertCrew(c: CrewMember) { this.crew.set(c.id, c); }

  async listTransactions(uid: string, limit = 50) {
    return this.transactions.filter((t) => t.uid === uid).slice(-limit).reverse();
  }

  async getMarketState() { return this.market; }
  async setMarketState(m: Record<string, MarketPrice>) { this.market = m; }
  async getNohastState() { return this.nohast; }
  async setNohastState(s: NohastState) { this.nohast = { ...s, updatedAt: Date.now() }; }

  async addChatMessage(msg: ChatMessage) { this.chat.push(msg); if (this.chat.length > 500) this.chat.shift(); }
  async recentChat(channel: ChatMessage['channel'], regionId?: string, limit = 50) {
    return this.chat.filter((m) => m.channel === channel && (!regionId || m.regionId === regionId)).slice(-limit);
  }

  async setPresence(p: PresenceInfo) { this.presence.set(p.uid, p); }
  async presenceInRegion(regionId: string) {
    return [...this.presence.values()].filter((p) => p.online && p.regionId === regionId);
  }
}

export { NOHAST_STATION };
