import type { Transponder, IffResult } from './iff';

export type EntityClass =
  | 'FIGHTER'
  | 'BOMBER'
  | 'AIRLINER'
  | 'CRUISE'
  | 'DRONE'
  | 'HELO'
  | 'BIRD'
  | 'CLUTTER';

/** A scripted leg: at world time atT the entity turns to headingDeg (and changes speed if given). */
export interface Leg {
  atT: number;
  headingDeg: number;
  speedMs?: number;
}

export interface EntityDef {
  class: EntityClass;
  callsign: string;
  /** meters east (x) / north (y) of the site */
  x: number;
  y: number;
  altM: number;
  headingDeg: number;
  speedMs: number;
  /** world time (s) at which the entity enters the world */
  spawnT: number;
  friendly: boolean;
  legs?: Leg[];
  /** short-lived clutter return (weather false plot): entity removed after this many seconds */
  ttlS?: number;
  /** IFF transponder capability */
  transponder?: Transponder;
  /** appears as friendly on the datalink link-list without operator work */
  datalinkId?: boolean;
  /** civil / neutral traffic (airliners etc.) — shooting these is a violation */
  neutral?: boolean;
  /** this aircraft is covered by a flight plan row in the ATO (commander can cite it) */
  planCallsign?: string;
}

export interface Entity {
  id: number;
  def: EntityDef;
  x: number;
  y: number;
  altM: number;
  headingDeg: number;
  speedMs: number;
  legIndex: number;
  spawned: boolean;
}

/** A painted radar return stored on a track (position where the blip was painted). */
export interface Blip {
  x: number;
  y: number;
  brightness: number;
  t: number;
}

export type TrackState = 'PLOT' | 'TRACKED' | 'COAST';

/** Console identity state — only OPERATOR/DATALINK sources are player-visible. */
export type TrackIdentity = 'UNK' | 'FND' | 'HOS';

/** Player-side representation of an entity: created on first radar paint,
 *  dead-reckoned between sweeps, coasting through misses, dropped when faded. */
export interface Track {
  tn: number;
  entityId: number;
  firstPaintT: number;
  lastPaintT: number;
  /** last actual radar return */
  blip: Blip;
  /** TWS computer estimate — smoothed position/velocity, extrapolated between paints */
  est: {
    x: number;
    y: number;
    altM: number;
    vx: number;
    vy: number;
    speedMs: number;
    headingDeg: number;
  };
  /** heading change across recent paints (deg) — separates wandering helos from drones */
  headingChurnDeg: number;
  state: TrackState;
  paints: number;
  /** consecutive sweeps since last detection */
  missed: number;
  /** sweep serial of last detection (miss accounting) */
  lastDetectSweep: number;
  autoClass: string;
  classConf: 'GOOD' | 'FAIR' | 'POOR';
  /** identification */
  identity: TrackIdentity;
  idSource: 'DATALINK' | 'IFF' | 'OPERATOR' | '';
  iffResult: IffResult | null;
  iffPending: boolean;
  /** operator mistakes recorded on this track (revealed live + debrief) */
  violations: number;
}

export const CLASS_RCS: Record<EntityClass, number> = {
  FIGHTER: 3,
  BOMBER: 20,
  AIRLINER: 15,
  CRUISE: 0.1,
  DRONE: 0.15,
  HELO: 2,
  BIRD: 0.05,
  CLUTTER: 0.8,
};

/** Datalink-derived identity note for friendlies (full IFF arrives in M3). */
export const CLASS_LABEL: Record<EntityClass, string> = {
  FIGHTER: 'ABT',
  BOMBER: 'ABT',
  AIRLINER: 'ABT',
  CRUISE: 'CRU',
  DRONE: 'UAV',
  HELO: 'HELO',
  BIRD: 'SLO',
  CLUTTER: 'SLO',
};

export const MS_TO_KT = 1.94384;
export const M_TO_FT = 3.28084;

/** One row of the ATO / flight-plan list the operator cross-checks against. */
export interface FlightPlan {
  callsign: string;
  route: string;
  altFt: number;
  speedKt: number;
  /** mission-time window (s) in which the plan is active */
  fromS: number;
  toS: number;
}
