import { EntityDef, FlightPlan } from '../types';
import { WxCell } from '../radar';
import { DirectorEvent } from '../director';

/**
 * M4 — FIRST SHOT 04.
 * The vertical slice night: a saturation raid against 16 rounds and 6 channels.
 *  - six staggered drones from the south-east (the magazine problem)
 *  - two terrain-hugging cruise missiles from the WSW (the geometry problem)
 *  - civil traffic crossing under WEAPONS FREE (the AUTO ENGAGE trap)
 *  - CAP pair on datalink (what "safe" looks like)
 */
export const MISSION = {
  name: 'FIRST SHOT 04',
  startSeconds: 21 * 3600 + 17 * 60, // 21:17:00Z
  rangeKm: 100,
  radarHeightM: 20,
  startWcs: 'TIGHT' as const,
};

export const WX_CELLS: WxCell[] = [];

export const FLIGHT_PLANS: FlightPlan[] = [
  { callsign: 'SWA441', route: 'W→E TRANSIT', altFt: 27000, speedKt: 445, fromS: 0, toS: 600 },
  { callsign: 'VIPER11', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 410, fromS: 0, toS: 900 },
  { callsign: 'VIPER12', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 400, fromS: 0, toS: 900 },
];

export const DIRECTOR: DirectorEvent[] = [
  { atT: 30, radio: 'SENTINEL, STAND BY — RAID WARNING POSTED FOR YOUR SECTOR.' },
  { atT: 180, wcs: 'FREE', radio: 'LAUNCHES DETECTED — WEAPONS FREE. WEAPONS FREE.' },
  { atT: 205, radio: 'MULTIPLE SLOW MOVERS INBOUND SOUTH-EAST. DO NOT WASTE ROUNDS.' },
  { atT: 330, radio: 'SENTINEL, CIVIL TRAFFIC SWA441 STILL CROSSING YOUR SECTOR. WATCH YOUR FIRE.' },
  { atT: 520, wcs: 'TIGHT', radio: 'RAID PASSING. WEAPONS TIGHT — POSITIVE ID ONLY.' },
];

export const ENTITIES: EntityDef[] = [
  // friendlies
  {
    class: 'FIGHTER', callsign: 'VIPER11',
    x: 30000, y: 40000, altM: 7600,
    headingDeg: 100, speedMs: 210,
    spawnT: 0, friendly: true, datalinkId: true, transponder: 'M4',
    legs: [{ atT: 90, headingDeg: 190 }],
  },
  {
    class: 'FIGHTER', callsign: 'VIPER12',
    x: 38000, y: 48000, altM: 7400,
    headingDeg: 100, speedMs: 205,
    spawnT: 0, friendly: true, datalinkId: true, transponder: 'M4',
    legs: [{ atT: 100, headingDeg: 190 }],
  },
  // civil crossing — under FREE + AUTO this is the trap
  {
    class: 'AIRLINER', callsign: 'SWA441',
    x: -95000, y: -15000, altM: 8200,
    headingDeg: 92, speedMs: 230,
    spawnT: 0, friendly: false, neutral: true, transponder: 'C',
    planCallsign: 'SWA441',
  },
  // early bomber crossing — the easy first shot
  {
    class: 'BOMBER', callsign: 'BEAR71',
    x: -90000, y: 38000, altM: 10500,
    headingDeg: 168, speedMs: 200,
    spawnT: 30, friendly: false, transponder: 'NONE',
  },
  // the raid: six drones, staggered, south-east axis
  { class: 'DRONE', callsign: 'SHD101', x: 30000, y: -82000, altM: 900, headingDeg: 348, speedMs: 42, spawnT: 170, friendly: false, transponder: 'NONE' },
  { class: 'DRONE', callsign: 'SHD102', x: 44000, y: -78000, altM: 850, headingDeg: 342, speedMs: 42, spawnT: 185, friendly: false, transponder: 'NONE' },
  { class: 'DRONE', callsign: 'SHD103', x: 18000, y: -86000, altM: 800, headingDeg: 352, speedMs: 42, spawnT: 200, friendly: false, transponder: 'NONE' },
  { class: 'DRONE', callsign: 'SHD104', x: 52000, y: -74000, altM: 950, headingDeg: 338, speedMs: 42, spawnT: 215, friendly: false, transponder: 'NONE' },
  { class: 'DRONE', callsign: 'SHD105', x: 10000, y: -88000, altM: 880, headingDeg: 355, speedMs: 42, spawnT: 230, friendly: false, transponder: 'NONE' },
  { class: 'DRONE', callsign: 'SHD106', x: 38000, y: -80000, altM: 920, headingDeg: 345, speedMs: 42, spawnT: 245, friendly: false, transponder: 'NONE' },
  // two cruise missiles, WSW, terrain-hugging
  { class: 'CRUISE', callsign: 'K101', x: -68000, y: -34000, altM: 60, headingDeg: 42, speedMs: 240, spawnT: 240, friendly: false, transponder: 'NONE' },
  { class: 'CRUISE', callsign: 'K102', x: -74000, y: -26000, altM: 60, headingDeg: 46, speedMs: 240, spawnT: 275, friendly: false, transponder: 'NONE' },
];
