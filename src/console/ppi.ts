import { bearingDeg, World } from '../sim/world';
import { Track } from '../sim/types';

interface Palette {
  blip: string;
  ring: string;
  tick: string;
  sweep: string;
  friendly: string;
  unknown: string;
  hostile: string;
  label: string;
  accent: string;
}

const PAL: Palette = {
  blip: '150, 220, 150',
  ring: '120, 140, 120',
  tick: '160, 175, 160',
  sweep: '170, 235, 170',
  friendly: '#5d8fc4',
  unknown: '#b8a06a',
  hostile: '#a8433f',
  label: '200, 205, 210',
  accent: '#c9b37e',
};

/**
 * Plan Position Indicator: rotating sweep, phosphor-persistence blip buffer and
 * APP-6-inspired track symbology. Blips are stamped only when the sweep crosses
 * a track's bearing (world.paintCrossed), symbols sit at the last painted position.
 */
export class PPI {
  private ctx: CanvasRenderingContext2D;
  private persist: HTMLCanvasElement;
  private pctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private cssW = 0;
  private cssH = 0;
  private cx = 0;
  private cy = 0;
  private radius = 0;

  selectedTn: number | null = null;
  showTruth = false;
  onSelect: ((tn: number | null) => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private world: World,
    private rangeM: number,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.persist = document.createElement('canvas');
    this.pctx = this.persist.getContext('2d')!;
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas.parentElement!);
    this.resize();
    canvas.addEventListener('click', ev => this.handleClick(ev));
  }

  private resize() {
    const box = this.canvas.parentElement!.getBoundingClientRect();
    this.cssW = Math.max(50, box.width - 12);
    this.cssH = Math.max(50, box.height - 12);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.cssW * dpr);
    this.canvas.height = Math.round(this.cssH * dpr);
    this.canvas.style.width = `${this.cssW}px`;
    this.canvas.style.height = `${this.cssH}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.persist.width = this.canvas.width;
    this.persist.height = this.canvas.height;
    this.pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = this.cssW;
    this.h = this.cssH;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.radius = Math.min(this.w, this.h) / 2 - 34;
  }

  /** world meters → scope screen px */
  private toScreen(x: number, y: number): [number, number] {
    const s = this.radius / this.rangeM;
    return [this.cx + x * s, this.cy - y * s];
  }

  /** Stamp fresh blips (from world.paintCrossed) into the persistence buffer. */
  stamp(blips: { x: number; y: number; brightness: number }[]): void {
    for (const b of blips) {
      const [sx, sy] = this.toScreen(b.x, b.y);
      if (Math.hypot(sx - this.cx, sy - this.cy) > this.radius + 4) continue;
      const r = 3 + 3 * b.brightness;
      const g = this.pctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(${PAL.blip}, ${0.75 * b.brightness + 0.2})`);
      g.addColorStop(1, `rgba(${PAL.blip}, 0)`);
      this.pctx.fillStyle = g;
      this.pctx.beginPath();
      this.pctx.arc(sx, sy, r, 0, Math.PI * 2);
      this.pctx.fill();
    }
  }

  /** Fade the persistence buffer (phosphor decay), tied to real time. */
  private decay(dtReal: number): void {
    this.pctx.globalCompositeOperation = 'destination-out';
    this.pctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.5, 0.55 * dtReal)})`;
    this.pctx.fillRect(0, 0, this.w, this.h);
    this.pctx.globalCompositeOperation = 'source-over';
  }

  /** bearing (0=N, cw) → canvas angle (0=+x, cw) */
  private static bearingToCanvas(deg: number): number {
    return ((deg - 90) * Math.PI) / 180;
  }

  render(dtReal: number): void {
    this.decay(dtReal);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // scope background disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius + 6, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#0b0e0b';
    ctx.fillRect(0, 0, this.w, this.h);
    const vg = ctx.createRadialGradient(this.cx, this.cy, this.radius * 0.2, this.cx, this.cy, this.radius + 6);
    vg.addColorStop(0, 'rgba(30, 42, 30, 0.25)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, this.w, this.h);

    // range rings
    ctx.strokeStyle = `rgba(${PAL.ring}, 0.16)`;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, (this.radius * i) / 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    // cardinal cross
    ctx.beginPath();
    ctx.moveTo(this.cx, this.cy - this.radius);
    ctx.lineTo(this.cx, this.cy + this.radius);
    ctx.moveTo(this.cx - this.radius, this.cy);
    ctx.lineTo(this.cx + this.radius, this.cy);
    ctx.stroke();

    // persistence layer
    ctx.drawImage(this.persist, 0, 0, this.w, this.h);

    // sweep wedge
    const brg = this.world.sweepAngle;
    const a = PPI.bearingToCanvas(brg);
    const wedge = 26 * Math.PI / 180;
    const grad = ctx.createConicGradient
      ? ctx.createConicGradient(a - wedge, this.cx, this.cy)
      : null;
    if (grad) {
      grad.addColorStop(0, `rgba(${PAL.sweep}, 0)`);
      grad.addColorStop(0.9, `rgba(${PAL.sweep}, 0.10)`);
      grad.addColorStop(1, `rgba(${PAL.sweep}, 0.22)`);
      ctx.beginPath();
      ctx.moveTo(this.cx, this.cy);
      ctx.arc(this.cx, this.cy, this.radius + 4, a - wedge, a);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }
    // leading edge
    ctx.strokeStyle = `rgba(${PAL.sweep}, 0.65)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.cx, this.cy);
    ctx.lineTo(this.cx + Math.cos(a) * (this.radius + 4), this.cy + Math.sin(a) * (this.radius + 4));
    ctx.stroke();

    ctx.restore();

    // outer rim + bearing ticks + labels
    ctx.strokeStyle = `rgba(${PAL.ring}, 0.35)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius + 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '10px system-ui';
    ctx.fillStyle = `rgba(${PAL.tick}, 0.55)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let d = 0; d < 360; d += 10) {
      const ca = PPI.bearingToCanvas(d);
      const major = d % 30 === 0;
      const r0 = this.radius + 8;
      const r1 = r0 + (major ? 7 : 4);
      ctx.strokeStyle = `rgba(${PAL.tick}, ${major ? 0.55 : 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.cx + Math.cos(ca) * r0, this.cy + Math.sin(ca) * r0);
      ctx.lineTo(this.cx + Math.cos(ca) * r1, this.cy + Math.sin(ca) * r1);
      ctx.stroke();
      if (major) {
        const rl = r1 + 12;
        ctx.fillText(String(d).padStart(3, '0'), this.cx + Math.cos(ca) * rl, this.cy + Math.sin(ca) * rl);
      }
    }

    // range labels along the east axis
    ctx.fillStyle = `rgba(${PAL.tick}, 0.4)`;
    ctx.textAlign = 'left';
    for (let i = 1; i <= 5; i++) {
      ctx.fillText(String(i * 20), this.cx + (this.radius * i) / 5 + 4, this.cy - 6);
    }

    // truth overlay (dev / debrief camera)
    if (this.showTruth) this.drawTruth(ctx);

    // track symbology at last painted position
    for (const trk of this.world.tracks.values()) {
      this.drawSymbol(ctx, trk);
    }

    // site marker
    ctx.strokeStyle = `rgba(${PAL.accent}, 0.8)`;
    ctx.lineWidth = 1.2;
    const sm = 5;
    ctx.beginPath();
    ctx.moveTo(this.cx - sm, this.cy);
    ctx.lineTo(this.cx + sm, this.cy);
    ctx.moveTo(this.cx, this.cy - sm);
    ctx.lineTo(this.cx, this.cy + sm);
    ctx.stroke();
  }

  private drawSymbol(ctx: CanvasRenderingContext2D, trk: Track): void {
    const e = this.world.entityById(trk.entityId);
    if (!e) return;
    const [sx, sy] = this.toScreen(trk.blip.x, trk.blip.y);
    if (Math.hypot(sx - this.cx, sy - this.cy) > this.radius) return;

    // M1: friendlies arrive pre-identified (as if datalink); everything else unknown.
    // M3 replaces this with the real IFF/identification gameplay.
    const color = e.def.friendly ? PAL.friendly : PAL.unknown;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;

    // velocity leader from last blip along current known heading
    const lead = 10 + (trk.blip.brightness * 4);
    const ha = ((e.headingDeg - 90) * Math.PI) / 180;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ha) * lead, sy + Math.sin(ha) * lead);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (e.def.friendly) {
      // friendly: circle (air track "dome" flavor)
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // unknown: quatrefoil approximation (4 petal arcs)
      for (let k = 0; k < 4; k++) {
        const pa = ((k * 90 - 90) * Math.PI) / 180;
        const ox = sx + Math.cos(pa) * 3.4;
        const oy = sy + Math.sin(pa) * 3.4;
        ctx.beginPath();
        ctx.arc(ox, oy, 3.4, pa - Math.PI / 2, pa + Math.PI / 2);
        ctx.stroke();
      }
    }

    // selected highlight
    if (this.selectedTn === trk.tn) {
      ctx.strokeStyle = PAL.accent;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(sx, sy, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // TN label
    ctx.fillStyle = `rgba(${PAL.label}, 0.75)`;
    ctx.font = '9px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(trk.tn), sx + 10, sy + 8);

    ctx.restore();
  }

  private drawTruth(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = '9px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const e of this.world.entities) {
      if (!e.spawned) continue;
      const [sx, sy] = this.toScreen(e.x, e.y);
      if (Math.hypot(sx - this.cx, sy - this.cy) > this.radius) continue;
      ctx.strokeStyle = e.def.friendly ? '#4a7ca8' : '#a8433f';
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 3, sy - 3);
      ctx.lineTo(sx + 3, sy + 3);
      ctx.moveTo(sx + 3, sy - 3);
      ctx.lineTo(sx - 3, sy + 3);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle as string;
      ctx.fillText(e.def.callsign, sx + 7, sy - 7);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private handleClick(ev: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left;
    const py = ev.clientY - rect.top;
    let best: number | null = null;
    let bestD = 20;
    for (const trk of this.world.tracks.values()) {
      const [sx, sy] = this.toScreen(trk.blip.x, trk.blip.y);
      const d = Math.hypot(px - sx, py - sy);
      if (d < bestD) {
        bestD = d;
        best = trk.tn;
      }
    }
    if (best !== this.selectedTn) {
      this.selectedTn = best;
      if (this.onSelect) this.onSelect(best);
    }
  }

  selectTn(tn: number | null): void {
    this.selectedTn = tn;
  }

  /** bearing/range readout of a track's last blip */
  brgRng(trk: Track): { brg: number; rngKm: number } {
    return {
      brg: Math.round(bearingDeg(trk.blip.x, trk.blip.y)),
      rngKm: Math.round(Math.hypot(trk.blip.x, trk.blip.y) / 1000),
    };
  }
}
