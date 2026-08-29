import './style.css';
import { World, bearingDeg } from './sim/world';
import { RadarModel, EmconMode } from './sim/radar';
import { Director, Wcs } from './sim/director';
import { FlightPlan } from './sim/types';
import { ENTITIES as M1_ENTITIES, MISSION as M1 } from './sim/scenarios/m1';
import { ENTITIES as M2_ENTITIES, MISSION as M2, WX_CELLS as M2_WX } from './sim/scenarios/m2';
import {
  ENTITIES as M3_ENTITIES,
  MISSION as M3,
  WX_CELLS as M3_WX,
  FLIGHT_PLANS,
  DIRECTOR,
} from './sim/scenarios/m3';
import {
  ENTITIES as M4_ENTITIES,
  MISSION as M4,
  DIRECTOR as M4_DIRECTOR,
} from './sim/scenarios/m4';
import { CAMPAIGN, CAMPAIGN_NAME, WatchScenario } from './sim/scenarios/desertstorm';
import {
  CampaignState,
  freshCampaign,
  loadCampaign,
  applyWatchResult,
  clearCampaign,
} from './sim/campaign';
import { renderDebrief } from './console/debrief';
import { ConsoleAudio } from './audio/audio';
import { PPI } from './console/ppi';
import { Tactical3D } from './console/tactical3d';
import { TrackTable } from './console/trackTable';

const DT = 1 / 50; // fixed sim timestep
const TIME_SCALES = [0, 1, 4, 16];

const params = new URLSearchParams(location.search);

// ----- scenario source resolution -----

interface ResolvedWatch {
  isCampaign: boolean;
  watchIndex: number; // campaign watch index (0-based), or trial id
  trial: 'm1' | 'm2' | 'm3' | 'm4' | null;
  name: string;
  startSeconds: number;
  rangeKm: number;
  radarHeightM: number;
  endT: number;
  startWcs: Wcs;
  briefing: string[];
  entities: typeof M1_ENTITIES;
  wxCells: typeof M2_WX;
  flightPlans: FlightPlan[];
  directorEvents: import('./sim/director').DirectorEvent[];
  demo: string | null;
}

function resolveTrial(id: string): ResolvedWatch {
  switch (id) {
    case 'm1':
      return {
        isCampaign: false, watchIndex: 0, trial: 'm1', name: M1.name,
        startSeconds: M1.startSeconds, rangeKm: M1.rangeKm, radarHeightM: M1.radarHeightM,
        endT: M1.endT, startWcs: 'TIGHT', briefing: [],
        entities: M1_ENTITIES, wxCells: [], flightPlans: [], directorEvents: [],
        demo: params.get('demo'),
      };
    case 'm2':
      return {
        isCampaign: false, watchIndex: 0, trial: 'm2', name: M2.name,
        startSeconds: M2.startSeconds, rangeKm: M2.rangeKm, radarHeightM: M2.radarHeightM,
        endT: M2.endT, startWcs: 'TIGHT', briefing: [],
        entities: M2_ENTITIES, wxCells: M2_WX, flightPlans: [], directorEvents: [],
        demo: params.get('demo'),
      };
    case 'm3':
      return {
        isCampaign: false, watchIndex: 0, trial: 'm3', name: M3.name,
        startSeconds: M3.startSeconds, rangeKm: M3.rangeKm, radarHeightM: M3.radarHeightM,
        endT: M3.endT, startWcs: M3.startWcs, briefing: [],
        entities: M3_ENTITIES, wxCells: M3_WX, flightPlans: FLIGHT_PLANS, directorEvents: DIRECTOR,
        demo: params.get('demo'),
      };
    default:
      return {
        isCampaign: false, watchIndex: 0, trial: 'm4', name: M4.name,
        startSeconds: M4.startSeconds, rangeKm: M4.rangeKm, radarHeightM: M4.radarHeightM,
        endT: M4.endT, startWcs: M4.startWcs, briefing: [],
        entities: M4_ENTITIES, wxCells: [], flightPlans: M4_DIRECTOR ? [
          { callsign: 'SWA441', route: 'W→E TRANSIT', altFt: 27000, speedKt: 445, fromS: 0, toS: 600 },
          { callsign: 'VIPER11', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 410, fromS: 0, toS: 900 },
          { callsign: 'VIPER12', route: 'CAP NORTH-EAST', altFt: 25000, speedKt: 400, fromS: 0, toS: 900 },
        ] : [], directorEvents: M4_DIRECTOR,
        demo: params.get('demo'),
      };
  }
}

