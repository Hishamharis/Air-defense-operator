# SENTINEL — Realistic Air Defense Operator Sim
### Game Design Document v0.1 — 2026-08-16

> You are the fire-control operator of a surface-to-air missile battery. You don't fly the jet,
> you don't command the war — you sit in a dark shelter, watch a radar scope for hours, and own
> the decision that takes 30 seconds and lives with you forever.

---

## 1. Vision & Pillars

**Pitch:** A browser-based "job simulator" where the player performs the real tasks of an air
defense fire-control operator: surveillance, classification, IFF identification, engagement
authority decisions, missile employment, and kill assessment — against procedurally assembled
strike packages drawn from real conflicts.

| Pillar | Meaning |
|---|---|
| **The kill chain is the gameplay** | Detect → classify → identify → decide → engage → assess. Every step is an interaction, not a cutscene. |
| **Identification is the boss fight** | No reply on IFF means *unknown*, not hostile. Shooting the wrong track is the worst possible outcome, and the game makes you feel it. |
| **Scarcity and physics over action** | Radar horizon, missile energy, magazine depth, reload clocks. You can't shoot everything; triage IS the skill. |
| **Boredom punctuated by terror** | Long watches (compressed, seeded with ambient tasks) interrupted by 90 seconds of chaos. |
| **Every real decision, no fake busywork** | Realistic core, streamlined UX: we automate tedious procedure, never the decisions. |

**Non-goals (v1):** first-person 3D, multiplayer, flying aircraft, god-view strategic map.
**Future:** commander role, crew co-op, persistent dynamic campaign.

---

## 2. Player Role

One seat: **Fire Control Operator** (modeled on Patriot TCA + elements of TCO, since the player
is alone). AI characters surround the player and matter:

- **Battery Commander (AI, radio)** — issues ROE changes, weapons-control status, engagement
  authority (or delegates it), scolds/investigates you.
