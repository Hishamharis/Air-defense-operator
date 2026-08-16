import { EntityDef } from '../types';

export const MISSION = {
  name: 'SCOPE TRIAL 01',
  /** mission starts at 02:14:00Z */
  startSeconds: 2 * 3600 + 14 * 60,
  rangeKm: 100,
  radarHeightM: 20,
};

export const ENTITIES: EntityDef[] = [
  // Friendly airliner crossing east→west at FL270
  {
    class: 'AIRLINER', callsign: 'SWA441',
    x: 96000, y: 9000, altM: 8200,
    headingDeg: 268, speedMs: 230,
    spawnT: 0, friendly: true, datalinkId: true, transponder: 'M4',
  },
  // Friendly CAP pair flying a racetrack north-east
  {
    class: 'FIGHTER', callsign: 'VIPER11',
    x: 38000, y: 44000, altM: 7600,
    headingDeg: 100, speedMs: 210,
    spawnT: 0, friendly: true, datalinkId: true, transponder: 'M4',
    legs: [
      { atT: 55, headingDeg: 190 },
      { atT: 145, headingDeg: 280 },
      { atT: 235, headingDeg: 10 },
      { atT: 325, headingDeg: 100 },
    ],
  },
  {
    class: 'FIGHTER', callsign: 'VIPER12',
    x: 46000, y: 52000, altM: 7400,
    headingDeg: 100, speedMs: 205,
    spawnT: 0, friendly: true, datalinkId: true, transponder: 'M4',
    legs: [
      { atT: 65, headingDeg: 190 },
      { atT: 155, headingDeg: 280 },
      { atT: 245, headingDeg: 10 },
      { atT: 335, headingDeg: 100 },
    ],
  },
  // Low slow helo wandering north of site
  {
    class: 'HELO', callsign: 'HIND02',
    x: -8000, y: 26000, altM: 300,
    headingDeg: 130, speedMs: 55,
    spawnT: 0, friendly: false,
    legs: [
      { atT: 90, headingDeg: 220 },
      { atT: 200, headingDeg: 70 },
      { atT: 320, headingDeg: 180 },
    ],
  },
  // Hostile bomber entering west edge, high and fast
  {
    class: 'BOMBER', callsign: 'BEAR71',
    x: -96000, y: 34000, altM: 10500,
    headingDeg: 168, speedMs: 200,
    spawnT: 25, friendly: false,
  },
  // Shahed-style drone: slow, low, inbound from the south at T+60
  {
    class: 'DRONE', callsign: 'SHD107',
    x: -6000, y: -78000, altM: 900,
    headingDeg: 12, speedMs: 42,
    spawnT: 60, friendly: false,
  },
  // Terrain-hugging cruise missile from the WSW at T+130 — faint blip
  {
    class: 'CRUISE', callsign: 'K101',
    x: -82000, y: -38000, altM: 60,
    headingDeg: 38, speedMs: 240,
    spawnT: 130, friendly: false,
  },
];
