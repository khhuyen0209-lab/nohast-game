// Repository abstraction: Firestore (prod) or in-memory (dev/test).
// This lets tests run without Firebase and keeps server code storage-agnostic.
import type {
  PlayerProfile, Wallet, Ship, PersonalStation, CrewMember, Transaction,
  ChatMessage, PresenceInfo, NohastState, ResourceId, MarketPrice,
} from '../../../shared/types';

export interface WalletTxResult {
  wallet: Wallet;
  transaction: Transaction;
}

export interface GameRepository {
  kind: 'firestore' | 'memory';
  getProfile(uid: string): Promise<PlayerProfile | null>;
  upsertProfile(p: PlayerProfile): Promise<void>;
  getWallet(uid: string): Promise<Wallet>;
  // Atomic wallet mutation: fn may throw to abort; returns new wallet + ledger entry.
  mutateWallet(
    uid: string,
    fn: (w: Wallet) => { deltaCredits: number; deltaResources: Partial<Record<ResourceId, number>>; kind: Transaction['kind']; note?: string },
  ): Promise<WalletTxResult>;
  listShips(uid: string): Promise<Ship[]>;
  getShip(uid: string, shipId: string): Promise<Ship | null>;
  upsertShip(ship: Ship): Promise<void>;
  countShips(uid: string): Promise<number>;
  listStations(uid: string): Promise<PersonalStation[]>;
  upsertStation(s: PersonalStation): Promise<void>;
  countStations(uid: string): Promise<number>;
  listCrew(uid: string): Promise<CrewMember[]>;
  upsertCrew(c: CrewMember): Promise<void>;
  listTransactions(uid: string, limit?: number): Promise<Transaction[]>;
  getMarketState(): Promise<Record<string, MarketPrice>>;
  setMarketState(m: Record<string, MarketPrice>): Promise<void>;
  getNohastState(): Promise<NohastState>;
  setNohastState(s: NohastState): Promise<void>;
  addChatMessage(msg: ChatMessage): Promise<void>;
  recentChat(channel: ChatMessage['channel'], regionId?: string, limit?: number): Promise<ChatMessage[]>;
  setPresence(p: PresenceInfo): Promise<void>;
  presenceInRegion(regionId: string): Promise<PresenceInfo[]>;
}