- **Crew (AI, off-screen)** — reload launchers, fix faults, report status ("Launcher 2 reload:
  22 minutes remaining").
- **Higher HQ / CRC (AI, datalink + voice)** — sends flight plans, airspace restrictions,
  ATO updates, warnings ("Two friendlies returning through corridor BRAVO 0145Z").

The player's console is the entire UI. No menus floating in space — everything happens on
screens in the shelter.

---

## 3. Core Loop

```
┌─ WATCH ──────────────────────────────────────────────┐
│  Monitor PPI + track table. Ambient tasks, chatter.   │
│  Manage: EMCON, radar modes, ready states, IFF codes. │
└──────────────┬───────────────────────────────────────┘
               │ new track / alert
┌─▼ REACTION (the 30 seconds) ─────────────────────────┐
│  1. CLASSIFY  — TBM? cruise? drone? air-breather?    │
│  2. IDENTIFY  — IFF interrogate, flight-plan match,   │
│                 corridor check, speed/alt profile     │
│  3. DECIDE    — does it meet hostile criteria under   │
│                 current weapons-tightness?            │
│  4. ENGAGE    — assign fire unit, doctrine, launch    │
└──────────────┬───────────────────────────────────────┘
               │ missile away
┌─▼ ASSESS ────────────────────────────────────────────┐
│  Track the intercept. Kill? Miss? Re-engage?         │
│  Damage report. Reload started. Debrief + scoring.   │
└──────────────┴───────────────────────────────────────┘
```

A **mission = one watch** (10–25 min real time with time compression, pauses).
A **campaign = a sequence of watches** with persistent inventory, crew fatigue, and story.

---

## 4. Systems Design

### 4.1 Radar & Detection (physics-gated)
- Track state per contact: **UNTRACKED → PLOT (blip, fading) → TRACKED (system custody)**.
  Plots that don't refresh on successive sweeps decay — lost track = start over.
- **Detection range** = min(radar max range, radar horizon, SNR from RCS):
  `horizon_km ≈ 4.12 × (√h_radar + √h_target)` — a 30 m cruise missile appears at ~25–30 km
  no matter how good the radar is. Terrain masking adds shadow zones from site elevation map.
- **RCS by class**: fighter 1–10 m², cruise missile ~0.1 m², stealth 0.001–0.01 m²,
  drone 0.01–0.5 m², airliner 10–50 m². SNR → detection probability (small targets sometimes
  flicker — first detection at reduced confidence).
- **Clutter & false plots**: weather cells, birds, chaff create junk plots the player must
  dismiss or risk polluting the track table (real operator workload).
- **Radar modes** (player's biggest lever):
  - SURVEILLANCE (normal) — full picture.
  - FOCUSED/SECTOR — deeper detection in one sector, blind elsewhere.
  - **EMCON SILENT** — radar OFF: invisible to enemy RWR/ARM, but you are blind and tracks
    go stale (coast). **The emitter dilemma is a core mechanic.**
- **EW effects**: standoff jamming = degraded range/wobbly tracks in a bearing wedge;
  chaff corridors = clutter blobs; MALD decoys = fake convincing tracks.

### 4.2 Classification (what is it?)
Automatic first-pass label from kinematics — often right, sometimes wrong (that's the trap):
- **TBM**: steep climb, apogee, fast reentry (Mach 5–8), short timeline.
- **CRUISE**: low, slow–fast, terrain-following, small RCS.
- **DRONE**: very slow, low, straight.
- **AIR-BREATHER (ABT)**: fighter/attack profile.
- **HELO**: low, slow, hovering behavior.
- **UNKNOWN**: data insufficient.

### 4.3 Identification (whose is it?) — THE core system
Layered evidence the player must weigh; the console never says "hostile" for free:
1. **IFF interrogate** (button + crypto code selection):
   - Mode 4/5 valid reply → FRIENDLY (high confidence).
   - No reply → UNKNOWN (could be a failed transponder, a stealth jet, or a hostile).
   - Wrong-code reply / garbage → suspect.
2. **Flight plan correlation**: does the track match an approved flight plan / corridor /
   ATO entry? (Displayed as a lookup list the player cross-checks — Papers-Please-style.)
3. **AWACS/datalink ID** — sometimes available, sometimes the datalink is down.
4. **Behavior**: squawking emergency? Descending toward the base? Pop-up from a threat axis?
   Orbiting like a CAP?
5. **Visual/short-range sensor** — only if it gets close enough.

**Hostile declaration is a player action** — a confirmation step with weight. The system may
*recommend*, the player *declares*. Under some ROE, declaring requires commander authority
(radio request → 10–20 s wait → granted/denied/”use your judgment").

### 4.4 Rules of Engagement & Weapons Control
- **Weapons-tightness states** (set by AI commander, changes mid-mission):
  - WEAPONS HOLD — engage only in self-defense.
  - WEAPONS TIGHT — engage only tracks *positively identified hostile*.
  - WEAPONS FREE — engage anything not *positively friendly*.
- **Engagement authority**: who says "shoot" — the player or the commander? Scenarios vary;
  stress spikes when authority is delegated to you.
- **Violation consequences**: engaging a friendly/neutral/civil track under TIGHT triggers the
  consequence system (§4.8), regardless of outcome.

### 4.5 Engagement & Missiles
- Player assigns tracks to **fire units/launchers**, picks **doctrine**:
  - SHOOT-SHOOT (salvo, 2 missiles: Pₖ ≈ 1−(1−Pk)², burns magazine)
  - SHOOT-LOOK-SHOOT (fire 1, assess, re-fire: efficient, needs time window)
- **Missile flight is simulated**: boost → sustain → coast with energy bleed; intercept
  geometry matters (head-on good, tail-chase bad — same physics as real NEZ). Against
  maneuvering targets or at range extremes,Pk drops visibly.
- Guidance limits: finite **track channels** (e.g., 6 simultaneous engagements) — saturation
  raids overload channels, not just missiles.
- **Abort**: HOLD FIRE / self-destruct command after launch (if you realize the mistake —
  maybe).
- **Kill assessment**: the intercept is a flash + debris plots; "kill" is a judgment the
  player/system confirms (radar still shows the track? Was it a decoy?).

### 4.6 Threats & Magazines (real hardware, real numbers)
| Layer (player may command 1–2 in a mission) | Range | Notes |
|---|---|---|
| Patriot PAC-3 MSE | ~60–120 km, 25 km alt | hit-to-kill, best vs TBMs; 30-min launcher reload |
| NASAMS/AMRAAM | 25–40 km | vs drones/CRUISE |
| S-300/S-400 (playable in RU-scenarios) | up to 380 km (40N6) | same console concepts, different flavor |
| Iron Dome-style counter-rocket | 4–70 km | impact-point prediction: only fire if it will hit the defended area |
| Stinger/SHORAD | ~4.8 km | last-ditch manual |

**Threat classes with raid behavior**: Scud/Iskander TBMs (steep, seconds of warning),
terrain-following cruise missiles (pop up late), Shahed-style drone swarms (slow, saturating,
cheap — cost-exchange pressure), SEAD strike packages (HARMs hunt your radar — ties directly
into EMCON), strike fighters with stand-off jammers + MALD decoys, helos popping up nap-of-earth.

### 4.7 Procedural Raid Generator
Strike packages assembled from templates of real doctrine (DEAD shooters + escorts + jammers +
decoys + drone feints on a different axis). Parameters per campaign night: axis, timing, mix,
deception quality. The player never fights the same raid twice, but raids always *make sense*.

### 4.8 Consequence & Scoring (the Papers-Please layer)
- Every engagement ends in an outcome: clean kill / leak (base takes damage) / **fratricide**.
- Fratricide is not instant game-over: you finish the watch under investigation — radio goes
  quiet, the commander asks questions, then a **board of inquiry screen** replays YOUR decision
  timeline (the game has been recording everything) against the ROE in force. Career impact,
  crew morale effects, campaign story branches.
- Leaks cost base integrity/assets (persistent across a campaign): runways cratered, radar
  damaged, casualties (kept abstract: reports, not gore).
- Score = assets defended, interceptors spent (cost-exchange shown!), correct/incorrect IDs,
  ROE compliance. **The debrief screen is the emotional payoff.**

### 4.9 Watch-Life Systems (anti-boredom, pro-tension)
- Time compression (1×–60×) that auto-slows on new track/alarm.
- Ambient tasks with real value: radio checks, IFF code change windows (miss the window =
  friendlies won't squawk right → ambiguity later), system BITs that catch faults, weather
  front watching (clutter incoming), generator/fuel management.
- **Vigilance mechanic**: reaction bonuses for responding promptly; long uneventful stretches
  increase "rusty" debrief penalties if the player was skip-compressing blind (subtle, not a
  fake stamina bar).
- Radio chatter (procedural brevity lines) sells the world.

---

## 5. UI/UX — The Console

**One screen, diegetic console. Art direction: HOI4-style minimalism** (user decision):
dark desaturated panels (near-black slate/olive), thin 1px borders, muted amber accent for
headers/highlights, clean condensed sans typography, flat design with subtle depth — no heavy
CRT scanline effects. The scope itself keeps a *subtle* phosphor feel (soft blip decay, faint
glow) so it reads as a radar display, but the chrome around it stays Paradox-clean.

**Palette:**
- Panels `#14161a` / `#1e2126`, borders `#34383f`, text `#c9ccd1` / secondary `#878c93`
- Accent amber `#c9b37e`; hostile muted red `#a8433f`; friendly muted blue `#4a7ca8`;
  unknown muted amber `#b8a06a`; neutral muted green `#5f8b5f`

```
┌────────────────────────────────────────────────────────────────┐
│ STATUS BAR: ZULU time · DEFCON · WEAPONS TIGHT/RS · EMCON · IFF │
├───────────────────────────────┬────────────────────────────────┤
│                               │  TRACK TABLE (sortable)        │
│   PPI SCOPE (center-left)     │  ┌──┬────┬────┬────┬──────┐    │
│   range rings + sweep          │  │TN│CLAS│ID  │SPD│ALT   │    │
│   APP-6-style symbology:       │  ├──┼────┼────┼────┼──────┤    │
│   ○ friendly · ◇ hostile ·     │  │4172 ABT UNK 480 27000│     │
│   □ neutral · ✿ unknown        │  │4185 CRU HOS 540   100│     │
│   engagement zones overlay     │  └──┴────┴────┴────┴──────┘    │
│   intercept lines when engaged │  SELECTED TRACK DETAIL        │
│                               │  [IFF INTERROGATE] [DECLARE]   │
├───────────────────────┬───────┴────────────────────────────────┤
│ FIRE UNITS: ready/    │  COMMS LOG (radio + datalink msgs)     │
│ rounds/reload timers  │  [WCS request] [Report kill]           │
│ doctrine selector     │  SYSTEM: faults · BIT · generator       │
└───────────────────────┴────────────────────────────────────────┘
```

- **Symbology**: APP-6/MIL-STD-2525-inspired (shape = identity, color redundant; hostile
  diamond, friendly circle/dome, unknown quatrefoil). Blips fade like phosphor persistence.
- **Audio carries tension**: sweep hum, IFF chirp, tiered klaxons (new track / TBM inbound /
  ARM launch detected vs your site), radio brevity chatter, muffled impact booms on leaks
  (DEFCON lesson: restraint amplifies dread).
- **Alarm discipline**: false alarms exist; every alarm silenceable, silencing is a choice.
- **Onboarding**: qualification scenarios — one console function per scripted watch ("Today
  you learn the IFF panel"), then sandbox raids. No 40-page manual required.

---

## 6. Content — Campaigns (real conflicts, generic framing)

Scenario campaigns using real hardware and historically-inspired situations; each = 5–8 watches
with a persistent base/inventory/story:

1. **DESERT SHIELD/STORM 1991** (tutorial campaign): Patriot vs Scud. Tel Aviv/Riyadh nights,
   falling Scud debris classification problem, the infamous accuracy myths.
2. **IRAQI FREEDOM 2003**: the fratricide campaign. Tornado GR4 on the wrong corridor, F/A-18
   vs a false TBM track — the player sits in the same dilemmas the real crews did (training
   mission in empathy, not blame).
3. **UKRAINE 2022+** (fictionalized front line): mixed S-300/Patriot battery vs Shahed swarms,
   Iskanders, and permanent SEAD pressure — the EMCON/shoot-and-scoot campaign.
4. **IRON SHIELD**: counter-rocket/counter-drone watch; only engage what will hit the city —
   impact-point prediction decisions under saturation.
5. **STRAIT STRESS** (Iran–US flavored generic): airliner-dense airspace + drone incidents;
   identification discipline is everything (the PS752/Vincennes lesson, played straight).

**Tone rule:** consequences shown as reports, inquiries, and radio silence — sober, never
gratuitous. Real names for hardware; scenarios labeled "inspired by historical events."

---

## 7. Tech Architecture (web)

- **TypeScript + Vite**, no heavyweight engine; **Canvas 2D** for the console (fast, perfect
  for CRT aesthetic; upgradeable to WebGL later if needed).
- **Simulation core**: fixed-timestep (e.g., 50 Hz) deterministic sim — entities (aircraft,
  missiles, chaff, decoys), sensors, weapons — decoupled from rendering. Determinism keeps
  replays/debriefs (§4.8) trivial: record inputs, replay the watch.
- **Modules**:
  - `sim/` — world, entities, flight models (simple point-mass kinematics per class),
    radar/detection model, missile guidance (proportional navigation), IFF, raid generator.
  - `console/` — PPI renderer (sweep, persistence buffer, symbology), track table, panels.
  - `director/` — mission script/state machine, AI commander voice, pacing/time-compression.
  - `audio/` — Web Audio API synth (tones, klaxons) + procedural radio chatter (TTS-lite or
    sampled phrase bank).
  - `data/` — JSON scenario definitions (hardware stats, raids, ROE scripts, campaigns).
  - `debrief/` — replay renderer + scoring/inquiry screens.
- **Persistence**: localStorage (campaign state, best scores); export/import save JSON.
- **Performance targets**: 200+ concurrent entities, 60 fps on integrated graphics.
- **Deployment**: static site (any host); optional itch.io/Steam wrapper later (Electron/Tauri).

---

## 8. Roadmap

| Milestone | Deliverable | Playable? |
|---|---|---|
| **M1 — "The Scope"** | Console shell + PPI with sweep, plots, phosphor fade; scripted tracks flying; time controls | visually |
| **M2 — "The Picture"** | Sim core: detection model (horizon/RCS/SNR), track initiation/decay, track table, classification labels, EMCON modes | watch it work |
| **M3 — "The Decision"** | IFF + flight-plan correlation + declare hostile + ROE states; false-track scenarios; consequence flags | first real tension |
| **M4 — "The Shot"** | Fire units, doctrines, missile flight model, intercept/kill assessment, reloads, channels, saturation raids | **vertical slice** |
| **M5 — "The War"** | Campaign 1 (Desert Storm) complete: debriefs, scoring, investigation flow, save/load, audio, chatter | **MVP / friends test** |
| **M6 — "The Career"** | Campaigns 2–5, raid generator tuning, difficulty curves, polish, deploy | release candidate |
| **Future** | Commander role, crew stations, co-op multiplayer, dynamic persistent campaign | post-v1 |

---

## 9. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Boredom reads as *boring* | Aggressive time compression + ambient tasks with teeth + pacing director per scenario |
| Complexity wall | Qualification tutorial watches; one new system per mission; assist layer (labels/tips) toggleable |
| Fratricide content too heavy | Sober report-style consequences; inquiry replay framed as learning; no gratuitous imagery |
| Web perf with big raids | Canvas batching, entity pooling, sim rate decoupled from render |
| Scope creep (roles/multiplayer) | Locked out of v1 by design; architecture keeps sim deterministic & modular for later |

---

## 10. Research Sources (selected)

- [CNAS — Patriot Wars](https://www.cnas.org/publications/reports/patriot-wars) (automation bias, fratricides, operator workload)
- [FM 44-85 Patriot Battalion Operations (PDF)](https://www.ausairpower.net/PDF-A/FM-44-85-Patriot-Battalion-and-Battery-Operations.pdf)
- [Wikipedia — MIM-104 Patriot](https://en.wikipedia.org/wiki/MIM-104_Patriot) · [Radar horizon](https://en.wikipedia.org/wiki/Radar_horizon) · [IFF](https://en.wikipedia.org/wiki/Identification_friend_or_foe) · [NATO symbology](https://en.wikipedia.org/wiki/NATO_Joint_Military_Symbology)
- [Kill chain F2T2EA](https://en.wikipedia.org/wiki/Kill_chain_(military)) · [AFTTP 3-2.5 BREVITY (PDF)](https://static.e-publishing.af.mil/production1/lemay_center/publication/afttp3-2.5/afttp3-2.5.pdf)
- [CSIS Missile Threat — Patriot](https://missilethreat.csis.org/system/patriot/) · [S-400](https://www.globalsecurity.org/military/world/russia/s-400-missiles.htm) · [Stinger](https://en.wikipedia.org/wiki/FIM-92_Stinger)
- [PS752 Factual Analysis](https://international.canada.ca/en/global-affairs/corporate/reports/flight-ps752/factual-analysis) · [Iran Air 655](https://en.wikipedia.org/wiki/Iran_Air_Flight_655) (identification failure case studies)
- [SAM Simulator](https://samsim.info) · [Air Defender (Steam)](https://store.steampowered.com/app/3985030/Air_Defender/) · [Command: Modern Operations](https://store.steampowered.com/app/1076160/Command_Modern_Operations/) (market comparables)
- [Mackworth vigilance research](https://en.wikipedia.org/wiki/Mackworth_Clock) · [Alert fatigue (AHRQ)](https://psnet.ahrq.gov/primer/alert-fatigue) (watch-life design)
