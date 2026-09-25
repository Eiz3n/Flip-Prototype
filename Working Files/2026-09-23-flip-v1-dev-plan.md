# Flip v1 — Dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the engine and backbone of Flip v1 — a playable browser build of two rooms (title → room 1 → room 2 → win) with every tuning value in config files, every level in its own file, and clearly marked slots where the art plan plugs in assets, drawings and animations.

**Architecture:** Vite + vanilla JS in `game/`. A pure simulation (`src/sim/`, no DOM, no clock) exposes `createWorld` / `startRoom` / `step`; `step` returns event names. `src/game.js` runs the state machine on top of the sim. `src/view/` reads state and consumes events for drawing and juice — it never mutates the sim. Levels live one-per-file in `src/levels/`. Art is procedural canvas drawing: one module per drawable in `src/view/art/`, one registry of animations in `src/view/anim/`, all colours / sizes / timings in `src/theme.js`.

**Tech Stack:** Vite (build/dev server), Vitest (tests, Node environment), Canvas 2D, ES modules. No runtime dependencies.

**Spec:** [2026-09-23-flip-v1-design.md](2026-09-23-flip-v1-design.md) — read it alongside this plan. Behaviour not in the spec comes from the TDD via the wiki: [tuning parameters](../wiki/entities/tuning-parameters.md), [polarity & force model](../wiki/concepts/polarity-force-model.md), [latch, orbit & launch](../wiki/concepts/latch-orbit-launch.md), [wall wave](../wiki/concepts/wall-wave.md), [collision & input](../wiki/concepts/collision-and-input.md), [game loop](../wiki/systems/game-loop-state-machine.md).

**Companion plan:** the Art & Design plan (written separately) fills the art slots this plan creates. This plan ships **blockout art** — correct shapes, colours and sizes from `theme.js`, no polish — so the game is fully playable before art lands.

## Global Constraints

- Logical room 360 × 640, y down, origin top-left. Physics side walls at inner edges **x = 10 and x = 350**; centre line x = 180. Top wall y 0–6, bottom wall y 634–640, both kill.
- Fixed physics step **1/120 s**, accumulator loop, frame delta clamped to **0.25 s**, loop paused on `visibilitychange`.
- `src/sim/` is pure: **no `window`, `document`, `performance`, `Date`, `Math.random`, canvas**. No per-step object allocation (no `{}`, `[]`, `new`, closures inside `step`).
- Every gameplay number lives in `src/config.js`; every colour, size, font and animation timing lives in `src/theme.js`. Logic files contain no magic numbers beyond 0, 1, 2, π.
- Per-room values (wave, `minOrbitSpeed`, windows, shafts, hook points, obstacles) live **only** in that room's level file.
- Palette `#6FA8DC` positive, `#E27D7D` negative, `#EDE6D8` background, `#26252E` ink, `#A9A4B5` neutral. Blue = +1, red = −1 everywhere; every polarity shape carries a `+` / `−` ink mark.
- Flat fills and strokes only — no gradients, blur, shadows. Particles from a fixed pool of **200**. Canvas DPR capped at **2**.
- No runtime network requests. Font is self-hosted `public/fonts/baloo2-subset.woff2`; fallback `ui-rounded, system-ui, sans-serif`; wait at most **1 s** for it.
- Best time key `flip.bestTime.v1` (milliseconds); all `localStorage` access in try/catch.
- `vite.config.js` uses `base: './'`. `dist/` under **200 KB**.
- `config.launchPreview = false`. Audio is out of scope.
- Project rule: plans and specs live in `Working Files/`; code lives in `game/`. Commits go to the `Dev` branch.
- Project logs (CLAUDE.md): every new or edited `.md` file (for example `game/README.md`) ends with a Decision Log block. Every new folder, deletion or move is appended to **both** `Commands and Logs/directory-log.md` and `Maintenance/setup-log.md` (Structural Change Log), in their existing formats. Task 1 logs the `game/` tree; later tasks log any folder they add (`src/levels/`, `src/view/`, `src/view/anim/`, `src/view/art/`) in the same commit.
- Shell: run `bash` blocks in Git Bash (the Bash tool). Python, if ever needed, is `py -3`.

## Deviation from the spec

| Spec | This plan | Why |
|---|---|---|
| `src/sim/rooms.js` holds both room definitions | `src/levels/` — one file per room plus `index.js` (ordered list) and `validate.js` | User request: each level segmented so it can be found and modified on its own. Adding room 3 = one new file + one line in `index.js`. |
| `step` returns event objects | `step` returns an array of event **name strings**; the view reads positions from world state | Keeps `step` allocation-free |
| TDD rule 7: launch assist nudges "toward the nearest hook point field … or the exit" | Nudges toward the **best-aligned** target inside a 45° cone: the exit mouth, or a hook point within `maxReach` that will **attract** the player after the flip | "Nearest" can pick a hook behind the player; a same-colour hook would repel, so nudging toward it hurts |
| TDD rule 6: the launch uses the orbit angle from 60 ms before the tap | Velocity is aimed from the rewound angle; the player's **position** stays at the live angle | Moving the player back along the orbit jumps it up to ~11 units on screen |
| TDD obstacle response: sliding speed × `obstacleFriction` on contact (applied per step in the first draft of this plan) | × `obstacleFriction` **once**, on the step contact starts | Per-step friction plus the updraft pinned players under room 1's bar forever (review M1) |
| No death except wall contact | **Stall death:** touching a solid and moving slower than `stallSpeed` (5 u/s) for `stallTime` (3 s, configurable, 0 disables) → `death` | A cushioned player settles at x 180 where wall pull is zero, and the required centre-line obstacle can hold it there; there is no restart input. User choice: stall death, time configurable |
| `src/view/render.js` draws everything | `render.js` only orders the draw; each drawable is a module in `src/view/art/`, each animation an entry in `src/view/anim/effects.js` | Gives the art plan one file per asset to own |

---

## File structure

Everything below is created by this plan. `(art)` marks files whose **bodies** the Art & Design plan replaces — this plan writes the blockout version and the function signature that must not change.

```
game/
  README.md                      map of this tree + "how to add a room / an asset" (Task 1)
  index.html                     canvas, @font-face for Baloo 2, touch-action: none
  package.json                   scripts: dev, build, preview, test
  vite.config.js                 base './', vitest env node
  public/
    fonts/
      baloo2-subset.woff2        (art) delivered by the art plan; game runs without it
  src/
    main.js                      boot, canvas + DPR resize, fixed-step loop, visibility pause
    game.js                      state machine, run timer, deaths, best time, slow-mo
    config.js                    every gameplay number (TDD table + v1 shaft/timing values)
    theme.js                     (art) colours, fonts, stroke widths, sizes, fx timings
    input.js                     pointerdown / Space → game.tap(timeStamp), one per press
    levels/
      index.js                   ordered LEVELS array — the only place room order lives
      room-01-sidestep.js        room 1 data + intended-route comment
      room-02-cluster.js         room 2 data + intended-route comment
      validate.js                authoring-rule checks; throws with the room index
    sim/                         PURE — no DOM, no clock, no allocation in step()
      vec.js                     in-place vector helpers
      wave.js                    polarityAt, frontY
      entities.js                Player, HookPoint, Obstacle classes
      room.js                    Room: build from level data, reset(), updateBob()
      physics.js                 forces, integration, grace, latch, orbit, launch, assist, entry launch
      collision.js               obstacles + shaft posts, exit capture, death
      world.js                   createWorld, startRoom, step → event names
    view/
      camera.js                  pan (0.4 s ease-out cubic) + shake
      particles.js               fixed pool of 200
      fonts.js                   load Baloo 2 with a 1 s cap
      render.js                  draw order only; calls art modules
      screens.js                 (art) title + win screen layout
      anim/
        ease.js                  easing functions
        effects.js               (art) event → animation registry: timers, trail, pops, bursts
      art/                       (art) one module per drawable
        marks.js                 + / − glyphs
        walls.js                 side bands, top/bottom walls, wave front line
        shaft.js                 exit doorway, entry hatch, chevrons, pull cue
        hookPoint.js             hook circle, field ring, latch pop
        player.js                player circle, trail, tether, flip ring
        obstacle.js              bars / squares, hit flash
        updraft.js               drifting dashes
        hud.js                   room / timer / deaths
        logo.js                  "Flip" with the upside-down F
  test/
    helpers.js                   blank test level + world builder
    purity.test.js               sim/ never touches DOM / clock
    config.test.js  wave.test.js  room.test.js  levels.test.js
    physics.test.js  latch.test.js  collision.test.js  world.test.js
    bots.test.js  game.test.js  view.test.js
```

## Where things go — the art ↔ code contract

This section is what the Art & Design plan builds against. Signatures here are fixed; bodies are free.

| You want to change… | Edit | Never edit |
|---|---|---|
| A colour, stroke width, radius, font weight, animation duration | `src/theme.js` | art modules (they read theme) |
| How a thing looks | its module in `src/view/art/` | `src/sim/`, `src/game.js` |
| What happens visually on an event (latch, flip, death…) | `src/view/anim/effects.js` | `src/sim/` |
| A gameplay number (force, speed, timing window) | `src/config.js` | `theme.js` |
| A room's layout or difficulty | its file in `src/levels/` | any other file |
| Room order / adding a room | `src/levels/index.js` + a new `room-NN-name.js` | — |
| The font file | `public/fonts/baloo2-subset.woff2` (same name) | `index.html` |

**Art module signatures** (all draw in room-local logical units; `ctx` is already translated for camera and room offset):

```js
// art/walls.js
export function drawWalls(ctx, room, wave, theme)            // wave = { frontY, polAbove, polBelow }
// art/shaft.js
export function drawExitDoorway(ctx, x, time, theme)          // time drives chevron scroll
export function drawEntryHatch(ctx, x, time, theme)
// art/hookPoint.js
export function drawHookPoint(ctx, hook, playerInside, pop, theme)    // pop 1 → 0 over latchPopTime
// art/player.js — x, y are the render-interpolated position
export function drawPlayer(ctx, x, y, player, fx, theme)      // fx.trail, fx.flipRing
export function drawTether(ctx, x, y, hook, theme)
// art/obstacle.js
export function drawObstacle(ctx, obstacle, flash, theme)     // flash 1 → 0 over obstacleFlashTime; also used for shaft posts
// art/updraft.js
export function drawUpdraft(ctx, time, theme)
// art/hud.js
export function drawHud(ctx, hud, theme)                      // hud = { room, rooms, timeMs, deaths, roomPop }
// art/logo.js
export function drawLogo(ctx, cx, cy, size, flipped, theme)
// art/marks.js
export function drawMark(ctx, x, y, size, pol, theme)
```

**Effects registry** (`anim/effects.js`) — the only place event → animation wiring lives:

```js
export function createEffects(theme)                          // preallocates everything
export function handleEvent(fx, type, world)                  // type = sim/game event name
export function updateEffects(fx, dt, world)
// fx fields read by render: fx.trail, fx.flipRing, fx.latchPop (Map hook→t), fx.obstacleFlash (Map),
//   fx.roomPop, fx.particles, fx.shakeRequest
```

**Known blockout issues handed to the Art & Design plan** (found in review; not fixed here because they are layout and type decisions):

- The HUD room label (`1 / 2`, drawn from x 18 at y 12) overlaps room 2's exit doorway (x 57–133, ink interior), so the ink text vanishes there. HUD placement or a backing plate is needed.
- The run timer is centred but not tabular — Baloo 2's digit widths vary, so the time jitters as it counts. Use tabular figures in the font subset, or draw each digit in a fixed-width cell.
- The font file does not exist yet; until it does the dev server logs one font decode warning (see Task 12 Step 9).

**Events the view can react to** (strings): `flip`, `latch`, `launch`, `entryLaunch`, `obstacleHit`, `nearMiss`, `death`, `exitCaptured`, `win` (from the sim) and `titleTap`, `roomStart`, `toTitle` (from `game.js`).

---

## Tasks

1. Scaffold `game/`, README map, smoke test
2. `config.js` + `theme.js`
3. `vec.js` + `wave.js`
4. Entities, level files, validator, `room.js`
5. Free-flight physics: fields, walls, cushion, updraft, grace
6. Latch, orbit, launch, assist, latency compensation
7. Collision: obstacles, shaft posts, exit pull + capture, death
8. `world.js`: `createWorld`, `startRoom`, `step`, tap buffering, events
9. Passive bots
10. `game.js` state machine + `input.js`
11. View core: camera, particles, effects registry
12. Blockout art modules, `render.js`, screens, fonts, `main.js`
13. Build, size and performance check

---

### Task 1: Scaffold `game/`, README map, purity test

**Files:**
- Create: `game/package.json`, `game/vite.config.js`, `game/index.html`, `game/README.md`, `game/.gitignore`
- Create: `game/src/sim/.gitkeep`, `game/public/fonts/.gitkeep`
- Test: `game/test/purity.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test`, `npm run dev`, `npm run build` inside `game/`; the purity test guards every later `src/sim/` file.

- [ ] **Step 1: Create `game/package.json`**

```json
{
  "name": "flip-game",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Install dev dependencies**

Run (from repo root): `cd game && npm install -D vite vitest`
Expected: `node_modules/` created, `package.json` gains a `devDependencies` block with `vite` and `vitest`.

- [ ] **Step 3: Create `game/vite.config.js` and `game/.gitignore`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
```

```gitignore
node_modules/
dist/
```

- [ ] **Step 4: Write the failing purity test** — `game/test/purity.test.js`

```js
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { test, expect } from 'vitest';

const SIM_DIR = fileURLToPath(new URL('../src/sim/', import.meta.url));
const BANNED = [
  /\bwindow\b/, /\bdocument\b/, /\bperformance\b/, /\bDate\b/,
  /Math\.random/, /getContext/, /localStorage/, /requestAnimationFrame/,
];

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

test('src/sim/ never touches the DOM, the clock or randomness', () => {
  const files = readdirSync(SIM_DIR).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const code = stripComments(readFileSync(join(SIM_DIR, file), 'utf8'));
    for (const pattern of BANNED) {
      expect(code, `${file} uses ${pattern}`).not.toMatch(pattern);
    }
  }
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `cd game && npx vitest run test/purity.test.js`
Expected: FAIL — `ENOENT: no such file or directory, scandir '.../src/sim/'`

- [ ] **Step 6: Create the empty folders**

Create empty files `game/src/sim/.gitkeep` and `game/public/fonts/.gitkeep`.

- [ ] **Step 7: Run it to verify it passes**

Run: `cd game && npx vitest run test/purity.test.js`
Expected: PASS (1 test)

- [ ] **Step 8: Create `game/index.html`**

The font is loaded from JS (`src/view/fonts.js`, Task 12) so a missing font file never breaks the Vite build.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Flip</title>
    <style>
      html, body { margin: 0; height: 100%; background: #EDE6D8; overflow: hidden; }
      canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    </style>
  </head>
  <body>
    <canvas id="game"></canvas>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 9: Create `game/README.md`** — the map a newcomer reads first

Contents (plain Markdown):

- Title `# Flip — game code`, then one line: Vite + vanilla JS. `npm install`, then `npm run dev` (play), `npm test` (sim tests), `npm run build` (static `dist/`).
- `## Where things live` — this table:

| Folder / file | Holds | Rule |
|---|---|---|
| `src/config.js` | every gameplay number | logic files read numbers from here |
| `src/theme.js` | every colour, font, stroke, size, fx timing | art files read style from here |
| `src/levels/` | one file per room, `index.js` sets the order | a room's numbers live only in its file |
| `src/sim/` | the simulation | pure: no DOM, no clock, no allocation in `step()` |
| `src/game.js` | state machine, timer, deaths, best time | talks to sim through `startRoom` / `step` only |
| `src/view/art/` | one module per drawable | reads sim state, never changes it |
| `src/view/anim/effects.js` | event → animation wiring | the only place events become juice |
| `public/fonts/` | `baloo2-subset.woff2` | keep the file name |

- `## Add a room` — numbered: (1) copy `src/levels/room-02-cluster.js` to `src/levels/room-03-<name>.js` and set `index: 3`; (2) set `entry.x` to room 2's `exit.x`; (3) add it to the array in `src/levels/index.js`; (4) `npm test` — the validator and both passive bots must pass.
- `## Change how something looks` — one paragraph: find the drawable in `src/view/art/` or the value in `src/theme.js`. Collision shapes (player radius, shaft posts) come from `src/config.js`; change them there so drawing and physics stay matched.
- End with the project Decision Log block: `---`, `## Decision Log`, one entry `### [DD-MM-YY] — Game README created` (map of the tree, add-a-room and change-a-look notes).

- [ ] **Step 9b: Log the new tree**

Append `CREATED | game/` (Vite project: `src/sim/`, `public/fonts/`, `test/`) to both `Commands and Logs/directory-log.md` and `Maintenance/setup-log.md` (Structural Change Log), in their existing formats.

- [ ] **Step 10: Commit**

```bash
git add game/package.json game/package-lock.json game/vite.config.js game/.gitignore game/index.html game/README.md game/src/sim/.gitkeep game/public/fonts/.gitkeep game/test/purity.test.js "Commands and Logs/directory-log.md" Maintenance/setup-log.md
git commit -m "chore(game): scaffold Vite project with sim purity test"
```

---

### Task 2: `config.js` and `theme.js`

**Files:**
- Create: `game/src/deepFreeze.js`, `game/src/config.js`, `game/src/theme.js`
- Test: `game/test/config.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `import { config } from '../src/config.js'` and `import { theme } from '../src/theme.js'` — both deep-frozen. Every later task reads numbers through these names. Tests needing other values pass a copy: `{ ...config, k: 0 }`.

**Split rule:** anything that collides or moves (radii, shaft geometry, speeds) is in `config`. Anything purely visual (colours, strokes, animation timings, the hook point's drawn radius) is in `theme`. Art modules read geometry from `config` so drawings match physics.

- [ ] **Step 1: Write the failing test** — `game/test/config.test.js`

```js
import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { theme } from '../src/theme.js';

test('config holds the TDD tuning table', () => {
  expect(config).toMatchObject({
    step: 1 / 120,
    k: 2_000_000, kWall: 400_000, wallDamping: 6, centerPush: 80, safeGap: 12, dMin: 24,
    fieldRadius: 70, exitFieldRadius: 50, latchRadius: 30, orbitRadius: 30,
    maxOrbitSpeed: 6, orbitDrag: 0.8, launchImpulse: 180, entryLaunchSpeed: 240,
    relatchCooldown: 0.25, riseSpeed: 60, updraftGain: 3, drag: 0.25, maxSpeed: 480,
    obstacleFriction: 0.85, centerLineClearance: 20, maxReach: 220, wallMargin: 30,
    waveGrace: 0.4, waveGraceRamp: 0.15, inputLatencyComp: 0.06, launchAssist: 6,
    playerRadius: 8, nearMissDistance: 6, minWavePeriod: 4, launchPreview: false,
    bestTimeKey: 'flip.bestTime.v1',
  });
});

test('config holds the v1 room, shaft and timing geometry', () => {
  expect(config.room).toEqual({ width: 360, height: 640, wallBand: 10, topWall: 6, bottomWall: 6 });
  expect(config.shaft).toMatchObject({ opening: 60, depth: 46, postWidth: 8, postOverhang: 6,
    exitMouthY: 52, entryMouthY: 588, spawnY: 580, entryZoneRadius: 50 });
  expect(config.timing).toMatchObject({ titleFlipTime: 0.25, dyingTime: 0.6, readyBeat: 0.5, panTime: 0.4 });
  expect(config.bob).toEqual({ ampX: 8, ampY: 5, freq: 0.4, phaseStep: 1.1 });
  expect(config.exitXRanges).toEqual([[80, 110], [250, 280]]);
  expect(config).toMatchObject({ stallTime: 3, stallSpeed: 5, obstacleGap: 48 });
});

test('config and theme are deep-frozen', () => {
  expect(Object.isFrozen(config)).toBe(true);
  expect(Object.isFrozen(config.shaft)).toBe(true);
  expect(Object.isFrozen(theme.color)).toBe(true);
});

