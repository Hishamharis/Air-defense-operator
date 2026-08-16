import { Entity } from './types';

export type Doctrine = 'SS' | 'SLS'; // shoot-shoot (ripple 2) / shoot-look-shoot (single)
export type FireUnitState = 'READY' | 'RELOADING';

export interface FireUnit {
  id: number;
  name: string;
  roundsMax: number;
  rounds: number;
  state: FireUnitState;
  reloadEndsT: number;
}

export type MissilePhase = 'BOOST' | 'SUSTAIN' | 'COAST';

export interface Missile {
  id: number;
  tn: number; // track number engaged (for display/abort)
  targetEntityId: number;
  x: number;
  y: number;
  altM: number;
  vx: number;
  vy: number;
  speedMs: number;
  launchedT: number;
  phase: MissilePhase;
  dead: boolean;
  deadReason?: 'KILL' | 'MISS' | 'SELF-DESTRUCT' | 'ENERGY' | 'TARGET-LOST';
}

export interface InterceptOutcome {
  missile: Missile;
  target: Entity;
  killed: boolean;
  pk: number;
  x: number;
  y: number;
}

// PAC-3-flavored performance, compressed for a 100 km scope
const V_MAX = 900; // m/s
const BOOST_ACCEL = 220; // m/s²
const SUSTAIN_S = 6;
const DRAG_K = 1.6e-5; // v² deceleration coefficient during coast
const TURN_ACCEL = 400; // m/s² lateral (~40 g)
const FUZE_RADIUS = 260; // m 2D proximity
const FUZE_ALT = 320; // m vertical gate

export class WeaponsSystem {
  units: FireUnit[];
  missiles: Missile[] = [];
  doctrine: Doctrine = 'SLS';
  autoEngage = false;
  readonly channelsMax = 6;
  readonly reloadS = 480; // compressed ~8 min per launcher

  private nextMissileId = 1;

  constructor(unitCount = 4, roundsPer = 4) {
    this.units = Array.from({ length: unitCount }, (_, i) => ({
      id: i + 1,
      name: `LNCHR ${i + 1}`,
      roundsMax: roundsPer,
      rounds: roundsPer,
      state: 'READY',
      reloadEndsT: 0,
    }));
  }

  get channelsUsed(): number {
    return this.missiles.filter(m => !m.dead).length;
  }

  roundsReady(): number {
    return this.units.reduce((n, u) => n + (u.state === 'READY' ? u.rounds : 0), 0);
  }

  /** Launch n missiles at a target. Returns missiles launched (empty on failure). */
  launch(entityId: number, tn: number, count: number, t: number, target: Entity): Missile[] {
    const out: Missile[] = [];
    for (let i = 0; i < count; i++) {
      if (this.channelsUsed >= this.channelsMax) break;
      const unit = this.units.find(u => u.state === 'READY' && u.rounds > 0);
      if (!unit) break;
      unit.rounds--;
      if (unit.rounds === 0) {
        unit.state = 'RELOADING';
        unit.reloadEndsT = t + this.reloadS;
      }
      // off toward the lead point, modest eject speed, boost does the rest
      const d = Math.hypot(target.x, target.y) || 1;
      const dirx = target.x / d;
      const diry = target.y / d;
      const m: Missile = {
        id: this.nextMissileId++,
        tn,
        targetEntityId: entityId,
        x: dirx * 500,
        y: diry * 500,
        altM: 30,
        vx: dirx * 250,
        vy: diry * 250,
        speedMs: 250,
        launchedT: t,
        phase: 'BOOST',
        dead: false,
      };
      this.missiles.push(m);
      out.push(m);
    }
    return out;
  }

  /** Operator self-destruct: kill all missiles assigned to a track. */
  abort(tn: number): number {
    let n = 0;
    for (const m of this.missiles) {
      if (m.tn === tn && !m.dead) {
        m.dead = true;
        m.deadReason = 'SELF-DESTRUCT';
        n++;
      }
    }
    return n;
  }