function resolveCampaignWatch(idx: number): ResolvedWatch {
  const w: WatchScenario = CAMPAIGN[Math.max(0, Math.min(CAMPAIGN.length - 1, idx))];
  return {
    isCampaign: true, watchIndex: idx, trial: null, name: w.name,
    startSeconds: w.startSeconds, rangeKm: w.rangeKm, radarHeightM: w.radarHeightM,
    endT: w.endT, startWcs: w.startWcs, briefing: w.briefing,
    entities: w.entities, wxCells: w.wxCells, flightPlans: w.flightPlans, directorEvents: w.director,
    demo: params.get('demo'),
  };
}

// menu mode (no params): boot campaign watch silently, paused, behind the menu
const scParam = params.get('sc');
const campaignParam = params.has('campaign');
const hasWatchParams = scParam !== null || campaignParam || params.has('demo') || params.has('t');
const watchParam = Number(params.get('watch'));
const devAutostart = params.has('t');

let campaignState: CampaignState | null = campaignParam ? (loadCampaign() ?? freshCampaign()) : null;
let W: ResolvedWatch;

if (scParam) W = resolveTrial(scParam);
else if (campaignParam) W = resolveCampaignWatch(Number.isFinite(watchParam) ? Math.max(0, watchParam) : 0);
else if (params.has('demo')) W = resolveTrial('m4');
else {
  const st = loadCampaign();
  W = resolveCampaignWatch(st ? Math.min(st.watchIndex, CAMPAIGN.length - 1) : 0);
}

// ----- app phase -----

type Phase = 'menu' | 'briefing' | 'boot' | 'watch' | 'debrief';
let phase: Phase = hasWatchParams ? (devAutostart ? 'watch' : 'briefing') : 'menu';
let watchEnded = false;

const overlay = document.getElementById('overlay')!;
const fxAlarm = document.getElementById('fx-alarm')!;
const fxBoot = document.getElementById('fx-boot')!;

/** Wash the shelter red while hostiles are inside the inner ring. */
function refreshAlarmLight(): void {
  const hostileNear = [...world.tracks.values()].some(
    t => t.identity === 'HOS' && Math.hypot(t.est.x, t.est.y) < 25000,
  );
  const leakerRecent = world.history.some(
    ev => ev.kind === 'LEAKER' && world.time - (ev.t ?? 0) < 20,
  );
  fxAlarm.classList.toggle('on', hostileNear || leakerRecent);
}

// ----- logging -----

const wcsLog: { t: number; wcs: string }[] = [];

function fmtZulu(seconds: number): string {
  const h = Math.floor(seconds / 3600) % 24;
  const m = Math.floor(seconds / 60) % 60;
  const s = Math.floor(seconds) % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

const logBody = document.getElementById('log-body')!;

function log(text: string, cls = ''): void {
  const div = document.createElement('div');
  div.className = `log-line ${cls}`;
  div.innerHTML = `<span class="lt">${fmtZulu(W.startSeconds + world.time)}Z</span>${text}`;
  if (cls === 'err') div.classList.add('flash-line');
  logBody.appendChild(div);
  while (logBody.children.length > 120) logBody.removeChild(logBody.firstChild!);
  logBody.scrollTop = logBody.scrollHeight;
}

// ----- audio -----

const audio = new ConsoleAudio();
const btnAudio = document.getElementById('btn-audio')!;
btnAudio.addEventListener('click', () => {
  audio.unlock();
  audio.setEnabled(!audio.enabled);
  btnAudio.textContent = audio.enabled ? '♪' : '♪̸';
  btnAudio.classList.toggle('mute', !audio.enabled);
});
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });

// ----- boot world -----

const radar = new RadarModel(W.rangeKm, W.radarHeightM);

const wcsPill = document.getElementById('pill-wcs')!;
function refreshWcsPill(wcs: Wcs): void {
  wcsPill.textContent = `WEAPONS ${wcs}`;
  wcsPill.className = `pill ${wcs === 'FREE' ? 'pill-wcs-free' : wcs === 'HOLD' ? 'pill-wcs-hold' : 'pill-blue'}`;
}
refreshWcsPill(W.startWcs);
wcsLog.push({ t: 0, wcs: W.startWcs });

function radio(text: string): void {
  audio.radioSquelch();
  log(`CMD ▸ ${text}`, 'radio');
}

const director = new Director(
  W.directorEvents,
  W.startWcs,
  wcs => {
    refreshWcsPill(wcs);
    wcsLog.push({ t: world.time, wcs });
    log(`WEAPONS CONTROL STATUS: ${wcs}`, 'hl');
  },
  radio,
);

const tbmAnnounced = new Set<number>();

