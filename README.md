# SENTINEL — Air Defense Operator

> You are the fire-control operator of a surface-to-air missile battery. You don't fly the jet,
> you don't command the war — you sit in a dark shelter, watch a radar scope for hours, and own
> the decision that takes 30 seconds and lives with you forever.

A browser-based "job simulator" where you perform the real tasks of an air defense fire-control
operator: radar surveillance, classification, IFF identification, engagement authority under
rules of engagement, missile employment, and kill assessment — against strike packages drawn
from real conflicts.

**No installation** — TypeScript + Vite + Canvas/Three.js, zero runtime dependencies.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

## How a watch works

1. **DETECT** — the PPI scope paints what the radar actually sees: detection is gated by the
   radar horizon (`4.12·(√h_radar + √h_t)`), target radar cross-section, weather, and your EMCON
   mode. Low flyers appear late. Weak contacts flicker in the marginal band.
2. **CLASSIFY** — the computer labels tracks from kinematics only (speed/altitude/heading
   behavior): CRU (fast + deck-hugging), TBM (hypersonic), UAV?, HELO?, BIRD?… some genuinely
   ambiguous. That's your problem.
3. **IDENTIFY** — interrogate IFF (Mode 4/Mode C), cross-check the ATO flight-plan panel by
   hand, weigh behavior. **No reply is not a verdict — it's a question.**
4. **ENGAGE** — MASTER ARM, pick a doctrine (shoot-shoot vs shoot-look-shoot), fire, and ride
   the interceptor. Missiles have real energy: boost → sustain → coast, and kill probability
   falls with range and tail-chase geometry. Sixteen rounds, six channels, eight-minute
   launcher reloads.
5. **ASSESS** — every watch ends in an after-action report: kills, leakers, violations — and
   if you shot the wrong aircraft, a Board of Inquiry replays your decisions against the ROE
   in force. *You were the one who said launch.*

### The systems in play

- **EMCON**: radiate, focus a sector (deep detection inside, blind outside), or go silent
  (invisible to anti-radiation missiles — but blind, and tracks fade).
- **Rules of engagement**: WEAPONS HOLD / TIGHT / FREE change mid-watch; declaring a track
  hostile under TIGHT requires your judgment on the evidence.
- **AUTO ENGAGE**: hand the system your authority under WEAPONS FREE and it will engage
  anything not positively friendly — the automation-bias trap from the real 2003 fratricides,
  playable. ABORT always works.
- **Scenarios**: a five-watch DESERT STORM 1991 campaign (Scud TBMs, the corridor night,
  saturation, the long night) plus four trial watches.

### Controls

| Key | Action |
|---|---|
| ←/→ or click | select track (table, scope, 3D view) |
| I | IFF interrogate |
| H / F | declare hostile / friendly |
| K | master arm |
| E | engage selected track |
| X | abort / self-destruct missiles in flight |
| D | drop track |
| 1/2/3, Space | time compression / pause |
| T | truth overlay (debug) |
| drag / wheel | orbit / zoom the 3D tactical view |

## Development

```bash
npm run build   # production bundle in dist/
```

Architecture: deterministic fixed-timestep sim (`src/sim/`) fully decoupled from the console
renderers (`src/console/`: PPI canvas, Three.js tactical view, DOM panels) and the director/
campaign state machines. Scenarios are data (`src/sim/scenarios/`).

Built milestone by milestone (design doc in `GAME_DESIGN.md`):
The Scope → The Picture → The Decision → The Shot → The War.
