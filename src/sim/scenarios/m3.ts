import { EntityDef, FlightPlan } from '../types';
import { WxCell } from '../radar';
import { DirectorEvent } from '../director';

/**
 * M3 — CORRIDOR WATCH 03.
 * The identification night: every ambiguity of a real wartime air picture.
 *  - VIPER CAP: datalink friendlies (the safe baseline)
 *  - SWA441 / MED217: civil traffic on the ATO — Mode C only, correlate by hand
 *  - RYK214: civil, NOT on the ATO, slightly off corridor — the PS752/655 trap
 *  - JUDO21: friendly strike package returning off-schedule with a failing
 *    Mode 4 box — the 2003 Tornado story
 *  - drone / cruise / bomber / helo: the actual threat mix
 * Weapons control: TIGHT → FREE (raid) → TIGHT.
 */
export const MISSION = {
  name: 'CORRIDOR WATCH 03',
  startSeconds: 19 * 3600 + 5 * 60, // 19:05:00Z
  rangeKm: 100,
  radarHeightM: 20,
  startWcs: 'TIGHT' as const,
  endT: 700,
};

export const WX_CELLS: WxCell[] = [
  { x: -30000, y: 30000, radiusM: 14000 },
];

export const FLIGHT_PLANS: FlightPlan[] = [
  { callsign: 'SWA441', route: 'W→E TRANSIT', altFt: 27000, speedKt: 445, fromS: 0, toS: 500 },
  { callsign: 'MED217', route: 'CORRIDOR BRAVO N→S', altFt: 19000, speedKt: 300, fromS: 90, toS: 600 },
  { callsign: 'VIPER11', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 410, fromS: 0, toS: 900 },
  { callsign: 'VIPER12', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 400, fromS: 0, toS: 900 },
  // an expired plan — pure noise, exactly like a real ATO page
  { callsign: 'GAF55', route: 'S→N TRANSIT', altFt: 15000, speedKt: 350, fromS: -600, toS: -30 },
];

export const DIRECTOR: DirectorEvent[] = [
  { atT: 45, radio: 'CRC: CIVIL TRAFFIC ACTIVE ON CORRIDOR BRAVO. CHECK YOUR ATO.' },
  { atT: 150, radio: 'SENTINEL, DRONE ACTIVITY REPORTED SOUTH OF YOUR SECTOR.' },
  { atT: 260, wcs: 'FREE', radio: 'MULTIPLE LAUNCHES REPORTED — WEAPONS FREE. ENGAGE ALL THREATS.' },
  { atT: 330, radio: 'SENTINEL, STRIKE PACKAGE JUDO21 RECOVERING THROUGH YOUR NORTH — ATO UPDATE PENDING.' },
  { atT: 430, wcs: 'TIGHT', radio: 'RAID PASSED. RESUMING WEAPONS TIGHT — POSITIVE ID ONLY.' },
];

export const ENTITIES: EntityDef[] = [
  // --- friendlies ---
  {
    class: 'FIGHTER', callsign: 'VIPER11',
    x: 34000, y: 42000, altM: 7600,
    headingDeg: 100, speedMs: 210,
    spawnT: 0, friendly: true, datalinkId: true, transponder: 'M4',
    legs: [
      { atT: 60, headingDeg: 190 },
      { atT: 150, headingDeg: 280 },
      { atT: 240, headingDeg: 10 },
    ],
  },
  {
    class: 'FIGHTER', callsign: 'VIPER12',
    x: 42000, y: 50000, altM: 7400,
    headingDeg: 100, speedMs: 205,
    spawnT: 0, friendly: true, datalinkId: true, transponder: 'M4',
    legs: [
      { atT: 70, headingDeg: 190 },
      { atT: 160, headingDeg: 280 },
      { atT: 250, headingDeg: 10 },
    ],
  },
  // friendly strike package returning off-schedule, failing Mode 4 box
  {
    class: 'FIGHTER', callsign: 'JUDO21',
    x: 12000, y: 88000, altM: 5200,
    headingDeg: 182, speedMs: 225,
    spawnT: 230, friendly: true, transponder: 'FAILING',
  },
  // --- civil traffic ---
  {
    class: 'AIRLINER', callsign: 'SWA441',
    x: -94000, y: -12000, altM: 8200,
    headingDeg: 92, speedMs: 230,
    spawnT: 0, friendly: false, neutral: true, transponder: 'C',
    planCallsign: 'SWA441',
  },
  {
    class: 'AIRLINER', callsign: 'MED217',
    x: 3000, y: 92000, altM: 5800,
    headingDeg: 182, speedMs: 155,
    spawnT: 95, friendly: false, neutral: true, transponder: 'C',
    planCallsign: 'MED217',
  },
  // the off-plan charter: civil pattern, no ATO row, drifting off corridor
  {
    class: 'AIRLINER', callsign: 'RYK214',
    x: 14000, y: 88000, altM: 6100,
    headingDeg: 192, speedMs: 150,
    spawnT: 200, friendly: false, neutral: true, transponder: 'C',
    legs: [{ atT: 330, headingDeg: 205 }],
  },
  // --- hostiles ---
  {
    class: 'BOMBER', callsign: 'BEAR71',
    x: -92000, y: 36000, altM: 10500,
    headingDeg: 168, speedMs: 200,
    spawnT: 40, friendly: false, transponder: 'NONE',
  },
  {
    class: 'HELO', callsign: 'HIND02',
    x: -12000, y: 60000, altM: 50,
    headingDeg: 160, speedMs: 55,
    spawnT: 90, friendly: false, transponder: 'NONE',
    legs: [
      { atT: 170, headingDeg: 210 },
      { atT: 280, headingDeg: 150 },
    ],
  },
  {
    class: 'DRONE', callsign: 'SHD107',
    x: -5000, y: -70000, altM: 900,
    headingDeg: 10, speedMs: 42,
    spawnT: 150, friendly: false, transponder: 'NONE',
  },
  {
    class: 'CRUISE', callsign: 'K101',
    x: -60000, y: -30000, altM: 60,
    headingDeg: 42, speedMs: 240,
    spawnT: 262, friendly: false, transponder: 'NONE',
  },
];