const world = new World(
  W.entities,
  radar,
  W.wxCells,
  director,
  ev => {
    const brg = String(ev.brg).padStart(3, '0');
    switch (ev.kind) {
      case 'NEW':
        audio.newTrack();
        log(`NEW TRACK ${ev.tn} BRG ${brg} RNG ${ev.rngKm} KM`, 'hl');
        break;
      case 'FADED':
        log(`TRACK ${ev.tn} FADED — PLOTS LOST`, 'warn');
        break;
      case 'DROPPED':
        log(`TRACK ${ev.tn} DROPPED BY OPERATOR`, 'warn');
        break;
      case 'REACQ':
        log(`TRACK ${ev.tn} RE-ACQUIRED BRG ${brg} RNG ${ev.rngKm} KM`);
        break;
      case 'DECL_HOS':
        log(`TRACK ${ev.tn} DECLARED HOSTILE BY OPERATOR`, 'hl');
        break;
      case 'DECL_FND':
        log(`TRACK ${ev.tn} DECLARED FRIENDLY BY OPERATOR`);
        break;
      case 'IFF':
        log(`TRACK ${ev.tn} IFF: ${ev.text ?? ''}`);
        break;
      case 'DATALINK':
        log(`TRACK ${ev.tn} DATALINK ID — FRIENDLY`, 'hl');
        break;
      case 'VIOLATION_NOTE':
        audio.violation();
        log(`⚑ ${ev.text ?? ''} (TRACK ${ev.tn})`, 'err');
        break;
      case 'MISSILE':
        audio.launch();
        log(`▲ ${ev.text ?? ''} (TRACK ${ev.tn})`, 'hl');
        break;
      case 'INTERCEPT':
        audio.interceptMiss();
        log(`✖ ${ev.text ?? ''} (TRACK ${ev.tn})`, 'warn');
        break;
      case 'DESTROYED':
        audio.interceptKill();
        log(`✔ ${ev.text ?? ''} — TRACK ${ev.tn} DESTROYED`, 'hl');
        break;
      case 'FRATRICIDE':
        audio.interceptKill();
        audio.violation();
        log(`✖✖ FRATRICIDE — ${ev.text ?? ''} (TRACK ${ev.tn})`, 'err');
        break;
      case 'LEAKER':
        audio.leaker();
        log(`⚠ ${ev.text ?? ''} (TRACK ${ev.tn})`, 'err');
        break;
      case 'RELOAD':
        log(ev.text ?? 'RELOAD COMPLETE', 'warn');
        break;
      case 'ENGAGE_BLOCKED':
        log(`ENGAGE DENIED — ${ev.text ?? ''} (TRACK ${ev.tn})`, 'warn');
        break;
      default:
        break;
    }
  },
  radio,
);

const ppi = new PPI(document.getElementById('ppi') as HTMLCanvasElement, world, W.rangeKm * 1000);
const tac3d = new Tactical3D(document.getElementById('tac3d') as HTMLCanvasElement, world, W.rangeKm);
const table = new TrackTable(world);

function select(tn: number | null): void {
  ppi.selectTn(tn);
  tac3d.selectTn(tn);
  table.selectedTn = tn;
  table.update(trk => ppi.brgRng(trk));
}
ppi.onSelect = select;
tac3d.onSelect = select;
table.onSelect = select;
table.onDrop = tn => {
  if (world.dropTrack(tn)) select(null);
};
table.onIff = tn => {
  audio.iffChirp();
  world.interrogate(tn);
};
table.onDeclare = (tn, identity) => {
  world.declare(tn, identity);
};
table.onEngage = tn => {
  world.engage(tn);
};
table.onAbort = tn => {
  const n = world.weapons.abort(tn);
  if (n) log(`✖ SELF-DESTRUCT — ${n} MISSILE${n > 1 ? 'S' : ''} DESTROYED (TRACK ${tn})`, 'warn');
};

document.getElementById('mission-name')!.textContent = W.name;

// ----- fire units strip -----

const fsUnits = document.getElementById('fs-units')!;
const fsChannels = document.getElementById('fs-channels')!;
const fsRounds = document.getElementById('fs-rounds')!;
const btnAuto = document.getElementById('btn-auto')!;
const docSS = document.getElementById('doc-ss')!;
const docSLS = document.getElementById('doc-sls')!;

docSS.addEventListener('click', () => {
  world.weapons.doctrine = 'SS';
  docSS.classList.add('active');
  docSLS.classList.remove('active');
  log('FIRE DOCTRINE: SHOOT-SHOOT — RIPPLE 2');
});
docSLS.addEventListener('click', () => {
  world.weapons.doctrine = 'SLS';
  docSLS.classList.add('active');
  docSS.classList.remove('active');
  log('FIRE DOCTRINE: SHOOT-LOOK-SHOOT — SINGLE');
});
btnAuto.addEventListener('click', () => {
  world.weapons.autoEngage = !world.weapons.autoEngage;
  btnAuto.textContent = `AUTO: ${world.weapons.autoEngage ? 'ON' : 'OFF'}`;
  btnAuto.classList.toggle('on', world.weapons.autoEngage);
  log(
    world.weapons.autoEngage
      ? 'AUTO ENGAGE ENABLED — SYSTEM WILL FIRE PER WEAPONS STATUS'
      : 'AUTO ENGAGE DISABLED — MANUAL ENGAGEMENT ONLY',
    world.weapons.autoEngage ? 'warn' : '',
  );
});

