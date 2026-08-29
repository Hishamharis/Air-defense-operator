import * as THREE from 'three';
import { World } from '../sim/world';
import { Track, MS_TO_KT } from '../sim/types';

/**
 * 3D tactical airspace view (dual-display right side).
 * Vector-wireframe aesthetic to match the console: dark void, glowing edges,
 * true-altitude track positions with ground stems, interceptor cones with
 * trails, expanding intercept bursts, rotating radar wedge on the ground grid.
 * Altitude is exaggerated 3x so the vertical picture reads at a glance.
 */

const ALT_SCALE = 3; // world units per km of altitude
const GROUND_KM = 100; // scope radius in km → world units

const COL = {
  friendly: 0x5d8fc4,
  hostile: 0xc4524d,
  unknown: 0xb8a06a,
  missile: 0x9be89b,
  grid: 0x2c313a,
  gridMajor: 0x3d434d,
  sweep: 0x7fd47f,
  accent: 0xc9b37e,
  terrain: 0x232830,
};

function makeLabel(text: string, color: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 48;
  const ctx = c.getContext('2d')!;
  ctx.font = 'bold 26px "Segoe UI", system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 24);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.scale.set(9, 3.4, 1);
  return spr;
}

/** Wireframe-ish jet: fuselage + swept wings, edges only. */
function makeJet(color: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, wireframe: false, transparent: true, opacity: 0.85 });
  const edge = new THREE.LineBasicMaterial({ color });

  const fus = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5, 6), mat);
  fus.rotation.x = Math.PI / 2; // point +Z (north)
  g.add(fus);

  const wingPts = [
    new THREE.Vector3(0, 0, 0.6), new THREE.Vector3(4.2, 0, -1.2),
    new THREE.Vector3(4.2, 0, -1.9), new THREE.Vector3(0, 0, -1.6),
    new THREE.Vector3(-4.2, 0, -1.9), new THREE.Vector3(-4.2, 0, -1.2),
  ];
  const wingGeo = new THREE.BufferGeometry().setFromPoints(wingPts);
  const wing = new THREE.LineLoop(wingGeo, edge);
  wing.position.z = -0.4;
  g.add(wing);

  const tailPts = [
    new THREE.Vector3(0, 0, -2.4), new THREE.Vector3(0, 1.8, -2.4),
    new THREE.Vector3(0, 1.8, -2.9), new THREE.Vector3(0, 0, -2.9),
  ];
  const tail = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(tailPts), edge);
  g.add(tail);
  return g;
}

/** Chunky airliner silhouette: fat fuselage + long wings + tailplane. */
function makeAirliner(color: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 11, 8), mat);
  fus.rotation.x = Math.PI / 2;
  g.add(fus);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), mat);
  nose.position.z = 5.5;
  g.add(nose);
  const edge = new THREE.LineBasicMaterial({ color });
  const wingPts = [
    new THREE.Vector3(0, 0, 0.5), new THREE.Vector3(7.5, -0.5, -2.2),
    new THREE.Vector3(7.5, -0.5, -3.0), new THREE.Vector3(0, 0, -2.2),
    new THREE.Vector3(-7.5, -0.5, -3.0), new THREE.Vector3(-7.5, -0.5, -2.2),
  ];
  g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(wingPts), edge));
  const tailPts = [
    new THREE.Vector3(0, 0, -4.5), new THREE.Vector3(0, 2.6, -5.3),
    new THREE.Vector3(0, 2.6, -5.8), new THREE.Vector3(0, 0, -5.5),
  ];
  g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(tailPts), edge));
  return g;
}

/** Ballistic reentry: sharp dart with flame streak. */
function makeTbm(color: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const dart = new THREE.Mesh(new THREE.ConeGeometry(0.8, 6, 5), mat);
  dart.rotation.x = Math.PI / 2;
  g.add(dart);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 4.5, 5),
    new THREE.MeshBasicMaterial({ color: 0xd8843c, transparent: true, opacity: 0.55 }),
  );
  flame.rotation.x = -Math.PI / 2;
  flame.position.z = -5;
  g.add(flame);
  return g;
}

/** Quad-drone: X frame with rotor discs. */
function makeDrone(color: number): THREE.Group {
  const g = new THREE.Group();
  const edge = new THREE.LineBasicMaterial({ color });
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
  const arm = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 0.5), mat);
  g.add(arm);
  const arm2 = arm.clone();
  arm2.rotation.y = Math.PI / 2;
  g.add(arm2);
  for (const [x, z] of [[2.2, 0], [-2.2, 0], [0, 2.2], [0, -2.2]] as const) {
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 13 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return new THREE.Vector3(x + Math.cos(a) * 1.1, 0.35, z + Math.sin(a) * 1.1);
        }),
      ),
      edge,
    );
    g.add(ring);
  }
  return g;
}

