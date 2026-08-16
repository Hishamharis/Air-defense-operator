import { CAMPAIGN_NAME } from './scenarios/desertstorm';

const SAVE_KEY = 'sentinel-campaign-v1';

export interface CampaignTotals {
  kills: number;
  shots: number;
  leakers: number;
  violations: number;
  fratricides: number;
}

export interface CampaignState {
  campaign: string;
  watchIndex: number; // next watch to play
  baseIntegrity: number; // 100 at start
  totals: CampaignTotals;
  completed: string[]; // watch ids finished
  finished: boolean;
}

export function freshCampaign(): CampaignState {
  return {
    campaign: CAMPAIGN_NAME,
    watchIndex: 0,
    baseIntegrity: 100,
    totals: { kills: 0, shots: 0, leakers: 0, violations: 0, fratricides: 0 },
    completed: [],
    finished: false,
  };
}

export function loadCampaign(): CampaignState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const st = JSON.parse(raw) as CampaignState;
    if (typeof st.watchIndex !== 'number' || !st.totals) return null;
    return st;
  } catch {
    return null;
  }
}

export function saveCampaign(st: CampaignState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(st));
}

export function clearCampaign(): void {
  localStorage.removeItem(SAVE_KEY);
}

/** Apply a finished watch's world score to the campaign state and persist it. */
export function applyWatchResult(
  st: CampaignState,
  watchId: string,
  score: {
    kills: number;
    shots: number;
    leakers: string[];
    idViolations: unknown[];
    fratricides: unknown[];
  },
  watchCount: number,
): CampaignState {
  st.totals.kills += score.kills;
  st.totals.shots += score.shots;
  st.totals.leakers += score.leakers.length;
  st.totals.violations += score.idViolations.length;
  st.totals.fratricides += score.fratricides.length;
  st.baseIntegrity = Math.max(0, st.baseIntegrity - score.leakers.length * 15);
  if (!st.completed.includes(watchId)) st.completed.push(watchId);
  st.watchIndex = Math.min(watchCount, st.watchIndex + 1);
  st.finished = st.watchIndex >= watchCount || st.baseIntegrity <= 0;
  saveCampaign(st);
  return st;
}
