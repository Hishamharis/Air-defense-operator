import { EntityDef, FlightPlan } from '../types';
import { WxCell } from '../radar';
import { DirectorEvent, Wcs } from '../director';

export interface WatchScenario {
  id: string;
  name: string;
  /** short Zulu stamp for the briefing header */
  startSeconds: number;
  rangeKm: number;
  radarHeightM: number;
  endT: number;
  startWcs: Wcs;
  briefing: string[];
  entities: EntityDef[];
  wxCells: WxCell[];
  flightPlans: FlightPlan[];
  director: DirectorEvent[];
}

const cap = (x: number, y: number, cs: string): EntityDef => ({
  class: 'FIGHTER', callsign: cs,
  x, y, altM: 7600, headingDeg: 100, speedMs: 210,
  spawnT: 0, friendly: true, datalinkId: true, transponder: 'M4',
  legs: [{ atT: 120, headingDeg: 190 }, { atT: 260, headingDeg: 280 }],
});

const civil = (cs: string, x: number, y: number, hdg: number, altM: number, spawnT: number, planned: boolean): EntityDef => ({
  class: 'AIRLINER', callsign: cs,
  x, y, altM, headingDeg: hdg, speedMs: 230,
  spawnT, friendly: false, neutral: true, transponder: 'C',
  planCallsign: planned ? cs : undefined,
});

const scud = (cs: string, fromX: number, fromY: number, toX: number, toY: number, spawnT: number): EntityDef => ({
  class: 'TBM', callsign: cs,
  x: fromX, y: fromY, altM: 200,
  headingDeg: 135, speedMs: 1100,
  spawnT, friendly: false, transponder: 'NONE',
  ballistic: { fromX, fromY, toX, toY, apogeeM: 15000, flightS: 92 },
});

const drone = (cs: string, x: number, y: number, spawnT: number): EntityDef => ({
  class: 'DRONE', callsign: cs,
  x, y, altM: 900, headingDeg: 350, speedMs: 42,
  spawnT, friendly: false, transponder: 'NONE',
});

const cruise = (cs: string, x: number, y: number, spawnT: number, hdg: number): EntityDef => ({
  class: 'CRUISE', callsign: cs,
  x, y, altM: 60, headingDeg: hdg, speedMs: 240,
  spawnT, friendly: false, transponder: 'NONE',
});

const birds = (x: number, y: number): EntityDef => ({
  class: 'BIRD', callsign: 'FLOCK1',
  x, y, altM: 120, headingDeg: 210, speedMs: 12,
  spawnT: 90, friendly: false,
  legs: [{ atT: 140, headingDeg: 250 }, { atT: 220, headingDeg: 190 }],
});

