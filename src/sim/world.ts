import { Blip, Entity, EntityDef, Track, CLASS_RCS, CLASS_LABEL } from './types';
import { classifyTrack } from './classify';
import { RadarModel, WxCell } from './radar';

export const SWEEP_RPM = 15;
export const SWEEP_RATE_DEG = SWEEP_RPM * 6; // deg/s

/** Bearing in degrees, 0 = north, clockwise. */
export function bearingDeg(x: number, y: number): number {
  return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
}

export interface NewTrackInfo {
  tn: number;
  entity: Entity;
  track: Track;
}

export interface TrackEvent {
  kind: 'NEW' | 'CONFIRMED' | 'COASTING' | 'FADED' | 'REACQ' | 'DROPPED';
  tn: number;
  brg: number;
  rngKm: number;
}

const DROP_AFTER_MISSED = 3; // sweeps without detection before a track fades
const REASSOCIATE_S = 30; // a faded track resumes its number if re-painted within this window

export class World {
  time = 0;
  entities: Entity[] = [];
  /** tracks keyed by entityId */
  tracks = new Map<number, Track>();
  /** faded tracks kept briefly so a re-paint resumes the same TN */
  private droppedTracks = new Map<number, { track: Track; droppedAt: number }>();

  readonly radar: RadarModel;
  readonly wxCells: WxCell[];

  private nextTn = 4101;
  private nextId = 1;
  private sweepSerial = 0;