  /** Advance all missiles: guidance, energy, fuzing. Returns intercept outcomes. */
  step(dt: number, t: number, entities: Entity[]): InterceptOutcome[] {
    // reloads
    for (const u of this.units) {
      if (u.state === 'RELOADING' && t >= u.reloadEndsT) {
        u.rounds = u.roundsMax;
        u.state = 'READY';
      }
    }

    const outcomes: InterceptOutcome[] = [];
    for (const m of this.missiles) {
      if (m.dead) continue;
      const target = entities.find(e => e.id === m.targetEntityId && e.spawned);
      if (!target) {
        m.dead = true;
        m.deadReason = 'TARGET-LOST';
        continue;
      }

      // energy phase
      if (m.phase === 'BOOST') {
        m.speedMs = Math.min(V_MAX, m.speedMs + BOOST_ACCEL * dt);
        if (m.speedMs >= V_MAX) m.phase = 'SUSTAIN';
      } else if (m.phase === 'SUSTAIN') {
        m.speedMs = V_MAX;
        if (t - m.launchedT > 3 + SUSTAIN_S) m.phase = 'COAST';
      } else {
        m.speedMs -= m.speedMs * m.speedMs * DRAG_K * dt;
        if (m.speedMs < 180) {
          m.dead = true;
          m.deadReason = 'ENERGY';
          continue;
        }
      }

      // proportional navigation toward the lead point
      const dx = target.x - m.x;
      const dy = target.y - m.y;
      const dist = Math.hypot(dx, dy);
      const closing = Math.max(200, m.speedMs - (dx * target.speedMs * Math.sin(target.headingDeg * Math.PI / 180) +
        dy * target.speedMs * Math.cos(target.headingDeg * Math.PI / 180)) / (dist || 1));
      const tti = dist / closing;
      const lx = target.x + Math.sin(target.headingDeg * Math.PI / 180) * target.speedMs * tti;
      const ly = target.y + Math.cos(target.headingDeg * Math.PI / 180) * target.speedMs * tti;
      const wantX = lx - m.x;
      const wantY = ly - m.y;
      const wantLen = Math.hypot(wantX, wantY) || 1;
      const curX = m.vx / (m.speedMs || 1);
      const curY = m.vy / (m.speedMs || 1);
      const maxTurn = (TURN_ACCEL / (m.speedMs || 1)) * dt;
      let dX = wantX / wantLen - curX;
      let dY = wantY / wantLen - curY;
      const dLen = Math.hypot(dX, dY);
      if (dLen > maxTurn) {
        dX = (dX / dLen) * maxTurn;
        dY = (dY / dLen) * maxTurn;
      }
      const nx = curX + dX;
      const ny = curY + dY;
      const nLen = Math.hypot(nx, ny) || 1;
      m.vx = (nx / nLen) * m.speedMs;
      m.vy = (ny / nLen) * m.speedMs;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.altM += (target.altM - m.altM) * Math.min(1, dt * 0.5);

      // fuze — planar-only against TBMs: a steep terminal dive makes a vertical
      // gate meaningless, the intercept is decided in the terminal envelope
      const planar = Math.hypot(target.x - m.x, target.y - m.y);
      const altOk = target.def.ballistic ? true : Math.abs(target.altM - m.altM) < FUZE_ALT;
      if (planar < FUZE_RADIUS && altOk) {
        const pk = this.pkAtIntercept(m, target);
        const killed = Math.random() < pk;
        m.dead = true;
        m.deadReason = killed ? 'KILL' : 'MISS';
        outcomes.push({ missile: m, target, killed, pk, x: target.x, y: target.y });
      }
    }

    // graveyard keeping
    if (this.missiles.length > 40) {
      this.missiles = this.missiles.filter(m => !m.dead);
    }
    return outcomes;
  }

  /** Energy + geometry driven single-shot probability of kill. */
  pkAtIntercept(m: Missile, target: Entity): number {
    const energy = Math.max(0, Math.min(1, (m.speedMs - 250) / (V_MAX - 250)));
    const energyFactor = 0.35 + 0.65 * energy;
    // tail-chases punish fast movers; slow targets are geometry-insensitive
    const mv = { x: m.vx / (m.speedMs || 1), y: m.vy / (m.speedMs || 1) };
    const tv = {
      x: Math.sin(target.headingDeg * Math.PI / 180),
      y: Math.cos(target.headingDeg * Math.PI / 180),
    };
    const dot = mv.x * tv.x + mv.y * tv.y;
    const geoFactor = dot > 0.5 ? 0.65 : dot < -0.3 ? 1.0 : 0.9;
    const geoEff = 1 - (1 - geoFactor) * Math.min(1, target.speedMs / 250);
    return Math.max(0.05, Math.min(0.95, 0.85 * energyFactor * geoEff));
  }

  /** Pre-launch solution estimate for a target (displayed to the operator). */
  estimatePk(target: Entity): number {
    const dist = Math.hypot(target.x, target.y);
    const tti = dist / (V_MAX * 0.8);
    const speedAtTti = Math.max(180, V_MAX - Math.max(0, tti - 3 - SUSTAIN_S) * V_MAX * V_MAX * DRAG_K * 0.55);
    const fake: Missile = {
      id: -1, tn: 0, targetEntityId: target.id,
      x: 0, y: 0, altM: 0,
      vx: target.x, vy: target.y,
      speedMs: speedAtTti,
      launchedT: 0, phase: 'COAST', dead: false,
    };
    return this.pkAtIntercept(fake, target);
  }
}
