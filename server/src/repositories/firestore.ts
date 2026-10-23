// Firestore repository (production). Uses Firestore transactions for atomic
// wallet mutations (spec §25: no double-spend, no item loss without payment).
import type { GameRepository, WalletTxResult } from './types';
import type {
  PlayerProfile, Wallet, Ship, PersonalStation, CrewMember, Transaction,
  ChatMessage, PresenceInfo, NohastState, ResourceId, MarketPrice,
} from '../../../shared/types';
import { RESOURCE_DEFS } from '../../../shared/game-data/resources';

let admin: any = null;
function db(): any {
  if (!admin) admin = require('firebase-admin');
  return admin.firestore();
}

const C = {
  profiles: 'players',
  wallets: 'wallets', // doc per uid: {credits, resources, updatedAt}
  ships: (uid: string) => `players/${uid}/ships`,
  stations: (uid: string) => `players/${uid}/stations`,
  crew: (uid: string) => `players/${uid}/crew`,
  transactions: (uid: string) => `players/${uid}/transactions`,
  market: 'world/market/state',
  nohast: 'world/nohast/state',
  chat: 'chat/messages/log',
  presence: 'presence',
};

function emptyWallet(uid: string): Wallet {
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const id of Object.keys(RESOURCE_DEFS) as ResourceId[]) if (id !== 'credits') resources[id] = 0;
  return { uid, credits: 0, resources, updatedAt: Date.now() };
}

export class FirestoreRepository implements GameRepository {
  kind = 'firestore' as const;

  async getProfile(uid: string) {
    const snap = await db().collection(C.profiles).doc(uid).get();
    return snap.exists ? (snap.data() as PlayerProfile) : null;
  }
  async upsertProfile(p: PlayerProfile) {
    await db().collection(C.profiles).doc(p.uid).set({ ...p, lastSeenAt: Date.now() }, { merge: true });
  }
  async getWallet(uid: string) {
    const snap = await db().collection(C.wallets).doc(uid).get();
    return snap.exists ? (snap.data() as Wallet) : emptyWallet(uid);
  }

  async mutateWallet(
    uid: string,
    fn: (w: Wallet) => { deltaCredits: number; deltaResources: Partial<Record<ResourceId, number>>; kind: Transaction['kind']; note?: string },
  ): Promise<WalletTxResult> {
    return db().runTransaction(async (t: any) => {
      const ref = db().collection(C.wallets).doc(uid);
      const snap = await t.get(ref);
      const w: Wallet = snap.exists ? (snap.data() as Wallet) : emptyWallet(uid);
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
      t.set(ref, updated);
      const tx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uid, kind, deltaCredits, deltaResources, balanceCreditsAfter: newCredits, note, createdAt: Date.now(),
      };
      t.set(db().collection(C.transactions(uid)).doc(tx.id), tx);
      return { wallet: updated, transaction: tx };
    });
  }

  async listShips(uid: string) {
    const snap = await db().collection(C.ships(uid)).get();
    return snap.docs.map((d: any) => d.data() as Ship);
  }
  async getShip(uid: string, shipId: string) {
    const snap = await db().collection(C.ships(uid)).doc(shipId).get();
    return snap.exists ? (snap.data() as Ship) : null;
  }
  async upsertShip(ship: Ship) {
    await db().collection(C.ships(ship.ownerUid)).doc(ship.id).set({ ...ship, updatedAt: Date.now() }, { merge: true });
  }
  async countShips(uid: string) { return (await this.listShips(uid)).length; }

  async listStations(uid: string) {
    const snap = await db().collection(C.stations(uid)).get();
    return snap.docs.map((d: any) => d.data() as PersonalStation);
  }
  async upsertStation(s: PersonalStation) {
    await db().collection(C.stations(s.ownerUid)).doc(s.id).set({ ...s, updatedAt: Date.now() }, { merge: true });
  }
  async countStations(uid: string) { return (await this.listStations(uid)).length; }

  async listCrew(uid: string) {
    const snap = await db().collection(C.crew(uid)).get();
    return snap.docs.map((d: any) => d.data() as CrewMember);
  }
  async upsertCrew(c: CrewMember) { await db().collection(C.crew(c.ownerUid)).doc(c.id).set(c, { merge: true }); }

  async listTransactions(uid: string, limit = 50) {
    const snap = await db().collection(C.transactions(uid)).orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((d: any) => d.data() as Transaction);
  }

  async getMarketState() {
    const snap = await db().doc(C.market).get();
    return snap.exists ? (snap.data() as Record<string, MarketPrice>) : {};
  }
  async setMarketState(m: Record<string, MarketPrice>) { await db().doc(C.market).set(m); }
  async getNohastState() {
    const snap = await db().doc(C.nohast).get();
    return snap.exists ? (snap.data() as NohastState) : ({ control: 'gm', updatedAt: Date.now() } as NohastState);
  }
  async setNohastState(s: NohastState) { await db().doc(C.nohast).set({ ...s, updatedAt: Date.now() }); }

  async addChatMessage(msg: ChatMessage) {
    await db().collection(C.chat).doc(msg.id).set(msg);
  }
  async recentChat(channel: ChatMessage['channel'], regionId?: string, limit = 50) {
    let q = db().collection(C.chat).where('channel', '==', channel).orderBy('createdAt', 'desc').limit(limit);
    if (regionId) q = q.where('regionId', '==', regionId);
    const snap = await q.get();
    return snap.docs.map((d: any) => d.data() as ChatMessage).reverse();
  }

  async setPresence(p: PresenceInfo) { await db().collection(C.presence).doc(p.uid).set(p, { merge: true }); }
  async presenceInRegion(regionId: string) {
    const snap = await db().collection(C.presence).where('regionId', '==', regionId).where('online', '==', true).get();
    return snap.docs.map((d: any) => d.data() as PresenceInfo);
  }
}
