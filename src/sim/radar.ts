/**
 * Radar detection model (M2).
 *
 * Detection range for a target is the minimum of:
 *  - instrument range (scope limit),
 *  - radar horizon  d_km ≈ 4.12·(√h_radar + √h_target)  (4/3 Earth refraction),
 *  - SNR range from the radar equation  R ∝ σ^(1/4), referenced so a 3 m² target
 *    is detectable at instrument range.
 *
 * A marginal band in the outer 20% of effective range makes weak/distant targets
 * flicker: sometimes painted, sometimes missed. Sector focus trades coverage for
 * depth; EMCON SILENT stops radiating entirely (with a warm-up delay on return).
 */

export type EmconMode = 'SURVEILLANCE' | 'SECTOR' | 'SILENT';

export interface WxCell {
  x: number; // m east
  y: number; // m north
  radiusM: number;
}

export function angleDiffDeg(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export interface Detection {
  detected: boolean;
  brightness: number; // 0..1
}

export class RadarModel {
  mode: EmconMode = 'SURVEILLANCE';
  sectorBearing = 0;
  readonly sectorHalfWidthDeg = 30;
  private warmupRemaining = 0;

  constructor(
    public readonly instrumentKm: number,
    public readonly radarHeightM: number,
    public readonly warmupS = 3,
  ) {}

  setMode(mode: EmconMode): boolean {
    if (mode === this.mode) return false;
    if (this.mode === 'SILENT' && mode !== 'SILENT') this.warmupRemaining = this.warmupS;
    this.mode = mode;
    return true;
  }

  tick(dt: number): void {
    this.warmupRemaining = Math.max(0, this.warmupRemaining - dt);
  }

  get warming(): boolean {
    return this.warmupRemaining > 0;
  }

  get radiating(): boolean {
    return this.mode !== 'SILENT' && !this.warming;
  }

  horizonKm(targetAltM: number): number {
    return 4.12 * (Math.sqrt(this.radarHeightM) + Math.sqrt(Math.max(1, targetAltM)));
  }

  /**
   * SNR range from the radar equation (R ∝ σ^(1/4)), referenced so a 3 m²
   * target is solid at instrument range (reference sits 30% beyond it).
   */
  snrKm(rcs: number): number {
    return this.instrumentKm * 1.3 * Math.pow(rcs / 3, 0.25);
  }

  inWxCell(x: number, y: number, cells: WxCell[]): boolean {
    return cells.some(c => Math.hypot(x - c.x, y - c.y) < c.radiusM);
  }

  /**
   * Physics-limited detection range (km): signal (SNR) vs geometry (horizon),
   * degraded by sector mode and weather. The instrument range is a hard scope
   * edge on top of this, but does NOT make strong targets marginal — a big
   * aircraft near the scope edge stays solid.
   */
  physicalRangeKm(x: number, y: number, altM: number, rcs: number, wx: WxCell[]): number {
    if (!this.radiating) return 0;
    let r = Math.min(this.snrKm(rcs), this.horizonKm(altM));
    if (this.mode === 'SECTOR') {
      const brg = (Math.atan2(x, y) * 180) / Math.PI;
      const off = Math.abs(angleDiffDeg(brg, this.sectorBearing));
      r *= off <= this.sectorHalfWidthDeg ? 1.4 : 0.4;
    }
    if (this.inWxCell(x, y, wx)) r *= 0.7;
    return r;
  }

  /**
   * Roll a detection attempt. Inside 88% of the physics-limited range targets
   * are solid; beyond that, probability ramps down — the flicker zone where
   * weak or horizon-grazing contacts live.
   */
  detect(x: number, y: number, altM: number, rcs: number, wx: WxCell[]): Detection {
    const rngKm = Math.hypot(x, y) / 1000;
    const physKm = this.physicalRangeKm(x, y, altM, rcs, wx);
    if (physKm <= 0 || rngKm > Math.min(this.instrumentKm, physKm)) {
      return { detected: false, brightness: 0 };
    }

    let p = 0.95;
    if (rngKm > physKm * 0.88) {
      p = Math.max(0.25, 0.95 * (1 - ((rngKm / physKm - 0.88) / 0.12) * 0.75));
    }
    if (Math.random() > p) return { detected: false, brightness: 0 };

    const closeness = 1 - Math.min(1, rngKm / physKm);
    const brightness = Math.min(1, 0.25 + 0.55 * closeness + 0.2 * Math.min(1, rcs / 3));
    return { detected: true, brightness };
  }
}
