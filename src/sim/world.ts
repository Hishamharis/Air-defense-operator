import { Blip, Entity, EntityDef, Track, CLASS_RCS } from './types';

export const SWEEP_RPM = 15;
export const SWEEP_RATE_DEG = SWEEP_RPM * 6; // deg/s

/** Blip brightness from RCS on a log scale: 0.05 m² faint → 30 m² bright. */
export function blipBrightness(rcs: number): number {
  const lo = Math.log10(0.05);
  const hi = Math.log10(30);
  return Math.min(1, Math.max(0.3, 0.35 + 0.65 * (Math.log10(rcs) - lo) / (hi - lo)));
}

/** Bearing in degrees, 0 = north, clockwise. */
export function bearingDeg(x: number, y: number): number {
  return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
}

export interface NewTrackInfo {
  tn: number;
  entity: Entity;
  track: Track;
}

export class World {
  time = 0;
  entities: Entity[] = [];
  /** tracks keyed by entityId */
  tracks = new Map<number, Track>();

  private nextTn = 4101;
  private nextId = 1;

  constructor(
    defs: EntityDef[],
    private onNewTrack?: (info: NewTrackInfo) => void,
  ) {
    for (const def of defs) {
      this.entities.push({
        id: this.nextId++,
        def,
        x: def.x,
        y: def.y,
        altM: def.altM,
        headingDeg: def.headingDeg,
        speedMs: def.speedMs,
        legIndex: 0,
        spawned: false,
      });
    }
  }

  step(dt: number): void {
    this.time += dt;
    for (const e of this.entities) {
      if (!e.spawned) {
        if (this.time >= e.def.spawnT) e.spawned = true;
        else continue;
      }
      const legs = e.def.legs ?? [];
      while (e.legIndex < legs.length && this.time >= legs[e.legIndex].atT) {
        const leg = legs[e.legIndex];
        e.headingDeg = leg.headingDeg;
        if (leg.speedMs !== undefined) e.speedMs = leg.speedMs;
        e.legIndex++;
      }
      const rad = e.headingDeg * Math.PI / 180;
      e.x += Math.sin(rad) * e.speedMs * dt;
      e.y += Math.cos(rad) * e.speedMs * dt;
    }
  }

  get sweepAngle(): number {
    return (this.time * SWEEP_RATE_DEG) % 360;
  }

  entityById(id: number): Entity | undefined {
    return this.entities.find(e => e.id === id);
  }

  trackByTn(tn: number): Track | undefined {
    for (const t of this.tracks.values()) if (t.tn === tn) return t;
    return undefined;
  }

  /**
   * Paint all spawned entities whose bearing lies in the swept arc (a0, a1] and that are
   * within instrument range. Creates/updates tracks and returns the fresh blips so the
   * renderer can stamp them into the persistence buffer.
   */
  paintCrossed(a0: number, a1: number, rangeM: number): { entity: Entity; blip: Blip }[] {
    const arc = (a1 - a0 + 720) % 360;
    const painted: { entity: Entity; blip: Blip }[] = [];
    for (const e of this.entities) {
      if (!e.spawned) continue;
      const rng = Math.hypot(e.x, e.y);
      if (rng > rangeM || rng < 1) continue;
      const db = (bearingDeg(e.x, e.y) - a0 + 720) % 360;
      if (db > arc) continue;

      const blip: Blip = {
        x: e.x,
        y: e.y,
        brightness: blipBrightness(CLASS_RCS[e.def.class]),
        t: this.time,
      };
      let track = this.tracks.get(e.id);
      if (!track) {
        track = {
          tn: this.nextTn++,
          entityId: e.id,
          firstPaintT: this.time,
          lastPaintT: this.time,
          blip,
        };
        this.tracks.set(e.id, track);
        if (this.onNewTrack) this.onNewTrack({ tn: track.tn, entity: e, track });
      } else {
        track.lastPaintT = this.time;
        track.blip = blip;
      }
      painted.push({ entity: e, blip });
    }
    return painted;
  }
}
