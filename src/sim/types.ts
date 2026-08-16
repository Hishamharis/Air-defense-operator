export type EntityClass = 'FIGHTER' | 'BOMBER' | 'AIRLINER' | 'CRUISE' | 'DRONE' | 'HELO';

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

/** Player-side representation of an entity, created on first radar paint. */
export interface Track {
  tn: number;
  entityId: number;
  firstPaintT: number;
  lastPaintT: number;
  blip: Blip;
}

export const CLASS_RCS: Record<EntityClass, number> = {
  FIGHTER: 3,
  BOMBER: 20,
  AIRLINER: 15,
  CRUISE: 0.1,
  DRONE: 0.15,
  HELO: 2,
};

/** M1 placeholder classification: derived from truth class. M2 will derive from kinematics. */
export const CLASS_LABEL: Record<EntityClass, string> = {
  FIGHTER: 'ABT',
  BOMBER: 'ABT',
  AIRLINER: 'ABT',
  CRUISE: 'CRU',
  DRONE: 'UAV',
  HELO: 'HELO',
};

export const MS_TO_KT = 1.94384;
export const M_TO_FT = 3.28084;
