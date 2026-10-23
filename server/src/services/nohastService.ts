// Nohast central station + Nahast-Rules weapon state machine (spec §16–22).
// MVP: state structure + read endpoints + skeleton. Full attack campaign is
// explicitly deferred (spec §49) but data model supports it.
import type { GameRepository } from '../repositories/types';
import type { NohastState } from '../../../shared/types';
import { NAHAST_CONFIG } from '../../../shared/constants';

export async function getNohastState(repo: GameRepository): Promise<NohastState & { config: typeof NAHAST_CONFIG }> {
  const s = await repo.getNohastState();
  // Tick: if discharge started and completed, mark depleted.
  if (s.nahastDischarge && Date.now() >= s.nahastDischarge.completesAt && s.nahastDischarge.mode !== 'full_discharge') {
    s.nahastDischarge.mode = 'full_discharge';
    await repo.setNohastState(s);
  }
  return { ...s, config: NAHAST_CONFIG };
}

// Trigger auto-discharge when occupation threshold reached (spec §20).
// Once started, CANNOT be stopped. This function enforces that.
export async function triggerOccupation(repo: GameRepository, allianceId: string, occupationRatio: number): Promise<NohastState> {
  let s = await repo.getNohastState();
  if (occupationRatio < NAHAST_CONFIG.OCCUPATION_TRIGGER_RATIO) {
    s.control = 'contested';
    await repo.setNohastState(s);
    return s;
  }
  if (!s.nahastDischarge) {
    const now = Date.now();
    s.nahastDischarge = {
      startedAt: now,
      completesAt: now + NAHAST_CONFIG.DISCHARGE_DURATION_MS, // TEMPORARY placeholder
      mode: 'charging',
    };
    s.control = 'occupied';
    s.occupierAllianceId = allianceId;
    s.occupiedSince = now;
    s.reinforcementETA = now + NAHAST_CONFIG.REINFORCEMENT_ETA_MS; // TEMPORARY placeholder
    await repo.setNohastState(s);
  }
  return s;
}

// Microstream interception (spec §21): during discharge, part of energy may
// fire at approaching targets. Damage falls off very fast with distance.
export function microstreamDamage(distanceUnits: number): number {
  if (distanceUnits > NAHAST_CONFIG.MICROSTREAM_MAX_RANGE_UNITS) return 0;
  const base = 1000; // TEMPORARY placeholder damage at point-blank
  return base * Math.pow(NAHAST_CONFIG.MICROSTREAM_DAMAGE_FALLOFF, distanceUnits);
}