  constructor(
    defs: EntityDef[],
    radar: RadarModel,
    wxCells: WxCell[] = [],
    private onEvent?: (ev: TrackEvent) => void,
  ) {
    this.radar = radar;
    this.wxCells = wxCells;
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
    this.radar.tick(dt);

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

    // expire short-lived clutter entities
    if (this.entities.some(e => e.def.ttlS !== undefined)) {
      this.entities = this.entities.filter(e => {
        if (e.def.ttlS === undefined) return true;
        return this.time < e.def.spawnT + e.def.ttlS;
      });
    }

    // TWS dead reckoning: track estimates glide between sweeps
    for (const trk of this.tracks.values()) {
      if (trk.paints >= 2) {
        trk.est.x += trk.est.vx * dt;
        trk.est.y += trk.est.vy * dt;
      }
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

  private emit(kind: TrackEvent['kind'], trk: Track): void {
    if (!this.onEvent) return;
    const brg = Math.round(bearingDeg(trk.est.x, trk.est.y));
    const rngKm = Math.round(Math.hypot(trk.est.x, trk.est.y) / 1000);
    this.onEvent({ kind, tn: trk.tn, brg, rngKm });
  }

  /** Called when the beam sweeps across arc (a0, a1]: roll detections, manage tracks. */
  sweepCross(a0: number, a1: number): { x: number; y: number; brightness: number }[] {
    const wrapped = a1 < a0;
    if (wrapped) this.sweepSerial++;

    const stamped: { x: number; y: number; brightness: number }[] = [];
    const arc = (a1 - a0 + 720) % 360;

    for (const e of this.entities) {
      if (!e.spawned) continue;
      const db = (bearingDeg(e.x, e.y) - a0 + 720) % 360;
      if (db > arc) continue;

      const rcs = CLASS_RCS[e.def.class];
      const det = this.radar.detect(e.x, e.y, e.altM, rcs, this.wxCells);
      if (!det.detected) continue;

      stamped.push({ x: e.x, y: e.y, brightness: det.brightness });
      this.onPaint(e, det.brightness);
    }

    if (wrapped) this.endOfSweep();
    return stamped;
  }

  private onPaint(e: Entity, brightness: number): void {
    let trk = this.tracks.get(e.id);
    const now = this.time;

    // re-association: a faded track painted again soon resumes under its number
    if (!trk) {
      const dropped = this.droppedTracks.get(e.id);
      if (dropped && now - dropped.droppedAt <= REASSOCIATE_S) {
        this.droppedTracks.delete(e.id);
        trk = dropped.track;
        this.tracks.set(e.id, trk);
        this.emit('REACQ', trk);
      }
    }

    if (!trk) {
      const blip: Blip = { x: e.x, y: e.y, brightness, t: now };
      trk = {
        tn: this.nextTn++,
        entityId: e.id,
        firstPaintT: now,
        lastPaintT: now,
        blip,
        est: {
          x: e.x,
          y: e.y,
          altM: e.altM * (1 + (Math.random() - 0.5) * 0.15),
          vx: 0,
          vy: 0,
          speedMs: 0,
          headingDeg: 0,
        },
        headingChurnDeg: 0,
        state: 'PLOT',
        paints: 1,
        missed: 0,
        lastDetectSweep: this.sweepSerial,
        autoClass: '??',
        classConf: 'POOR',
      };
      this.tracks.set(e.id, trk);
      this.emit('NEW', trk);
      return;
    }

    // update with a fresh paint: position jump + smoothed velocity
    const dtP = Math.max(0.5, now - trk.lastPaintT);
    const nvx = (e.x - trk.est.x) / dtP;
    const nvy = (e.y - trk.est.y) / dtP;
    const prevSpeed = trk.est.speedMs;

    trk.blip = { x: e.x, y: e.y, brightness, t: now };
    trk.est.x = e.x;
    trk.est.y = e.y;
    trk.est.altM = 0.7 * trk.est.altM + 0.3 * e.altM * (1 + (Math.random() - 0.5) * 0.15);
    trk.paints++;
    trk.lastPaintT = now;
    trk.missed = 0;
    trk.lastDetectSweep = this.sweepSerial;

    if (trk.paints >= 2) {
      trk.est.vx = 0.35 * trk.est.vx + 0.65 * nvx;
      trk.est.vy = 0.35 * trk.est.vy + 0.65 * nvy;
      trk.est.speedMs = Math.hypot(trk.est.vx, trk.est.vy);
      const hdg = (Math.atan2(trk.est.vx, trk.est.vy) * 180) / Math.PI;
      const dHdg = Math.abs(((hdg - trk.est.headingDeg + 540) % 360) - 180);
      if (trk.paints > 2) trk.headingChurnDeg = 0.7 * trk.headingChurnDeg + 0.3 * dHdg * 10;
      trk.est.headingDeg = hdg;
    }

    const wasConfirmed = trk.state === 'TRACKED';
    if (!wasConfirmed && trk.paints >= 2) {
      trk.state = 'TRACKED';
      this.emit('CONFIRMED', trk);
    } else if (trk.state === 'COAST') {
      trk.state = 'TRACKED';
    }

    if (trk.paints === 2 || (trk.paints > 2 && Math.abs(trk.est.speedMs - prevSpeed) > 15)) {
      const cls = classifyTrack(trk.est.speedMs, trk.est.altM, trk.headingChurnDeg, trk.paints);
      trk.autoClass = cls.label;
      trk.classConf = cls.conf;
    }
  }

  /** Sweep-wrap housekeeping: misses → coast → fade; false plots from weather. */
  private endOfSweep(): void {
    for (const [id, d] of this.droppedTracks) {
      if (this.time - d.droppedAt > REASSOCIATE_S) this.droppedTracks.delete(id);
    }
    for (const trk of [...this.tracks.values()]) {
      if (trk.lastDetectSweep === this.sweepSerial) continue;
      trk.missed++;
      if (trk.missed >= DROP_AFTER_MISSED) {
        this.tracks.delete(trk.entityId);
        this.droppedTracks.set(trk.entityId, { track: trk, droppedAt: this.time });
        this.emit('FADED', trk);
      } else if (trk.state !== 'COAST' && trk.missed >= 1) {
        trk.state = 'COAST';
        this.emit('COASTING', trk);
      }
    }
    this.spawnFalsePlots();
  }

  /** Weather cells occasionally produce strong-but-brief false returns. */
  private spawnFalsePlots(): void {
    if (!this.wxCells.length || !this.radar.radiating) return;
    for (const cell of this.wxCells) {
      if (Math.random() > 0.4) continue;
      const ang = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * cell.radiusM * 0.9;
      const x = cell.x + Math.cos(ang) * r;
      const y = cell.y + Math.sin(ang) * r;
      if (Math.hypot(x, y) > this.radar.instrumentKm * 1000) continue;
      const hdg = Math.random() * 360;
      this.entities.push({
        id: this.nextId++,
        def: {
          class: 'CLUTTER',
          callsign: 'WX',
          x,
          y,
          altM: 60 + Math.random() * 140,
          headingDeg: hdg,
          speedMs: 4 + Math.random() * 10,
          spawnT: this.time,
          friendly: false,
          ttlS: 3 + Math.random() * 6,
        },
        x,
        y,
        altM: 60,
        headingDeg: hdg,
        speedMs: 4,
        legIndex: 0,
        spawned: true,
      });
    }
  }

  /** Manual track drop by the operator. Returns true if a track was removed. */
  dropTrack(tn: number): boolean {
    for (const [entityId, trk] of this.tracks) {
      if (trk.tn === tn) {
        this.tracks.delete(entityId);
        this.emit('DROPPED', trk);
        return true;
      }
    }
    return false;
  }

  /** Truth label for debugging overlays only. */
  truthLabel(e: Entity): string {
    return e.def.friendly ? `${e.def.callsign} FND` : `${e.def.callsign} ${CLASS_LABEL[e.def.class]}`;
  }
}
