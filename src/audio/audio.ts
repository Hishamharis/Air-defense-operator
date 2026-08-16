/**
 * Procedural console audio (Web Audio synth — no assets).
 * Restrained by design: quiet ambient bed, tiered alarms, tactile chirps.
 * Browsers require a user gesture before audio: call unlock() from a click.
 */
export class ConsoleAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private humGain: GainNode | null = null;
  private lastKlaxon = new Map<string, number>();
  enabled = true;

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.startHum();
    } catch {
      this.ctx = null; // audio unsupported — the console stays silent
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.5 : 0;
  }

  private startHum(): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 62; // sweep-room hum
    const g = this.ctx.createGain();
    g.gain.value = 0.012;
    osc.connect(g).connect(this.master);
    osc.start();
    this.humGain = g;
  }

  /** Radiating hum lowers while EMCON silent — the room gets quieter, not louder. */
  setRadiating(on: boolean): void {
    if (this.humGain && this.ctx) {
      this.humGain.gain.setTargetAtTime(on ? 0.012 : 0.004, this.ctx.currentTime, 0.4);
    }
  }

  private tone(freq: number, durS: number, type: OscillatorType, vol: number, sweepTo?: number): void {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweepTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t + durS);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durS);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + durS + 0.05);
  }

  private noise(durS: number, vol: number, freq: number, q = 1): void {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * durS));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = freq;
    filt.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durS);
    src.connect(filt).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + durS);
  }

  /** Rate-limited so saturation raids don't become noise wall. */
  private gate(key: string, minGapS: number): boolean {
    const now = performance.now() / 1000;
    const last = this.lastKlaxon.get(key) ?? -999;
    if (now - last < minGapS) return false;
    this.lastKlaxon.set(key, now);
    return true;
  }

  newTrack(): void {
    if (!this.gate('new', 1.2)) return;
    this.tone(880, 0.09, 'square', 0.05);
    this.tone(880, 0.09, 'square', 0.05);
  }

  tbmAlert(): void {
    if (!this.gate('tbm', 2)) return;
    this.tone(620, 0.14, 'square', 0.09, 980);
    this.tone(620, 0.14, 'square', 0.09, 980);
    this.tone(620, 0.14, 'square', 0.09, 980);
  }

  iffChirp(): void {
    this.tone(1310, 0.05, 'sine', 0.06);
    this.tone(1720, 0.05, 'sine', 0.05);
  }

  launch(): void {
    if (!this.gate('launch', 0.6)) return;
    this.noise(1.4, 0.22, 500, 0.7); // booster roar
    this.tone(180, 1.2, 'sawtooth', 0.05, 60);
  }

  interceptKill(): void {
    this.noise(0.35, 0.3, 1400, 0.6); // thud
    this.tone(520, 0.5, 'sine', 0.08, 260);
  }

  interceptMiss(): void {
    this.noise(0.18, 0.12, 900, 0.8);
  }

  leaker(): void {
    if (!this.gate('leaker', 3)) return;
    this.tone(300, 0.5, 'sawtooth', 0.1, 120);
    this.tone(300, 0.5, 'sawtooth', 0.1, 120);
  }

  radioSquelch(): void {
    if (!this.gate('radio', 0.5)) return;
    this.noise(0.06, 0.05, 2600, 2);
  }

  violation(): void {
    this.tone(240, 0.4, 'square', 0.07, 180);
  }

  uiClick(): void {
    this.tone(740, 0.04, 'sine', 0.04);
  }
}
