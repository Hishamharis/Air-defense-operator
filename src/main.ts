import './style.css';
import { World } from './sim/world';
import { ENTITIES, MISSION } from './sim/scenarios/m1';
import { PPI } from './console/ppi';
import { TrackTable } from './console/trackTable';
import { bearingDeg } from './sim/world';

const DT = 1 / 50; // fixed sim timestep
const TIME_SCALES = [0, 1, 4, 16];

interface LogLine {
  t: number;
  text: string;
  cls: string;
}

const logs: LogLine[] = [];

function fmtZulu(seconds: number): string {
  const h = Math.floor(seconds / 3600) % 24;
  const m = Math.floor(seconds / 60) % 60;
  const s = Math.floor(seconds) % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function log(text: string, cls = ''): void {
  logs.push({ t: world.time, text, cls });
  if (logs.length > 60) logs.shift();
  const body = document.getElementById('log-body')!;
  body.innerHTML = logs
    .map(
      l =>
        `<div class="log-line ${l.cls}"><span class="lt">${fmtZulu(MISSION.startSeconds + l.t)}Z</span>${l.text}</div>`,
    )
    .join('');
  body.scrollTop = body.scrollHeight;
}

// ----- boot -----

const world = new World(ENTITIES, info => {
  const brg = Math.round(bearingDeg(info.track.blip.x, info.track.blip.y));
  const rng = Math.round(Math.hypot(info.track.blip.x, info.track.blip.y) / 1000);
  log(`NEW TRACK ${info.tn} BRG ${String(brg).padStart(3, '0')} RNG ${rng} KM`, 'hl');
});

const ppi = new PPI(document.getElementById('ppi') as HTMLCanvasElement, world, MISSION.rangeKm * 1000);
const table = new TrackTable(world);

function select(tn: number | null): void {
  ppi.selectTn(tn);
  table.selectedTn = tn;
  table.update(trk => ppi.brgRng(trk));
}
ppi.onSelect = select;
table.onSelect = select;

document.getElementById('mission-name')!.textContent = MISSION.name;

// ----- time controls -----

let timeScaleIdx = 1; // 1×

// dev/testing hook: ?t=0|1|4|16 sets the initial time scale
{
  const t = new URLSearchParams(location.search).get('t');
  if (t === '0' || t === '1' || t === '4' || t === '16') {
    timeScaleIdx = [0, 1, 4, 16].indexOf(Number(t));
  }
}

function setTimeScale(idx: number): void {
  timeScaleIdx = idx;
  for (const [i, id] of ['btn-pause', 'btn-1x', 'btn-4x', 'btn-16x'].entries()) {
    document.getElementById(id)!.classList.toggle('active', i === idx);
  }
}
document.getElementById('btn-pause')!.addEventListener('click', () => setTimeScale(0));
document.getElementById('btn-1x')!.addEventListener('click', () => setTimeScale(1));
document.getElementById('btn-4x')!.addEventListener('click', () => setTimeScale(2));
document.getElementById('btn-16x')!.addEventListener('click', () => setTimeScale(3));
setTimeScale(timeScaleIdx); // reflect URL-param initial state on the buttons

window.addEventListener('keydown', ev => {
  if (ev.code === 'Space') {
    ev.preventDefault();
    setTimeScale(timeScaleIdx === 0 ? 1 : 0);
  } else if (ev.key === '1') setTimeScale(1);
  else if (ev.key === '2') setTimeScale(2);
  else if (ev.key === '3') setTimeScale(3);
  else if (ev.key === 't' || ev.key === 'T') ppi.showTruth = !ppi.showTruth;
});

// ----- main loop -----

const zuluEl = document.getElementById('zulu')!;
let acc = 0;
let lastDom = 0;

log('ECS POWER-UP — BIT IN PROGRESS');
log('RADAR SET — SURVEILLANCE MODE — 15 RPM');
log('SYSTEM READY — MONITORING');

// surface runtime errors in the log panel instead of silently killing the loop
window.addEventListener('error', ev => {
  log(`RUNTIME ERROR: ${ev.message}`, 'err');
});
let lastErrLog = 0;
function reportError(tag: string, err: unknown): void {
  if (performance.now() - lastErrLog > 1000) {
    lastErrLog = performance.now();
    log(`${tag}: ${err instanceof Error ? err.message : String(err)}`, 'err');
  }
}

/**
 * Sim + DOM driver runs on setInterval so the world keeps turning when the tab
 * is hidden (browsers pause requestAnimationFrame on hidden pages). Rendering
 * stays on RAF and simply resumes when visible again.
 */
function stepSim(dtReal: number): void {
  const scale = TIME_SCALES[timeScaleIdx];
  if (scale > 0) {
    acc += dtReal * scale;
    let steps = 0;
    while (acc >= DT && steps < 9000) {
      const a0 = world.sweepAngle;
      world.step(DT);
      const a1 = world.sweepAngle;
      const blips = world.paintCrossed(a0, a1, MISSION.rangeKm * 1000);
      if (blips.length) {
        ppi.stamp(blips.map(b => b.blip));
      }
      acc -= DT;
      steps++;
    }
    if (steps >= 9000) acc = 0; // dropped time after long suspension
  }
}

let lastTick = performance.now();
setInterval(() => {
  const now = performance.now();
  // generous cap: lets a throttled (hidden-tab) timer catch the sim back up to wall time
  const dtReal = Math.min(10, (now - lastTick) / 1000);
  lastTick = now;
  try {
    stepSim(dtReal);
  } catch (err) {
    reportError('SIM ERROR', err);
  }
  if (now - lastDom > 250) {
    lastDom = now;
    zuluEl.textContent = `${fmtZulu(MISSION.startSeconds + world.time)}Z`;
    table.update(trk => ppi.brgRng(trk));
  }
}, 100);

let lastRender = performance.now();
function renderLoop(now: number): void {
  const dtReal = Math.min(0.1, (now - lastRender) / 1000);
  lastRender = now;
  try {
    ppi.render(dtReal);
  } catch (err) {
    reportError('RENDER ERROR', err);
  }
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