export class Tactical3D {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private trackObjs = new Map<number, { group: THREE.Group; label: THREE.Sprite; stem: THREE.Line; mesh: THREE.Group }>();
  private missileObjs = new Map<number, { cone: THREE.Mesh; trail: THREE.Line; pts: THREE.Vector3[] }>();
  private bursts: { mesh: THREE.Mesh; born: number; ring: THREE.Mesh }[] = [];
  private sweep: THREE.Mesh;
  private siteMark: THREE.Group;
  private raycaster = new THREE.Raycaster();
  private camYaw = Math.PI * 0.85;
  private camPitch = 0.62;
  private camDist = 150;
  private dragging = false;
  private lastMx = 0;
  private lastMy = 0;
  private disposed = false;

  selectedTn: number | null = null;
  onSelect: ((tn: number | null) => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private world: World,
    _rangeKm: number,
  ) {
    // WebGL can be unavailable (occluded panes, locked-down GPUs). The console
    // must survive that: fail soft, show a placeholder, keep the game running.
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      this.renderer.setClearColor(0x0a0c0f, 1);
    } catch {
      const note = document.createElement('div');
      note.className = 'tac-3d-off';
      note.textContent = '3D TACTICAL — GPU UNAVAILABLE';
      canvas.replaceWith(note);
    }
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0c0f, 260, 620);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.5, 1200);

    this.buildGround();
    this.sweep = this.buildSweep();
    this.siteMark = this.buildSite();
    this.scene.add(this.sweep, this.siteMark);

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas.parentElement!);
    this.resize();

    canvas.addEventListener('pointerdown', this.pdown);
    canvas.addEventListener('pointermove', this.pmove);
    canvas.addEventListener('pointerup', this.pup);
    canvas.addEventListener('pointerleave', this.pup);
    canvas.addEventListener('wheel', this.pwheel, { passive: false });
    canvas.addEventListener('click', this.pick);
  }

  private buildGround(): void {
    const R = GROUND_KM;
    // terrain disc
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(R, 72),
      new THREE.MeshBasicMaterial({ color: COL.terrain, transparent: true, opacity: 0.55 }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -0.02;
    this.scene.add(disc);

    // range rings 20/40/60/80/100
    for (let r = 20; r <= R; r += 20) {
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 97 }, (_, i) => {
            const a = (i / 96) * Math.PI * 2;
            return new THREE.Vector3(Math.sin(a) * r, 0, -Math.cos(a) * r);
          }),
        ),
        new THREE.LineBasicMaterial({ color: r % 40 === 0 ? COL.gridMajor : COL.grid, transparent: true, opacity: 0.8 }),
      );
      this.scene.add(ring);
    }
    // defended-area ring (8 km) in accent
    const inner = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 49 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          return new THREE.Vector3(Math.sin(a) * 8, 0, -Math.cos(a) * 8);
        }),
      ),
      new THREE.LineBasicMaterial({ color: COL.accent, transparent: true, opacity: 0.5 }),
    );
    this.scene.add(inner);

    // radial spokes every 30°
    for (let d = 0; d < 360; d += 30) {
      const a = (d * Math.PI) / 180;
      this.scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.sin(a) * 8, 0, -Math.cos(a) * 8),
          new THREE.Vector3(Math.sin(a) * R, 0, -Math.cos(a) * R),
        ]),
        new THREE.LineBasicMaterial({ color: COL.grid, transparent: true, opacity: 0.45 }),
      ));
    }

    // horizon glow ring at scope edge
    const rim = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 97 }, (_, i) => {
          const a = (i / 96) * Math.PI * 2;
          return new THREE.Vector3(Math.sin(a) * R, 0, -Math.cos(a) * R);
        }),
      ),
      new THREE.LineBasicMaterial({ color: 0x4a5261 }),
    );
    this.scene.add(rim);
  }

  private buildSweep(): THREE.Mesh {
    // rotating radar wedge on the deck
    const geo = new THREE.CircleGeometry(GROUND_KM, 24, 0, (30 * Math.PI) / 180);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: COL.sweep,
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.y = 0.02;
    return m;
  }

  private buildSite(): THREE.Group {
    const g = new THREE.Group();
    const edge = new THREE.LineBasicMaterial({ color: COL.accent });
    // battery: small pad + radar post + four launcher blocks
    const pad = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-2.5, 0, -2.5), new THREE.Vector3(2.5, 0, -2.5),
        new THREE.Vector3(2.5, 0, 2.5), new THREE.Vector3(-2.5, 0, 2.5),
      ]),
      edge,
    );
    g.add(pad);
    const post = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.6, 0),
      ]),
      edge,
    );
    g.add(post);
    for (const [x, z] of [[-1.6, 1.6], [1.6, 1.6], [-1.6, -1.6], [1.6, -1.6]] as const) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.6, 1.4),
        new THREE.MeshBasicMaterial({ color: COL.accent, transparent: true, opacity: 0.5 }),
      );
      box.position.set(x, 0.3, z);
      g.add(box);
    }
    return g;
  }

  private makeModelFor(trk: Track, color: number): THREE.Group {
    const e = this.world.entityById(trk.entityId);
    const kt = trk.est.speedMs * MS_TO_KT;
    if (!e) return makeJet(color);
    if (e.def.class === 'TBM') return makeTbm(color);
    if (e.def.class === 'DRONE') return makeDrone(color);
    if (e.def.class === 'AIRLINER') return makeAirliner(color);
    if (e.def.class === 'CRUISE') return makeJet(color);
    if (kt > 500) return makeJet(color);
    return makeDrone(color);
  }

  private trackColor(trk: Track): number {
    if (trk.identity === 'FND') return COL.friendly;
    if (trk.identity === 'HOS') return COL.hostile;
    return COL.unknown;
  }

  private hexCss(c: number): string {
    return `#${c.toString(16).padStart(6, '0')}`;
  }

  private syncTracks(): void {
    const seen = new Set<number>();
    for (const trk of this.world.tracks.values()) {
      if (trk.state === 'PLOT') continue;
      seen.add(trk.tn);
      const x = trk.est.x / 1000;
      const z = -trk.est.y / 1000;
      const y = Math.max(0.05, (trk.est.altM / 1000) * ALT_SCALE);

      let obj = this.trackObjs.get(trk.tn);
      if (!obj) {
        const color = this.trackColor(trk);
        const mesh = this.makeModelFor(trk, color);
        mesh.scale.setScalar(0.85);
        const label = makeLabel(String(trk.tn), this.hexCss(color));
        const stem = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }),
        );
        const group = new THREE.Group();
        group.add(mesh, label);
        this.scene.add(group, stem);
        obj = { group, label, stem, mesh };
        this.trackObjs.set(trk.tn, obj);
      }

      obj.group.position.set(x, y, z);
      obj.label.position.set(0, 4.5, 0);
      obj.stem.geometry.setFromPoints([
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, y, z),
      ]);
      // orient mesh along heading (yaw around Y)
      const hdg = (trk.est.headingDeg * Math.PI) / 180;
      obj.mesh.rotation.set(0, hdg, 0);
    }
    for (const [tn, obj] of this.trackObjs) {
      if (!seen.has(tn)) {
        this.scene.remove(obj.group, obj.stem);
        this.trackObjs.delete(tn);
      }
    }
  }

  private syncMissiles(): void {
    const seen = new Set<number>();
    for (const m of this.world.weapons.missiles) {
      seen.add(m.id);
      const x = m.x / 1000;
      const z = -m.y / 1000;
      const y = Math.max(0.05, (m.altM / 1000) * ALT_SCALE);
      let obj = this.missileObjs.get(m.id);
      if (!obj) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.55, 3.6, 6),
          new THREE.MeshBasicMaterial({ color: COL.missile }),
        );
        const pts = [new THREE.Vector3(x, y, z)];
        const trail = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: COL.missile, transparent: true, opacity: 0.4 }),
        );
        this.scene.add(cone, trail);
        obj = { cone, trail, pts };
        this.missileObjs.set(m.id, obj);
      }
      if (m.dead) continue;
      obj.cone.position.set(x, y, z);
      const dir = new THREE.Vector3(m.vx, 0, -m.vy).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      obj.cone.quaternion.copy(q);
      obj.pts.push(new THREE.Vector3(x, y, z));
      if (obj.pts.length > 90) obj.pts.shift();
      obj.trail.geometry.setFromPoints(obj.pts);
    }
    for (const [id, obj] of this.missileObjs) {
      if (!seen.has(id)) {
        this.scene.remove(obj.cone, obj.trail);
        this.missileObjs.delete(id);
      }
    }
  }

  /** Intercept flash: expanding sphere + ground ring. */
  addBurst(x: number, y: number, z: number, hostile: boolean): void {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 10),
      new THREE.MeshBasicMaterial({
        color: hostile ? 0xd06560 : 0xd9ecd9,
        transparent: true,
        opacity: 0.9,
      }),
    );
    mesh.position.set(x, y, z);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.12, 8, 40),
      new THREE.MeshBasicMaterial({ color: hostile ? 0xd06560 : 0xd9ecd9, transparent: true, opacity: 0.7 }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.05, z);
    this.scene.add(mesh, ring);
    this.bursts.push({ mesh, ring, born: performance.now() });
  }

  private stepBursts(): void {
    const now = performance.now();
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      const age = (now - b.born) / 1000;
      if (age > 2.4) {
        this.scene.remove(b.mesh, b.ring);
        this.bursts.splice(i, 1);
        continue;
      }
      const r = 1 + age * 26;
      b.mesh.scale.setScalar(r);
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - age * 0.38);
      b.ring.scale.setScalar(r * 1.2);
      (b.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - age * 0.3);
    }
  }

  private syncBurstsFromWorld(): void {
    // consume world flashes once each (keyed by position+time)
    for (const f of this.world.flashes) {
      const key = `${f.x},${f.y},${f.t}`;
      if (this.seenFlashKeys.has(key)) continue;
      this.seenFlashKeys.add(key);
      if (this.seenFlashKeys.size > 40) {
        const first = this.seenFlashKeys.keys().next();
        if (!first.done) this.seenFlashKeys.delete(first.value);
      }
      const hostile = f.kind === 'FRAT';
      const altGuess = f.kind === 'MISS' ? 400 : 900; // burst near deck for cruise-class intercepts
      this.addBurst(f.x / 1000, Math.max(0.3, (altGuess / 1000) * ALT_SCALE), -f.y / 1000, hostile);
    }
  }
  private seenFlashKeys = new Set<string>();

  selectTn(tn: number | null): void {
    this.selectedTn = tn;
  }

  private pdown = (ev: PointerEvent): void => {
    this.dragging = true;
    this.lastMx = ev.clientX;
    this.lastMy = ev.clientY;
    this.canvas.setPointerCapture(ev.pointerId);
  };

  private pmove = (ev: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = ev.clientX - this.lastMx;
    const dy = ev.clientY - this.lastMy;
    this.lastMx = ev.clientX;
    this.lastMy = ev.clientY;
    this.camYaw -= dx * 0.0055;
    this.camPitch = Math.max(0.12, Math.min(1.45, this.camPitch + dy * 0.004));
  };

  private pup = (): void => {
    this.dragging = false;
  };

  private pwheel = (ev: WheelEvent): void => {
    ev.preventDefault();
    this.camDist = Math.max(45, Math.min(420, this.camDist + ev.deltaY * 0.12));
  };

  private pick = (ev: MouseEvent): void => {
    if (!this.onSelect) return;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    let best: number | null = null;
    let bestD = 18;
    for (const [tn, obj] of this.trackObjs) {
      const wp = obj.group.position.clone();
      const d = wp.distanceTo(this.raycaster.ray.closestPointToPoint(wp, new THREE.Vector3()));
      if (d < bestD) {
        bestD = d;
        best = tn;
      }
    }
    if (best !== this.selectedTn) {
      this.selectedTn = best;
      this.onSelect(best);
    }
  };

  private resize(): void {
    if (!this.renderer) return;
    const box = this.canvas.parentElement!.getBoundingClientRect();
    const w = Math.max(40, box.width);
    const h = Math.max(40, box.height);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    if (this.disposed || !this.renderer) return;
    this.syncTracks();
    this.syncMissiles();
    this.syncBurstsFromWorld();
    this.stepBursts();

    // radar wedge rotation
    const brg = (this.world.sweepAngle * Math.PI) / 180;
    this.sweep.rotation.y = -brg;

    // camera orbit
    const cy = Math.sin(this.camPitch) * this.camDist;
    const cr = Math.cos(this.camPitch) * this.camDist;
    this.camera.position.set(
      Math.sin(this.camYaw) * cr,
      cy,
      -Math.cos(this.camYaw) * cr,
    );
    this.camera.lookAt(0, 6, 0);

    // selection glow ring under selected track
    this.siteMark.rotation.y = brg * 2;

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposed = true;
    this.renderer?.dispose();
  }
}
