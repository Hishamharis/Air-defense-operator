import { Blip, Entity, EntityDef, Track, CLASS_RCS, CLASS_LABEL } from './types';
import { classifyTrack } from './classify';
import { RadarModel, WxCell } from './radar';
import { rollIffReply, iffText } from './iff';
import { Director } from './director';
import { WeaponsSystem, InterceptOutcome } from './weapons';

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
  kind:
    | 'NEW'
    | 'CONFIRMED'
    | 'COASTING'
    | 'FADED'
    | 'REACQ'
    | 'DROPPED'
    | 'DECL_HOS'
    | 'DECL_FND'
    | 'IFF'
    | 'DATALINK'
    | 'VIOLATION_NOTE'
    | 'MISSILE'
    | 'INTERCEPT'
    | 'DESTROYED'
    | 'FRATRICIDE'
    | 'LEAKER'
    | 'RELOAD'
    | 'ENGAGE_BLOCKED';
  tn: number;
  brg: number;
  rngKm: number;
  text?: string;
  /** world time of the event (for the debrief narrative) */
  t?: number;
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
  readonly director?: Director;
  readonly weapons = new WeaponsSystem();
  /** end-of-watch tallies for the debrief (M5 will render these) */
  readonly score = {
    idViolations: [] as { tn: number; truth: string }[],
    clearMisses: [] as number[],
    kills: 0,
    shots: 0,
    fratricides: [] as { tn: number; truth: string }[],
    leakers: [] as string[],
  };

  private nextTn = 4101;
  private nextId = 1;
  private sweepSerial = 0;
  private pendingIff: { entityId: number; atT: number }[] = [];
  private leakersSeen = new Set<number>();
  private lastAutoT = -999;
  /** recent intercept points for the scope's expanding-ring flashes */
  readonly flashes: { x: number; y: number; t: number; kind: 'KILL' | 'MISS' | 'FRAT' }[] = [];
  /** full event archive — the debrief replays the watch from this */
  readonly history: TrackEvent[] = [];

  constructor(
    defs: EntityDef[],
    radar: RadarModel,
    wxCells: WxCell[] = [],
    director?: Director,
    private onEvent?: (ev: TrackEvent) => void,
    private onRadio?: (text: string) => void,
  ) {
    this.radar = radar;
    this.wxCells = wxCells;
    this.director = director;
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
    this.director?.tick(this.time);

    for (const e of this.entities) {
      if (!e.spawned) {
        if (this.time >= e.def.spawnT) e.spawned = true;
        else continue;
      }
      const bal = e.def.ballistic;
      if (bal) {
        // parabolic arc: position lerp, altitude parabola; removed on impact
        const u = Math.min(1, (this.time - e.def.spawnT) / bal.flightS);
        const nu = Math.min(1, u + dt / bal.flightS);
        e.x = bal.fromX + (bal.toX - bal.fromX) * u;
        e.y = bal.fromY + (bal.toY - bal.fromY) * u;
        e.altM = Math.max(50, bal.apogeeM * 4 * u * (1 - u));
        e.speedMs = Math.hypot(bal.toX - bal.fromX, bal.toY - bal.fromY) / bal.flightS;
        e.headingDeg = (Math.atan2(bal.toX - bal.fromX, bal.toY - bal.fromY) * 180) / Math.PI;
        if (nu >= 1) this.resolveTbmImpact(e);
        continue;
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

    // resolve pending IFF interrogations (delayed replies)
    if (this.pendingIff.length) {
      const still: typeof this.pendingIff = [];
      for (const p of this.pendingIff) {
        if (this.time < p.atT) {
          still.push(p);
          continue;
        }
        const trk = this.tracks.get(p.entityId);
        const e = this.entityById(p.entityId);
        if (!trk || !e) continue; // track dropped mid-interrogation: reply lost
        const kind = rollIffReply(e);
        trk.iffPending = false;
        trk.iffResult = { kind, text: iffText(kind, e, trk.est.altM), t: this.time };
        this.emit('IFF', trk, trk.iffResult.text);
      }
      this.pendingIff = still;
    }

    // weapons: flight, fuzing, reloads, auto-engage, leak watch
    const reloadingBefore = this.weapons.units.filter(u => u.state === 'RELOADING').length;
    const outcomes = this.weapons.step(dt, this.time, this.entities);
    if (this.weapons.units.filter(u => u.state === 'RELOADING').length < reloadingBefore) {
      const ev: TrackEvent = { kind: 'RELOAD', tn: 0, brg: 0, rngKm: 0, text: 'LAUNCHER RELOAD COMPLETE — ROUNDS READY' };
      this.history.push(ev);
      if (this.onEvent) this.onEvent(ev);
    }
    for (const oc of outcomes) this.resolveIntercept(oc);
    this.autoEngageTick();
    this.leakTick();
  }

  /** TBM reaches the ground: impact near the defended area counts against the base. */
  private resolveTbmImpact(e: Entity): void {
    this.entities = this.entities.filter(x => x.id !== e.id);
    this.droppedTracks.delete(e.id);
    const trk = this.tracks.get(e.id);
    const distKm = Math.hypot(e.def.ballistic!.toX, e.def.ballistic!.toY) / 1000;
    if (distKm < 12) {
      this.score.leakers.push(e.def.callsign);
      if (this.onRadio) this.onRadio('IMPACT — GROUND IMPACT INSIDE THE DEFENDED AREA.');
      if (trk) {
        this.tracks.delete(e.id);
        this.emit('LEAKER', trk, 'BALLISTIC IMPACT INSIDE DEFENDED AREA');
      }
    } else {
      if (this.onRadio) this.onRadio(`IMPACT REPORTED ${Math.round(distKm)} KM OUT — NO EFFECT TO ASSET.`);
      if (trk) {
        this.tracks.delete(e.id);
        this.emit('DESTROYED', trk, 'TBM IMPACT OUTSIDE DEFENDED AREA — NO EFFECT');
      }
    }
  }

  private resolveIntercept(oc: InterceptOutcome): void {
    const trk = this.tracks.get(oc.target.id);
    this.flashes.push({
      x: oc.x,
      y: oc.y,
      t: this.time,
      kind: oc.killed ? (oc.target.def.friendly || oc.target.def.neutral ? 'FRAT' : 'KILL') : 'MISS',
    });
    if (this.flashes.length > 12) this.flashes.shift();
    if (oc.killed) {
      // remove the target from the world — permanently
      this.entities = this.entities.filter(e => e.id !== oc.target.id);
      this.droppedTracks.delete(oc.target.id);
      const protectedTarget = oc.target.def.friendly || oc.target.def.neutral;
      if (protectedTarget) {
        this.score.fratricides.push({ tn: oc.missile.tn, truth: oc.target.def.callsign });
        if (this.onRadio) this.onRadio('SENTINEL, CHECK FIRE. CHECK FIRE.');
        this.tracks.delete(oc.target.id);
        if (trk) {
          this.emit('FRATRICIDE', trk, `${oc.target.def.callsign} DESTROYED BY OUR MISSILE`);
        } else if (this.onEvent) {
          // track had faded at the moment of intercept — the board still hears about it
          this.onEvent({
            kind: 'FRATRICIDE',
            tn: oc.missile.tn,
            brg: Math.round(bearingDeg(oc.x, oc.y)),
            rngKm: Math.round(Math.hypot(oc.x, oc.y) / 1000),
            text: `${oc.target.def.callsign} DESTROYED BY OUR MISSILE`,
          });
        }
      } else {
        this.score.kills++;
        if (trk) {
          this.tracks.delete(oc.target.id);
          this.emit('DESTROYED', trk, `HOSTILE DESTROYED · PK ${oc.pk.toFixed(2)}`);
        }
      }
    } else {
      if (trk) this.emit('INTERCEPT', trk, `MISS — PK WAS ${oc.pk.toFixed(2)} · RE-ENGAGE`);
    }
  }

  /** The automation: engages per current WCS with no human in the loop. */
  private autoEngageTick(): void {
    if (!this.weapons.autoEngage) return;
    if (this.time - this.lastAutoT < 4) return;
    const wcs = this.director?.wcs ?? 'TIGHT';
    if (wcs === 'HOLD') return;
    for (const trk of this.tracks.values()) {
      if (trk.state !== 'TRACKED') continue;
      const gate = wcs === 'FREE' ? trk.identity !== 'FND' : trk.identity === 'HOS';
      if (!gate) continue;
      if (this.weapons.missiles.some(m => m.tn === trk.tn && !m.dead)) continue;
      this.lastAutoT = this.time;
      this.engage(trk.tn, true);
      return; // one engagement per tick window
    }
  }

  /** Hostiles crossing the inner ring: the site takes it on the chin. */
  private leakTick(): void {
    for (const e of this.entities) {
      if (!e.spawned || e.def.friendly || e.def.neutral || e.def.class === 'BIRD' || e.def.class === 'CLUTTER') continue;
      if (Math.hypot(e.x, e.y) < 8000 && !this.leakersSeen.has(e.id)) {
        this.leakersSeen.add(e.id);
        const trk = this.tracks.get(e.id);
        this.score.leakers.push(e.def.callsign);
        if (trk) this.emit('LEAKER', trk, 'THREAT PENETRATED INNER RING — SITE UNDER ATTACK');
        else if (this.onRadio) this.onRadio('IMPACT — SITE UNDER ATTACK.');
      }
    }
  }

  /**
   * Launch on a track under the weapons-control status in force.
   * TIGHT requires the track to be declared hostile; FREE allows anything
   * not positively friendly; HOLD blocks everything. That last rule is the
   * only thing standing between AUTO ENGAGE and an airliner.
   */
  engage(tn: number, auto = false): boolean {
    const trk = this.trackByTn(tn);
    if (!trk || trk.state === 'PLOT') return false;
    const e = this.entityById(trk.entityId);
    if (!e) return false;

    const wcs = this.director?.wcs ?? 'TIGHT';
    if (wcs === 'HOLD') {
      if (!auto && this.onRadio) this.onRadio('NEGATIVE — WEAPONS HOLD IN EFFECT.');
      this.emit('ENGAGE_BLOCKED', trk, 'WEAPONS HOLD');
      return false;
    }
    const gate = wcs === 'FREE' ? trk.identity !== 'FND' : trk.identity === 'HOS';
    if (!gate) {
      if (!auto) this.emit('ENGAGE_BLOCKED', trk, wcs === 'FREE' ? 'DECLARED FRIENDLY' : 'NOT DECLARED HOSTILE');
      return false;
    }
    if (this.weapons.channelsUsed >= this.weapons.channelsMax) {
      if (!auto) this.emit('ENGAGE_BLOCKED', trk, 'ALL CHANNELS BUSY');
      return false;
    }
    if (this.weapons.roundsReady() === 0) {
      if (!auto) this.emit('ENGAGE_BLOCKED', trk, 'NO ROUNDS — ALL LAUNCHERS RELOADING');
      return false;
    }

    // engaging protected traffic is a violation the moment the order is given
    if ((e.def.friendly || e.def.neutral) && !auto) {
      this.emit('VIOLATION_NOTE', trk, 'ENGAGEMENT OF UNCONFIRMED HOSTILE — LOGGED');
    }

    const count = this.weapons.doctrine === 'SS' ? 2 : 1;
    const fired = this.weapons.launch(e.id, trk.tn, count, this.time, e);
    if (!fired.length) return false;
    this.score.shots += fired.length;
    this.emit(
      'MISSILE',
      trk,
      `${auto ? 'AUTO ' : ''}${fired.length} MISSILE${fired.length > 1 ? 'S' : ''} AWAY · ${this.weapons.doctrine} · EST PK ${this.weapons.estimatePk(e).toFixed(2)}`,
    );
    return true;
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

  private emit(kind: TrackEvent['kind'], trk: Track, text?: string): void {
    const brg = Math.round(bearingDeg(trk.est.x, trk.est.y));
    const rngKm = Math.round(Math.hypot(trk.est.x, trk.est.y) / 1000);
    const ev = { kind, tn: trk.tn, brg, rngKm, text, t: this.time };
    this.history.push(ev);
    if (!this.onEvent) return;
    this.onEvent(ev);
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
        identity: 'UNK',
        idSource: '',
        iffResult: null,
        iffPending: false,
        violations: 0,
      };
      this.tracks.set(e.id, trk);
      this.emit('NEW', trk);
      return;
    }

    // update with a fresh paint: position jump + smoothed velocity.
    // velocity comes from the RAW displacement since the LAST PAINT (blip), never
    // from the dead-reckoned est — est already contains vx·dt, so dividing that
    // displacement again converges to exactly half the true speed.
    const dtP = Math.max(0.5, now - trk.lastPaintT);
    const nvx = (e.x - trk.blip.x) / dtP;
    const nvy = (e.y - trk.blip.y) / dtP;

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
      // reclassify every paint — kinematics are all the console has
      const cls = classifyTrack(trk.est.speedMs, trk.est.altM, trk.headingChurnDeg, trk.paints);
      trk.autoClass = cls.label;
      trk.classConf = cls.conf;
    }

    const wasConfirmed = trk.state === 'TRACKED';
    if (!wasConfirmed && trk.paints >= 2) {
      trk.state = 'TRACKED';
      this.emit('CONFIRMED', trk);
      // link-list friendlies arrive identified once the track is solid
      if (e.def.datalinkId && trk.identity === 'UNK') {
        trk.identity = 'FND';
        trk.idSource = 'DATALINK';
        this.emit('DATALINK', trk, 'LINK-16 ID — FRIENDLY');
      }
    } else if (trk.state === 'COAST') {
      trk.state = 'TRACKED';
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

  /** Start an IFF interrogation on a track. Reply lands 1–2s later. */
  interrogate(tn: number): boolean {
    const trk = this.trackByTn(tn);
    if (!trk || trk.state === 'PLOT' || trk.iffPending) return false;
    trk.iffPending = true;
    this.pendingIff.push({ entityId: trk.entityId, atT: this.time + 1 + Math.random() });
    return true;
  }

  /**
   * Operator identity declaration. Hostile declarations are blocked under
   * WEAPONS HOLD, challenged when the commander's picture (datalink / ATO)
   * contradicts the call, and cautioned when the IFF facts contradict it.
   * Truth mismatches are tallied for the debrief either way.
   */
  declare(tn: number, identity: 'HOS' | 'FND'): boolean {
    const trk = this.trackByTn(tn);
    if (!trk || trk.state === 'PLOT') return false;
    const e = this.entityById(trk.entityId);
    if (!e) return false;

    if (identity === 'HOS') {
      const wcs = this.director?.wcs ?? 'TIGHT';
      if (wcs === 'HOLD') {
        if (this.onRadio) this.onRadio('NEGATIVE, SENTINEL — WEAPONS HOLD IN EFFECT. HOLD FIRE.');
        return false;
      }

      const wasFnd = trk.identity === 'FND';
      trk.identity = 'HOS';
      trk.idSource = 'OPERATOR';
      this.emit('DECL_HOS', trk);

      // the ECS flags a declaration that contradicts its own IFF facts
      if (trk.iffResult?.kind === 'C') {
        this.emit('VIOLATION_NOTE', trk, 'ID CAUTION — TRACK SHOWS MODE C PATTERN');
      }

      const truthProtected = e.def.friendly || e.def.neutral;
      if (truthProtected) {
        trk.violations++;
        this.score.idViolations.push({ tn: trk.tn, truth: e.def.callsign });
        if (e.def.datalinkId) {
          if (this.onRadio) this.onRadio(`SENTINEL, CONFIRM ${trk.tn} HOSTILE — WE SHOW THAT TRACK FRIENDLY ON LINK.`);
          this.emit('VIOLATION_NOTE', trk, 'ID VIOLATION LOGGED — TRACK IS LINK FRIENDLY');
        } else if (e.def.planCallsign) {
          if (this.onRadio) this.onRadio(`SENTINEL, ${trk.tn} CORRELATES ${e.def.planCallsign} ON THE ATO. CONFIRM.`);
          this.emit('VIOLATION_NOTE', trk, `ID VIOLATION LOGGED — CORRELATES ${e.def.planCallsign}`);
        }
        // off-plan neutrals: no one can refute it tonight — the debrief will
      } else if (!wasFnd && Math.random() < 0.5) {
        if (this.onRadio) this.onRadio(`GOOD COPY. TRACK ${trk.tn} HOSTILE, LOGGED.`);
      }
      return true;
    }

    // friendly declaration
    trk.identity = 'FND';
    trk.idSource = 'OPERATOR';
    this.emit('DECL_FND', trk);
    if (!e.def.friendly && !e.def.neutral) {
      this.score.clearMisses.push(trk.tn); // quietly cleared a real threat — debrief material
      if (Math.random() < 0.3 && this.onRadio) {
        this.onRadio(`COPY... WHAT IS YOUR BASIS ON ${trk.tn}, SENTINEL?`);
      }
    }
    return true;
  }

  /** Truth label for debugging overlays only. */
  truthLabel(e: Entity): string {
    return e.def.friendly ? `${e.def.callsign} FND` : `${e.def.callsign} ${CLASS_LABEL[e.def.class]}`;
  }
}