test('theme holds the canvas palette and font', () => {
  expect(theme.color).toEqual({
    positive: '#6FA8DC', negative: '#E27D7D', background: '#EDE6D8', ink: '#26252E', neutral: '#A9A4B5',
  });
  expect(theme.font.family.startsWith("'Baloo 2'")).toBe(true);
  expect(theme.font).toMatchObject({ logo: 800, hud: 700, body: 400 });
  expect(theme.size.hook).toBe(14);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/config.test.js`
Expected: FAIL — `Failed to resolve import "../src/config.js"`

- [ ] **Step 3: Write `game/src/deepFreeze.js`**

```js
export function deepFreeze(obj) {
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') deepFreeze(value);
  }
  return Object.freeze(obj);
}
```

- [ ] **Step 4: Write `game/src/config.js`**

```js
// Every gameplay number. Distances in logical units (room 360 × 640), times in seconds.
// TDD values: wiki/entities/tuning-parameters.md. v1 additions are marked.
import { deepFreeze } from './deepFreeze.js';

export const config = deepFreeze({
  step: 1 / 120,
  maxFrameDelta: 0.25,          // clamp after a tab switch

  room: { width: 360, height: 640, wallBand: 10, topWall: 6, bottomWall: 6 },

  // Hook point fields
  k: 2_000_000,
  dMin: 24,
  fieldRadius: 70,
  exitFieldRadius: 50,          // v1: radius of the exit doorway pull zone

  // Walls
  kWall: 400_000,
  wallDamping: 6,
  centerPush: 80,
  safeGap: 12,

  // Updraft
  riseSpeed: 60,
  updraftGain: 3,
  drag: 0.25,
  maxSpeed: 480,

  // Latch / orbit / launch
  latchRadius: 30,
  orbitRadius: 30,
  maxOrbitSpeed: 6,
  orbitDrag: 0.8,
  launchImpulse: 180,
  entryLaunchSpeed: 240,
  relatchCooldown: 0.25,

  // Wave
  waveGrace: 0.4,
  waveGraceRamp: 0.15,
  minWavePeriod: 4,

  // Human timing aids
  inputLatencyComp: 0.06,       // 0 disables
  launchAssist: 6,              // degrees, 0 disables
  launchAssistCone: 45,         // v1: only nudge toward targets within this many degrees
  launchPreview: false,         // v1: off (spec §2)

  // Obstacles: sliding speed along an edge is multiplied by this once, on the step contact starts
  obstacleFriction: 0.85,
  contactSlop: 0.5,             // v1: resting within this of a solid still counts as touching

  // v1 stall death: touching a solid and moving slower than stallSpeed for stallTime seconds
  // counts as a death, so a player pinned under a centre-line obstacle is never stuck forever.
  stallTime: 3,                 // seconds; 0 disables
  stallSpeed: 5,                // units/s

  // Room authoring rules (checked by levels/validate.js)
  centerLineClearance: 20,
  maxReach: 220,
  wallMargin: 30,
  exitXRanges: [[80, 110], [250, 280]],   // v1 spec §6.1
  obstacleGap: 48,                        // v1 spec §6: each obstacle leaves this gap to a wall on one side

  // Bodies
  playerRadius: 8,
  nearMissDistance: 6,

  // v1: exit doorway and entry hatch (spec §6.1)
  shaft: {
    opening: 60,
    depth: 46,
    postWidth: 8,
    postOverhang: 6,
    exitMouthY: 52,
    entryMouthY: 588,
    spawnY: 580,
    entryZoneRadius: 50,
  },

  // Default hook point bob; a level may override per hook point
  bob: { ampX: 8, ampY: 5, freq: 0.4, phaseStep: 1.1 },

  // State machine timings
  timing: {
    titleFlipTime: 0.25,        // v1: the logo's F flips on the title tap before the run starts
    dyingTime: 0.6,
    readyBeat: 0.5,
    panTime: 0.4,
    nearMissSlowmo: 0.08,
    deathSlowmo: 0.3,
    slowmoScale: 0.3,
  },

  bestTimeKey: 'flip.bestTime.v1',
});
```

`obstacleFriction`: the TDD's pseudocode multiplies sliding speed by 0.85; its table calls it "share lost". This plan follows the pseudocode, applied **once per contact** — applied every 1/120 s step, the updraft pins a player under a bar with no sideways speed (plan review M1). Flag to the user in playtest if obstacles feel too sticky or too slippery.

- [ ] **Step 5: Write `game/src/theme.js`** — blockout values from spec §4; the art plan re-syncs this file from the canvas

```js
// Every visual value. Read from the Flip Art canvas (spec §4). Geometry that collides lives in config.js.
import { deepFreeze } from './deepFreeze.js';

export const theme = deepFreeze({
  color: {
    positive: '#6FA8DC',
    negative: '#E27D7D',
    background: '#EDE6D8',
    ink: '#26252E',
    neutral: '#A9A4B5',
  },
  font: {
    family: "'Baloo 2', ui-rounded, system-ui, sans-serif",
    logo: 800, hud: 700, body: 400,
    logoSize: 72, hudSize: 18, bodySize: 16, titleSize: 28,
    file: './fonts/baloo2-subset.woff2', weights: '400 800', loadTimeoutMs: 1000,
  },
  render: { maxDpr: 2 },
  stroke: { ink: 2 },
  size: { hook: 14, markScale: 0.55 },
  field: { idleWidth: 1, idleAlpha: 0.2, insideWidth: 2, insideAlpha: 0.5 },
  tether: { width: 1, alpha: 0.5 },
  walls: { innerEdge: 2, frontLineWidth: 1 },
  shaft: {
    postOutline: 2,
    chevronWidth: 18, chevronAlphas: [0.35, 0.65, 1], chevronSpacing: 12, chevronSpeed: 20,
    pullCueLength: 64, pullCueAlpha: 0.4, pullCueAngle: 30,
  },
  updraft: { dashWidth: 2, dashLength: 12, alpha: 0.14, count: 14, speed: 20 },
  hud: { y: 12, sidePad: 18 },
  fx: {
    latchPopScale: 1.1, latchPopTime: 0.12,
    flipRingTime: 0.25, flipRingGrow: 10,
    roomPopTime: 0.6,
    obstacleFlashTime: 0.15,
    trailDots: 5, trailInterval: 0.03,
    launchPuffCount: 6, launchPuffSpeed: 60, launchPuffSpread: 1.2,   // spread in radians
    deathBurstCount: 24, deathBurstSpeed: 140,
    particleLife: 0.5, particleSize: 3,
    entryShake: { amount: 3, time: 0.1 },
    deathShake: { amount: 10, time: 0.3 },
  },
});
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd game && npx vitest run test/config.test.js`
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add game/src/deepFreeze.js game/src/config.js game/src/theme.js game/test/config.test.js
git commit -m "feat(game): add config and theme token files"
```

---

### Task 3: `vec.js` and `wave.js`

**Files:**
- Create: `game/src/sim/vec.js`, `game/src/sim/wave.js`
- Test: `game/test/wave.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `vec.js`: `set(o, x, y)`, `len(x, y) → number`, `clampLen(v, max)` (in place), `rotate(v, rad)` (in place). Plain `{x, y}` objects; nothing allocates.
  - `wave.js`: `polarityAt(s, t, period, height, startPol) → ±1`, `frontY(t, period, height) → number`, `wallPolAt(room, y) → ±1` (reads `room.wave.{enabled, period, startPol}`, `room.time`, `room.height`).

- [ ] **Step 1: Write the failing test** — `game/test/wave.test.js`

```js
import { test, expect } from 'vitest';
import { polarityAt, frontY, wallPolAt } from '../src/sim/wave.js';
import { set, len, clampLen, rotate } from '../src/sim/vec.js';

const H = 640, T = 6.5;

test('at t = 0 every height shows the starting polarity', () => {
  for (let s = 10; s < H; s += 50) expect(polarityAt(s, 0, T, H, +1)).toBe(+1);
});

test('above the front shows the new polarity, below the old', () => {
  const t = 0.25 * T;                        // front at 160
  expect(frontY(t, T, H)).toBeCloseTo(160);
  expect(polarityAt(100, t, T, H, +1)).toBe(-1);
  expect(polarityAt(200, t, T, H, +1)).toBe(+1);
});

test('the next front brings the opposite polarity again', () => {
  const t = 1.25 * T;                        // second front at 160
  expect(polarityAt(100, t, T, H, +1)).toBe(+1);
  expect(polarityAt(200, t, T, H, +1)).toBe(-1);
  expect(polarityAt(200, t, T, H, -1)).toBe(+1);
});

test('wallPolAt reads the room and ignores time when the wave is off', () => {
  const room = { wave: { enabled: true, period: T, startPol: -1 }, time: 0.25 * T, height: H };
  expect(wallPolAt(room, 100)).toBe(+1);
  room.wave = { enabled: false, period: T, startPol: -1 };
  expect(wallPolAt(room, 100)).toBe(-1);
});

test('vector helpers work in place', () => {
  const v = { x: 0, y: 0 };
  set(v, 30, 40);
  expect(len(v.x, v.y)).toBe(50);
  clampLen(v, 10);
  expect(v.x).toBeCloseTo(6); expect(v.y).toBeCloseTo(8);
  set(v, 1, 0); rotate(v, Math.PI / 2);
  expect(v.x).toBeCloseTo(0); expect(v.y).toBeCloseTo(1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/wave.test.js`
Expected: FAIL — `Failed to resolve import "../src/sim/wave.js"`

- [ ] **Step 3: Write `game/src/sim/vec.js`**

```js
// In-place 2D helpers on plain {x, y} objects. Nothing here allocates.

export function set(o, x, y) { o.x = x; o.y = y; return o; }

export function len(x, y) { return Math.sqrt(x * x + y * y); }

export function clampLen(v, max) {
  const l = len(v.x, v.y);
  if (l > max) { const s = max / l; v.x *= s; v.y *= s; }
  return v;
}

export function rotate(v, rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  const x = v.x * c - v.y * s;
  v.y = v.x * s + v.y * c;
  v.x = x;
  return v;
}
```

- [ ] **Step 4: Write `game/src/sim/wave.js`** — TDD formula `n = ⌊t/T − s/H⌋ + 1`, `p = p₀·(−1)ⁿ`

```js
// Two-band wall wave. A front moves top → bottom over `period` seconds;
// above it the walls show the new polarity, below it the old one.

export function polarityAt(s, t, period, height, startPol) {
  const n = Math.floor(t / period - s / height) + 1;
  return (n & 1) ? -startPol : startPol;
}

export function frontY(t, period, height) {
  return ((t / period) % 1) * height;
}

export function wallPolAt(room, y) {
  const w = room.wave;
  if (!w.enabled) return w.startPol;
  return polarityAt(y, room.time, w.period, room.height, w.startPol);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd game && npx vitest run`
Expected: PASS — wave (5), config (4), purity (1)

- [ ] **Step 6: Commit**

```bash
git add game/src/sim/vec.js game/src/sim/wave.js game/test/wave.test.js
git commit -m "feat(sim): add vector helpers and wall wave lookup"
```

---

### Task 4: Entities, level files, validator, `room.js`

**Files:**
- Create: `game/src/sim/entities.js`, `game/src/sim/room.js`
- Create: `game/src/levels/room-01-sidestep.js`, `game/src/levels/room-02-cluster.js`, `game/src/levels/index.js`, `game/src/levels/validate.js`
- Delete: `game/src/sim/.gitkeep`
- Test: `game/test/helpers.js`, `game/test/room.test.js`, `game/test/levels.test.js`

**Interfaces:**
- Consumes: `config` (Task 2)
- Produces:
  - `class Player(radius)` — fields `pos, prev, vel` (`{x,y}`), `radius, pol, latched, theta, omega, orbitDir, bufferedTap, bufferHook, bufferEntry, graceTimer, lastWallPol, inField, alive, nearMissArmed, onObstacle, stallTimer`.
  - `class HookPoint(def, index, cfg)` — `index, home, pos, pol, fieldRadius, bob {ampX, ampY, freq, phase}, cooldown`.
  - `class Obstacle(shape, x, y, w, h, kind = 'obstacle')` — `shape, kind ('obstacle'|'post'), pos {x,y}, w, h, left, right, top, bottom`.
  - `class Room(def, cfg)` — `def, index, name, width, height, wave {enabled, period, startPol}, time, minOrbitSpeed, minLaunchWindow, minCatchWindow, entryX, exitX, hookPoints[], obstacles[], posts[], solids[]` (obstacles then posts), `reset()`, `updateBob()`.
  - `LEVELS` (array of plain level objects, `src/levels/index.js`).
  - `validateLevels(levels, cfg)` — throws `Error('Room <index>: <rule>')` on the first failing room; `levelErrors(def, prevDef, cfg) → string[]`.
  - `test/helpers.js`: `blankLevel(overrides) → level object` (no hook points, no obstacles, wave off, no bob).

**Level file format** — one room per file, default export, plain data only. A hook point may carry `ampX, ampY, freq, phase` to override `config.bob`; otherwise phase is `index × 1.1`.

- [ ] **Step 1: Write the failing tests**

`game/test/helpers.js`:

```js
// Shared builders for sim tests.
export function blankLevel(overrides = {}) {
  return {
    index: 1, name: 'Blank',
    wave: { enabled: false, period: 6.5, startPol: +1 },
    minOrbitSpeed: 3.2, minLaunchWindow: 0.22, minCatchWindow: 0.48,
    entry: { x: 180 }, exit: { x: 265 },
    hookPoints: [], obstacles: [],
    ...overrides,
  };
}

export const still = { ampX: 0, ampY: 0 };   // spread into a hook point to switch its bob off
```

`game/test/room.test.js`:

```js
import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { Room } from '../src/sim/room.js';
import { blankLevel } from './helpers.js';

test('builds shaft posts from entry and exit x', () => {
  const room = new Room(blankLevel({ entry: { x: 180 }, exit: { x: 265 } }), config);
  const [exitL, exitR, hatchL, hatchR] = room.posts;
  expect([exitL.left, exitL.right, exitR.left, exitR.right]).toEqual([227, 235, 295, 303]);
  expect([exitL.top, exitL.bottom]).toEqual([0, 52]);                  // ends at the exit mouth
  expect([hatchL.left, hatchL.right, hatchR.left, hatchR.right]).toEqual([142, 150, 210, 218]);
  expect([hatchL.top, hatchL.bottom]).toEqual([588, 640]);             // starts at the hatch mouth
  expect(room.posts.every((p) => p.kind === 'post')).toBe(true);
  expect(room.solids.length).toBe(4);
});

test('hook points bob in a figure eight with staggered phases', () => {
  const room = new Room(blankLevel({ hookPoints: [{ x: 100, y: 300, pol: 1 }, { x: 200, y: 300, pol: -1 }] }), config);
  const [a, b] = room.hookPoints;
  expect(b.bob.phase).toBeCloseTo(1.1);
  room.time = 0.625;                               // quarter period at 0.4 Hz
  room.updateBob();
  expect(a.pos.x).toBeCloseTo(100 + 8 * Math.sin(Math.PI / 2));
  expect(a.pos.y).toBeCloseTo(300 + 5 * Math.sin(Math.PI));
});

test('reset rewinds time, cooldowns and bob so every attempt is identical', () => {
  const room = new Room(blankLevel({ hookPoints: [{ x: 100, y: 300, pol: 1 }] }), config);
  const h = room.hookPoints[0];
  room.reset();
  const x0 = h.pos.x, y0 = h.pos.y;
  room.time = 3; room.updateBob(); h.cooldown = 0.2;
  room.reset();
  expect(room.time).toBe(0);
  expect(h.cooldown).toBe(0);
  expect([h.pos.x, h.pos.y]).toEqual([x0, y0]);
});
```

`game/test/levels.test.js`:

```js
import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { validateLevels, levelErrors } from '../src/levels/validate.js';

test('both v1 rooms pass every authoring rule', () => {
  expect(LEVELS.map((l) => l.index)).toEqual([1, 2]);
  expect(() => validateLevels(LEVELS, config)).not.toThrow();
});

test('room n+1 entry sits under room n exit', () => {
  expect(LEVELS[1].entry.x).toBe(LEVELS[0].exit.x);
});

test('a broken room throws with its index', () => {
  const bad = { ...LEVELS[1], exit: { x: 180 } };
  expect(() => validateLevels([LEVELS[0], bad], config)).toThrow(/^Room 2: /);
});

test('each rule is reported', () => {
  const base = LEVELS[0];
  const errs = (def) => levelErrors(def, null, config);
  expect(errs({ ...base, wave: { ...base.wave, period: 3 } })).toContain('wave period below 4 s');
  expect(errs({ ...base, exit: { x: 180 } })).toContain('exit x outside allowed ranges');
  expect(errs({ ...base, entry: { x: 280 }, exit: { x: 265 } })).toContain('exit on the same side as entry');
  expect(errs({ ...base, hookPoints: [{ x: 100, y: 300, pol: 1 }] })).toContain('hook point 0 field too close to a wall');
  expect(errs({ ...base, hookPoints: [{ x: 108, y: 300, pol: 1 }] })).toContain('no field covers the centre line');
  expect(errs({ ...base, obstacles: [{ shape: 'bar', x: 110, y: 240, w: 20, h: 14 }] })).toContain('obstacle 0 crosses the orbit of hook point 2');
  expect(errs({ ...base, obstacles: [{ shape: 'circle', x: 180, y: 100, w: 20, h: 20 }] })).toContain('obstacle 0 is not a bar or square');
});

test('obstacle placement, bob and shaft-post rules are reported', () => {
  const base = LEVELS[0];
  const errs = (def) => levelErrors(def, null, config);
  expect(errs({ ...base, obstacles: [] })).toContain('no obstacle on the centre line in the upper half');
  expect(errs({ ...base, obstacles: [{ shape: 'bar', x: 180, y: 100, w: 300, h: 14 }] }))
    .toContain('obstacle 0 leaves no passable gap to a wall');       // 20 each side
  // Home distance 50 passes the 48 clearance; a 20-unit bob brings the hook within 38.
  const wobbly = [...base.hookPoints.slice(0, 2), { x: 110, y: 200, pol: -1, ampX: 20, ampY: 5 }];
  expect(errs({ ...base, hookPoints: wobbly, obstacles: [{ shape: 'square', x: 110, y: 257, w: 14, h: 14 }] }))
    .toContain('obstacle 0 touches the orbit of hook point 2 when it bobs');
  // (250, 90) is 35 from the exit's left post at x 227–235, y 0–58.
  expect(errs({ ...base, hookPoints: [...base.hookPoints, { x: 250, y: 90, pol: 1 }] }))
    .toContain('shaft post crosses the orbit of hook point 3');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd game && npx vitest run test/room.test.js test/levels.test.js`
Expected: FAIL — `Failed to resolve import "../src/sim/room.js"` and `"../src/levels/index.js"`

- [ ] **Step 3: Write `game/src/sim/entities.js`**

```js
// Plain data holders. All behaviour lives in physics.js / collision.js / world.js.

export class Player {
  constructor(radius) {
    this.pos = { x: 0, y: 0 };
    this.prev = { x: 0, y: 0 };      // position at the start of the last step (render interpolation)
    this.vel = { x: 0, y: 0 };
    this.radius = radius;
    this.pol = 1;                    // +1 blue, -1 red
    this.latched = null;             // HookPoint while orbiting
    this.theta = 0;
    this.omega = 0;                  // orbit speed, always >= 0
    this.orbitDir = 1;               // +1 or -1, follows arrival direction
    this.bufferedTap = false;
    this.bufferHook = null;          // taps are buffered while inside this hook point's field
    this.bufferEntry = false;        // taps are buffered while inside the entry hatch zone
    this.graceTimer = 0;
    this.lastWallPol = 0;            // 0 = not yet sampled this attempt
    this.inField = false;
    this.alive = true;
    this.nearMissArmed = true;
    this.onObstacle = false;
    this.stallTimer = 0;             // seconds pinned against a solid (stall death)
  }
}

export class HookPoint {
  constructor(def, index, cfg) {
    this.index = index;
    this.home = { x: def.x, y: def.y };
    this.pos = { x: def.x, y: def.y };
    this.pol = def.pol;
    this.fieldRadius = cfg.fieldRadius;
    this.bob = {
      ampX: def.ampX ?? cfg.bob.ampX,
      ampY: def.ampY ?? cfg.bob.ampY,
      freq: def.freq ?? cfg.bob.freq,
      phase: def.phase ?? index * cfg.bob.phaseStep,
    };
    this.cooldown = 0;
  }
}

export class Obstacle {
  constructor(shape, x, y, w, h, kind = 'obstacle') {
    this.shape = shape;              // 'bar' | 'square' — never round
    this.kind = kind;                // 'obstacle' | 'post' (shaft posts block like obstacles)
    this.pos = { x, y };
    this.w = w;
    this.h = h;
    this.left = x - w / 2;
    this.right = x + w / 2;
    this.top = y - h / 2;
    this.bottom = y + h / 2;
  }
}
```

- [ ] **Step 4: Write `game/src/sim/room.js`**

```js
import { HookPoint, Obstacle } from './entities.js';

const TAU = Math.PI * 2;

// Posts flank each shaft opening and end at its mouth line: exit posts run from the top edge
// down to exitMouthY (52 = depth 46 + postOverhang 6); hatch posts run from entryMouthY (588)
// to the bottom edge. Matches the Flip Art canvas (spec §4, §6.1).
// Exported so levels/validate.js checks the same rectangles the physics uses.
export function buildPosts(entryX, exitX, cfg) {
  const s = cfg.shaft;
  const half = s.opening / 2;
  const w = s.postWidth;
  const exitLen = s.exitMouthY;
  const hatchTop = s.entryMouthY;
  const hatchLen = cfg.room.height - hatchTop;
  return [
    new Obstacle('bar', exitX - half - w / 2, exitLen / 2, w, exitLen, 'post'),
    new Obstacle('bar', exitX + half + w / 2, exitLen / 2, w, exitLen, 'post'),
    new Obstacle('bar', entryX - half - w / 2, hatchTop + hatchLen / 2, w, hatchLen, 'post'),
    new Obstacle('bar', entryX + half + w / 2, hatchTop + hatchLen / 2, w, hatchLen, 'post'),
  ];
}

export class Room {
  constructor(def, cfg) {
    this.def = def;
    this.index = def.index;
    this.name = def.name;
    this.width = cfg.room.width;
    this.height = cfg.room.height;
    this.wave = { enabled: def.wave.enabled, period: def.wave.period, startPol: def.wave.startPol };
    this.time = 0;
    this.minOrbitSpeed = def.minOrbitSpeed;
    this.minLaunchWindow = def.minLaunchWindow;
    this.minCatchWindow = def.minCatchWindow;
    this.entryX = def.entry.x;
    this.exitX = def.exit.x;
    this.hookPoints = def.hookPoints.map((h, i) => new HookPoint(h, i, cfg));
    this.obstacles = def.obstacles.map((o) => new Obstacle(o.shape, o.x, o.y, o.w, o.h));
    this.posts = buildPosts(this.entryX, this.exitX, cfg);
    this.solids = [...this.obstacles, ...this.posts];
    this.reset();
  }

  reset() {
    this.time = 0;
    for (const h of this.hookPoints) h.cooldown = 0;
    this.updateBob();
  }

  updateBob() {
    const t = this.time;
    for (const h of this.hookPoints) {
      const b = h.bob;
      h.pos.x = h.home.x + b.ampX * Math.sin(TAU * b.freq * t + b.phase);
      h.pos.y = h.home.y + b.ampY * Math.sin(2 * TAU * b.freq * t + b.phase);
    }
  }
}
```

- [ ] **Step 5: Write the two level files**

`game/src/levels/room-01-sidestep.js`:

```js
// Room 1 — Sidestep (spec §6). Room-5 tier.
// Hook points hug alternating walls; the player uses wall pull to move sideways
// and reads the wave to stay safe.
//
// Intended route: entry launch (blue, cushioned) → drift left on wall pull, catch red (110, 470)
// → launch up-right into blue (240, 340) as red → launch up-left around the bar to red (110, 200)
// → launch up-right into the exit pull and through the doorway.
//
// Any coordinate change must re-pass levels/validate.js and test/bots.test.js.
export default {
  index: 1,
  name: 'Sidestep',
  wave: { enabled: true, period: 6.5, startPol: +1 },
  minOrbitSpeed: 3.2, minLaunchWindow: 0.22, minCatchWindow: 0.48,
  entry: { x: 180 },   // floor hatch, bottom centre
  exit: { x: 265 },    // ceiling doorway, top right
  hookPoints: [
    { x: 110, y: 470, pol: -1 },
    { x: 240, y: 340, pol: +1 },
    { x: 110, y: 200, pol: -1 },
  ],
  obstacles: [
    { shape: 'bar', x: 200, y: 265, w: 70, h: 14 },
  ],
};
```

`game/src/levels/room-02-cluster.js`:

```js
// Room 2 — Cluster (spec §6). Room-5 tier.
// Five mixed-colour hook points packed mid-room; the skill is choosing which to catch
// and in what colour.
//
// Any coordinate change must re-pass levels/validate.js and test/bots.test.js.
export default {
  index: 2,
  name: 'Cluster',
  wave: { enabled: true, period: 6.5, startPol: -1 },
  minOrbitSpeed: 3.2, minLaunchWindow: 0.22, minCatchWindow: 0.48,
  entry: { x: 265 },   // = room 1 exit x
  exit: { x: 95 },     // ceiling doorway, top left
  hookPoints: [
    { x: 215, y: 480, pol: +1 },
    { x: 140, y: 400, pol: -1 },
    { x: 240, y: 320, pol: +1 },
    { x: 150, y: 250, pol: +1 },
    { x: 230, y: 180, pol: -1 },
  ],
  obstacles: [
    { shape: 'square', x: 185, y: 125, w: 28, h: 28 },
    { shape: 'bar', x: 290, y: 420, w: 14, h: 70 },
  ],
};
```

- [ ] **Step 6: Write `game/src/levels/index.js`** — the only place room order lives

```js
// Play order. To add a room: create room-NN-name.js, import it here, append it.
import room01 from './room-01-sidestep.js';
import room02 from './room-02-cluster.js';

export const LEVELS = [room01, room02];
```

- [ ] **Step 7: Write `game/src/levels/validate.js`** — the spec §6 rule checks that can be computed from data

```js
// Authoring rules from spec §6 and wiki/concepts/no-passive-clears.md.
// Launch/catch windows and hop reach need a route and are checked by playtest + bots.
import { buildPosts } from '../sim/room.js';

function side(x, centre) { return x < centre ? -1 : x > centre ? 1 : 0; }

function bobReach(h, cfg) {
  return Math.hypot(h.ampX ?? cfg.bob.ampX, h.ampY ?? cfg.bob.ampY);
}

function rectDistance(o, px, py) {
  const cx = Math.max(o.x - o.w / 2, Math.min(px, o.x + o.w / 2));
  const cy = Math.max(o.y - o.h / 2, Math.min(py, o.y + o.h / 2));
  return Math.hypot(px - cx, py - cy);
}

export function levelErrors(def, prevDef, cfg) {
  const errors = [];
  const centre = cfg.room.width / 2;
  const innerLeft = cfg.room.wallBand;
  const innerRight = cfg.room.width - cfg.room.wallBand;

  if (def.wave.period < cfg.minWavePeriod) errors.push('wave period below 4 s');

  const ex = def.exit.x;
  if (!cfg.exitXRanges.some(([lo, hi]) => ex >= lo && ex <= hi)) errors.push('exit x outside allowed ranges');

  const entrySide = side(def.entry.x, centre);
  if (entrySide !== 0 && entrySide === side(ex, centre)) errors.push('exit on the same side as entry');

  if (prevDef && def.entry.x !== prevDef.exit.x) errors.push('entry x does not match previous exit x');

  def.hookPoints.forEach((h, i) => {
    const leftGap = h.x - cfg.fieldRadius - innerLeft;
    const rightGap = innerRight - (h.x + cfg.fieldRadius);
    if (Math.min(leftGap, rightGap) < cfg.wallMargin) errors.push(`hook point ${i} field too close to a wall`);
  });

  if (!def.hookPoints.some((h) => Math.abs(h.x - centre) <= cfg.fieldRadius)) {
    errors.push('no field covers the centre line');
  }

  // Rule 9: obstacles clear of orbits by 10 at the hook's home, and never touching the orbit
  // at any point of its bob (matters when a level overrides ampX / ampY).
  const orbitReach = cfg.orbitRadius + cfg.playerRadius;
  const clearance = orbitReach + 10;
  def.obstacles.forEach((o, i) => {
    if (o.shape !== 'bar' && o.shape !== 'square') errors.push(`obstacle ${i} is not a bar or square`);
    def.hookPoints.forEach((h, j) => {
      const d = rectDistance(o, h.x, h.y);
      if (d < clearance) errors.push(`obstacle ${i} crosses the orbit of hook point ${j}`);
      else if (d - bobReach(h, cfg) < orbitReach) errors.push(`obstacle ${i} touches the orbit of hook point ${j} when it bobs`);
    });
    const leftGap = o.x - o.w / 2 - innerLeft;
    const rightGap = innerRight - (o.x + o.w / 2);
    if (Math.max(leftGap, rightGap) < cfg.obstacleGap) errors.push(`obstacle ${i} leaves no passable gap to a wall`);
  });

  // No passive clears: an obstacle sits on the centre line in the upper half of the room.
  const upperCentre = def.obstacles.some((o) =>
    o.x - o.w / 2 <= centre && o.x + o.w / 2 >= centre && o.y < cfg.room.height / 2);
  if (!upperCentre) errors.push('no obstacle on the centre line in the upper half');

  // Shaft posts clear of every orbit, same clearance as obstacles.
  buildPosts(def.entry.x, ex, cfg).forEach((post) => {
    const rect = { x: post.pos.x, y: post.pos.y, w: post.w, h: post.h };
    def.hookPoints.forEach((h, j) => {
      if (rectDistance(rect, h.x, h.y) < clearance) errors.push(`shaft post crosses the orbit of hook point ${j}`);
    });
  });

  return errors;
}

export function validateLevels(levels, cfg) {
  levels.forEach((def, i) => {
    if (def.index !== i + 1) throw new Error(`Room ${def.index}: index does not match position ${i + 1}`);
    const errors = levelErrors(def, levels[i - 1] ?? null, cfg);
    if (errors.length) throw new Error(`Room ${def.index}: ${errors.join('; ')}`);
  });
}
```

Why each test case trips its rule: hook (100, 300) → 100 − 70 − 10 = 20 < 30 wall margin. Hook (108, 300) → field reaches x 178, short of the centre line 180. Obstacle (110, 240) → 33 from room 1's hook point 2 at (110, 200), under the 48 clearance. The tests use `toContain`, so a case that also trips a second rule still passes.

- [ ] **Step 8: Delete `game/src/sim/.gitkeep`** — the folder now has real files.

- [ ] **Step 9: Run the tests to verify they pass**

Run: `cd game && npx vitest run`
Expected: PASS — room (3), levels (5), plus earlier files. If `both v1 rooms pass every authoring rule` fails, **stop**: the spec's room data breaks a rule. Report the message to the user; do not edit room data without their approval.

- [ ] **Step 10: Commit**

```bash
git add -A game/src/sim game/src/levels game/test
git commit -m "feat(sim): add entities, per-room level files, validator and Room"
```

---

### Task 5: Free-flight physics — fields, walls, cushion, updraft, grace

**Files:**
- Create: `game/src/sim/physics.js`
- Modify: `game/test/helpers.js` (add `makeState`)
- Test: `game/test/physics.test.js`

**Interfaces:**
- Consumes: `config`, `Room`, `Player` (Task 4); `wallPolAt` (Task 3); `clampLen` (Task 3).
- Produces (all take a `state` = `{ cfg, room, player }`; `createWorld` in Task 8 returns a superset):
  - `fieldAccel(state, out) → boolean` — writes summed hook-point + exit-pull acceleration into `out`, returns whether the player is inside any field.
  - `wallAccelX(state, wallPol) → number` — pull or cushion, times the grace scale.
  - `graceScale(player, cfg) → 0..1`
  - `applyUpdraft(vel, dt, cfg)` — in place.
  - `freeFlightStep(state, dt)` — one integration step outside orbit: precedence switch, grace trigger, speed cap, `safeGap` clamp.
- `test/helpers.js`: `makeState(levelOverrides, cfgOverrides) → { cfg, room, player }`.

**Model recap** (wiki: polarity & force model). Mass is 1, so forces are accelerations. Precedence is a **branch**: inside any field → hook forces only; outside → side walls (x) + updraft (y). Physics walls are x = 10 and x = 350, so wall formulas use `x = pos.x − 10` and `W = 340`.

- [ ] **Step 1: Add `makeState` to `game/test/helpers.js`** (append)

```js
import { config } from '../src/config.js';
import { Room } from '../src/sim/room.js';
import { Player } from '../src/sim/entities.js';

export function makeState(levelOverrides = {}, cfgOverrides = {}) {
  const cfg = { ...config, ...cfgOverrides };
  const room = new Room(blankLevel(levelOverrides), cfg);
  const player = new Player(cfg.playerRadius);
  return { cfg, room, player };
}
```

Move the three `import` lines to the top of the file.

- [ ] **Step 2: Write the failing test** — `game/test/physics.test.js`

```js
import { test, expect } from 'vitest';
import { fieldAccel, wallAccelX, graceScale, freeFlightStep } from '../src/sim/physics.js';
import { makeState, still } from './helpers.js';

const DT = 1 / 120;
const out = { x: 0, y: 0 };

function place(state, x, y, vx = 0, vy = 0) {
  state.player.pos.x = x; state.player.pos.y = y;
  state.player.vel.x = vx; state.player.vel.y = vy;
}

test('hook force attracts on opposite polarity and repels on same', () => {
  const s = makeState({ hookPoints: [{ x: 180, y: 320, pol: +1, ...still }] });
  place(s, 180, 370);
  s.player.pol = -1;
  expect(fieldAccel(s, out)).toBe(true);
  expect(out.y).toBeLessThan(0);                        // toward the hook (up)
  s.player.pol = +1;
  fieldAccel(s, out);
  expect(out.y).toBeGreaterThan(0);                     // away from the hook
  expect(Math.abs(out.y)).toBeCloseTo(2_000_000 / 50 ** 2);
});

test('inside a field, walls and updraft do nothing', () => {
  const s = makeState({ hookPoints: [{ x: 60, y: 320, pol: +1, ...still }] }, { k: 0 });
  place(s, 40, 320);
  s.player.pol = -1;                                    // opposite the +1 walls: would be pulled
  freeFlightStep(s, DT);
  expect(s.player.vel.x).toBe(0);
  expect(s.player.vel.y).toBe(0);
  expect(s.player.inField).toBe(true);
});

test('overlapping fields add together', () => {
  const s = makeState({ hookPoints: [{ x: 140, y: 320, pol: +1, ...still }, { x: 220, y: 320, pol: -1, ...still }] });
  place(s, 180, 320);
  s.player.pol = -1;                                    // pulled toward left hook, pushed off right hook
  fieldAccel(s, out);
  expect(out.x).toBeCloseTo(-2 * 2_000_000 / 40 ** 2);
  expect(out.y).toBeCloseTo(0);
});

test('exit pull attracts both colours and overrides walls', () => {
  for (const pol of [1, -1]) {
    const s = makeState();                              // exit x 265, mouth y 52
    place(s, 265, 80);
    s.player.pol = pol;
    expect(fieldAccel(s, out)).toBe(true);
    expect(out.y).toBeLessThan(0);                      // toward the mouth
    freeFlightStep(s, DT);
    expect(s.player.inField).toBe(true);                // walls and updraft skipped
  }
});

test('a cushioned player never gets closer than safeGap to a side wall', () => {
  let minGap = Infinity;
  for (let deg = 100; deg <= 260; deg += 10) {
    const s = makeState();                              // wave off, walls +1
    const a = (deg * Math.PI) / 180;
    place(s, 180, 320, Math.cos(a) * 480, Math.sin(a) * 480);
    s.player.pol = +1;                                  // matches walls: cushioned
    for (let i = 0; i < 1200; i++) {
      freeFlightStep(s, DT);
      s.player.pos.y = 320;                             // stay clear of top/bottom walls
      const gap = Math.min(s.player.pos.x - 8 - 10, 350 - s.player.pos.x - 8);
      minGap = Math.min(minGap, gap);
    }
  }
  expect(minGap).toBeGreaterThanOrEqual(12 - 1e-9);
});

test('a pulled player reaches the wall', () => {
  const s = makeState();
  place(s, 100, 320);
  s.player.pol = -1;
  let reached = false;
  for (let i = 0; i < 600 && !reached; i++) {
    freeFlightStep(s, DT);
    s.player.pos.y = 320;
    reached = s.player.pos.x - 8 <= 10;
  }
  expect(reached).toBe(true);
});

test('the updraft restores riseSpeed and drag bleeds faster launches back to it', () => {
  const s = makeState();
  place(s, 180, 320);
  s.player.pol = +1;
  for (let i = 0; i < 600; i++) { freeFlightStep(s, DT); s.player.pos.y = 320; }
  expect(s.player.vel.y).toBeCloseTo(-60, 0);

  place(s, 180, 320, 0, -400);
  for (let i = 0; i < 120; i++) { freeFlightStep(s, DT); s.player.pos.y = 320; }
  expect(-s.player.vel.y).toBeGreaterThan(60);
  expect(-s.player.vel.y).toBeLessThan(400);
});

test('speed is capped at maxSpeed', () => {
  const s = makeState();
  place(s, 180, 320, 1000, 0);
  s.player.pol = +1;
  freeFlightStep(s, DT);
  expect(Math.hypot(s.player.vel.x, s.player.vel.y)).toBeLessThanOrEqual(480 + 1e-9);
});

test('the wave front crossing the player starts the grace timer', () => {
  const s = makeState({ wave: { enabled: true, period: 6.5, startPol: +1 } });
  place(s, 60, 320);
  s.player.pol = +1;                                    // cushioned until the front arrives
  s.room.time = 0.5 * 6.5 - 0.05;                       // front 5 px above the player
  let triggered = false;
  for (let i = 0; i < 24 && !triggered; i++) {
    s.room.time += DT;
    freeFlightStep(s, DT);
    s.player.pos.y = 320;
    triggered = s.player.graceTimer > 0;
  }
  expect(triggered).toBe(true);
  expect(s.player.graceTimer).toBeCloseTo(0.55 - DT, 5);
  expect(wallAccelX(s, -1)).toBeCloseTo(0);             // now opposite the walls, but graced (may be -0)
});

test('grace is off for 0.40 s, then ramps to full over 0.15 s', () => {
  const cfg = { waveGrace: 0.4, waveGraceRamp: 0.15 };
  expect(graceScale({ graceTimer: 0.5 }, cfg)).toBe(0);
  expect(graceScale({ graceTimer: 0.15 }, cfg)).toBe(0);
  expect(graceScale({ graceTimer: 0.075 }, cfg)).toBeCloseTo(0.5);
  expect(graceScale({ graceTimer: 0 }, cfg)).toBe(1);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd game && npx vitest run test/physics.test.js`
Expected: FAIL — `Failed to resolve import "../src/sim/physics.js"`

- [ ] **Step 4: Write `game/src/sim/physics.js`** (free-flight half; Task 6 appends the latch half)

```js
// Forces and integration. Formulas: wiki/concepts/polarity-force-model.md.
// Mass is 1, so every force here is an acceleration. Nothing in this file allocates per call.
import { wallPolAt } from './wave.js';
import { clampLen } from './vec.js';

const acc = { x: 0, y: 0 };

// Hook fields and the exit pull. Returns true if the player is inside any of them.
export function fieldAccel(state, out) {
  const { cfg, room, player } = state;
  const p = player.pos;
  out.x = 0; out.y = 0;
  let inside = false;

  for (const h of room.hookPoints) {
    const dx = h.pos.x - p.x, dy = h.pos.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= h.fieldRadius) continue;
    inside = true;
    if (d === 0) continue;
    const m = Math.max(d, cfg.dMin);
    // F = -k·p_player·p_hook·d̂/m², d̂ from player to hook: opposite colours attract
    const s = (-cfg.k * player.pol * h.pol) / (m * m * d);
    out.x += s * dx; out.y += s * dy;
  }

  // Exit pull (spec §6.1): hook force with the product fixed at −1, only below the mouth
  const mouthY = cfg.shaft.exitMouthY;
  const dx = room.exitX - p.x, dy = mouthY - p.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (p.y > mouthY && d < cfg.exitFieldRadius) {
    inside = true;
    if (d > 0) {
      const m = Math.max(d, cfg.dMin);
      const s = cfg.k / (m * m * d);
      out.x += s * dx; out.y += s * dy;
    }
  }
  return inside;
}

export function graceScale(player, cfg) {
  const t = player.graceTimer;
  if (t <= 0) return 1;
  if (t >= cfg.waveGraceRamp) return 0;
  return 1 - t / cfg.waveGraceRamp;
}

export function wallAccelX(state, wallPol) {
  const { cfg, player } = state;
  const inner = cfg.room.wallBand;
  const W = cfg.room.width - 2 * inner;
  const x = player.pos.x - inner;
  let ax;
  if (player.pol !== wallPol) {
    // Pull toward the nearer wall
    const l = Math.max(x, cfg.dMin), r = Math.max(W - x, cfg.dMin);
    ax = -cfg.kWall * (1 / (l * l) - 1 / (r * r));
  } else {
    // Cushion: damp only motion toward the nearer wall, plus a weak push to centre
    const toward = x < W / 2 ? -1 : 1;
    const damp = player.vel.x * toward > 0 ? -cfg.wallDamping * player.vel.x : 0;
    ax = damp - (cfg.centerPush * (x - W / 2)) / (W / 2);
  }
  return ax * graceScale(player, cfg);
}

export function applyUpdraft(vel, dt, cfg) {
  let up = -vel.y;
  if (up < cfg.riseSpeed) up += (cfg.riseSpeed - up) * (1 - Math.exp(-cfg.updraftGain * dt));
  else up = cfg.riseSpeed + (up - cfg.riseSpeed) * Math.exp(-cfg.drag * dt);
  vel.y = -up;
  vel.x *= Math.exp(-cfg.drag * dt);
}

// Hard clamp: a cushioned player may not cross the safeGap line this step.
function enforceSafeGap(player, cfg, xBefore) {
  const left = cfg.room.wallBand + player.radius + cfg.safeGap;
  const right = cfg.room.width - cfg.room.wallBand - player.radius - cfg.safeGap;
  const p = player.pos, v = player.vel;
  if (p.x < left && v.x < 0) { v.x = 0; if (xBefore >= left) p.x = left; }
  if (p.x > right && v.x > 0) { v.x = 0; if (xBefore <= right) p.x = right; }
}

export function freeFlightStep(state, dt) {
  const { cfg, room, player } = state;
  const v = player.vel, p = player.pos;

  const wallPol = wallPolAt(room, p.y);
  const inField = fieldAccel(state, acc);
  if (!inField && player.lastWallPol !== 0 && wallPol !== player.lastWallPol) {
    player.graceTimer = cfg.waveGrace + cfg.waveGraceRamp;
  }
  player.lastWallPol = wallPol;
  player.inField = inField;

  if (inField) {
    v.x += acc.x * dt;
    v.y += acc.y * dt;
  } else {
    v.x += wallAccelX(state, wallPol) * dt;
    applyUpdraft(v, dt, cfg);
  }
  clampLen(v, cfg.maxSpeed);

  const xBefore = p.x;
  p.x += v.x * dt;
  p.y += v.y * dt;
  if (!inField && player.pol === wallPol) enforceSafeGap(player, cfg, xBefore);

  if (player.graceTimer > 0) player.graceTimer = Math.max(0, player.graceTimer - dt);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd game && npx vitest run test/physics.test.js`
Expected: PASS (10 tests). If `a pulled player reaches the wall` fails, print the final `pos.x` — the likely cause is a sign error in the pull formula (the player drifting to the centre instead).

- [ ] **Step 6: Commit**

```bash
git add game/src/sim/physics.js game/test/physics.test.js game/test/helpers.js
git commit -m "feat(sim): add field, wall, cushion, updraft and grace physics"
```

---

### Task 6: Latch, orbit, launch, launch assist, latency compensation

**Files:**
- Modify: `game/src/sim/physics.js` (append)
- Test: `game/test/latch.test.js`

**Interfaces:**
- Consumes: `state = { cfg, room, player }` (Task 5); `clampLen`, `rotate` (Task 3).
- Produces:
  - `tryLatch(state) → HookPoint | null` — latches the first attracting hook point within `latchRadius` whose `cooldown` is 0; sets `theta`, `omega` (clamped), `orbitDir`; clears tap buffers.
  - `orbitStep(state, dt)` — ω bleed, θ advance, kinematic placement on the (bobbing) hook point.
  - `launch(state)` — aims from the latency-rewound θ (player position unchanged), tangential + radial velocity, assist, cap, flips `pol`, sets `cooldown` and `bufferHook`.

**Angle convention:** y is down, so θ = `atan2(dy, dx)` from hook to player, and the orbit tangent for `orbitDir = +1` is `(−sin θ, cos θ)` (clockwise on screen). `omega` is always ≥ 0; direction lives in `orbitDir`.

- [ ] **Step 1: Write the failing test** — `game/test/latch.test.js`

```js
import { test, expect } from 'vitest';
import { tryLatch, orbitStep, launch } from '../src/sim/physics.js';
import { makeState, still } from './helpers.js';

const DT = 1 / 120;
const HOOK = { x: 180, y: 320, pol: +1, ...still };

function latchedState(cfgOverrides = {}, theta = 0, omega = 4, dir = 1) {
  const s = makeState({ hookPoints: [HOOK] }, cfgOverrides);
  const h = s.room.hookPoints[0];
  Object.assign(s.player, { latched: h, theta, omega, orbitDir: dir, pol: -1 });
  return { s, h };
}

test('latches inside latchRadius only when attracted', () => {
  const s = makeState({ hookPoints: [HOOK] });
  Object.assign(s.player.pos, { x: 205, y: 320 });
  Object.assign(s.player.vel, { x: 0, y: 100 });
  s.player.pol = +1;
  expect(tryLatch(s)).toBe(null);                     // same colour: repelled
  s.player.pol = -1;
  s.player.pos.x = 215;
  expect(tryLatch(s)).toBe(null);                     // 35 away
  s.player.pos.x = 205;
  expect(tryLatch(s)).toBe(s.room.hookPoints[0]);
  expect(Math.hypot(s.player.pos.x - 180, s.player.pos.y - 320)).toBeCloseTo(30);
});

test('arrival speed sets omega, clamped to [minOrbitSpeed, maxOrbitSpeed]', () => {
  const s = makeState({ hookPoints: [HOOK] });
  s.player.pol = -1;
  Object.assign(s.player.pos, { x: 205, y: 320 });
  Object.assign(s.player.vel, { x: 0, y: 300 });      // 300/30 = 10 rad/s → 6
  tryLatch(s);
  expect(s.player.omega).toBe(6);

  const t = makeState({ hookPoints: [HOOK] });
  t.player.pol = -1;
  Object.assign(t.player.pos, { x: 205, y: 320 });
  Object.assign(t.player.vel, { x: 0, y: 30 });       // 1 rad/s → 3.2
  tryLatch(t);
  expect(t.player.omega).toBe(3.2);
});

test('orbit direction follows the arrival direction', () => {
  for (const [vy, dir] of [[100, 1], [-100, -1]]) {
    const s = makeState({ hookPoints: [HOOK] });
    s.player.pol = -1;
    Object.assign(s.player.pos, { x: 205, y: 320 });
    Object.assign(s.player.vel, { x: 0, y: vy });
    tryLatch(s);
    expect(s.player.orbitDir).toBe(dir);
  }
});

test('omega bleeds toward minOrbitSpeed by the TDD formula', () => {
  const { s } = latchedState({}, 0, 6);
  for (let i = 0; i < 120; i++) orbitStep(s, DT);
  expect(s.player.omega).toBeCloseTo(3.2 + (6 - 3.2) * Math.exp(-0.8), 6);
});

test('the orbit follows the bobbing hook point', () => {
  const { s, h } = latchedState();
  h.pos.x += 7; h.pos.y -= 4;
  orbitStep(s, DT);
  expect(Math.hypot(s.player.pos.x - h.pos.x, s.player.pos.y - h.pos.y)).toBeCloseTo(30);
});

test('launch velocity is tangential plus radial impulse', () => {
  const { s } = latchedState({ inputLatencyComp: 0, launchAssist: 0 }, 0, 4, 1);
  launch(s);
  expect(s.player.vel.x).toBeCloseTo(180);           // radial (1, 0) × 180
  expect(s.player.vel.y).toBeCloseTo(120);           // tangential (0, 1) × 4 × 30
  expect(s.player.pol).toBe(+1);                      // now matches the hook: pushed out
  expect(s.player.latched).toBe(null);
});

test('launch speed is capped at maxSpeed', () => {
  const { s } = latchedState({ inputLatencyComp: 0, launchAssist: 0, launchImpulse: 1000 });
  launch(s);
  expect(Math.hypot(s.player.vel.x, s.player.vel.y)).toBeCloseTo(480);
});

test('latency compensation aims from theta rewound by omega × inputLatencyComp, without moving the player', () => {
  const { s } = latchedState({ launchAssist: 0 }, 1, 4, 1);
  launch(s);
  const used = 1 - 4 * 0.06;
  expect(s.player.vel.x).toBeCloseTo(-120 * Math.sin(used) + 180 * Math.cos(used));
  expect(s.player.vel.y).toBeCloseTo(120 * Math.cos(used) + 180 * Math.sin(used));
  expect(s.player.pos.x).toBeCloseTo(180 + 30 * Math.cos(1));   // stays on the orbit at the live angle
  expect(s.player.pos.y).toBeCloseTo(320 + 30 * Math.sin(1));
});

test('relatchCooldown blocks an instant re-latch', () => {
  const { s, h } = latchedState({ inputLatencyComp: 0, launchAssist: 0 });
  launch(s);
  expect(h.cooldown).toBe(0.25);
  expect(s.player.bufferHook).toBe(h);
  s.player.pol = -1;                                  // force attraction to isolate the cooldown
  Object.assign(s.player.pos, { x: 200, y: 320 });
  expect(tryLatch(s)).toBe(null);
  h.cooldown = 0;
  expect(tryLatch(s)).toBe(h);
});

function assistCase(offsetDeg, targetPol = -1) {
  // Launch from below hook A; heading ≈ 118° (down-left), exit is up-right so it never competes.
  const A = { x: 100, y: 500, pol: +1, ...still };
  const base = makeState({ hookPoints: [A] }, { inputLatencyComp: 0, launchAssist: 0 });
  Object.assign(base.player, { latched: base.room.hookPoints[0], theta: Math.PI / 2, omega: 3.2, orbitDir: 1, pol: -1 });
  launch(base);
  const h0 = Math.atan2(base.player.vel.y, base.player.vel.x);
  const p = base.player.pos;
  const a = h0 + (offsetDeg * Math.PI) / 180;
  const B = { x: p.x + 60 * Math.cos(a), y: p.y + 60 * Math.sin(a), pol: targetPol, ...still };

  const s = makeState({ hookPoints: [A, B] }, { inputLatencyComp: 0 });
  Object.assign(s.player, { latched: s.room.hookPoints[0], theta: Math.PI / 2, omega: 3.2, orbitDir: 1, pol: -1 });
  launch(s);
  const h1 = Math.atan2(s.player.vel.y, s.player.vel.x);
  return ((h1 - h0) * 180) / Math.PI;
}

test('launch assist nudges at most 6° toward another hook point, never past it', () => {
  expect(assistCase(10)).toBeCloseTo(6);
  expect(assistCase(-10)).toBeCloseTo(-6);
  expect(assistCase(3)).toBeCloseTo(3);
  expect(assistCase(60)).toBeCloseTo(0);              // outside the 45° cone
});

test('launch assist ignores hook points that will repel the player', () => {
  // After the flip the player matches hook A (+1); another +1 hook would push it away.
  expect(assistCase(10, +1)).toBeCloseTo(0);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/latch.test.js`
Expected: FAIL — `tryLatch is not a function` (or "does not provide an export named 'tryLatch'")

- [ ] **Step 3: Append to `game/src/sim/physics.js`**

Change the vec import at the top to `import { clampLen, rotate } from './vec.js';`, then append:

```js
// ── Latch, orbit, launch ── wiki/concepts/latch-orbit-launch.md

const DEG = Math.PI / 180;

function placeOnOrbit(player, cfg) {
  const h = player.latched;
  const r = cfg.orbitRadius;
  const c = Math.cos(player.theta), s = Math.sin(player.theta);
  player.pos.x = h.pos.x + r * c;
  player.pos.y = h.pos.y + r * s;
  const w = player.orbitDir * player.omega * r;
  player.vel.x = -w * s;
  player.vel.y = w * c;
}

export function tryLatch(state) {
  const { cfg, room, player } = state;
  const p = player.pos;
  const r2 = cfg.latchRadius * cfg.latchRadius;
  for (const h of room.hookPoints) {
    if (h.cooldown > 0 || player.pol * h.pol !== -1) continue;
    const dx = p.x - h.pos.x, dy = p.y - h.pos.y;
    if (dx * dx + dy * dy >= r2) continue;
    const theta = Math.atan2(dy, dx);
    const vt = -player.vel.x * Math.sin(theta) + player.vel.y * Math.cos(theta);
    player.latched = h;
    player.theta = theta;
    player.orbitDir = vt >= 0 ? 1 : -1;
    player.omega = Math.min(Math.max(Math.abs(vt) / cfg.orbitRadius, room.minOrbitSpeed), cfg.maxOrbitSpeed);
    player.bufferHook = null;
    player.bufferEntry = false;
    player.bufferedTap = false;
    placeOnOrbit(player, cfg);
    return h;
  }
  return null;
}

export function orbitStep(state, dt) {
  const { cfg, room, player } = state;
  const min = room.minOrbitSpeed;
  player.omega = min + (player.omega - min) * Math.exp(-cfg.orbitDrag * dt);
  player.theta += player.orbitDir * player.omega * dt;
  placeOnOrbit(player, cfg);
}

function angleDiff(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

// Rotate the launch velocity up to launchAssist degrees toward the best-aligned target, if one
// lies within the cone. Targets: the exit mouth, and every hook point within maxReach that will
// attract the player after the flip (opposite colour to the hook being left). Never the one left.
function applyLaunchAssist(state, from) {
  const { cfg, room, player } = state;
  if (cfg.launchAssist <= 0) return;
  const p = player.pos, v = player.vel;
  const heading = Math.atan2(v.y, v.x);
  const reach2 = cfg.maxReach * cfg.maxReach;
  let best = angleDiff(heading, Math.atan2(cfg.shaft.exitMouthY - p.y, room.exitX - p.x));
  for (const h of room.hookPoints) {
    if (h === from || h.pol === from.pol) continue;
    const dx = h.pos.x - p.x, dy = h.pos.y - p.y;
    if (dx * dx + dy * dy > reach2) continue;
    const d = angleDiff(heading, Math.atan2(dy, dx));
    if (Math.abs(d) < Math.abs(best)) best = d;
  }
  if (Math.abs(best) > cfg.launchAssistCone * DEG) return;
  const max = cfg.launchAssist * DEG;
  rotate(v, Math.max(-max, Math.min(max, best)));
}

// Latency compensation (TDD rule 6) aims the launch from the angle inputLatencyComp seconds ago.
// The player stays where it is on the orbit, so there is no visible jump backwards.
export function launch(state) {
  const { cfg, player } = state;
  const h = player.latched;
  const r = cfg.orbitRadius;
  player.pos.x = h.pos.x + r * Math.cos(player.theta);
  player.pos.y = h.pos.y + r * Math.sin(player.theta);
  const aim = player.theta - player.orbitDir * player.omega * cfg.inputLatencyComp;
  const c = Math.cos(aim), s = Math.sin(aim);
  const w = player.orbitDir * player.omega * r;
  player.vel.x = -w * s + cfg.launchImpulse * c;
  player.vel.y = w * c + cfg.launchImpulse * s;
  applyLaunchAssist(state, h);
  clampLen(player.vel, cfg.maxSpeed);
  player.pol = -player.pol;
  player.latched = null;
  h.cooldown = cfg.relatchCooldown;
  player.bufferHook = h;
  player.bufferedTap = false;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd game && npx vitest run test/latch.test.js test/physics.test.js`
Expected: PASS — latch (11), physics (10)

- [ ] **Step 5: Commit**

```bash
git add game/src/sim/physics.js game/test/latch.test.js
git commit -m "feat(sim): add latch, orbit bleed, launch, assist and latency compensation"
```

---

### Task 7: Collision — obstacles, shaft posts, exit capture, death, near miss

**Files:**
- Create: `game/src/sim/collision.js`
- Test: `game/test/collision.test.js`

**Interfaces:**
- Consumes: `state = { cfg, room, player }`; `room.solids` (obstacles + posts, Task 4); `player.inField` (set by `freeFlightStep`, Task 5); `wallPolAt` (Task 3).
- Produces:
  - `resolveSolids(state) → boolean` — pushes the player out of every overlapping solid, removes inward velocity, applies `obstacleFriction`; returns `true` only on the step contact **starts**.
  - `checkCapture(state) → boolean` — centre above `exitMouthY` and within `opening/2 − radius` of `exitX`.
  - `checkDeath(state) → boolean` — side walls, bottom wall, top wall outside the doorway span.
  - `checkNearMiss(state) → boolean` — `true` once per approach when pulled within `nearMissDistance` of a side wall.
  - `checkStall(state, dt) → boolean` — `true` once the player has been touching a solid and moving slower than `stallSpeed` for `stallTime` seconds (reads `player.prev`, which `step` sets). `stallTime: 0` disables it.
  - `sideGap(player, cfg) → number` — distance from the player's edge to the nearer physics wall.

- [ ] **Step 1: Write the failing test** — `game/test/collision.test.js`

```js
import { test, expect } from 'vitest';
import { resolveSolids, checkCapture, checkDeath, checkNearMiss } from '../src/sim/collision.js';
import { freeFlightStep } from '../src/sim/physics.js';
import { makeState } from './helpers.js';

const DT = 1 / 120;
const BAR = { shape: 'bar', x: 180, y: 300, w: 70, h: 14 };   // top edge y 293

function at(s, x, y, vx = 0, vy = 0) {
  Object.assign(s.player.pos, { x, y });
  Object.assign(s.player.vel, { x: vx, y: vy });
}

test('obstacle contact pushes out, removes inward velocity, applies friction', () => {
  const s = makeState({ obstacles: [BAR] });
  at(s, 180, 288, 50, 100);                             // 3 units into the bar's top, moving down
  expect(resolveSolids(s)).toBe(true);
  expect(s.player.pos.y).toBeCloseTo(285);
  expect(s.player.vel.y).toBeCloseTo(0);
  expect(s.player.vel.x).toBeCloseTo(50 * 0.85);
});

test('contact reports only on the step it starts', () => {
  const s = makeState({ obstacles: [BAR] });
  at(s, 180, 288, 0, 100);
  expect(resolveSolids(s)).toBe(true);
  s.player.pos.y += 100 * DT;                           // keep pressing in
  expect(resolveSolids(s)).toBe(false);
  at(s, 180, 200);
  resolveSolids(s);                                     // clear of the bar
  at(s, 180, 288, 0, 100);
  expect(resolveSolids(s)).toBe(true);
});

test('friction applies once per contact, not every step', () => {
  const s = makeState({ obstacles: [BAR] });
  at(s, 180, 288, 50, 100);
  resolveSolids(s);                                     // contact starts: 50 → 42.5
  s.player.pos.y += 100 * DT;
  s.player.vel.y = 100;
  resolveSolids(s);                                     // still touching: no more friction
  expect(s.player.vel.x).toBeCloseTo(42.5);
});

test('a pulled player pinned under a bar slides free', () => {
  const s = makeState({ obstacles: [{ shape: 'bar', x: 200, y: 265, w: 70, h: 14 }] });  // room 1's bar
  at(s, 185, 280);                                      // resting on the bar's underside (y 272)
  s.player.pol = -1;                                    // walls +1: pulled toward the right wall
  let freeAt = null;
  for (let i = 0; i < 960 && freeAt === null; i++) {
    freeFlightStep(s, DT);
    resolveSolids(s);
    if (i > 10 && !s.player.onObstacle) freeAt = i * DT;
  }
  expect(freeAt).not.toBe(null);                        // review measured ≈ 5.8 s
});

test('shaft posts block without killing', () => {
  const s = makeState();                                // exit x 265: left post x 227–235, y 0–58
  at(s, 210, 40, 200, 0);
  for (let i = 0; i < 60; i++) {
    s.player.pos.x += s.player.vel.x * DT;
    resolveSolids(s);
    expect(checkDeath(s)).toBe(false);
  }
  expect(s.player.pos.x).toBeLessThanOrEqual(227 - 8 + 1e-9);
});

test('exit capture fires only inside the mouth span', () => {
  const s = makeState();
  at(s, 265, 50); expect(checkCapture(s)).toBe(true);
  at(s, 265, 53); expect(checkCapture(s)).toBe(false);  // still below the mouth
  at(s, 286.9, 50); expect(checkCapture(s)).toBe(true); // span is |x − 265| < 30 − 8 = 22
  at(s, 287, 50); expect(checkCapture(s)).toBe(false);
});

test('walls kill; the doorway gap in the top wall does not', () => {
  const s = makeState();
  at(s, 18, 320); expect(checkDeath(s)).toBe(true);    // left: 18 − 8 = 10
  at(s, 342, 320); expect(checkDeath(s)).toBe(true);   // right: 342 + 8 = 350
  at(s, 180, 626); expect(checkDeath(s)).toBe(true);   // bottom: 626 + 8 = 634
  at(s, 200, 14); expect(checkDeath(s)).toBe(true);    // top wall beside the doorway
  at(s, 265, 14); expect(checkDeath(s)).toBe(false);   // inside the doorway span
  at(s, 180, 320); expect(checkDeath(s)).toBe(false);
});

test('tunnelling through a bar or a post is impossible at maxSpeed', () => {
  const s = makeState({ obstacles: [BAR] });
  at(s, 180, 200, 0, 480);
  for (let i = 0; i < 240; i++) {
    s.player.pos.y += s.player.vel.y * DT;
    resolveSolids(s);
    expect(s.player.pos.y).toBeLessThan(293);
  }
  const t = makeState();
  at(t, 150, 30, 480, 0);
  for (let i = 0; i < 240; i++) {
    t.player.pos.x += t.player.vel.x * DT;
    resolveSolids(t);
    expect(t.player.pos.x).toBeLessThan(227);
  }
});

test('near miss fires once per approach while pulled', () => {
  const s = makeState();                                // walls +1
  s.player.pol = -1;
  s.player.inField = false;
  at(s, 40, 320); expect(checkNearMiss(s)).toBe(false);  // gap 22
  at(s, 24, 320); expect(checkNearMiss(s)).toBe(true);   // gap 6
  at(s, 23, 320); expect(checkNearMiss(s)).toBe(false);  // already fired
  at(s, 60, 320); checkNearMiss(s);                      // gap 42 re-arms
  at(s, 24, 320); expect(checkNearMiss(s)).toBe(true);
  s.player.pol = +1;                                     // cushioned: never a near miss
  at(s, 60, 320); checkNearMiss(s);
  at(s, 24, 320); expect(checkNearMiss(s)).toBe(false);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/collision.test.js`
Expected: FAIL — `Failed to resolve import "../src/sim/collision.js"`

- [ ] **Step 3: Write `game/src/sim/collision.js`**

```js
// Collision and room-exit checks. wiki/concepts/collision-and-input.md, spec §6.1.
// Simple overlap tests are enough: at maxSpeed a step moves 4 units, half the player radius.
import { wallPolAt } from './wave.js';

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export function resolveSolids(state) {
  const { cfg, room, player } = state;
  const p = player.pos, v = player.vel, r = player.radius;
  const touchR = r + cfg.contactSlop;
  let touching = false;

  for (const o of room.solids) {
    let nx = p.x - clamp(p.x, o.left, o.right);
    let ny = p.y - clamp(p.y, o.top, o.bottom);
    const d2 = nx * nx + ny * ny;
    if (d2 >= touchR * touchR) continue;
    touching = true;
    if (d2 >= r * r) continue;

    let pen;
    if (d2 > 0) {
      const d = Math.sqrt(d2);
      nx /= d; ny /= d;
      pen = r - d;
    } else {
      // Centre inside the rectangle: leave by the shallowest side
      const l = p.x - o.left, rt = o.right - p.x, t = p.y - o.top, b = o.bottom - p.y;
      const m = Math.min(l, rt, t, b);
      nx = m === l ? -1 : m === rt ? 1 : 0;
      ny = nx !== 0 ? 0 : m === t ? -1 : 1;
      pen = m + r;
    }
    p.x += nx * pen;
    p.y += ny * pen;
    const vn = v.x * nx + v.y * ny;
    if (vn < 0) { v.x -= vn * nx; v.y -= vn * ny; }
    if (!player.onObstacle) {                      // friction once per contact, not every step
      v.x *= cfg.obstacleFriction;
      v.y *= cfg.obstacleFriction;
    }
  }

  const started = touching && !player.onObstacle;
  player.onObstacle = touching;
  return started;
}

export function checkCapture(state) {
  const { cfg, room, player } = state;
  const halfSpan = cfg.shaft.opening / 2 - player.radius;
  return player.pos.y < cfg.shaft.exitMouthY && Math.abs(player.pos.x - room.exitX) < halfSpan;
}

export function checkDeath(state) {
  const { cfg, room, player } = state;
  const p = player.pos, r = player.radius, R = cfg.room;
  if (p.x - r <= R.wallBand || p.x + r >= R.width - R.wallBand) return true;
  if (p.y + r >= R.height - R.bottomWall) return true;
  if (p.y - r <= R.topWall && Math.abs(p.x - room.exitX) >= cfg.shaft.opening / 2) return true;
  return false;
}

export function sideGap(player, cfg) {
  const R = cfg.room;
  return Math.min(player.pos.x - player.radius - R.wallBand, R.width - R.wallBand - player.pos.x - player.radius);
}

// Stall death: pinned against a solid, moving slower than stallSpeed, for stallTime seconds.
export function checkStall(state, dt) {
  const { cfg, player } = state;
  if (cfg.stallTime <= 0 || !player.onObstacle) { player.stallTimer = 0; return false; }
  const moved = Math.hypot(player.pos.x - player.prev.x, player.pos.y - player.prev.y);
  if (moved > cfg.stallSpeed * dt) { player.stallTimer = 0; return false; }
  player.stallTimer += dt;
  return player.stallTimer >= cfg.stallTime;
}

export function checkNearMiss(state) {
  const { cfg, room, player } = state;
  const pulled = !player.inField && player.pol !== wallPolAt(room, player.pos.y);
  const gap = sideGap(player, cfg);
  if (!pulled || gap > cfg.safeGap) { player.nearMissArmed = true; return false; }
  if (player.nearMissArmed && gap <= cfg.nearMissDistance) { player.nearMissArmed = false; return true; }
  return false;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd game && npx vitest run test/collision.test.js`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add game/src/sim/collision.js game/test/collision.test.js
git commit -m "feat(sim): add obstacle and post collision, exit capture, death and near miss"
```

---

### Task 8: `world.js` — the sim's one entry point

**Files:**
- Create: `game/src/sim/world.js`
- Test: `game/test/world.test.js`

**Interfaces:**
- Consumes: `Room`, `Player` (Task 4); `wallPolAt` (Task 3); `freeFlightStep` (Task 5); `tryLatch`, `orbitStep`, `launch` (Task 6); `resolveSolids`, `checkCapture`, `checkDeath`, `checkNearMiss` (Task 7).
- Produces — **the whole public sim API; `game.js` and the view import nothing else from `src/sim/` except `wave.js` for drawing:**
  - `createWorld(levels, cfg) → world` — `world = { cfg, rooms[], roomIndex, room, player, phase, readyTimer, events[] }`.
  - `startRoom(world, index, readyBeat)` — resets that room, puts the player in its hatch coloured to the walls at `spawnY`, sets `phase = 'ready'`.
  - `step(world, dt, flips) → string[]` — the same `world.events` array every call, cleared at the start.
  - `world.phase`: `'idle'` (before the first `startRoom`), `'ready'` (ready beat; taps ignored), `'live'`, `'captured'` (rising up the exit shaft; taps ignored), `'dead'`.
  - Events: `flip`, `launch`, `latch`, `entryLaunch`, `obstacleHit`, `nearMiss`, `death`, `exitCaptured`, `win`.

**Order inside a live step:** advance room time + bob → tick cooldowns → apply flips → orbit **or** (free flight → release tap buffers → try latch) → if free: solids → capture → death (walls or stall) → near miss. A stall death emits the same `death` event as a wall death, so `game.js` and the view need nothing new.

- [ ] **Step 1: Write the failing test** — `game/test/world.test.js`

```js
import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { createWorld, startRoom, step } from '../src/sim/world.js';
import { blankLevel, still } from './helpers.js';

const DT = 1 / 120;

function run(world, seconds, flipsAt = () => 0) {
  const seen = [];
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    for (const e of step(world, DT, flipsAt(i))) seen.push(e);
  }
  return seen;
}

test('startRoom puts the player in the hatch, coloured to the walls, for the ready beat', () => {
  const w = createWorld([blankLevel({ wave: { enabled: true, period: 6.5, startPol: -1 } })], config);
  startRoom(w, 0, 0.5);
  expect(w.phase).toBe('ready');
  expect([w.player.pos.x, w.player.pos.y]).toEqual([180, 580]);
  expect(w.player.pol).toBe(-1);
  const early = run(w, 0.45, () => 1);                // taps during the ready beat do nothing
  expect(early).toEqual([]);
  expect(w.player.pol).toBe(-1);
  const later = run(w, 0.1);
  expect(later).toEqual(['entryLaunch']);
  expect(w.phase).toBe('live');
  expect(w.player.vel.y).toBeLessThan(0);
});

test('entry launch fires straight up at entryLaunchSpeed', () => {
  const w = createWorld([blankLevel()], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  expect(w.player.vel.x).toBe(0);
  expect(w.player.vel.y).toBe(-240);
});

test('taps inside the entry zone are buffered until the player leaves it', () => {
  const w = createWorld([blankLevel()], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);                                      // entry launch
  const events = step(w, DT, 1);
  expect(events).not.toContain('flip');
  expect(w.player.pol).toBe(+1);
  expect(w.player.bufferedTap).toBe(true);
  let flippedAt = null;
  for (let i = 0; i < 120 && flippedAt === null; i++) {
    if (step(w, DT, 0).includes('flip')) flippedAt = w.player.pos.y;
  }
  expect(w.player.pol).toBe(-1);
  expect(Math.hypot(0, flippedAt - 588)).toBeGreaterThanOrEqual(50);
});

test('latch, launch, and a tap buffered inside the launching field', () => {
  const w = createWorld([blankLevel({ hookPoints: [{ x: 180, y: 400, pol: -1, ...still }] })], config);
  startRoom(w, 0, 0);
  const toLatch = run(w, 2);
  expect(toLatch).toContain('latch');
  expect(w.player.latched).toBe(w.room.hookPoints[0]);

  expect(step(w, DT, 1)).toEqual(['flip', 'launch']);
  expect(w.player.pol).toBe(-1);                       // same as the hook: pushed out
  step(w, DT, 1);                                      // still inside the field → buffered
  expect(w.player.pol).toBe(-1);
  let flipped = false;
  for (let i = 0; i < 240 && !flipped; i++) flipped = step(w, DT, 0).includes('flip');
  expect(flipped).toBe(true);
  expect(w.player.pol).toBe(+1);
  const h = w.room.hookPoints[0];
  expect(Math.hypot(w.player.pos.x - h.pos.x, w.player.pos.y - h.pos.y)).toBeGreaterThanOrEqual(70);
});

test('exit capture ends the room, lifts the player and ignores taps; win on the last room', () => {
  const w = createWorld([blankLevel()], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  Object.assign(w.player.pos, { x: 265, y: 60 });
  Object.assign(w.player.vel, { x: 0, y: -200 });
  w.player.bufferEntry = false;
  const events = run(w, 0.2);
  expect(events).toEqual(['exitCaptured', 'win']);
  expect(w.phase).toBe('captured');
  const y = w.player.pos.y, pol = w.player.pol;
  expect(step(w, DT, 1)).toEqual([]);
  expect(w.player.pos.y).toBeLessThan(y);
  expect(w.player.pol).toBe(pol);
});

test('no win event when a room follows', () => {
  const w = createWorld([blankLevel(), blankLevel({ index: 2, entry: { x: 265 }, exit: { x: 95 } })], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  Object.assign(w.player.pos, { x: 265, y: 60 });
  w.player.bufferEntry = false;
  expect(run(w, 0.2)).toEqual(['exitCaptured']);
});

test('death stops the room', () => {
  const w = createWorld([blankLevel()], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  Object.assign(w.player.pos, { x: 19, y: 320 });
  w.player.pol = -1;                                   // pulled
  const events = run(w, 0.5);
  expect(events.filter((e) => e === 'death')).toHaveLength(1);
  expect(w.phase).toBe('dead');
  expect(w.player.alive).toBe(false);
});

const ROOM1_BAR = { shape: 'bar', x: 200, y: 265, w: 70, h: 14 };

function pinnedUnderBar(cfg) {
  // Cushioned (+1 player, +1 walls) at x 180, where the centre push is zero; the updraft
  // holds the player against the bar's underside (y 272).
  const w = createWorld([blankLevel({ obstacles: [ROOM1_BAR] })], cfg);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  Object.assign(w.player.pos, { x: 180, y: 281 });
  Object.assign(w.player.vel, { x: 0, y: 0 });
  w.player.bufferEntry = false;
  return w;
}

test('a player pinned against an obstacle dies after stallTime', () => {
  const w = pinnedUnderBar(config);
  expect(run(w, 2.9)).not.toContain('death');
  expect(run(w, 0.3)).toContain('death');
  expect(w.phase).toBe('dead');
});

test('stallTime is configurable and 0 disables stall death', () => {
  expect(run(pinnedUnderBar({ ...config, stallTime: 1 }), 1.2)).toContain('death');
  expect(run(pinnedUnderBar({ ...config, stallTime: 0 }), 5)).not.toContain('death');
});

test('every attempt at a room is identical, and events reuse one array', () => {
  const w = createWorld(LEVELS, config);
  const trace = () => {
    startRoom(w, 0, 0.5);
    run(w, 3);
    return [w.player.pos.x, w.player.pos.y, w.room.hookPoints[0].pos.x];
  };
  expect(trace()).toEqual(trace());
  expect(step(w, DT, 0)).toBe(w.events);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/world.test.js`
Expected: FAIL — `Failed to resolve import "../src/sim/world.js"`

- [ ] **Step 3: Write `game/src/sim/world.js`**

```js
// The simulation's single entry point. Pure: the caller supplies dt and the number of taps.
// v1 holds both rooms in memory; with more rooms, build only the current and next (TDD).
import { Room } from './room.js';
import { Player } from './entities.js';
import { wallPolAt } from './wave.js';
import { freeFlightStep, tryLatch, orbitStep, launch } from './physics.js';
import { resolveSolids, checkCapture, checkDeath, checkStall, checkNearMiss } from './collision.js';

export function createWorld(levels, cfg) {
  const rooms = levels.map((def) => new Room(def, cfg));
  return {
    cfg,
    rooms,
    roomIndex: 0,
    room: rooms[0],
    player: new Player(cfg.playerRadius),
    phase: 'idle',
    readyTimer: 0,
    events: [],
  };
}

export function startRoom(world, index, readyBeat) {
  const { cfg, player } = world;
  const room = world.rooms[index];
  world.roomIndex = index;
  world.room = room;
  room.reset();

  player.pos.x = player.prev.x = room.entryX;
  player.pos.y = player.prev.y = cfg.shaft.spawnY;
  player.vel.x = 0;
  player.vel.y = 0;
  player.pol = wallPolAt(room, cfg.shaft.spawnY);
  player.latched = null;
  player.bufferedTap = false;
  player.bufferHook = null;
  player.bufferEntry = false;
  player.graceTimer = 0;
  player.lastWallPol = 0;
  player.inField = false;
  player.alive = true;
  player.nearMissArmed = true;
  player.onObstacle = false;
  player.stallTimer = 0;

  world.phase = 'ready';
  world.readyTimer = readyBeat;
}

function entryLaunch(world) {
  const p = world.player;
  p.vel.x = 0;
  p.vel.y = -world.cfg.entryLaunchSpeed;
  p.bufferEntry = true;
  p.bufferedTap = false;
}

function handleFlip(world) {
  const p = world.player;
  if (p.latched) {
    launch(world);
    world.events.push('flip', 'launch');
    return;
  }
  if (p.bufferHook || p.bufferEntry) {
    p.bufferedTap = true;
    return;
  }
  p.pol = -p.pol;
  world.events.push('flip');
}

function releaseBuffers(world) {
  const { cfg, room, player: p } = world;
  if (p.bufferHook) {
    const h = p.bufferHook;
    const dx = p.pos.x - h.pos.x, dy = p.pos.y - h.pos.y;
    if (dx * dx + dy * dy >= h.fieldRadius * h.fieldRadius) p.bufferHook = null;
  }
  if (p.bufferEntry) {
    const dx = p.pos.x - room.entryX, dy = p.pos.y - cfg.shaft.entryMouthY;
    const r = cfg.shaft.entryZoneRadius;
    if (dx * dx + dy * dy >= r * r) p.bufferEntry = false;
  }
  if (p.bufferedTap && !p.bufferHook && !p.bufferEntry) {
    p.bufferedTap = false;
    p.pol = -p.pol;
    world.events.push('flip');
  }
}

export function step(world, dt, flips) {
  const ev = world.events;
  ev.length = 0;
  const { cfg, player } = world;
  player.prev.x = player.pos.x;
  player.prev.y = player.pos.y;

  if (world.phase === 'ready') {
    world.readyTimer -= dt;
    if (world.readyTimer <= 0) {
      entryLaunch(world);
      world.phase = 'live';
      ev.push('entryLaunch');
    }
    return ev;
  }
  if (world.phase === 'captured') {
    player.pos.y += player.vel.y * dt;
    return ev;
  }
  if (world.phase !== 'live') return ev;

  const room = world.room;
  room.time += dt;
  room.updateBob();
  for (const h of room.hookPoints) if (h.cooldown > 0) h.cooldown = Math.max(0, h.cooldown - dt);

  for (let i = 0; i < flips; i++) handleFlip(world);

  if (player.latched) {
    orbitStep(world, dt);
    return ev;
  }

  freeFlightStep(world, dt);
  releaseBuffers(world);
  if (tryLatch(world)) {
    ev.push('latch');
    return ev;
  }

  if (resolveSolids(world)) ev.push('obstacleHit');
  if (checkCapture(world)) {
    world.phase = 'captured';
    player.vel.x = 0;
    player.vel.y = -cfg.entryLaunchSpeed;
    ev.push('exitCaptured');
    if (world.roomIndex === world.rooms.length - 1) ev.push('win');
    return ev;
  }
  if (checkDeath(world) || checkStall(world, dt)) {
    world.phase = 'dead';
    player.alive = false;
    ev.push('death');
    return ev;
  }
  if (checkNearMiss(world)) ev.push('nearMiss');
  return ev;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd game && npx vitest run`
Expected: PASS — world (10) plus all earlier files. `purity.test.js` now scans seven sim files and must still pass.

- [ ] **Step 5: Commit**

```bash
git add game/src/sim/world.js game/test/world.test.js
git commit -m "feat(sim): add world step with tap buffering, entry launch and room events"
```

---

### Task 9: Passive bots

**Files:**
- Test: `game/test/bots.test.js`

**Interfaces:**
- Consumes: `createWorld`, `startRoom`, `step` (Task 8); `wallPolAt` (Task 3); `LEVELS` (Task 4).
- Produces: the release gate for room data — any change to a level file must keep this green.

**Bots** (wiki: no passive clears). **Idle:** never taps. **Drift:** never launches; whenever it is free-flying outside every field and opposite the walls at its height, it taps to be cushioned. **Repel** (v1 addition): never latches — inside a field it matches the nearest hook point, outside it stays cushioned. The TDD bots often latch early and orbit for the rest of the run, so on their own they test less than they look; the repel bot closes that gap. Each bot runs 60 simulated seconds per room, restarting after every death. A room fails if any bot reaches exit capture.

- [ ] **Step 1: Write the test** — `game/test/bots.test.js`

```js
import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { createWorld, startRoom, step } from '../src/sim/world.js';
import { wallPolAt } from '../src/sim/wave.js';

const DT = config.step;
const STEPS = Math.round(60 / DT);

const idleBot = () => 0;

function driftBot(w) {
  const p = w.player;
  if (w.phase !== 'live' || p.latched || p.inField) return 0;
  return p.pol !== wallPolAt(w.room, p.pos.y) ? 1 : 0;
}

// Stronger than the TDD bots: never latches at all. Inside a field it matches the nearest
// hook point (repelled); outside it stays cushioned. Catches rooms the drift bot only
// "fails" because it latches early and orbits forever.
function repelBot(w) {
  const p = w.player;
  if (w.phase !== 'live' || p.latched || p.bufferHook || p.bufferEntry) return 0;
  let near = null, nearD = Infinity;
  for (const h of w.room.hookPoints) {
    const d = Math.hypot(p.pos.x - h.pos.x, p.pos.y - h.pos.y);
    if (d < h.fieldRadius && d < nearD) { near = h; nearD = d; }
  }
  if (near) return p.pol !== near.pol ? 1 : 0;
  return p.pol !== wallPolAt(w.room, p.pos.y) ? 1 : 0;
}

// Returns true if the bot cleared the room within 60 simulated seconds.
function clears(roomIndex, bot, setup = () => {}) {
  const w = createWorld(LEVELS, config);
  startRoom(w, roomIndex, 0);
  setup(w);
  for (let i = 0; i < STEPS; i++) {
    const events = step(w, DT, bot(w));
    if (events.includes('exitCaptured')) return true;
    if (w.phase === 'dead') { startRoom(w, roomIndex, config.timing.readyBeat); setup(w); }
  }
  return false;
}

test('the harness detects a clear', () => {
  // Spawned straight under the exit mouth, the entry launch carries the player through the doorway.
  const underExit = (w) => { w.player.pos.x = w.room.exitX; w.player.pos.y = 70; };
  expect(clears(0, idleBot, underExit)).toBe(true);
});

for (const level of LEVELS) {
  test(`room ${level.index} (${level.name}): the idle bot never clears`, () => {
    expect(clears(level.index - 1, idleBot)).toBe(false);
  });
  test(`room ${level.index} (${level.name}): the drift bot never clears`, () => {
    expect(clears(level.index - 1, driftBot)).toBe(false);
  });
  test(`room ${level.index} (${level.name}): the repel bot never clears`, () => {
    expect(clears(level.index - 1, repelBot)).toBe(false);
  });
}
```

- [ ] **Step 2: Run it**

Run: `cd game && npx vitest run test/bots.test.js`
Expected: PASS (7 tests). There is no separate "fail first" step — this test guards data that already exists.

**If a bot clears a room, stop.** That is a room-design failure (spec §6 rule check), not a test bug. Do not weaken the bot or move room geometry on your own. Report to the user: which bot, which room, and the player's path (log `w.player.pos` every 60 steps for the clearing run). Room edits need the user's approval and must re-pass `levels.test.js`.

- [ ] **Step 3: Commit**

```bash
git add game/test/bots.test.js
git commit -m "test(sim): add idle and drift passive bots over both rooms"
```

---

### Task 10: `game.js` state machine and `input.js`

**Files:**
- Create: `game/src/game.js`, `game/src/input.js`
- Test: `game/test/game.test.js`

**Interfaces:**
- Consumes: `createWorld`, `startRoom`, `step` (Task 8); `config` (Task 2).
- Produces:
  - `createGame({ levels, cfg, storage, onEvent }) → game` — `storage` is a `localStorage`-like object or `null`; `onEvent(name)` receives every sim event plus `titleTap`, `roomStart`, `toTitle`.
  - `tap(game)` and `update(game, dt)`.
  - `game` fields the view reads: `state` (`'title'|'playing'|'transition'|'dying'|'win'`), `stateTime`, `world`, `runTime` (s), `deaths`, `best` (ms or `null`), `lastTimeMs`, `newBest`, `timeScale`, `startPending` (s left on the title flip; the title screen keeps drawing while it runs).
  - `bindInput(pointerTarget, keyTarget, onTap) → unbind` — one call per pointer press or Space press (key repeat ignored), passing `event.timeStamp`.

**State table** (spec §8):

| State | On enter | Leaves when |
|---|---|---|
| `title` | — | tap → `titleTap` (logo F flips; further taps ignored) → after `titleFlipTime` (0.25 s) → `startRoom(0, readyBeat)`, `playing` |
| `playing` | — | sim `death` → `dying`; sim `exitCaptured` (not last) → `transition`; sim `win` → `win` |
| `transition` | next room reset (so the pan shows its start state); sim keeps stepping (player rises up the shaft) | `stateTime ≥ panTime` → `startRoom(next, 0)`, `playing` |
| `dying` | deaths +1, death slow-mo | `stateTime ≥ dyingTime` → `startRoom(same, readyBeat)`, `playing` |
| `win` | timer stops, best time saved | tap → `title` |

The run timer uses **unscaled** `dt`; slow-mo scales only the `dt` handed to `step`.

- [ ] **Step 1: Write the failing test** — `game/test/game.test.js`

```js
import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { createGame, tap, update } from '../src/game.js';
import { bindInput } from '../src/input.js';

const DT = config.step;

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}

function newGame(storage = memoryStorage()) {
  const events = [];
  const game = createGame({ levels: LEVELS, cfg: config, storage, onEvent: (e) => events.push(e) });
  return { game, events, storage };
}

function advance(game, seconds) {
  for (let i = 0; i < Math.round(seconds / DT); i++) update(game, DT);
}

// Title tap → logo flip (titleFlipTime) → room 1 ready beat → entry launch, then a little flight.
function beginPlay(game) {
  tap(game);
  advance(game, config.timing.titleFlipTime + config.timing.readyBeat + 0.1);
}

function captureNow(game) {
  const w = game.world;
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });
  Object.assign(w.player.vel, { x: 0, y: -200 });
  w.player.bufferEntry = false;
  w.player.latched = null;
}

test('title tap plays the logo flip, then starts room 1 after the ready beat', () => {
  const { game, events } = newGame();
  expect(game.state).toBe('title');
  tap(game);
  expect(game.state).toBe('title');                   // the F flips on the title screen first
  expect(events).toEqual(['titleTap']);
  tap(game);                                          // taps during the flip are ignored
  advance(game, config.timing.titleFlipTime - 0.05);
  expect(game.state).toBe('title');
  advance(game, 0.1);
  expect(game.state).toBe('playing');
  expect(events).toEqual(['titleTap', 'roomStart']);
  advance(game, 0.6);
  expect(events).toContain('entryLaunch');
  expect(game.world.phase).toBe('live');
});

test('taps during play reach the sim', () => {
  const { game, events } = newGame();
  tap(game);
  advance(game, config.timing.titleFlipTime + 1.0);   // clear of the entry zone
  events.length = 0;
  tap(game);
  update(game, DT);
  expect(events).toContain('flip');
});

test('death → dying 0.6 s (taps ignored) → same room with ready beat', () => {
  const { game, events } = newGame();
  beginPlay(game);
  const p = game.world.player;
  Object.assign(p.pos, { x: 18, y: 320 });            // 18 − 8 = 10: touching the wall, dies on the next step
  p.pol = -p.pol; p.latched = null;
  advance(game, 0.1);
  expect(game.state).toBe('dying');
  expect(game.deaths).toBe(1);
  tap(game);
  advance(game, 0.4);
  expect(game.state).toBe('dying');
  advance(game, 0.25);
  expect(game.state).toBe('playing');
  expect(game.world.roomIndex).toBe(0);
  expect(game.world.phase).toBe('ready');
  expect(events.filter((e) => e === 'roomStart')).toHaveLength(2);
});

test('room 1 exit → transition 0.4 s → room 2 entry launch', () => {
  const { game, events } = newGame();
  beginPlay(game);
  game.world.rooms[1].time = 5;                       // stale state from an earlier run
  captureNow(game);
  advance(game, 0.05);
  expect(game.state).toBe('transition');
  expect(game.world.rooms[1].time).toBe(0);           // reset before the pan draws it
  advance(game, 0.4);
  expect(game.state).toBe('playing');
  expect(game.world.roomIndex).toBe(1);
  advance(game, 0.02);
  expect(events.filter((e) => e === 'entryLaunch')).toHaveLength(2);
});

test('room 2 exit wins, stops the timer and stores the best time', () => {
  const { game, storage } = newGame();
  beginPlay(game);
  captureNow(game); advance(game, 0.5);              // → room 2
  advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  expect(game.state).toBe('win');
  const t = game.runTime;
  advance(game, 1);
  expect(game.runTime).toBe(t);
  expect(game.newBest).toBe(true);
  expect(game.lastTimeMs).toBe(Math.round(t * 1000));
  expect(storage.map.get('flip.bestTime.v1')).toBe(String(game.lastTimeMs));
});

test('a slower run keeps the old best', () => {
  const storage = memoryStorage();
  storage.setItem('flip.bestTime.v1', '1');
  const { game } = newGame(storage);
  expect(game.best).toBe(1);
  beginPlay(game);
  captureNow(game); advance(game, 0.5); advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  expect(game.newBest).toBe(false);
  expect(game.best).toBe(1);
});

test('win tap returns to title', () => {
  const { game, events } = newGame();
  beginPlay(game);
  captureNow(game); advance(game, 0.5); advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  tap(game);
  expect(game.state).toBe('title');
  expect(events.at(-1)).toBe('toTitle');
});

test('slow-mo never slows the run timer', () => {
  const { game } = newGame();
  beginPlay(game);
  const before = game.runTime;
  game.slowmo = 0.08;
  update(game, DT);
  expect(game.timeScale).toBe(0.3);
  expect(game.runTime).toBeCloseTo(before + DT, 12);
});

test('blocked storage means no best time, and the game still runs', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const { game } = newGame(broken);
  expect(game.best).toBe(null);
  beginPlay(game);
  captureNow(game); advance(game, 0.5); advance(game, 0.1);
  captureNow(game);
  expect(() => advance(game, 0.05)).not.toThrow();
  expect(game.state).toBe('win');
});

test('bindInput sends one tap per press and ignores key repeat', () => {
  const pointer = new EventTarget(), keys = new EventTarget();
  const taps = [];
  const unbind = bindInput(pointer, keys, (t) => taps.push(t));
  pointer.dispatchEvent(new Event('pointerdown', { cancelable: true }));
  const space = new Event('keydown', { cancelable: true }); space.code = 'Space'; space.repeat = false;
  keys.dispatchEvent(space);
  const held = new Event('keydown', { cancelable: true }); held.code = 'Space'; held.repeat = true;
  keys.dispatchEvent(held);
  const other = new Event('keydown', { cancelable: true }); other.code = 'KeyA'; other.repeat = false;
  keys.dispatchEvent(other);
  expect(taps).toHaveLength(2);
  unbind();
  pointer.dispatchEvent(new Event('pointerdown'));
  expect(taps).toHaveLength(2);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/game.test.js`
Expected: FAIL — `Failed to resolve import "../src/game.js"`

- [ ] **Step 3: Write `game/src/game.js`**

```js
// State machine on top of the sim (spec §8). Knows nothing about drawing.
import { createWorld, startRoom, step } from './sim/world.js';

function readBest(storage, key) {
  try {
    const raw = storage ? storage.getItem(key) : null;
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function recordBest(game) {
  const ms = Math.round(game.runTime * 1000);
  game.lastTimeMs = ms;
  game.newBest = game.best === null || ms < game.best;
  if (!game.newBest) return;
  game.best = ms;
  try {
    if (game.storage) game.storage.setItem(game.cfg.bestTimeKey, String(ms));
  } catch {
    // Storage blocked: keep the in-memory best only.
  }
}

function setState(game, state) {
  game.state = state;
  game.stateTime = 0;
}

export function createGame({ levels, cfg, storage = null, onEvent = () => {} }) {
  return {
    cfg,
    storage,
    onEvent,
    world: createWorld(levels, cfg),
    state: 'title',
    stateTime: 0,
    pendingTaps: 0,
    runTime: 0,
    timerRunning: false,
    deaths: 0,
    best: readBest(storage, cfg.bestTimeKey),
    lastTimeMs: 0,
    newBest: false,
    slowmo: 0,
    timeScale: 1,
    startPending: 0,              // seconds left on the title logo flip before the run starts
  };
}

function startRun(game) {
  game.runTime = 0;
  game.timerRunning = false;
  game.deaths = 0;
  game.newBest = false;
  game.pendingTaps = 0;
  startRoom(game.world, 0, game.cfg.timing.readyBeat);
  setState(game, 'playing');
  game.onEvent('roomStart');
}

export function tap(game) {
  switch (game.state) {
    case 'title':
      // The logo's F flips first (spec §8); the run starts when the flip ends.
      if (game.startPending > 0) break;             // already flipping: ignore extra taps
      game.onEvent('titleTap');
      game.startPending = game.cfg.timing.titleFlipTime;
      if (game.startPending <= 0) startRun(game);
      break;
    case 'playing':
      game.pendingTaps++;
      break;
    case 'win':
      setState(game, 'title');
      game.onEvent('toTitle');
      break;
    default:
      break;                                          // transition, dying: ignored
  }
}

function handleSimEvent(game, e) {
  const { cfg, world } = game;
  switch (e) {
    case 'entryLaunch':
      if (world.roomIndex === 0 && !game.timerRunning && game.runTime === 0) game.timerRunning = true;
      break;
    case 'nearMiss':
      game.slowmo = Math.max(game.slowmo, cfg.timing.nearMissSlowmo);
      break;
    case 'death':
      game.deaths++;
      game.slowmo = cfg.timing.deathSlowmo;
      setState(game, 'dying');
      break;
    case 'exitCaptured':
      if (world.roomIndex < world.rooms.length - 1) {
        world.rooms[world.roomIndex + 1].reset();     // the pan shows the next room at its start state
        setState(game, 'transition');
      }
      break;
    case 'win':
      game.timerRunning = false;
      recordBest(game);
      setState(game, 'win');
      break;
    default:
      break;
  }
  game.onEvent(e);
}

export function update(game, dt) {
  const { cfg, world } = game;
  if (game.slowmo > 0) game.slowmo = Math.max(0, game.slowmo - dt);
  game.timeScale = game.slowmo > 0 ? cfg.timing.slowmoScale : 1;
  const simDt = dt * game.timeScale;
  game.stateTime += dt;
  if (game.timerRunning) game.runTime += dt;

  switch (game.state) {
    case 'title':
      if (game.startPending > 0) {
        game.startPending -= dt;
        if (game.startPending <= 0) {
          game.startPending = 0;
          startRun(game);
        }
      }
      break;
    case 'playing': {
      const taps = game.pendingTaps;
      game.pendingTaps = 0;
      const events = step(world, simDt, taps);
      for (let i = 0; i < events.length; i++) handleSimEvent(game, events[i]);
      break;
    }
    case 'transition':
      step(world, simDt, 0);
      if (game.stateTime >= cfg.timing.panTime) {
        startRoom(world, world.roomIndex + 1, 0);
        setState(game, 'playing');
        game.onEvent('roomStart');
      }
      break;
    case 'dying':
      if (game.stateTime >= cfg.timing.dyingTime) {
        startRoom(world, world.roomIndex, cfg.timing.readyBeat);
        setState(game, 'playing');
        game.pendingTaps = 0;
        game.onEvent('roomStart');
      }
      break;
    default:
      break;
  }
}
```

Note: `handleSimEvent` loops with an index because `step` returns the shared `world.events` array — a `death` handler must never trigger another `step` while iterating.

- [ ] **Step 4: Write `game/src/input.js`**

```js
// Pointer down or Space flips polarity: one call per press, holding does nothing.
// event.timeStamp is passed through for future per-tap latency use; v1 applies the fixed
// config.inputLatencyComp rewind inside the sim.
export function bindInput(pointerTarget, keyTarget, onTap) {
  const onPointer = (e) => {
    if (e.cancelable) e.preventDefault();
    onTap(e.timeStamp);
  };
  const onKey = (e) => {
    if (e.code !== 'Space') return;
    if (e.cancelable) e.preventDefault();
    if (!e.repeat) onTap(e.timeStamp);
  };
  pointerTarget.addEventListener('pointerdown', onPointer);
  keyTarget.addEventListener('keydown', onKey);
  return () => {
    pointerTarget.removeEventListener('pointerdown', onPointer);
    keyTarget.removeEventListener('keydown', onKey);
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd game && npx vitest run`
Expected: PASS — game (10) plus all earlier files.

- [ ] **Step 6: Commit**

```bash
git add game/src/game.js game/src/input.js game/test/game.test.js
git commit -m "feat(game): add state machine, run timer, best time and input binding"
```

---

### Task 11: View core — easing, camera, particle pool, effects registry

**Files:**
- Create: `game/src/view/anim/ease.js`, `game/src/view/camera.js`, `game/src/view/particles.js`, `game/src/view/anim/effects.js`
- Test: `game/test/view.test.js`

**Interfaces:**
- Consumes: `game` fields (Task 10); `world` (Task 8); `theme` (Task 2).
- Produces:
  - `ease.js`: `easeOutCubic(t)`, `easeOutBack(t)`, `clamp01(t)`.
  - `camera.js`: `createCamera() → { y, offsetX, offsetY, … }`, `shake(cam, amount, time)`, `updateCamera(cam, game, dt, rand = Math.random)`. `cam.y` is 0 in a room and eases to `−640` during `transition`; the renderer translates by `−cam.y`.
  - `particles.js`: `POOL_SIZE = 200`, `createParticles()`, `spawn(pool, x, y, vx, vy, life, color, size)`, `burst(pool, x, y, count, speed, life, color, size)`, `updateParticles(pool, dt)`, `drawParticles(ctx, pool)`.
  - `effects.js`: `createEffects(theme)`, `handleEvent(fx, type, world)`, `updateEffects(fx, dt, world)` — fields per the contract section at the top of this plan, plus `fx.titleFlipped` (boolean) and `fx.time`.

These modules hold **timers and state only**; how each effect looks is drawn by the art modules in Task 12, which the art plan restyles.

- [ ] **Step 1: Write the failing test** — `game/test/view.test.js`

```js
import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { theme } from '../src/theme.js';
import { LEVELS } from '../src/levels/index.js';
import { createWorld, startRoom, step } from '../src/sim/world.js';
import { easeOutCubic } from '../src/view/anim/ease.js';
import { createCamera, shake, updateCamera } from '../src/view/camera.js';
import { createParticles, spawn, POOL_SIZE } from '../src/view/particles.js';
import { createEffects, handleEvent, updateEffects } from '../src/view/anim/effects.js';

test('easeOutCubic', () => {
  expect(easeOutCubic(0)).toBe(0);
  expect(easeOutCubic(1)).toBe(1);
  expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
});

test('camera pans up one room over panTime, only during transition', () => {
  const cam = createCamera();
  updateCamera(cam, { cfg: config, state: 'transition', stateTime: 0.2 }, 0);
  expect(cam.y).toBeCloseTo(-640 * 0.875);
  updateCamera(cam, { cfg: config, state: 'transition', stateTime: 1 }, 0);
  expect(cam.y).toBeCloseTo(-640);
  updateCamera(cam, { cfg: config, state: 'playing', stateTime: 0 }, 0);
  expect(cam.y).toBe(0);
});

test('shake decays to nothing; a weaker shake never cuts a stronger one short', () => {
  const cam = createCamera();
  const game = { cfg: config, state: 'playing', stateTime: 0 };
  shake(cam, 10, 0.3);
  shake(cam, 3, 0.1);
  expect(cam.shakeAmount).toBe(10);
  updateCamera(cam, game, 0.1, () => 1);
  expect(cam.offsetX).toBeCloseTo(10 * (0.2 / 0.3));
  updateCamera(cam, game, 0.25, () => 1);
  expect(cam.offsetX).toBe(0);
});

test('the particle pool never grows past 200 and recycles', () => {
  const pool = createParticles();
  for (let i = 0; i < 500; i++) spawn(pool, 0, 0, 0, 0, 1, '#000', 2);
  expect(pool.items).toHaveLength(POOL_SIZE);
  expect(pool.items.filter((p) => p.alive)).toHaveLength(200);
});

function liveWorld() {
  const w = createWorld(LEVELS, config);
  startRoom(w, 0, 0);
  step(w, config.step, 0);
  return w;
}

test('death bursts particles and requests the death shake', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  handleEvent(fx, 'death', w);
  expect(fx.particles.items.filter((p) => p.alive)).toHaveLength(theme.fx.deathBurstCount);
  expect(fx.shakeRequest).toEqual({ amount: 10, time: 0.3 });
});

test('latch pop and flip ring run for their theme time, then clear', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  w.player.latched = w.room.hookPoints[0];
  handleEvent(fx, 'latch', w);
  handleEvent(fx, 'flip', w);
  expect(fx.latchPop.get(w.room.hookPoints[0])).toBe(theme.fx.latchPopTime);
  expect(fx.flipRing.t).toBe(theme.fx.flipRingTime);
  updateEffects(fx, 1, w);
  expect(fx.latchPop.size).toBe(0);
  expect(fx.flipRing.t).toBe(0);
});

test('the trail keeps at most trailDots samples', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  for (let i = 0; i < 100; i++) updateEffects(fx, theme.fx.trailInterval, w);
  expect(fx.trail.count).toBe(theme.fx.trailDots);
  handleEvent(fx, 'roomStart', w);
  expect(fx.trail.count).toBe(0);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/view.test.js`
Expected: FAIL — `Failed to resolve import "../src/view/anim/ease.js"`

- [ ] **Step 3: Write `game/src/view/anim/ease.js`**

```js
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
export function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}
```

- [ ] **Step 4: Write `game/src/view/camera.js`**

```js
// Camera frames one room exactly. During Transition it eases up one room height.
import { easeOutCubic, clamp01 } from './anim/ease.js';

export function createCamera() {
  return { y: 0, offsetX: 0, offsetY: 0, shakeAmount: 0, shakeTime: 0, shakeDuration: 0 };
}

export function shake(cam, amount, time) {
  const current = cam.shakeDuration > 0 ? cam.shakeAmount * (cam.shakeTime / cam.shakeDuration) : 0;
  if (amount < current) return;
  cam.shakeAmount = amount;
  cam.shakeTime = time;
  cam.shakeDuration = time;
}

export function updateCamera(cam, game, dt, rand = Math.random) {
  const { cfg } = game;
  cam.y = game.state === 'transition'
    ? -cfg.room.height * easeOutCubic(clamp01(game.stateTime / cfg.timing.panTime))
    : 0;

  if (cam.shakeTime > 0) {
    cam.shakeTime = Math.max(0, cam.shakeTime - dt);
    const a = cam.shakeAmount * (cam.shakeTime / cam.shakeDuration);
    cam.offsetX = (rand() * 2 - 1) * a;
    cam.offsetY = (rand() * 2 - 1) * a;
  } else {
    cam.offsetX = 0;
    cam.offsetY = 0;
  }
}
```

With `rand = () => 1` the offset is exactly the remaining amplitude, which is what the test checks.

- [ ] **Step 5: Write `game/src/view/particles.js`**

```js
// Fixed pool of solid dots. Never allocates after createParticles().
export const POOL_SIZE = 200;

export function createParticles() {
  const items = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    items.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#000', size: 2 });
  }
  return { items, next: 0 };
}

export function spawn(pool, x, y, vx, vy, life, color, size) {
  const p = pool.items[pool.next];
  pool.next = (pool.next + 1) % POOL_SIZE;
  p.alive = true;
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.life = life; p.maxLife = life;
  p.color = color; p.size = size;
}

export function burst(pool, x, y, count, speed, life, color, size) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const s = speed * (0.6 + 0.4 * ((i * 7) % count) / count);   // deterministic speed spread
    spawn(pool, x, y, Math.cos(a) * s, Math.sin(a) * s, life, color, size);
  }
}

export function updateParticles(pool, dt) {
  for (const p of pool.items) {
    if (!p.alive) continue;
    p.life -= dt;
    if (p.life <= 0) { p.alive = false; continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

// Opacity in four hard steps — flat look, no smooth fade (spec §4 / TDD visual rule).
export function drawParticles(ctx, pool) {
  for (const p of pool.items) {
    if (!p.alive) continue;
    ctx.globalAlpha = Math.ceil((p.life / p.maxLife) * 4) / 4;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
```

- [ ] **Step 6: Write `game/src/view/anim/effects.js`** — the event → animation registry

```js
// The only place events turn into juice. Timers and particles only; art modules draw them.
// Art plan: change timings in theme.fx, looks in view/art/*, and add new cases here.
import { createParticles, spawn, burst, updateParticles } from '../particles.js';

function polColor(theme, pol) { return pol > 0 ? theme.color.positive : theme.color.negative; }

function requestShake(fx, s) {
  if (s.amount >= fx.shakeRequest.amount) {
    fx.shakeRequest.amount = s.amount;
    fx.shakeRequest.time = s.time;
  }
}

function nearestSolid(world) {
  const p = world.player.pos;
  let best = null, bestD = Infinity;
  for (const o of world.room.solids) {
    const d = Math.hypot(p.x - o.pos.x, p.y - o.pos.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

function tickMap(map, dt) {
  for (const [key, t] of map) {
    if (t - dt <= 0) map.delete(key);
    else map.set(key, t - dt);
  }
}

export function createEffects(theme) {
  const n = theme.fx.trailDots;
  return {
    theme,
    time: 0,
    particles: createParticles(),
    trail: { x: new Float32Array(n), y: new Float32Array(n), pol: new Int8Array(n), count: 0, head: 0, timer: 0 },
    flipRing: { t: 0 },
    latchPop: new Map(),          // HookPoint → seconds left
    obstacleFlash: new Map(),     // Obstacle → seconds left
    roomPop: 0,
    titleFlipped: true,           // logo starts with the F upside down
    shakeRequest: { amount: 0, time: 0 },
  };
}

export function handleEvent(fx, type, world) {
  const f = fx.theme.fx;
  const p = world.player;
  switch (type) {
    case 'flip':
      fx.flipRing.t = f.flipRingTime;
      break;
    case 'latch':
      if (p.latched) fx.latchPop.set(p.latched, f.latchPopTime);
      break;
    case 'launch': {
      const sp = Math.hypot(p.vel.x, p.vel.y) || 1;
      const bx = -p.vel.x / sp, by = -p.vel.y / sp;
      const n = f.launchPuffCount;
      for (let i = 0; i < n; i++) {
        const a = (n > 1 ? i / (n - 1) - 0.5 : 0) * f.launchPuffSpread;
        const c = Math.cos(a), s = Math.sin(a);
        const vx = (bx * c - by * s) * f.launchPuffSpeed;
        const vy = (bx * s + by * c) * f.launchPuffSpeed;
        spawn(fx.particles, p.pos.x, p.pos.y, vx, vy, f.particleLife, polColor(fx.theme, p.pol), f.particleSize);
      }
      break;
    }
    case 'entryLaunch':
      requestShake(fx, f.entryShake);
      break;
    case 'obstacleHit': {
      const o = nearestSolid(world);
      if (o) fx.obstacleFlash.set(o, f.obstacleFlashTime);
      break;
    }
    case 'death':
      burst(fx.particles, p.pos.x, p.pos.y, f.deathBurstCount, f.deathBurstSpeed, f.particleLife,
        polColor(fx.theme, p.pol), f.particleSize);
      requestShake(fx, f.deathShake);
      break;
    case 'exitCaptured':
      fx.roomPop = f.roomPopTime;
      break;
    case 'roomStart':
      fx.trail.count = 0;
      fx.latchPop.clear();
      fx.obstacleFlash.clear();
      break;
    case 'titleTap':
    case 'toTitle':
      fx.titleFlipped = !fx.titleFlipped;
      break;
    default:
      break;
  }
}

export function updateEffects(fx, dt, world) {
  fx.time += dt;
  fx.flipRing.t = Math.max(0, fx.flipRing.t - dt);
  fx.roomPop = Math.max(0, fx.roomPop - dt);
  tickMap(fx.latchPop, dt);
  tickMap(fx.obstacleFlash, dt);
  updateParticles(fx.particles, dt);

  const tr = fx.trail, p = world.player;
  tr.timer -= dt;
  if (tr.timer <= 0 && p.alive && world.phase === 'live') {
    tr.timer = fx.theme.fx.trailInterval;
    tr.x[tr.head] = p.pos.x;
    tr.y[tr.head] = p.pos.y;
    tr.pol[tr.head] = p.pol;
    tr.head = (tr.head + 1) % tr.x.length;
    tr.count = Math.min(tr.count + 1, tr.x.length);
  }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd game && npx vitest run test/view.test.js`
Expected: PASS (7 tests)

- [ ] **Step 8: Commit**

```bash
git add game/src/view game/test/view.test.js
git commit -m "feat(view): add camera, particle pool and effects registry"
```

---

### Task 12: Blockout art modules, `render.js`, screens, fonts, `main.js`

**Files:**
- Create: `game/src/view/art/marks.js`, `walls.js`, `shaft.js`, `hookPoint.js`, `player.js`, `obstacle.js`, `updraft.js`, `hud.js`, `logo.js`
- Create: `game/src/view/render.js`, `game/src/view/screens.js`, `game/src/view/fonts.js`, `game/src/main.js`
- Test: `game/test/render.test.js`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - Art module functions with the **exact signatures in the contract section** at the top of this plan.
  - `formatTime(ms) → 'm:ss.cc'` (`hud.js`).
  - `renderFrame(ctx, game, fx, cam, alpha)` — `ctx` already scaled to logical units; draws one frame for any state.
  - `drawTitle(ctx, game, fx, theme)`, `drawWin(ctx, game, theme)` (`screens.js`).
  - `loadFonts(fontTheme) → Promise<boolean>` — resolves within `loadTimeoutMs`, never rejects.

**Blockout rule:** every shape uses `theme` colours and sizes and `config` geometry, so the build is readable and correctly sized, but no polish: no easing curves on pops beyond linear, no bespoke glyph work. The Art & Design plan replaces these bodies.

- [ ] **Step 1: Write the failing test** — `game/test/render.test.js`

A fake 2D context records nothing but enforces the flat-art rule: gradients and shadows throw.

```js
import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { theme } from '../src/theme.js';
import { LEVELS } from '../src/levels/index.js';
import { createGame, tap, update } from '../src/game.js';
import { createEffects, handleEvent, updateEffects } from '../src/view/anim/effects.js';
import { createCamera, updateCamera } from '../src/view/camera.js';
import { renderFrame } from '../src/view/render.js';
import { formatTime } from '../src/view/art/hud.js';

function fakeCtx() {
  const banned = new Set(['createLinearGradient', 'createRadialGradient', 'createConicGradient', 'filter']);
  const state = { measureText: (s) => ({ width: String(s).length * 8 }) };
  return new Proxy(state, {
    get(t, k) {
      if (banned.has(k)) throw new Error(`flat art rule: ${String(k)}`);
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) {
      if ((k === 'shadowBlur' && v > 0) || k === 'filter') throw new Error(`flat art rule: ${String(k)}`);
      t[k] = v;
      return true;
    },
  });
}

function setup() {
  const fx = createEffects(theme);
  const cam = createCamera();
  const game = createGame({ levels: LEVELS, cfg: config, storage: null, onEvent: (e) => handleEvent(fx, e, game.world) });
  const ctx = fakeCtx();
  const frame = (seconds) => {
    for (let i = 0; i < Math.round(seconds / config.step); i++) {
      update(game, config.step);
      updateEffects(fx, config.step, game.world);
    }
    updateCamera(cam, game, seconds);
    renderFrame(ctx, game, fx, cam, 0.5);
  };
  return { game, frame };
}

test('formatTime', () => {
  expect(formatTime(0)).toBe('0:00.00');
  expect(formatTime(83456)).toBe('1:23.45');
});

test('every state renders without error and without gradients or shadows', () => {
  const { game, frame } = setup();
  frame(0);                                            expect(game.state).toBe('title');
  tap(game); frame(0.2);                               // ready beat
  frame(0.6);                                          expect(game.state).toBe('playing');
  const w = game.world;
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });
  w.player.bufferEntry = false; w.player.latched = null;
  frame(0.05);                                         expect(game.state).toBe('transition');
  frame(0.2);                                          // mid-pan: both rooms drawn
  frame(0.4);                                          expect(game.world.roomIndex).toBe(1);
  Object.assign(w.player.pos, { x: 18, y: 320 });     // touching the wall: dies on the next step
  w.player.latched = null;
  frame(0.1);                                          expect(game.state).toBe('dying');
  frame(0.7);                                          // dying done, ready beat running
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });   // ready phase holds position
  frame(0.6);                                          // entry launch → exit pull → capture
  expect(game.state).toBe('win');
  frame(0.1);                                          // win screen
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/render.test.js`
Expected: FAIL — `Failed to resolve import "../src/view/render.js"`

- [ ] **Step 3: Write the art modules** — `game/src/view/art/`

`marks.js`:

```js
// + / − glyph in ink. Every polarity-coloured shape carries one (colour-blind rule).
export function drawMark(ctx, x, y, size, pol, theme) {
  const h = size * theme.size.markScale;
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = theme.stroke.ink;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - h, y);
  ctx.lineTo(x + h, y);
  if (pol > 0) {
    ctx.moveTo(x, y - h);
    ctx.lineTo(x, y + h);
  }
  ctx.stroke();
}

export function polColor(theme, pol) {
  return pol > 0 ? theme.color.positive : theme.color.negative;
}
```

`walls.js`:

```js
// Side bands in local wall polarity (hard edge at the wave front), neutral top/bottom walls,
// and the thin ink wave-front line.
import { config } from '../../config.js';
import { polColor } from './marks.js';

export function drawWalls(ctx, room, wave, theme) {
  const R = config.room;
  const c = theme.color;
  const f = wave.frontY < 0 ? 0 : wave.frontY;

  for (const x of [0, R.width - R.wallBand]) {
    ctx.fillStyle = polColor(theme, wave.polAbove);
    ctx.fillRect(x, 0, R.wallBand, f);
    ctx.fillStyle = polColor(theme, wave.polBelow);
    ctx.fillRect(x, f, R.wallBand, R.height - f);
  }

  ctx.fillStyle = c.neutral;
  ctx.fillRect(0, 0, R.width, R.topWall);
  ctx.fillRect(0, R.height - R.bottomWall, R.width, R.bottomWall);
  ctx.fillStyle = c.ink;
  const e = theme.walls.innerEdge;
  ctx.fillRect(0, R.topWall - e, R.width, e);
  ctx.fillRect(0, R.height - R.bottomWall, R.width, e);
  ctx.fillRect(R.wallBand - e, 0, e, R.height);
  ctx.fillRect(R.width - R.wallBand, 0, e, R.height);

  if (wave.frontY >= 0) {
    ctx.fillRect(R.wallBand, wave.frontY, R.width - 2 * R.wallBand, theme.walls.frontLineWidth);
  }
}
```

`shaft.js`:

```js
// Exit doorway (ceiling) and entry hatch (floor): ink interior, neutral posts with ink outline,
// three rising chevrons, and the exit's dashed pull cue. Geometry from config.shaft.
import { config } from '../../config.js';

function posts(ctx, x, top, bottom, theme) {
  const s = config.shaft;
  const half = s.opening / 2;
  for (const left of [x - half - s.postWidth, x + half]) {
    ctx.fillStyle = theme.color.neutral;
    ctx.fillRect(left, top, s.postWidth, bottom - top);
    ctx.strokeStyle = theme.color.ink;
    ctx.lineWidth = theme.shaft.postOutline;
    ctx.strokeRect(left, top, s.postWidth, bottom - top);
  }
}

function chevrons(ctx, x, top, bottom, time, theme) {
  const t = theme.shaft;
  const span = bottom - top;
  const w = t.chevronWidth / 2;
  ctx.strokeStyle = theme.color.background;
  ctx.lineWidth = theme.stroke.ink;
  for (let i = 0; i < 3; i++) {
    const y = bottom - ((time * t.chevronSpeed + i * t.chevronSpacing) % span);
    const k = Math.min(2, Math.floor(((bottom - y) / span) * 3));   // 0 near bottom → 2 near top
    ctx.globalAlpha = t.chevronAlphas[k];
    ctx.beginPath();
    ctx.moveTo(x - w, y + w / 2);
    ctx.lineTo(x, y - w / 2);
    ctx.lineTo(x + w, y + w / 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawExitDoorway(ctx, x, time, theme) {
  const s = config.shaft;
  const half = s.opening / 2;
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x - half, 0, s.opening, s.depth);                 // interior 46 deep, posts reach the mouth
  chevrons(ctx, x, 0, s.depth, time, theme);
  posts(ctx, x, 0, s.exitMouthY, theme);

  const t = theme.shaft;
  const feetY = s.exitMouthY;
  const a = (t.pullCueAngle * Math.PI) / 180;
  ctx.strokeStyle = theme.color.ink;
  ctx.globalAlpha = t.pullCueAlpha;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const sign of [-1, 1]) {
    const fx = x + sign * (half + s.postWidth);                   // outer foot of each post
    ctx.beginPath();
    ctx.moveTo(fx, feetY);
    ctx.lineTo(fx + sign * Math.sin(a) * t.pullCueLength, feetY + Math.cos(a) * t.pullCueLength);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function drawEntryHatch(ctx, x, time, theme) {
  const s = config.shaft;
  const H = config.room.height;
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x - s.opening / 2, H - s.depth, s.opening, s.depth);
  chevrons(ctx, x, H - s.depth, H, time, theme);
  posts(ctx, x, s.entryMouthY, H, theme);
}
```

`hookPoint.js`:

```js
import { drawMark, polColor } from './marks.js';

// pop: 1 at the moment of latching, falling to 0 over theme.fx.latchPopTime.
export function drawHookPoint(ctx, hook, playerInside, pop, theme) {
  const f = theme.field;
  ctx.strokeStyle = theme.color.ink;
  ctx.globalAlpha = playerInside ? f.insideAlpha : f.idleAlpha;
  ctx.lineWidth = playerInside ? f.insideWidth : f.idleWidth;
  ctx.beginPath();
  ctx.arc(hook.pos.x, hook.pos.y, hook.fieldRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const r = theme.size.hook * (1 + (theme.fx.latchPopScale - 1) * pop);
  ctx.fillStyle = polColor(theme, hook.pol);
  ctx.beginPath();
  ctx.arc(hook.pos.x, hook.pos.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = theme.stroke.ink;
  ctx.stroke();
  drawMark(ctx, hook.pos.x, hook.pos.y, r, hook.pol, theme);
}
```

`player.js`:

```js
import { config } from '../../config.js';
import { drawMark, polColor } from './marks.js';

export function drawTether(ctx, x, y, hook, theme) {
  ctx.strokeStyle = theme.color.ink;
  ctx.globalAlpha = theme.tether.alpha;
  ctx.lineWidth = theme.tether.width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(hook.pos.x, hook.pos.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawPlayer(ctx, x, y, player, fx, theme) {
  const r = config.playerRadius;
  const tr = fx.trail;
  for (let i = 0; i < tr.count; i++) {
    const idx = (tr.head - 1 - i + tr.x.length) % tr.x.length;   // newest first
    ctx.globalAlpha = 1 - (i + 1) / (tr.count + 1);                 // stepped, one level per dot
    ctx.fillStyle = polColor(theme, tr.pol[idx]);
    ctx.beginPath();
    ctx.arc(tr.x[idx], tr.y[idx], r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = polColor(theme, player.pol);
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = theme.stroke.ink;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawMark(ctx, x, y, r, player.pol, theme);

  if (fx.flipRing.t > 0) {
    const k = 1 - fx.flipRing.t / theme.fx.flipRingTime;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    ctx.arc(x, y, r + k * theme.fx.flipRingGrow, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
```

`obstacle.js`:

```js
export function drawObstacle(ctx, o, flash, theme) {
  ctx.fillStyle = theme.color.neutral;
  ctx.fillRect(o.left, o.top, o.w, o.h);
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = theme.stroke.ink * (flash > 0 ? 2 : 1);
  ctx.strokeRect(o.left, o.top, o.w, o.h);
}
```

`updraft.js`:

```js
import { config } from '../../config.js';

export function drawUpdraft(ctx, time, theme) {
  const u = theme.updraft;
  const R = config.room;
  const inner = R.width - 2 * R.wallBand;
  ctx.fillStyle = theme.color.ink;
  ctx.globalAlpha = u.alpha;
  for (let i = 0; i < u.count; i++) {
    const x = R.wallBand + ((i * 97) % inner);                         // fixed scatter, no randomness
    const y = R.height - ((time * u.speed + i * 53) % R.height);
    ctx.fillRect(x, y, u.dashWidth, u.dashLength);
  }
  ctx.globalAlpha = 1;
}
```

`hud.js`:

```js
import { config } from '../../config.js';

const pad2 = (n) => (n < 10 ? '0' : '') + n;

export function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor(ms / 1000) % 60;
  const cs = Math.floor(ms / 10) % 100;
  return `${m}:${pad2(s)}.${pad2(cs)}`;
}

// hud = { room, rooms, timeMs, deaths, roomPop }
export function drawHud(ctx, hud, theme) {
  const f = theme.font, y = theme.hud.y, pad = theme.hud.sidePad;
  ctx.fillStyle = theme.color.ink;
  ctx.textBaseline = 'top';
  const pop = hud.roomPop > 0 ? 1 + 0.3 * (hud.roomPop / theme.fx.roomPopTime) : 1;
  ctx.font = `${f.hud} ${Math.round(f.hudSize * pop)}px ${f.family}`;
  ctx.textAlign = 'left';
  ctx.fillText(`${hud.room} / ${hud.rooms}`, pad, y);
  ctx.font = `${f.hud} ${f.hudSize}px ${f.family}`;
  ctx.textAlign = 'center';
  ctx.fillText(formatTime(hud.timeMs), config.room.width / 2, y);
  ctx.textAlign = 'right';
  ctx.fillText(`× ${hud.deaths}`, config.room.width - pad, y);
}
```

`logo.js`:

```js
// "Flip" with the capital F upside down. flipped = true shows the upside-down F.
export function drawLogo(ctx, cx, cy, size, flipped, theme) {
  const f = theme.font;
  ctx.font = `${f.logo} ${size}px ${f.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const fw = ctx.measureText('F').width;
  const rest = ctx.measureText('lip').width;
  const x0 = cx - (fw + rest) / 2;
  ctx.save();
  ctx.translate(x0 + fw / 2, cy);
  if (flipped) ctx.rotate(Math.PI);
  ctx.fillText('F', -fw / 2, 0);
  ctx.restore();
  ctx.fillText('lip', x0 + fw, cy);
}
```

- [ ] **Step 4: Write `game/src/view/screens.js`**

```js
import { config } from '../config.js';
import { drawLogo } from './art/logo.js';
import { formatTime } from './art/hud.js';

function text(ctx, s, y, size, weight, theme) {
  ctx.font = `${weight} ${size}px ${theme.font.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, config.room.width / 2, y);
}

export function drawTitle(ctx, game, fx, theme) {
  const f = theme.font;
  drawLogo(ctx, config.room.width / 2, 240, f.logoSize, fx.titleFlipped, theme);
  text(ctx, 'Tap to flip', 360, f.bodySize, f.body, theme);
  text(ctx, `Best ${game.best === null ? '—' : formatTime(game.best)}`, 400, f.bodySize, f.body, theme);
}

export function drawWin(ctx, game, theme) {
  const f = theme.font;
  text(ctx, 'Cleared', 200, f.titleSize, f.logo, theme);
  text(ctx, formatTime(game.lastTimeMs), 260, f.titleSize, f.hud, theme);
  text(ctx, `× ${game.deaths}`, 300, f.bodySize, f.hud, theme);
  text(ctx, `Best ${game.best === null ? '—' : formatTime(game.best)}`, 340, f.bodySize, f.body, theme);
  if (game.newBest) text(ctx, 'New best', 380, f.bodySize, f.hud, theme);
  text(ctx, 'Tap to play again', 460, f.bodySize, f.body, theme);
}
```

- [ ] **Step 5: Write `game/src/view/render.js`** — draw order only

```js
// Draw order for one frame. ctx is in logical units (360 × 640). Never mutates game or world.
import { config } from '../config.js';
import { theme } from '../theme.js';
import { frontY, wallPolAt } from '../sim/wave.js';
import { drawWalls } from './art/walls.js';
import { drawExitDoorway, drawEntryHatch } from './art/shaft.js';
import { drawHookPoint } from './art/hookPoint.js';
import { drawPlayer, drawTether } from './art/player.js';
import { drawObstacle } from './art/obstacle.js';
import { drawUpdraft } from './art/updraft.js';
import { drawHud } from './art/hud.js';
import { drawParticles } from './particles.js';
import { drawTitle, drawWin } from './screens.js';

const wave = { frontY: -1, polAbove: 1, polBelow: 1 };
const hud = { room: 1, rooms: 1, timeMs: 0, deaths: 0, roomPop: 0 };

function readWave(room) {
  const w = room.wave;
  if (!w.enabled) {
    wave.frontY = -1;
    wave.polAbove = wave.polBelow = w.startPol;
    return wave;
  }
  const f = frontY(room.time, w.period, room.height);
  wave.frontY = f;
  wave.polAbove = wallPolAt(room, Math.max(0, f - 0.5));
  wave.polBelow = wallPolAt(room, Math.min(room.height, f + 0.5));
  return wave;
}

function drawRoom(ctx, room, player, fx, current) {
  drawUpdraft(ctx, fx.time, theme);
  drawWalls(ctx, room, readWave(room), theme);
  drawExitDoorway(ctx, room.exitX, fx.time, theme);
  drawEntryHatch(ctx, room.entryX, fx.time, theme);
  const flashTime = theme.fx.obstacleFlashTime;
  for (const o of room.obstacles) drawObstacle(ctx, o, (fx.obstacleFlash.get(o) ?? 0) / flashTime, theme);
  for (const o of room.posts) {
    const t = fx.obstacleFlash.get(o);
    if (t) drawObstacle(ctx, o, t / flashTime, theme);           // redraw a hit post with its flash
  }
  for (const h of room.hookPoints) {
    const inside = current && Math.hypot(player.pos.x - h.pos.x, player.pos.y - h.pos.y) < h.fieldRadius;
    const pop = (fx.latchPop.get(h) ?? 0) / theme.fx.latchPopTime;
    drawHookPoint(ctx, h, inside, pop, theme);
  }
}

export function renderFrame(ctx, game, fx, cam, alpha) {
  const R = config.room;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, R.width, R.height);
  ctx.clip();
  ctx.fillStyle = theme.color.background;
  ctx.fillRect(0, 0, R.width, R.height);

  if (game.state === 'title') {
    drawTitle(ctx, game, fx, theme);
    ctx.restore();
    return;
  }
  if (game.state === 'win') {
    drawWin(ctx, game, theme);
    ctx.restore();
    return;
  }

  const world = game.world;
  const p = world.player;
  ctx.translate(cam.offsetX, -cam.y + cam.offsetY);

  drawRoom(ctx, world.room, p, fx, true);
  const next = world.rooms[world.roomIndex + 1];
  if (game.state === 'transition' && next) {
    ctx.save();
    ctx.translate(0, -R.height);
    drawRoom(ctx, next, p, fx, false);
    ctx.restore();
  }

  drawParticles(ctx, fx.particles);
  if (p.alive) {
    const x = p.prev.x + (p.pos.x - p.prev.x) * alpha;
    const y = p.prev.y + (p.pos.y - p.prev.y) * alpha;
    if (p.latched) drawTether(ctx, x, y, p.latched, theme);
    drawPlayer(ctx, x, y, p, fx, theme);
  }
  ctx.restore();

  hud.room = world.roomIndex + 1;
  hud.rooms = world.rooms.length;
  hud.timeMs = Math.round(game.runTime * 1000);
  hud.deaths = game.deaths;
  hud.roomPop = fx.roomPop;
  drawHud(ctx, hud, theme);
}
```

`render.js` imports `wave.js` from the sim for the band colours — a read-only pure function, allowed by the boundary rule.

- [ ] **Step 6: Write `game/src/view/fonts.js`**

```js
// Loads the self-hosted Baloo 2 subset. Resolves false on missing file, error or timeout;
// the theme's font stack then falls back to ui-rounded / system-ui.
export async function loadFonts(font) {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') return false;
  try {
    const face = new FontFace('Baloo 2', `url(${font.file}) format('woff2')`, { weight: font.weights, display: 'block' });
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), font.loadTimeoutMs));
    const loaded = await Promise.race([face.load(), timeout]);
    if (!loaded) return false;
    document.fonts.add(loaded);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 7: Write `game/src/main.js`**

```js
// Boot: canvas + DPR-capped letterbox, fixed-step loop, visibility pause.
import { config } from './config.js';
import { theme } from './theme.js';
import { LEVELS } from './levels/index.js';
import { validateLevels } from './levels/validate.js';
import { createGame, tap, update } from './game.js';
import { bindInput } from './input.js';
import { createCamera, shake, updateCamera } from './view/camera.js';
import { createEffects, handleEvent, updateEffects } from './view/anim/effects.js';
import { renderFrame } from './view/render.js';
import { loadFonts } from './view/fonts.js';

if (import.meta.env.DEV) validateLevels(LEVELS, config);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const view = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };

function safeStorage() {
  try { return window.localStorage; } catch { return null; }
}

const fx = createEffects(theme);
const cam = createCamera();
const game = createGame({
  levels: LEVELS,
  cfg: config,
  storage: safeStorage(),
  onEvent: (e) => handleEvent(fx, e, game.world),
});

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, theme.render.maxDpr);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const R = config.room;
  view.scale = Math.min(w / R.width, h / R.height);
  view.offsetX = (w - R.width * view.scale) / 2;
  view.offsetY = (h - R.height * view.scale) / 2;
  view.dpr = dpr;
}

function draw(alpha) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = theme.color.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const s = view.scale * view.dpr;
  ctx.setTransform(s, 0, 0, s, view.offsetX * view.dpr, view.offsetY * view.dpr);
  renderFrame(ctx, game, fx, cam, alpha);
}

let last = 0, acc = 0, running = false, rafId = 0;

function frame(now) {
  // The first rAF timestamp can be earlier than the performance.now() taken in start().
  const dt = Math.max(0, Math.min((now - last) / 1000, config.maxFrameDelta));
  last = now;
  acc += dt;
  while (acc >= config.step) {
    update(game, config.step);
    updateEffects(fx, config.step * game.timeScale, game.world);
    acc -= config.step;
  }
  if (fx.shakeRequest.time > 0) {
    shake(cam, fx.shakeRequest.amount, fx.shakeRequest.time);
    fx.shakeRequest.amount = 0;
    fx.shakeRequest.time = 0;
  }
  updateCamera(cam, game, dt);
  draw(acc / config.step);
  rafId = requestAnimationFrame(frame);
}

function start() {
  if (running) return;
  running = true;
  last = performance.now();
  acc = 0;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  cancelAnimationFrame(rafId);
}

window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
resize();
bindInput(canvas, window, () => tap(game));
loadFonts(theme.font).finally(start);
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `cd game && npx vitest run`
Expected: PASS — render (2) plus every earlier file.

- [ ] **Step 9: Play it in the browser**

Run: `cd game && npm run dev` and open the printed URL in the browser pane (use `preview_start` with a `.claude/launch.json` entry: `runtimeExecutable: "npm"`, `runtimeArgs: ["run", "dev", "--prefix", "game"]`, `port: 5173`).

Check, and write each result down for the task report:
1. Title shows the logo with an upside-down F, "Tap to flip" and "Best —".
2. Tap: the title stays up for 0.25 s (the blockout logo does not animate yet; the art plan adds the F flip), then room 1 appears, a 0.5 s pause, then the player launches up out of the floor hatch.
3. Walls show two colour bands with a hard edge and a thin ink line that moves down.
4. Hook points show field rings that thicken when the player is inside.
5. Dying on a side wall: burst, shake, restart in the hatch after about 1.1 s, death count +1.
6. Flying into the exit doorway: camera pans up 0.4 s into room 2, player launches from room 2's hatch at the same x.
7. Room 2 exit: win screen with time, deaths, best, "New best". Tap → title with the new best shown.
8. Console shows no errors (`read_console_messages` with `onlyErrors: true`). **Expected exception until the Art & Design plan ships the font:** Vite answers the missing `/fonts/baloo2-subset.woff2` with an HTML page, so the browser logs a font decode / OTS warning. That one message is not a failure; anything else is.
9. At 375 × 812 (`resize_window` preset `mobile`) the room letterboxes with no scrollbars. Reset to `desktop` afterwards.

- [ ] **Step 10: Commit**

```bash
git add game/src/view game/src/main.js game/test/render.test.js
git commit -m "feat(view): add blockout art modules, renderer, screens, fonts and boot loop"
```

---

### Task 13: Build, size, static serve and performance check

**Files:**
- Modify: none expected. Fix-ups go in the file that caused the failure.

**Interfaces:**
- Consumes: the whole build.
- Produces: a verified `dist/` and a filled-in "Done when" checklist (spec §11) in the task report.

- [ ] **Step 1: Full test run**

Run: `cd game && npm test`
Expected: PASS — 13 test files (purity, config, wave, room, levels, physics, latch, collision, world, bots, game, view, render), 0 failures.

- [ ] **Step 2: Build**

Run: `cd game && npm run build`
Expected: `dist/index.html` plus `dist/assets/*.js`; no warnings about unresolved URLs.

- [ ] **Step 3: Check relative paths**

Run: `grep -o 'src="[^"]*"' game/dist/index.html`
Expected: every path starts with `./assets/` — never `/assets/` (itch.io serves from a nested path).

- [ ] **Step 4: Check the size budget**

Run: `node -e "const fs=require('fs'),p=require('path');const s=d=>fs.readdirSync(d).reduce((t,f)=>{const q=p.join(d,f);return t+(fs.statSync(q).isDirectory()?s(q):fs.statSync(q).size)},0);const b=s('game/dist');console.log(b,'bytes',b<204800?'OK':'OVER')"`
Expected: `OK`. Without the font this should be well under 50 KB; the art plan's font subset must keep the total under 204 800 bytes.

- [ ] **Step 5: Serve the static build and play it**

Run: `cd game && npx vite preview --port 4173`, open `http://localhost:4173` in the browser pane, and repeat the Task 12 Step 9 checklist on the built version. Expected: identical behaviour, no console errors (except the missing-font warning noted in Task 12 Step 9, until the font ships), no network requests other than the page's own files (`read_network_requests`).

- [ ] **Step 6: Measure frame rate**

In the browser pane on the running build, start room 1, then run with `javascript_tool`:

```js
await new Promise((done) => {
  let n = 0; const t0 = performance.now();
  const f = (t) => { n++; if (t - t0 < 3000) requestAnimationFrame(f); else { window.__fps = n / ((t - t0) / 1000); done(); } };
  requestAnimationFrame(f);
});
window.__fps
```

Expected: ≥ 58 on desktop Chrome. Record the number in the task report.

- [ ] **Step 7: Allocation review of the step path**

Run: `grep -nE "new |= \[|= \{|\.map\(|\.filter\(|\.slice\(|=>" game/src/sim/world.js game/src/sim/physics.js game/src/sim/collision.js game/src/sim/wave.js game/src/sim/vec.js`
Expected: matches only in `createWorld` and at module scope (the `acc` scratch vector). Any match inside `step`, `freeFlightStep`, `tryLatch`, `orbitStep`, `launch`, `resolveSolids` or the check functions is a bug — move the object to module scope and reuse it.

- [ ] **Step 8: Done-when checklist** (spec §11) — report each line as pass/fail with evidence

1. `npm test` passes, including both bots in both rooms — Step 1 output.
2. `npm run dev` plays title → room 1 → room 2 → win → title with no console errors — Task 12 Step 9.
3. Visuals use the canvas tokens — blockout only; **final visual match is the Art & Design plan's gate.**
4. `dist/` under 200 KB and runs from a static server — Steps 4–5.
5. 60 fps on desktop Chrome, no per-step allocation in `sim/` — Steps 6–7.

- [ ] **Step 9: Commit** (only if Steps 1–7 required fixes)

```bash
git add -A game
git commit -m "fix(game): address build and performance check findings"
```

---

## Spec coverage

| Spec item | Task |
|---|---|
| §2 polarity flip, fields, wall pull + cushion, `safeGap`, updraft | 5 |
| §2 latch, orbit bleed, launch, `relatchCooldown`, latency comp, launch assist | 6 |
| §2 buffered taps (launching field and entry zone) | 8 |
| §2 wall wave, front line, 400 ms grace | 3, 5, 12 |
| §2 static obstacles | 4, 7 |
| §6.1 exit doorway: posts, pull, capture; entry hatch launch; restart ready beat | 4, 5, 7, 8, 10 |
| §2 camera pan, restart with ready beat | 10, 11 |
| §8 state machine, run timer, deaths, best time `flip.bestTime.v1` | 10 |
| §4 art tokens → `theme.js`; art slots for the canvas pass | 2, 12 (bodies: Art & Design plan) |
| §2 juice: trail, launch puff, death burst, shake, slow-mo, near-miss, latch pop, flip ring, room pop, logo | 10 (slow-mo), 11 (timers), 12 (blockout draw) |
| §2 headless idle and drift bots | 9 |
| §6 both room definitions; rule checks | 4 (+ validator), 9 |
| §7 architecture and sim/view boundary | 1, 8, 12 (levels deviation noted above) |
| §9 storage try/catch, font fallback 1 s, frame clamp 0.25 s, visibility pause, dev room validation | 10, 12 |
| §10 tests | 3–12 |
| §11 done when | 13 |
| §2 out of scope: audio, `checkRooms.js`, sliding obstacles, launch preview (`false`), itch upload | not built; `launchPreview` in config |

---

## Decision Log

### [23-09-26] — Dev implementation plan written from the v1 spec
- **Added:** 13-task TDD plan for the `game/` engine: scaffold and purity guard, config/theme token files, wave, entities, per-room level files with validator, free-flight physics, latch/orbit/launch, collision and exit capture, world step, passive bots, state machine and input, view core (camera, particles, effects registry), blockout art modules with renderer and boot loop, build and performance gate. Art ↔ code contract section with fixed art-module signatures for the Art & Design plan.
- **Removed:** —
- **Choices given:** one combined plan vs separate dev and art plans → **Chosen:** separate (user request); this is the dev plan.
- **Notes:** Deviations from spec §7, each recorded in the plan's deviation table: levels moved from `sim/rooms.js` to `src/levels/` one file per room (user asked for easily found and edited levels); `step` returns event-name strings to stay allocation-free; drawing split into one art module per drawable. v1 config additions not in the TDD: `exitXRanges`, `launchAssistCone` 45°, `contactSlop` 0.5, `maxFrameDelta`, `waveGraceRamp`, shaft geometry, state timings. `obstacleFriction` follows the TDD pseudocode (multiply by 0.85), not its table wording ("share lost"); flagged for playtest. Previous session stalled while generating both plans in one pass; this plan was written section by section so progress was visible.

### [23-09-26] — Minor review findings fixed
- **Added:** Exit-pull test (Task 5). Validator rules for a centre-line obstacle in the upper half, an `obstacleGap` (48) to a wall on one side, obstacle clearance under hook bob, and shaft posts clear of orbits, with tests (Task 4; new config key `obstacleGap`). Repel bot as a third passive bot (Task 9). Next-room reset on exit capture, so the pan never shows stale state (Task 10). Notes on the expected missing-font warning (Tasks 12, 13). A list of known blockout issues handed to the art plan (HUD label over room 2's doorway, non-tabular timer). `dt` floor at 0 in `main.js`.
- **Removed:** Fixed `popScale` and seconds-valued `flash` arguments to the art modules. They now receive normalised 1 → 0 values, and hit shaft posts flash too. Latency compensation no longer moves the player back along the orbit; it only aims the launch.
- **Choices given:** fix blockers, major and minor findings, or minor only → **Chosen:** minor only (m1–m9).
- **Notes:** Launch assist now targets only hook points that will attract after the flip, within `maxReach`, plus the exit. Both changes to the TDD's rules 6 and 7 are recorded in the deviation table. Still open from the review: B1 (repo path contains `#` and `&`, which breaks npm, Vitest and Vite on Windows), B2 (Task 10 death test starts at x 19 and does not die in 0.1 s; x 18 fixes it; the Task 12 render test uses the same setup), M1 (per-step obstacle friction pins the player under room 1's bar; plus the centre-line stuck case that needs a user decision).

### [23-09-26] — M1 fixed: friction once per contact, stall death
- **Added:** `stallTime` (3 s, 0 disables) and `stallSpeed` (5 u/s) config keys. `Player.stallTimer`. `checkStall` in collision.js, wired into the world step as a death. Tests: friction applies once per contact; a pulled player pinned under room 1's bar slides free; a pinned player dies after `stallTime`; `stallTime` is configurable and 0 disables it. Two deviation-table rows.
- **Removed:** Friction applied on every contact step.
- **Choices given:** stuck-at-centre handling (stall death / hold to restart / both / leave for playtest) → **Chosen:** stall death, with the time configurable.
- **Notes:** A stall death emits the normal `death` event, so `game.js` and the view are unchanged. B1 (repo path) is not applied yet; the user asked why a clean path is needed. B2 (Task 10 death test starting at x 19) is still open.

### [25-09-26] — B2 fixed; shaft posts aligned with the canvas
- **Added:** Task 10 death test and Task 12 render test now place the player at x 18, touching the wall, so death is immediate (review B2).
- **Removed:** Post geometry that ran 6 past each mouth (exit posts y 0–58, hatch posts 582–640).
- **Notes:** The Flip Art canvas draws the exit posts y 0–52 and the hatch posts 588–640, ending at the mouth lines, with a 46-deep ink interior. That matches spec §4 ("6 longer than the shaft": 46 + 6 = 52). `buildPosts`, the room test and the blockout `shaft.js` now follow it; the pull-cue feet sit at the posts' outer edges, as on the canvas. Collision, validator and bot expectations are unaffected, by hand check (the post-orbit rule case is still 41 from the post, under 48).

### [25-09-26] — Title tap waits for the logo flip
- **Added:** `config.timing.titleFlipTime` (0.25 s) and `game.startPending`. A title tap emits `titleTap`, stays on the title while the F flips, ignores further taps, then starts the run. A `beginPlay` test helper; the title test now checks the delay and that extra taps are ignored.
- **Removed:** Run start on the same frame as the title tap.
- **Choices given:** add a start delay so the flip is seen (yes / no) → **Chosen:** yes. The screen transitions after the flip animation plays.
- **Notes:** Behaviour lives here; the art plan animates the flip for the same `titleFlipTime`, so the two can never drift. Seven game tests switched to `beginPlay` (0.85 s = flip + ready beat + 0.1). The Task 12 render test already advances 0.8 s before its first live check (entry launch at 0.75 s), so it is unaffected.

### [25-09-26] — Project-log steps added
- **Added:** Global constraints for CLAUDE.md logging (Decision Log on every `.md`; directory-log + setup-log for every new folder) and the shell / Python note. Task 1 Step 9b logs the `game/` tree; the README gets its Decision Log block.
- **Notes:** Prompted by the art-plan review (m12), which found the same gap there. No code or test change.
