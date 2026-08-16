import { MS_TO_KT, M_TO_FT } from './types';

export type ClassConf = 'GOOD' | 'FAIR' | 'POOR';

export interface ClassResult {
  label: string;
  conf: ClassConf;
}

/**
 * M2 classification: derived purely from track kinematics (no truth data).
 * Deliberately conservative — slow/low contacts stay ambiguous because drones,
 * helicopters and bird flocks genuinely overlap in the speed/altitude envelope.
 * That ambiguity is the M3 identification problem being seeded here.
 */
export function classifyTrack(speedMs: number, altM: number, headingChurnDeg: number, quality: number): ClassResult {
  const kt = speedMs * MS_TO_KT;
  const ft = altM * M_TO_FT;
  const known = quality >= 2; // needs a velocity estimate (2nd paint)

  if (!known) return { label: '??', conf: 'POOR' };

  if (kt < 35) {
    // crawl-speed low: almost certainly birds or debris — but a hovering drone hides here too
    return { label: 'BIRD', conf: 'POOR' };
  }
  if (ft < 1500 && kt < 160) {
    // slow-low envelope: UAV / HELO / light aircraft — genuinely ambiguous
    if (headingChurnDeg > 20) return { label: 'HELO', conf: 'POOR' };
    return { label: 'UAV', conf: kt > 50 ? 'FAIR' : 'POOR' };
  }
  if (ft < 1500 && kt >= 300) {
    return { label: 'CRU', conf: 'GOOD' }; // fast and terrain-hugging: cruise missile
  }
  if (kt >= 280) {
    return { label: 'ABT', conf: altM > 4000 ? 'GOOD' : 'FAIR' };
  }
  return { label: 'ABT', conf: 'POOR' };
}
