import { EntityDef } from '../types';
import { WxCell } from '../radar';

/**
 * M2 — NIGHT WATCH 02.
 * Exercises every detection mechanic:
 *  - airliner/CAP: bright stable friendlies (datalink ID in M2)
 *  - bomber: big RCS, appears at instrument range
 *  - helo at 50 m: SNR range 90 km but radar-horizon-limited to ~47 km — pops up late
 *  - cruise missile at 60 m: RCS-limited to ~41 km — appears well inside the scope
 *  - drone at 900 m: marginal from ~38-47 km — flickers
 *  - bird flock at T+40: slow, low, faint — the false-track trap
 *  - weather cell east: 30% detection loss inside + occasional strong false plots
 */
export const MISSION = {
  name: 'NIGHT WATCH 02',
  startSeconds: 22 * 3600 + 41 * 60, // 22:41:00Z
  rangeKm: 100,
  radarHeightM: 20,
};

export const WX_CELLS: WxCell[] = [
  { x: 38000, y: -14000, radiusM: 16000 },
];

export const ENTITIES: EntityDef[] = [
  // Friendly CAP pair on a northeast racetrack
  {
    class: 'FIGHTER', callsign: 'VIPER11',
    x: 34000, y: 40000, altM: 7600,
    headingDeg: 100, speedMs: 210,
    spawnT: 0, friendly: true,
    legs: [
      { atT: 55, headingDeg: 190 },
      { atT: 145, headingDeg: 280 },
      { atT: 235, headingDeg: 10 },
      { atT: 325, headingDeg: 100 },
    ],
  },
  {
    class: 'FIGHTER', callsign: 'VIPER12',
    x: 42000, y: 48000, altM: 7400,
    headingDeg: 100, speedMs: 205,
    spawnT: 0, friendly: true,
    legs: [
      { atT: 65, headingDeg: 190 },
      { atT: 155, headingDeg: 280 },
      { atT: 245, headingDeg: 10 },
      { atT: 335, headingDeg: 100 },
    ],
  },
  // Airliner crossing high and bright
  {
    class: 'AIRLINER', callsign: 'SWA441',
    x: 96000, y: 9000, altM: 8200,
    headingDeg: 268, speedMs: 230,
    spawnT: 0, friendly: true,
  },
  // High-fast bomber entering from the west
  {
    class: 'BOMBER', callsign: 'BEAR71',
    x: -96000, y: 34000, altM: 10500,
    headingDeg: 168, speedMs: 200,
    spawnT: 25, friendly: false,
  },
  // Nap-of-earth helo north: horizon-limited — invisible until ~47 km despite big-ish RCS
  {
    class: 'HELO', callsign: 'HIND02',
    x: 4000, y: 58000, altM: 50,
    headingDeg: 200, speedMs: 55,
    spawnT: 0, friendly: false,
    legs: [
      { atT: 70, headingDeg: 245 },
      { atT: 160, headingDeg: 160 },
      { atT: 260, headingDeg: 210 },
    ],
  },
  // Drone inbound from the south: marginal-band flicker on approach
  {
    class: 'DRONE', callsign: 'SHD107',
    x: -6000, y: -74000, altM: 900,
    headingDeg: 12, speedMs: 42,
    spawnT: 45, friendly: false,
  },
  // Terrain-hugging cruise from the WSW: RCS-limited — appears at ~41 km
  {
    class: 'CRUISE', callsign: 'K101',
    x: -56000, y: -33000, altM: 60,
    headingDeg: 38, speedMs: 240,
    spawnT: 120, friendly: false,
  },
  // Bird flock meandering northeast at low altitude — faint, slow, ambiguous
  {
    class: 'BIRD', callsign: 'FLOCK1',
    x: 16000, y: 19000, altM: 120,
    headingDeg: 210, speedMs: 12,
    spawnT: 40, friendly: false,
    legs: [
      { atT: 75, headingDeg: 250 },
      { atT: 130, headingDeg: 190 },
      { atT: 200, headingDeg: 230 },
      { atT: 280, headingDeg: 180 },
    ],
  },
];