function renderFireStrip(): void {
  const w = world.weapons;
  fsUnits.innerHTML = w.units
    .map(u => {
      if (u.state === 'RELOADING') {
        const left = Math.max(0, Math.ceil(u.reloadEndsT - world.time));
        const mm = String(Math.floor(left / 60)).padStart(2, '0');
        const ss = String(left % 60).padStart(2, '0');
        return `<div class="fsu reloading">${u.name}<br><span class="pips">RELOAD ${mm}:${ss}</span></div>`;
      }
      const pips = '●'.repeat(u.rounds) + '○'.repeat(u.roundsMax - u.rounds);
      return `<div class="fsu">${u.name}<br><span class="pips">${pips}</span> ${u.rounds}/${u.roundsMax}</div>`;
    })
    .join('');
  fsChannels.textContent = `CH ${w.channelsUsed}/${w.channelsMax}`;
  fsRounds.textContent = `${w.roundsReady()} RDY`;
}

// ----- master arm -----

const pillArm = document.getElementById('pill-arm')!;
const btnArm = document.getElementById('btn-arm')!;

function refreshArmUi(): void {
  const on = world.weapons.masterArmed;
  pillArm.textContent = on ? 'MASTER ARM' : 'MASTER SAFE';
  pillArm.className = on ? 'pill armed' : 'pill';
  btnArm.textContent = on ? '⏻ MASTER ARM' : '⏻ MASTER SAFE';
  btnArm.classList.toggle('armed', on);
}

function setMasterArm(on: boolean): void {
  world.weapons.masterArmed = on;
  refreshArmUi();
  audio.uiClick();
  log(
    on ? 'MASTER ARM — WEAPONS ARMED' : 'MASTER SAFE — WEAPONS SAFE',
    on ? 'warn' : '',
  );
  // repaint the table so the detail panel engage button reflects armed state
  table.update(trk => ppi.brgRng(trk));
}

btnArm.addEventListener('click', () => setMasterArm(!world.weapons.masterArmed));
refreshArmUi();

// ----- flight plans panel -----

const plansTbody = document.getElementById('plans-tbody')!;
const plansClock = document.getElementById('plans-clock')!;
const plansPanel = document.getElementById('plans-panel')!;

function renderFlightPlans(): void {
  if (!W.flightPlans.length) {
    plansPanel.style.display = 'none';
    return;
  }
  const t = world.time;
  plansClock.textContent = fmtZulu(W.startSeconds + t).slice(0, 5) + 'Z';
  const rows = W.flightPlans.map(p => {
    const active = t >= p.fromS && t <= p.toS;
    const expired = t > p.toS;
    const windowTxt = expired
      ? 'EXPIRED'
      : `${fmtZulu(W.startSeconds + Math.max(0, p.fromS)).slice(0, 5)}–${fmtZulu(W.startSeconds + p.toS).slice(0, 5)}`;
    return `<tr class="${active ? '' : 'plan-inactive'}">
      <td>${p.callsign}</td><td>${p.route}</td><td>${(p.altFt / 1000).toFixed(0)}k</td><td>${p.speedKt}</td>
      <td>${windowTxt}</td>
    </tr>`;
  });
  plansTbody.innerHTML = rows.join('');
}

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
  audio.setRadiating(radar.radiating);
  if (mode === 'SILENT') log('EMCON SILENT — RADAR OFF, TRACKS WILL FADE', 'warn');
  else if (mode === 'SECTOR') log(`RADAR SECTOR FOCUS — DEEP ARC ±${radar.sectorHalfWidthDeg}°, REDUCED ELSEWHERE`);
  else log('RADAR SURVEILLANCE — FULL COVERAGE');
  refreshEmconUi();
}

emcButtons.SURVEILLANCE.addEventListener('click', () => setEmcon('SURVEILLANCE'));
emcButtons.SECTOR.addEventListener('click', () => setEmcon('SECTOR'));
emcButtons.SILENT.addEventListener('click', () => setEmcon('SILENT'));

ppi.onAim = brg => {
  radar.sectorBearing = brg;
  log(`SECTOR AIMED ${String(Math.round(brg)).padStart(3, '0')}°`);
  refreshEmconUi();
};

