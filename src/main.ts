import './style.css';
import { World, bearingDeg } from './sim/world';
import { RadarModel, EmconMode } from './sim/radar';
import { ENTITIES as M1_ENTITIES, MISSION as M1 } from './sim/scenarios/m1';
import { ENTITIES as M2_ENTITIES, MISSION as M2, WX_CELLS as M2_WX } from './sim/scenarios/m2';
import { PPI } from './console/ppi';
import { TrackTable } from './console/trackTable';

const DT = 1 / 50; // fixed sim timestep
const TIME_SCALES = [0, 1, 4, 16];

// ----- scenario select (?sc=m1|m2) -----

const params = new URLSearchParams(location.search);
const useM1 = params.get('sc') === 'm1';
const ENTITIES = useM1 ? M1_ENTITIES : M2_ENTITIES;
const MISSION = useM1 ? M1 : M2;
const WX_CELLS = useM1 ? [] : M2_WX;

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

const logBody = document.getElementById('log-body')!;

function log(text: string, cls = ''): void {
  logs.push({ t: world.time, text, cls });
  if (logs.length > 80) logs.shift();
  logBody.innerHTML = logs
    .map(
      l =>
        `<div class="log-line ${l.cls}"><span class="lt">${fmtZulu(MISSION.startSeconds + l.t)}Z</span>${l.text}</div>`,
    )
    .join('');
  logBody.scrollTop = logBody.scrollHeight;
}

// ----- boot -----

const radar = new RadarModel(MISSION.rangeKm, MISSION.radarHeightM ?? 20);
const world = new World(ENTITIES, radar, WX_CELLS, ev => {
  const brg = String(ev.brg).padStart(3, '0');
  switch (ev.kind) {
    case 'NEW':
      log(`NEW TRACK ${ev.tn} BRG ${brg} RNG ${ev.rngKm} KM`, 'hl');
      break;
    case 'FADED':
      log(`TRACK ${ev.tn} FADED — PLOTS LOST`, 'warn');
      break;
    case 'REACQ':
      log(`TRACK ${ev.tn} RE-ACQUIRED BRG ${brg} RNG ${ev.rngKm} KM`);
      break;
    case 'DROPPED':
      log(`TRACK ${ev.tn} DROPPED BY OPERATOR`, 'warn');
      break;
    default:
      break; // CONFIRMED/COASTING are visible in the table — too chatty for the log
  }
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
table.onDrop = tn => {
  if (world.dropTrack(tn)) select(null);
};

document.getElementById('mission-name')!.textContent = MISSION.name;

// ----- EMCON controls -----

const emconPill = document.getElementById('pill-emcon')!;
const emconStatus = document.getElementById('emcon-status')!;
const emcButtons: Record<EmconMode, HTMLElement> = {
  SURVEILLANCE: document.getElementById('emc-surv')!,
  SECTOR: document.getElementById('emc-sector')!,
  SILENT: document.getElementById('emc-silent')!,
};

function refreshEmconUi(): void {
  for (const [mode, el] of Object.entries(emcButtons)) {
    el.classList.toggle('active', radar.mode === mode);
  }
  if (radar.mode === 'SILENT') {
    emconPill.textContent = 'EMCON SILENT';
    emconPill.className = 'pill pill-red';
    emconStatus.textContent = 'NOT RADIATING — BLIND';
  } else if (radar.mode === 'SECTOR') {
    emconPill.textContent = 'EMCON SECTOR';
    emconPill.className = 'pill pill-amber';
    emconStatus.textContent = `SECTOR ${String(Math.round(radar.sectorBearing)).padStart(3, '0')}° ±${radar.sectorHalfWidthDeg}° — CLICK SCOPE TO AIM`;
  } else {
    emconPill.textContent = 'EMCON RADIATE';
    emconPill.className = 'pill pill-green';
    emconStatus.textContent = radar.warming ? 'WARM-UP…' : 'SURVEILLANCE';
  }
}

function setEmcon(mode: EmconMode): void {
  if (!radar.setMode(mode)) return;
  if (mode === 'SILENT') log('EMCON SILENT — RADAR OFF, TRACKS WILL FADE', 'warn');
  else if (mode === 'SECTOR') log(`RADAR SECTOR FOCUS — DEEP ARC ±${radar.sectorHalfWidthDeg}°, REDUCED ELSEWHERE`);
  else log('RADAR SURVEILLANCE — FULL COVERAGE');
  refreshEmconUi();
}

emcButtons.SURVEILLANCE.addEventListener('click', () => setEmcon('SURVEILLANCE'));
emcButtons.SECTOR.addEventListener('click', () => setEmcon('SECTOR'));
emcButtons.SILENT.addEventListener('click', () => setEmcon('SILENT'));

// dev/testing hook: ?emcon=silent|sector (optionally &aim=DDD initial sector bearing)
{
  const em = params.get('emcon');
  if (em === 'silent') setEmcon('SILENT');
  else if (em === 'sector') {
    const aim = Number(params.get('aim'));
    if (Number.isFinite(aim)) radar.sectorBearing = ((aim % 360) + 360) % 360;
    setEmcon('SECTOR');
  }
}
refreshEmconUi();

ppi.onAim = brg => {
  radar.sectorBearing = brg;
  log(`SECTOR AIMED ${String(Math.round(brg)).padStart(3, '0')}°`);
  refreshEmconUi();
};

// ----- time controls -----

let timeScaleIdx = 1; // 1×

// dev/testing hook: ?t=0|1|4|16 sets the initial time scale
{
  const t = params.get('t');
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
  else if (ev.key === 'd' || ev.key === 'D') {
    if (ppi.selectedTn !== null && world.dropTrack(ppi.selectedTn)) select(null);
  } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    const tns = [...world.tracks.values()].sort((a, b) => a.tn - b.tn).map(t => t.tn);
    if (!tns.length) return;
    const cur = tns.indexOf(table.selectedTn ?? -1);
    const next = ev.key === 'ArrowDown'
      ? tns[(cur + 1 + tns.length) % tns.length]
      : tns[(cur - 1 + tns.length) % tns.length];
    select(next);
  }
});

// ----- main loop -----

const zuluEl = document.getElementById('zulu')!;
let acc = 0;
let lastDom = 0;

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
      const blips = world.sweepCross(a0, a1);
      if (blips.length) ppi.stamp(blips);
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
    if (radar.warming) refreshEmconUi();
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

// ----- boot log -----

log('ECS POWER-UP — BIT IN PROGRESS');
log('RADAR SET — SURVEILLANCE MODE — 15 RPM');
if (WX_CELLS.length) {
  for (const c of WX_CELLS) {
    const brg = String(Math.round(bearingDeg(c.x, c.y))).padStart(3, '0');
    const rng = Math.round(Math.hypot(c.x, c.y) / 1000);
    log(`WX CELL BRG ${brg} RNG ${rng} KM — REDUCED DETECTION`, 'warn');
  }
}
log('SYSTEM READY — MONITORING');

// surface runtime errors in the log panel instead of silently killing the loop
window.addEventListener('error', ev => {
  log(`RUNTIME ERROR: ${ev.message}`, 'err');
});