export const CAMPAIGN_NAME = 'DESERT STORM 1991';
export const CAMPAIGN: WatchScenario[] = [
  {
    id: 'ds1',
    name: 'NIGHT ONE — EMPLACE',
    startSeconds: 18 * 3600 + 40 * 60,
    rangeKm: 100,
    radarHeightM: 20,
    endT: 600,
    startWcs: 'TIGHT',
    briefing: [
      'Battery emplaced north of the objective. First night of the war.',
      'Airspace is dense with coalition traffic — the ATO is your bible tonight.',
      'One slow mover reported to the south near the end of your watch.',
      'WEAPONS TIGHT: engage only what you have declared hostile.',
    ],
    entities: [
      cap(34000, 42000, 'VIPER11'),
      cap(42000, 50000, 'VIPER12'),
      civil('SWA441', -94000, -10000, 92, 8200, 0, true),
      civil('MED217', 4000, 92000, 182, 5800, 120, true),
      civil('RYK214', 16000, 88000, 192, 6100, 260, false),
      birds(15000, 18000),
      drone('SHD107', -6000, -62000, 430),
    ],
    wxCells: [{ x: 36000, y: -12000, radiusM: 14000 }],
    flightPlans: [
      { callsign: 'SWA441', route: 'W→E TRANSIT', altFt: 27000, speedKt: 445, fromS: 0, toS: 600 },
      { callsign: 'MED217', route: 'CORRIDOR BRAVO N→S', altFt: 19000, speedKt: 300, fromS: 100, toS: 640 },
      { callsign: 'VIPER11', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 410, fromS: 0, toS: 700 },
      { callsign: 'VIPER12', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 400, fromS: 0, toS: 700 },
    ],
    director: [
      { atT: 45, radio: 'CRC: WELCOME TO THE WAR, SENTINEL. CHECK YOUR ATO BEFORE YOU TOUCH ANYTHING.' },
      { atT: 300, radio: 'SENTINEL, UNREGISTERED CIVIL PATTERN NORTH — YOUR CALL ON IDENTIFICATION.' },
      { atT: 440, radio: 'SLOW MOVER INBOUND SOUTH. DROPPED FROM THE ATO — TREAT AS UNAFFILIATED.' },
    ],
  },
  {
    id: 'ds2',
    name: 'SCUD NIGHT',
    startSeconds: 20 * 3600 + 15 * 60,
    rangeKm: 100,
    radarHeightM: 20,
    endT: 660,
    startWcs: 'FREE',
    briefing: [
      'Theater reports ballistic launches from the northwest. Impacts projected on the objective.',
      'TBM rules tonight: the warhead does not squawk and it will not deviate.',
      'You will have roughly a minute from first paint to impact. Choose fast.',
      'Two of the projected impacts are inside your defended area. Three are not.',
    ],
    entities: [
      cap(30000, 44000, 'VIPER21'),
      cap(40000, 52000, 'VIPER22'),
      civil('SWA441', -94000, -8000, 92, 8200, 60, true),
      // five Scuds: two threaten the objective, three fall outside — discriminate by geometry
      scud('SCUD-A', -88000, 78000, 2000, -1500, 120),
      scud('SCUD-B', -92000, 62000, -3500, 2500, 165),
      scud('SCUD-C', -76000, 88000, -44000, 38000, 215),
      scud('SCUD-D', -84000, 70000, -12000, -26000, 260),
      scud('SCUD-E', -95000, 54000, 38000, -30000, 300),
      drone('SHD201', 8000, -64000, 380),
    ],
    wxCells: [],
    flightPlans: [
      { callsign: 'SWA441', route: 'W→E TRANSIT', altFt: 27000, speedKt: 445, fromS: 40, toS: 660 },
      { callsign: 'VIPER21', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 410, fromS: 0, toS: 700 },
      { callsign: 'VIPER22', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 400, fromS: 0, toS: 700 },
    ],
    director: [
      { atT: 30, radio: 'LAUNCH WARNING — MULTIPLE BALLISTICS OUTBOUND NORTHWEST. TRACKS WILL BE FAST.' },
      { atT: 100, radio: 'TBM RULES IN EFFECT: BALLISTIC TRACKS MAY BE ENGAGED ON SPEED ALONE.' },
      { atT: 340, radio: 'BDA TEAMS REPORTING. STAY SHARP — THE NIGHT IS NOT OVER.' },
    ],
  },
  {
    id: 'ds3',
    name: 'THE CORRIDOR',
    startSeconds: 22 * 3600 + 41 * 60,
    rangeKm: 100,
    radarHeightM: 20,
    endT: 700,
    startWcs: 'TIGHT',
    briefing: [
      'Strike package traffic returns tonight through corridors you do not fully see.',
      'The ATO page you hold was printed before the last wave launched. It is stale.',
      'WEAPONS TIGHT. Every engagement tonight needs your declaration behind it.',
      'Remember: no reply on Mode 4 is not a verdict. It is a question.',
    ],
    entities: [
      cap(34000, 42000, 'VIPER11'),
      cap(42000, 50000, 'VIPER12'),
      {
        class: 'FIGHTER', callsign: 'JUDO21',
        x: 12000, y: 88000, altM: 5200,
        headingDeg: 182, speedMs: 225,
        spawnT: 230, friendly: true, transponder: 'FAILING',
      },
      civil('SWA441', -94000, -12000, 92, 8200, 0, true),
      civil('MED217', 3000, 92000, 182, 5800, 95, true),
      civil('RYK214', 14000, 88000, 192, 6100, 200, false),
      {
        class: 'HELO', callsign: 'HIND02',
        x: -12000, y: 60000, altM: 50,
        headingDeg: 160, speedMs: 55,
        spawnT: 90, friendly: false, transponder: 'NONE',
        legs: [{ atT: 170, headingDeg: 210 }, { atT: 280, headingDeg: 150 }],
      },
      drone('SHD107', -5000, -70000, 420),
    ],
    wxCells: [{ x: -30000, y: 30000, radiusM: 14000 }],
    flightPlans: [
      { callsign: 'SWA441', route: 'W→E TRANSIT', altFt: 27000, speedKt: 445, fromS: 0, toS: 500 },
      { callsign: 'MED217', route: 'CORRIDOR BRAVO N→S', altFt: 19000, speedKt: 300, fromS: 90, toS: 600 },
      { callsign: 'VIPER11', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 410, fromS: 0, toS: 900 },
      { callsign: 'VIPER12', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 400, fromS: 0, toS: 900 },
      { callsign: 'GAF55', route: 'S→N TRANSIT', altFt: 15000, speedKt: 350, fromS: -600, toS: -30 },
    ],
    director: [
      { atT: 45, radio: 'CRC: CIVIL TRAFFIC ACTIVE ON CORRIDOR BRAVO. CHECK YOUR ATO.' },
      { atT: 260, wcs: 'FREE', radio: 'MULTIPLE LAUNCHES REPORTED — WEAPONS FREE. ENGAGE ALL THREATS.' },
      { atT: 330, radio: 'SENTINEL, STRIKE PACKAGE JUDO21 RECOVERING THROUGH YOUR NORTH — ATO UPDATE PENDING.' },
      { atT: 430, wcs: 'TIGHT', radio: 'RAID PASSED. RESUMING WEAPONS TIGHT — POSITIVE ID ONLY.' },
    ],
  },
  {
    id: 'ds4',
    name: 'SATURATION',
    startSeconds: 21 * 3600 + 17 * 60,
    rangeKm: 100,
    radarHeightM: 20,
    endT: 720,
    startWcs: 'TIGHT',
    briefing: [
      'They will come with everything: drones to bleed your magazine, cruise to beat your horizon.',
      'Sixteen rounds. Six channels. More targets than answers.',
      'WEAPONS FREE will be called when the raid breaks — until then, discipline.',
      'Do not shoot the airliner. You will be tempted. Do not.',
    ],
    entities: [
      cap(30000, 40000, 'VIPER11'),
      cap(38000, 48000, 'VIPER12'),
      civil('SWA441', -95000, -15000, 92, 8200, 0, true),
      drone('SHD101', 22000, -60000, 165),
      drone('SHD102', 34000, -58000, 180),
      drone('SHD103', 14000, -63000, 195),
      drone('SHD104', 40000, -55000, 210),
      drone('SHD105', 8000, -65000, 225),
      cruise('K101', -68000, -34000, 240, 42),
      cruise('K102', -74000, -26000, 275, 46),
      scud('SCUD-F', -90000, 70000, -1000, 1200, 300),
      birds(15000, 18000),
    ],
    wxCells: [],
    flightPlans: [
      { callsign: 'SWA441', route: 'W→E TRANSIT', altFt: 27000, speedKt: 445, fromS: 0, toS: 600 },
      { callsign: 'VIPER11', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 410, fromS: 0, toS: 900 },
      { callsign: 'VIPER12', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 400, fromS: 0, toS: 900 },
    ],
    director: [
      { atT: 30, radio: 'SENTINEL, STAND BY — RAID WARNING POSTED FOR YOUR SECTOR.' },
      { atT: 170, wcs: 'FREE', radio: 'LAUNCHES DETECTED — WEAPONS FREE. WEAPONS FREE.' },
      { atT: 205, radio: 'MULTIPLE SLOW MOVERS INBOUND SOUTH-EAST. DO NOT WASTE ROUNDS.' },
      { atT: 620, wcs: 'TIGHT', radio: 'RAID PASSING. WEAPONS TIGHT — POSITIVE ID ONLY.' },
    ],
  },
  {
    id: 'ds5',
    name: 'THE LONG NIGHT',
    startSeconds: 23 * 3600 + 50 * 60,
    rangeKm: 100,
    radarHeightM: 20,
    endT: 900,
    startWcs: 'FREE',
    briefing: [
      'Last night of the war. They know where you are.',
      'Ballistics, drones, cruise — and coalition traffic still crossing overhead.',
      'The battery is tired. You are tired. The rules have not changed.',
      'Bring everyone home and this is over.',
    ],
    entities: [
      cap(30000, 44000, 'VIPER31'),
      cap(40000, 52000, 'VIPER32'),
      {
        class: 'FIGHTER', callsign: 'JUDO41',
        x: 10000, y: 90000, altM: 5200,
        headingDeg: 182, speedMs: 225,
        spawnT: 240, friendly: true, transponder: 'FAILING',
      },
      civil('SWA441', -94000, -10000, 92, 8200, 80, true),
      civil('MED217', 2000, 94000, 182, 5800, 320, true),
      scud('SCUD-G', -88000, 76000, 1500, -1000, 140),
      scud('SCUD-H', -90000, 66000, -2600, 1800, 200),
      scud('SCUD-I', -82000, 82000, -20000, 16000, 300),
      scud('SCUD-J', -94000, 58000, -9000, -22000, 480),
      drone('SHD301', 24000, -62000, 200),
      drone('SHD302', 12000, -66000, 240),
      drone('SHD303', 36000, -56000, 280),
      drone('SHD304', 6000, -68000, 320),
      cruise('K201', -70000, -32000, 300, 44),
      cruise('K202', -66000, -38000, 380, 40),
      {
        class: 'BOMBER', callsign: 'BEAR71',
        x: -90000, y: 38000, altM: 10500,
        headingDeg: 168, speedMs: 200,
        spawnT: 60, friendly: false, transponder: 'NONE',
      },
      birds(14000, 16000),
    ],
    wxCells: [{ x: 30000, y: -20000, radiusM: 15000 }],
    flightPlans: [
      { callsign: 'SWA441', route: 'W→E TRANSIT', altFt: 27000, speedKt: 445, fromS: 60, toS: 700 },
      { callsign: 'MED217', route: 'CORRIDOR BRAVO N→S', altFt: 19000, speedKt: 300, fromS: 300, toS: 900 },
      { callsign: 'VIPER31', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 410, fromS: 0, toS: 950 },
      { callsign: 'VIPER32', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 400, fromS: 0, toS: 950 },
    ],
    director: [
      { atT: 40, radio: 'ALL UNITS: HEAVY ACTIVITY EXPECTED BEFORE MIDNIGHT. SENTINEL HAS THE SKY.' },
      { atT: 330, radio: 'SENTINEL, CIVIL TRAFFIC STILL CROSSING. DISCIPLINE ON THE TRIGGERS.' },
      { atT: 700, radio: 'THEATER REPORTS ACTIVITY DYING DOWN. HOLD YOUR PICTURE.' },
      { atT: 860, radio: 'STAND DOWN IN TEN MINUTES. YOU MADE IT, SENTINEL.' },
    ],
  },
];