// dev/testing hooks in URL
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

// ----- time controls -----

let timeScaleIdx = devAutostart ? [0, 1, 4, 16].indexOf(Number(params.get('t'))) : 0;
if (timeScaleIdx < 0) timeScaleIdx = 1;

function setTimeScale(idx: number): void {
  if (watchEnded) return;
  timeScaleIdx = idx;
  for (const [i, id] of ['btn-pause', 'btn-1x', 'btn-4x', 'btn-16x'].entries()) {
    document.getElementById(id)!.classList.toggle('active', i === idx);
  }
}
document.getElementById('btn-pause')!.addEventListener('click', () => setTimeScale(0));
document.getElementById('btn-1x')!.addEventListener('click', () => setTimeScale(1));
document.getElementById('btn-4x')!.addEventListener('click', () => setTimeScale(2));
document.getElementById('btn-16x')!.addEventListener('click', () => setTimeScale(3));
setTimeScale(timeScaleIdx);

window.addEventListener('keydown', ev => {
  if (phase !== 'watch') {
    if (ev.code === 'Space' && phase === 'briefing') {
      ev.preventDefault();
      beginWatch();
    } else if (ev.code === 'Space' && phase === 'boot') {
      ev.preventDefault();
      finishBoot();
    }
    return;
  }
  if (ev.code === 'Space') {
    ev.preventDefault();
    setTimeScale(timeScaleIdx === 0 ? 1 : 0);
  } else if (ev.key === 'Escape') {
    location.assign('/');
  } else if (ev.key === '1') setTimeScale(1);
  else if (ev.key === '2') setTimeScale(2);
  else if (ev.key === '3') setTimeScale(3);
  else if (ev.key === 't' || ev.key === 'T') ppi.showTruth = !ppi.showTruth;
  else if (ev.key === 'd' || ev.key === 'D') {
    if (ppi.selectedTn !== null && world.dropTrack(ppi.selectedTn)) select(null);
  } else if (ev.key === 'i' || ev.key === 'I') {
    if (ppi.selectedTn !== null) {
      audio.iffChirp();
      world.interrogate(ppi.selectedTn);
    }
  } else if (ev.key === 'h' || ev.key === 'H') {
    if (ppi.selectedTn !== null) world.declare(ppi.selectedTn, 'HOS');
  } else if (ev.key === 'f' || ev.key === 'F') {
    if (ppi.selectedTn !== null) world.declare(ppi.selectedTn, 'FND');
  } else if (ev.key === 'e' || ev.key === 'E') {
    if (ppi.selectedTn !== null) world.engage(ppi.selectedTn);
  } else if (ev.key === 'x' || ev.key === 'X') {
    if (ppi.selectedTn !== null) {
      const n = world.weapons.abort(ppi.selectedTn);
      if (n) log(`✖ SELF-DESTRUCT — ${n} MISSILE${n > 1 ? 'S' : ''} DESTROYED (TRACK ${ppi.selectedTn})`, 'warn');
    }
  } else if (ev.key === 'k' || ev.key === 'K') {
    setMasterArm(!world.weapons.masterArmed);
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

// ----- overlays: menu / briefing / debrief -----

function showMenu(): void {
  const st = loadCampaign();
  const cont = st && !st.finished && st.watchIndex < CAMPAIGN.length;
  overlay.className = 'ov-show';
  overlay.innerHTML = `
    <div class="menu-box">
      <div class="menu-title">SENTINEL</div>
      <div class="menu-sub">ENGAGEMENT CONTROL STATION · A REALISTIC AIR DEFENSE WATCH</div>
      <div class="menu-sec">CAMPAIGN</div>
      ${cont ? `<button class="mbtn" id="m-continue">CONTINUE — ${CAMPAIGN_NAME} · WATCH ${st!.watchIndex + 1}</button>` : ''}
      <button class="mbtn" id="m-new">${st ? 'RESTART CAMPAIGN' : `BEGIN CAMPAIGN — ${CAMPAIGN_NAME}`}</button>
      ${st?.finished ? `<div class="menu-note">CAMPAIGN COMPLETE — BASE ${st.baseIntegrity}% · ${st.totals.kills} KILLS · ${st.totals.fratricides} FRATRICIDES</div>` : ''}
      <div class="menu-sec">TRIAL WATCHES</div>
      <button class="mbtn mbtn-small" data-trial="m4">FIRST SHOT 04 — weapons</button>
      <button class="mbtn mbtn-small" data-trial="m3">CORRIDOR WATCH 03 — identification</button>
      <button class="mbtn mbtn-small" data-trial="m2">NIGHT WATCH 02 — detection</button>
      <button class="mbtn mbtn-small" data-trial="m1">SCOPE TRIAL 01 — the scope</button>
      <div class="menu-note">SPACE pause · arrows select · I interrogate · H/F declare · E engage · X abort · D drop · T truth · K arm</div>
    </div>`;
  overlay.querySelector('#m-new')?.addEventListener('click', () => {
    audio.unlock();
    audio.uiClick();
    clearCampaign();
    location.assign('/?campaign=ds&watch=0');
  });
  overlay.querySelector('#m-continue')?.addEventListener('click', () => {
    audio.unlock();
    audio.uiClick();
    location.assign(`/?campaign=ds&watch=${st!.watchIndex}`);
  });
  overlay.querySelectorAll<HTMLButtonElement>('[data-trial]').forEach(b =>
    b.addEventListener('click', () => {
      audio.unlock();
      audio.uiClick();
      location.assign(`/?sc=${b.dataset.trial}`);
    }),
  );
}

function showBriefing(): void {
  overlay.className = 'ov-show';
  overlay.innerHTML = `
    <div class="brief-box">
      <div class="brief-title">${W.name}</div>
      <div class="brief-sub">${fmtZulu(W.startSeconds).slice(0, 5)}Z · WEAPONS ${W.startWcs} · ${W.endT / 60} MIN WATCH</div>
      <div class="brief-lines">${W.briefing.map(l => `<p>${l}</p>`).join('')}</div>
      <button class="mbtn" id="b-begin">BEGIN WATCH ▶</button>
      <div class="menu-note">SPACE also begins</div>
    </div>`;
  overlay.querySelector('#b-begin')?.addEventListener('click', beginWatch);
}

// ----- ECS boot sequence -----

interface BootLine {
  text: string;
  cls: 'ok' | 'warn';
}

const BOOT_LINES: BootLine[] = [
  { text: 'CENTRAL PROCESSOR ... OK', cls: 'ok' },
  { text: 'RADAR X-BAND TRANSMITTER ... OK', cls: 'ok' },
  { text: 'IFF INTERROGATOR MODE 4 ... KEYED', cls: 'ok' },
  { text: 'PADIL DATALINK ... NET SYNC', cls: 'ok' },
  { text: 'LAUNCHER 1-4 ... RESPONSE', cls: 'ok' },
  { text: 'COOLANT LOOP ... NOMINAL', cls: 'ok' },
  { text: 'BACKUP BUS DEGRADED — PRIMARY IN USE', cls: 'warn' },
  { text: 'BIT COMPLETE — ECS READY', cls: 'ok' },
  { text: 'HANDING CONTROL TO OPERATOR', cls: 'ok' },
];

const BOOT_TICK_MS = 260;
const BOOT_DWELL_TICKS = 10; // ~2.6s hold after the last line before handover

let bootTimer: ReturnType<typeof setInterval> | null = null;
let bootFinished = false;

function finishBoot(): void {
  if (bootFinished || phase !== 'boot') return;
  bootFinished = true;
  if (bootTimer !== null) {
    clearInterval(bootTimer);
    bootTimer = null;
  }
  fxBoot.classList.add('ov-hide');
  phase = 'watch';
  setTimeScale(1);
  log('ECS POWER-UP — BIT IN PROGRESS');
  log('RADAR SET — SURVEILLANCE MODE — 15 RPM');
  for (const c of W.wxCells) {
    const brg = String(Math.round(bearingDeg(c.x, c.y))).padStart(3, '0');
    const rng = Math.round(Math.hypot(c.x, c.y) / 1000);
    log(`WX CELL BRG ${brg} RNG ${rng} KM — REDUCED DETECTION`, 'warn');
  }
  log('SYSTEM READY — MONITORING');
}

function runBootSequence(): void {
  if (bootTimer !== null) {
    clearInterval(bootTimer);
    bootTimer = null;
  }
  bootFinished = false;
  fxBoot.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'boot-title';
  title.textContent = 'SENTINEL ECS';
  const lines = document.createElement('div');
  lines.className = 'boot-lines';
  const bar = document.createElement('div');
  bar.className = 'boot-bar';
  const fill = document.createElement('div');
  fill.className = 'boot-bar-fill';
  bar.appendChild(fill);
  const skip = document.createElement('div');
  skip.className = 'boot-skip';
  skip.textContent = 'SPACE — SKIP';
  fxBoot.append(title, lines, bar, skip);
  fxBoot.classList.remove('ov-hide');

  const totalTicks = BOOT_LINES.length + BOOT_DWELL_TICKS;
  let step = 0;
  bootTimer = setInterval(() => {
    if (step < BOOT_LINES.length) {
      const bl = BOOT_LINES[step];
      const div = document.createElement('div');
      div.className = bl.cls;
      div.textContent = bl.text;
      lines.appendChild(div);
      audio.uiClick();
      fill.style.width = `${Math.round(((step + 1) / totalTicks) * 100)}%`;
    } else {
      fill.style.width = `${Math.min(100, Math.round(((step + 1) / totalTicks) * 100))}%`;
      if (step + 1 >= totalTicks) finishBoot();
    }
    step++;
  }, BOOT_TICK_MS);
}

function beginWatch(): void {
  audio.unlock();
  audio.uiClick();
  overlay.className = 'ov-hide';
  phase = 'boot';
  runBootSequence();
}

function enterDebrief(): void {
  phase = 'debrief';
  watchEnded = true;
  timeScaleIdx = 0;
  for (const [i, id] of ['btn-pause', 'btn-1x', 'btn-4x', 'btn-16x'].entries()) {
    document.getElementById(id)!.classList.toggle('active', i === 0);
  }

  if (W.isCampaign) {
    const st = campaignState ?? freshCampaign();
    campaignState = applyWatchResult(st, CAMPAIGN[W.watchIndex].id, world.score, CAMPAIGN.length);
  }

  overlay.className = 'ov-show';
  overlay.innerHTML = renderDebrief({
    world,
    missionName: W.name,
    startSeconds: W.startSeconds,
    wcsLog,
    campaign: campaignState,
    campaignLength: CAMPAIGN.length,
    isCampaign: W.isCampaign,
  });

  overlay.querySelector('#db-next')?.addEventListener('click', () =>
    location.assign(`/?campaign=ds&watch=${Math.min(CAMPAIGN.length - 1, (campaignState?.watchIndex ?? W.watchIndex + 1))}`),
  );
  overlay.querySelector('#db-retry')?.addEventListener('click', () => location.reload());
  overlay.querySelector('#db-menu')?.addEventListener('click', () => location.assign('/'));
  overlay.querySelector('#db-campaign-end')?.addEventListener('click', () => location.assign('/'));
}

if (phase === 'menu') showMenu();
else if (phase === 'briefing') showBriefing();

// boot log lines for dev-autostart watches (briefing path logs its own)
if (phase === 'watch') {
  log('ECS POWER-UP — BIT IN PROGRESS');
  log('RADAR SET — SURVEILLANCE MODE — 15 RPM');
  log('SYSTEM READY — MONITORING');
}

// dev hook: jump straight to the debrief for AAR testing
if (params.has('end')) {
  world.time = Math.max(0, W.endT - 3);
}

// surface runtime errors in the log panel instead of silently killing the loop
window.addEventListener('error', ev => {
  log(`RUNTIME ERROR: ${ev.message}`, 'err');
});

// ----- scripted operator for automated verification -----

interface DemoStep {
  atT: number;
  label: string;
  run: () => void;
}

function findTrackBy(pred: (altFt: number, spdKt: number, identity: string, rngKm: number) => boolean): number | null {
  for (const trk of world.tracks.values()) {
    if (trk.state === 'PLOT') continue;
    const altFt = trk.est.altM * 3.28084;
    const spdKt = trk.est.speedMs * 1.94384;
    const rngKm = Math.hypot(trk.est.x, trk.est.y) / 1000;
    if (pred(altFt, spdKt, trk.identity, rngKm)) return trk.tn;
  }
  return null;
}

const demoQueue: DemoStep[] = params.get('demo') === 'm3'
  ? [
      { atT: 100, label: 'SELECT CIVIL (SWA441) + INTERROGATE', run: () => {
        const tn = findTrackBy((a, _s, id) => id === 'UNK' && a > 24000 && a < 31000);
        if (tn !== null) { select(tn); world.interrogate(tn); }
      } },
      { atT: 110, label: 'DECLARE CIVIL HOSTILE (expect ATO challenge + violation)', run: () => {
        if (table.selectedTn !== null) world.declare(table.selectedTn, 'HOS');
      } },
      { atT: 120, label: 'DECLARE BOMBER HOSTILE', run: () => {
        const tn = findTrackBy((a, _s, id) => id === 'UNK' && a > 31000);
        if (tn !== null) { select(tn); world.declare(tn, 'HOS'); }
      } },
      { atT: 245, label: 'SELECT JUDO21 (failing M4) + INTERROGATE', run: () => {
        const tn = findTrackBy((a, _s, id, r) => id === 'UNK' && a > 15000 && a < 19000 && r > 50);
        if (tn !== null) { select(tn); world.interrogate(tn); }
      } },
      { atT: 258, label: 'INTERROGATE JUDO21 AGAIN', run: () => {
        if (table.selectedTn !== null) world.interrogate(table.selectedTn);
      } },
      { atT: 335, label: 'DECLARE RYK214 HOSTILE (off-plan civil, expect caution only)', run: () => {
        const tn = findTrackBy((a, _s, id, r) => id === 'UNK' && a > 18800 && a < 21500 && r > 55);
        if (tn !== null) { select(tn); world.declare(tn, 'HOS'); }
      } },
    ]
  : params.get('demo') === 'm4'
    ? [
        { atT: 60, label: 'DECLARE BOMBER HOSTILE', run: () => {
          const tn = findTrackBy((a, _s, id) => id === 'UNK' && a > 30000);
          if (tn !== null) { select(tn); world.declare(tn, 'HOS'); }
        } },
        { atT: 66, label: 'ENGAGE BOMBER (SLS)', run: () => {
          setMasterArm(true);
          if (table.selectedTn !== null) world.engage(table.selectedTn);
        } },
        { atT: 200, label: 'DECLARE + ENGAGE FIRST DRONE', run: () => {
          setMasterArm(true);
          const tn = findTrackBy((a, s, id) => id === 'UNK' && a < 5000 && s < 130);
          if (tn !== null) { select(tn); world.declare(tn, 'HOS'); world.engage(tn); }
        } },
        { atT: 250, label: 'ENABLE AUTO ENGAGE (weapons free — watch the civil)', run: () => {
          setMasterArm(true);
          world.weapons.autoEngage = true;
          btnAuto.textContent = 'AUTO: ON';
          btnAuto.classList.add('on');
          log('DEMO ▸ AUTO ENGAGE ENABLED BY OPERATOR', 'warn');
        } },
      ]
    : params.get('demo') === 'ds'
      ? [
          { atT: 135, label: 'DECLARE + ENGAGE FIRST SCUD', run: () => {
            setMasterArm(true);
            const tn = findTrackBy((_a, s, id) => id !== 'FND' && s > 900);
            if (tn !== null) { select(tn); world.declare(tn, 'HOS'); world.engage(tn); }
          } },
          { atT: 175, label: 'DECLARE + ENGAGE SECOND SCUD', run: () => {
            setMasterArm(true);
            const tn = findTrackBy((_a, s, id) => id !== 'FND' && s > 900);
            if (tn !== null) { select(tn); world.declare(tn, 'HOS'); world.engage(tn); }
          } },
          { atT: 225, label: 'DECLARE + ENGAGE THIRD SCUD', run: () => {
            setMasterArm(true);
            const tn = findTrackBy((_a, s, id) => id !== 'FND' && s > 900);
            if (tn !== null) { select(tn); world.declare(tn, 'HOS'); world.engage(tn); }
          } },
          { atT: 268, label: 'DECLARE + ENGAGE FOURTH SCUD', run: () => {
            setMasterArm(true);
            const tn = findTrackBy((_a, s, id) => id !== 'FND' && s > 900);
            if (tn !== null) { select(tn); world.declare(tn, 'HOS'); world.engage(tn); }
          } },
        ]
      : [];

let demoIdx = 0;
function runDemo(): void {
  while (demoIdx < demoQueue.length && world.time >= demoQueue[demoIdx].atT) {
    const step = demoQueue[demoIdx++];
    log(`DEMO ▸ ${step.label}`);
    step.run();
  }
}

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
  const dtReal = Math.min(10, (now - lastTick) / 1000);
  lastTick = now;
  if (phase === 'watch') {
    try {
      stepSim(dtReal);
      runDemo();
      if (world.time >= W.endT) enterDebrief();
    } catch (err) {
      reportError('SIM ERROR', err);
    }
  }
  if (now - lastDom > 250) {
    lastDom = now;
    zuluEl.textContent = `${fmtZulu(W.startSeconds + world.time)}Z`;
    table.update(trk => ppi.brgRng(trk));
    renderFlightPlans();
    renderFireStrip();
    refreshAlarmLight();
    // TBM alarm: announced once per track when the classifier catches hypersonic
    for (const trk of world.tracks.values()) {
      if (trk.autoClass === 'TBM' && !tbmAnnounced.has(trk.tn)) {
        tbmAnnounced.add(trk.tn);
        audio.tbmAlert();
        log(`⚠ TRACK ${trk.tn} CLASSIFIED TBM — HIGH-SPEED TARGET`, 'err');
      }
    }
    if (radar.warming) refreshEmconUi();
  }
}, 100);

let lastRender = performance.now();
function renderLoop(now: number): void {
  const dtReal = Math.min(0.1, (now - lastRender) / 1000);
  lastRender = now;
  try {
    ppi.render(dtReal);
    tac3d.render();
  } catch (err) {
    reportError('RENDER ERROR', err);
  }
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);
