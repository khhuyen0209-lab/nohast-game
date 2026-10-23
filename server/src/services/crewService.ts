// Crew hiring (spec §26). NPCs are state-machine driven, no LLM per NPC (spec §27).
import type { GameRepository } from '../repositories/types';
import type { CrewMember } from '../../../shared/types';
import { newId } from './shipService';

const NAMES = ['Kael', 'Mira', 'Jax', 'Sora', 'Tane', 'Ivy', 'Rook', 'Zed', 'Lira', 'Orin', 'Vex', 'Nia'];
const ROLES: CrewMember['role'][] = ['pilot', 'engineer', 'gunner', 'miner', 'medic', 'science', 'officer'];

export async function hireCrew(repo: GameRepository, uid: string): Promise<CrewMember> {
  const role = ROLES[Math.floor(Math.random() * ROLES.length)];
  const name = NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.';
  const skill = 30 + Math.floor(Math.random() * 50);
  const salary = 20 + skill;
  const cost = salary * 10; // 10 days advance
  await repo.mutateWallet(uid, () => ({ deltaCredits: -cost, deltaResources: {}, kind: 'crew_hire', note: `Tuyển ${name} (${role})` }));
  const crew: CrewMember = {
    id: newId('crew'), ownerUid: uid, name, role, skill, loyalty: 50 + Math.floor(Math.random() * 40),
    salaryPerDay: salary, createdAt: Date.now(),
  };
  await repo.upsertCrew(crew);
  return crew;
}
