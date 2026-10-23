import { config } from '../config';
import type { GameRepository } from './types';
import { MemoryRepository } from './memory';
import { FirestoreRepository } from './firestore';

let repo: GameRepository | null = null;

export function getRepository(): GameRepository {
  if (repo) return repo;
  if (config.memoryStore) {
    console.log('[repo] Using MEMORY store (local dev / CI). Data resets on restart.');
    repo = new MemoryRepository();
  } else {
    console.log('[repo] Using Firestore store.');
    repo = new FirestoreRepository();
  }
  return repo!;
}

export type { GameRepository } from './types';
