# Flip v1 — Design Spec (2 custom rooms)

2026-09-23 · Status: draft, awaiting review

## 1. Goal

A playable browser build of Flip with **two custom rooms**, played start to finish: title → room 1 → room 2 → win. Proves the core loop (flip, latch, launch, read the wave) feels good before the full 10-room build.

Every rule and number not stated here comes from the TDD ([Reference Files/Flip-TDD.md](../Reference%20Files/Flip-TDD.md)), synthesised in the wiki ([main-index](../Commands%20and%20Logs/main-index.md)). This spec lists only what v1 **adds, changes or drops**.

**Visual source of truth:** the Claude Design canvas [Flip Art](https://claude.ai/artifact/51tn6oK5ZfHmTbD2dnK5fw). Where the canvas and TDD disagree on looks (colour, font, sizes), the canvas wins. Where they disagree on behaviour, the TDD wins.

## 2. Scope

**In**

- Full core gameplay per TDD: polarity flip, hook point fields, wall pull and cushion, `safeGap`, updraft, latch and orbit with speed bleed, launch, `relatchCooldown`, buffered taps, latency compensation, launch assist, wall wave with front line and 400 ms grace, static obstacles, entry hatch and exit doorway (§6.1), camera pan, restart with 0.5 s ready beat.
- State machine: Title → Playing ⇄ Transition / Dying → Win → Title.
- Run timer, death counter, best time in `localStorage`.
- Art pass and feedback juice from the canvas: palette, Baloo 2, wave bands, field rings, tether, ± marks, exit doorway and entry hatch shafts with rising chevrons, trail dots, launch puff, death burst, screen shake, slow-mo, near-miss, latch pop, flip ring pop, room-number pop, flipped-F logo.
- Headless idle and drift bots as automated tests.

**Out** (deferred, not rejected)

- Rooms 3–10 and the TDD's tutorial rooms 1–2.
- Audio (`audio.js`).
- `tools/checkRooms.js` launch- and catch-window measurement. Physics stays pure so it can be added later.
- Sliding obstacles (TDD rooms 8–10 only).
- Launch preview. TDD limits it to tutorial rooms; v1 rooms are room-5 tier. Kept as `config.launchPreview = false`.
- itch.io upload. `npm run build` must still produce a working static `dist/`.

## 3. Deviations from the TDD

| TDD | v1 | Why |
|---|---|---|
| 10 rooms; win on room 10 exit | 2 rooms; win on room 2 exit | Scope |
| Run timer ends at room 10 exit latch | Ends at room 2 exit capture | Follows from above |
| Palette `#9CC7F2 #F4A3A3 #F7F3EC #3B3A45 #D9D6E0` | `#6FA8DC #E27D7D #EDE6D8 #26252E #A9A4B5` | User: pastel too faint; background and neutral indistinguishable on small phones |
| System fonts only, no external requests | Baloo 2, self-hosted subset `.woff2` in the bundle | User choice. Still no runtime network requests |
| Launch preview in rooms 1–2 | Off | v1 rooms are not tutorials |
| Exit is a hook point: latch, orbit, held while the camera pans | Exit is a **doorway** cut through the top wall; the player flies in (§6.1) | User: the exit must not be circular or look like a hook point, and must read as an exit without a label |
| Entry is a hook point that flips colour to launch the player | Entry is a **floor hatch**, the same shaft continuing from the room below, launching straight up | Follows from the doorway; a circular entry would repeat the hook-point confusion |
| Room plan table | Two custom rooms (§6) | User choice: contrasting layouts, same tier |

## 4. Art tokens

Read from the canvas into `src/theme.js`. The canvas is re-read and `theme.js` re-synced whenever the user changes the art.

| Token | Value |
|---|---|
| `positive` | `#6FA8DC` |
| `negative` | `#E27D7D` |
| `background` | `#EDE6D8` |
| `ink` | `#26252E` |
| `neutral` | `#A9A4B5` |
| font | Baloo 2 — 800 logo, 700 HUD and labels, 400 body |
| ink stroke | 2 |
| player / hook radius | 8 / 14 |
| shaft (exit doorway and entry hatch) | opening 60 wide, 46 deep, ink interior; neutral posts 8 wide with 2 px ink outline, 6 longer than the shaft, ending at the mouth line (exit posts y 0–52, hatch posts y 588–640) |
| shaft chevrons | three up-chevrons, 18 wide, background colour at 35 / 65 / 100 % from top to bottom (brightest at the bottom of each shaft, as on the canvas); in game they rise and fade as they rise |
| exit pull cue | two 64-long dashed ink lines at 40 %, fanning out 30° from the post feet |
| field ring idle / inside | 1 px at 20 % / 2 px at 50 % ink |
| tether | 1 px at 50 % ink |
| side wall band | 10, in local wall polarity colour |
| top / bottom wall | 6, neutral with 2 px ink inner edge |
| updraft dashes | 2 × 12, ink at 14 % |
| HUD | top row, y 12: `room / 2` left, timer centre (tabular), `× deaths` right |

Contrast checked: ink on blue 6.0:1, ink on red 5.4:1, ink on background 12.2:1, background vs neutral 1.95:1.

## 5. Coordinates

- Logical room 360 × 640, y down, origin top-left. Scaled to fit the canvas and letterboxed.
- Side wall bands occupy x 0–10 and 350–360. **Physics walls are the inner edges, x = 10 and x = 350.** Wall force distances, `safeGap`, `wallMargin` and death all measure from those edges. Centre line x = 180.
- Top wall y 0–6, bottom wall y 634–640. Both kill on contact, no force.
- World: room *n* occupies world y from `-(n-1)·640` to `-(n-1)·640 + 640`. Camera frames one room.

## 6. Rooms

Both rooms at room-5 tier: `wavePeriod` 6.5 s, `minOrbitSpeed` 3.2 rad/s, `minLaunchWindow` 0.22, `minCatchWindow` 0.48, bob `ampX` 8, `ampY` 5, `freq` 0.4, phases staggered by 1.1 rad per hook point.

### 6.1 Exit doorway and entry hatch

Rooms connect through one vertical shaft: room *n*'s exit doorway in the ceiling is room *n + 1*'s entry hatch in the floor, at the same x.

- **Exit doorway.** A 60-wide opening in the top wall at `exit.x`, flanked by posts. Mouth line y = 52. Posts are solid: they block like obstacles (TDD obstacle response) and never kill. The top wall either side still kills.
- **Exit pull.** Within 50 of the mouth centre `(exit.x, 52)` and below the mouth, the player is attracted toward the mouth centre whatever its colour, with the TDD hook force (product fixed at −1). This zone overrides walls and updraft, exactly like a hook point field.
- **Capture.** The room clears when the player's centre crosses above y 52 with `|x − exit.x| < 30 − playerRadius`. The player keeps rising up the shaft, input is ignored, and the camera pans 0.4 s (ease-out cubic). This replaces the TDD's exit latch.
- **Entry hatch.** The same shaft in the floor of the next room, mouth y 588. The player appears at `(entry.x, 580)`, colour set to match the walls at that height, and is launched straight up at `entryLaunchSpeed`. No hook point flips. Room 1's hatch is bottom centre (x 180).
- **Restart.** After a death the player reappears in the hatch; 0.5 s ready beat (taps ignored), then the entry launch.
- **Entry buffer.** Taps within 50 of the hatch mouth after an entry launch are buffered until the player leaves that zone (replaces "inside the entry hook point's field").
- **Run timer** starts at room 1's first entry launch and stops at room 2's exit capture.

Room data carries only the shaft x: `entry: { x }`, `exit: { x }`. Exit x stays within 80–110 or 250–280 and opposite the entry side.

### Room 1 — Sidestep

Hook points hug alternating walls; the player must use wall pull to move sideways and read the wave to stay safe.

```js
{ index: 1, wave: { enabled: true, period: 6.5, startPol: +1 },
  minOrbitSpeed: 3.2, minLaunchWindow: 0.22, minCatchWindow: 0.48,
  entry: { x: 180 },   // floor hatch, bottom centre
  exit:  { x: 265 },   // ceiling doorway, top right
  hookPoints: [ { x: 110, y: 470, pol: -1 },
                { x: 240, y: 340, pol: +1 },
                { x: 110, y: 200, pol: -1 } ],
  obstacles:  [ { shape: 'bar', x: 200, y: 265, w: 70, h: 14 } ] }
```

Intended route: entry launch (blue, cushioned) → drift left on wall pull, catch the red hook at (110, 470) → launch up-right into the blue hook's field at (240, 340) as red → launch up-left around the bar to the red hook at (110, 200) → launch up-right into the exit pull and through the doorway.

The middle hook sits at x 240 (first drawn at 250) so its field covers the centre line (No passive clears, rule 3). Canvas updated.

### Room 2 — Cluster

Five mixed-colour hook points packed mid-room; the skill is choosing which to catch and in what colour.

```js
{ index: 2, wave: { enabled: true, period: 6.5, startPol: -1 },
  minOrbitSpeed: 3.2, minLaunchWindow: 0.22, minCatchWindow: 0.48,
  entry: { x: 265 },   // = room 1 exit x
  exit:  { x: 95 },    // ceiling doorway, top left
  hookPoints: [ { x: 215, y: 480, pol: +1 },
                { x: 140, y: 400, pol: -1 },
                { x: 240, y: 320, pol: +1 },
                { x: 150, y: 250, pol: +1 },
                { x: 230, y: 180, pol: -1 } ],
  obstacles:  [ { shape: 'square', x: 185, y: 125, w: 28, h: 28 },
                { shape: 'bar',    x: 290, y: 420, w: 14, h: 70 } ] }
```

### Rule checks (by hand; bots verify the passive ones)

| Rule | Room 1 | Room 2 |
|---|---|---|
| Exit opposite entry | Entry centre, exit right | Entry right, exit left |
| Exit pull ≥ 20 from centre line | Pull 215–315 → 35 | Pull 45–145 → 35 |
| Shaft posts clear of orbits and obstacles | Doorway posts x 227–303; hatch posts x 142–218 | Doorway posts x 57–133; hatch posts x 227–303 |
| A field covers centre line | (240, 340): 170–310 | (140, 400): 70–210 |
| Obstacle on centre line, upper half | Bar 165–235 at y 265 | Square 171–199 at y 125 |
| Field edge ≥ 30 from wall (`wallMargin`) | Minimum 30 (x 110 hooks) | Minimum 40 |
| Obstacle clear of orbits (≥ 48 from hook centre) | Closest: bar vs (240, 340), 68 | Closest: square vs (230, 180), 51 |
| Obstacle gap ≥ 48 on one side | Bar right gap 115 | Bar right gap 53 |
| Hops shorter than `maxReach` 220 | Longest: (110, 200) → exit mouth, 214 | Longest: (230, 180) → exit mouth, 186 |

Coordinates are a first draft. Tuning in playtest may move them; any move must re-pass this table and the bot tests.

## 7. Architecture

Vite project in `game/`, separate from the GPS wiki folders at the repo root.

```
game/
  index.html
  package.json            vite, vitest (dev only)
  vite.config.js          base: './'
  public/fonts/baloo2-subset.woff2
  src/
    main.js               boot, DPR-capped resize, fixed-step loop, visibilitychange pause
    game.js               state machine, run timer, deaths, best time, update/render dispatch
    config.js             every tuning value from the TDD table, plus launchPreview=false
    theme.js              art tokens from §4
    input.js              pointerdown / Space → timestamped flip queue, one per press
    sim/                  pure: no DOM, no canvas, no Date/performance calls
      vec.js              in-place vector helpers (no per-step allocation)
      wave.js             p(s,t), front height, grace timer
      physics.js          forces, integration, latch, orbit, launch, assist, latency comp
      collision.js        walls, obstacles, shaft posts, exit capture
      room.js             build a live Room from data; reset(); bob update
      rooms.js            the two room definitions (§6)
      entities.js         Player, HookPoint, Obstacle
      world.js            step(world, dt, flips) → events[]; the one entry point
    view/
      camera.js           pan (0.4 s ease-out cubic), shake
      render.js           draws world + HUD from theme tokens
      particles.js        fixed pool of 200
      screens.js          title, win
  test/
    wave.test.js  physics.test.js  collision.test.js  latch.test.js
    bots.test.js          idle and drift bots over both rooms
```

**Boundary:** `sim/` exposes `createWorld(rooms)` and `step(world, dt, flips)`. `step` returns events (`flip`, `latch`, `launch`, `entryLaunch`, `obstacleHit`, `nearMiss`, `death`, `exitCaptured`, `win`). `view/` reads world state and consumes events for juice; it never mutates the simulation. Slow-mo scales the `dt` handed to `step`, never the run timer.

**Data flow per frame:** input queue → `game.update(STEP)` × N → `sim.step` → events → particles, camera, HUD → `render(alpha)`.

## 8. State machine

As TDD, with room 2 as the last room.

| State | Enters on | Leaves on |
|---|---|---|
| Title | Boot; tap on Win | Tap → the logo's F flips (0.25 s, further taps ignored) → Playing, room 1 |
| Playing | Title flip done; pan done; Dying done | Wall contact or stall → Dying; exit capture room 1 → Transition; exit capture room 2 → Win |
| Transition | Room 1 exit capture | 0.4 s pan done → entry launch from room 2's hatch |
| Dying | Wall contact, or stall (pinned against a solid below 5 u/s for 3 s, configurable) | 0.6 s → reset room, 0.5 s ready beat, entry launch |
| Win | Room 2 exit capture | Tap → Title |

Timer starts at the first entry launch in room 1 and stops on the room 2 exit capture. Best time key: `flip.bestTime.v1` (milliseconds). Win screen shows time, deaths, best, and "New best" when beaten.

## 9. Error handling

- `localStorage` read/write wrapped in try/catch; missing or blocked storage means best shows "—" and the game still runs.
- Font load failure falls back to `ui-rounded, system-ui, sans-serif`; rendering waits at most 1 s for `document.fonts.load`.
- Frame delta clamped to 0.25 s; loop paused while the tab is hidden.
- Room data validated at load in dev builds (exit x range, field-wall margin); a failing room throws with its index.

## 10. Testing

Test-first with Vitest on `sim/` only.

- **wave:** band polarity above and below the front at several `t`; front height; grace suppresses wall force for 0.40 s then ramps over 0.15 s.
- **physics:** hook force sign (attract on opposite, repel on same); fields override walls and updraft; overlapping fields sum; cushioned player never closer than `safeGap` to a wall over a 10 s sweep of launches toward it; pulled player reaches the wall; updraft restores `riseSpeed`; speed capped at `maxSpeed`.
- **latch/launch:** latch inside `latchRadius` when attracted only; ω clamped to [min, max]; ω bleeds toward min by the TDD formula; launch velocity = tangential + radial impulse, capped; `relatchCooldown` blocks instant re-latch; buffered tap fires on field exit; latency comp rewinds θ by `inputLatencyComp`.
- **exit/entry:** exit pull attracts both colours and overrides walls; capture fires only inside the mouth span; posts block without killing; top wall beside the doorway kills; entry launch sets player colour to the wall at y 580 and velocity to `entryLaunchSpeed` straight up; taps within the entry zone are buffered.
- **collision:** obstacle push-out removes inward velocity and applies `obstacleFriction`; top/bottom wall kills; tunneling impossible at `maxSpeed`.
- **bots:** idle bot and drift bot each run 60 simulated seconds in both rooms; neither may reach exit capture.
- **Manual:** play both rooms in the browser pane at desktop and 375 × 812; a player new to the room clears each within 5 attempts.

## 11. Done when

1. `npm test` passes in `game/`, including both bots in both rooms.
2. `npm run dev` plays title → room 1 → room 2 → win → title with no console errors.
3. Visuals match the canvas tokens (§4).
4. `npm run build` produces `dist/` under 200 KB that runs from a static file server.
5. Steady 60 fps on desktop Chrome; no per-step allocation in `sim/`.

---

## Decision Log

### [23-09-26] — Spec written from brainstorming session
- **Added:** Full v1 design spec — scope, TDD deviations, art tokens, coordinate convention, both room definitions with rule checks, architecture, state machine, error handling, testing, done criteria.
- **Removed:** —
- **Choices given:** which rooms (3+4 / 4+5 / 5+6 / custom) → **Chosen:** two custom rooms. Room feel (ramp / showcase / contrasting same-tier) → **Chosen:** contrasting layouts, same tier. Layouts (Sidestep+Cluster / Ladder+Leap / Sidestep+Leap) → **Chosen:** Sidestep + Cluster at room-5 tier. Extras (screens+timer / art+juice / audio / checkRooms) → **Chosen:** screens+timer and art+juice. Code location (`game/` / repo root) → **Chosen:** `game/`. Font (Fredoka / Baloo 2 / Nunito / Rubik / Outfit / Space Grotesk) → **Chosen:** Baloo 2.
- **Notes:** Art authored in Claude Design canvas "Flip Art" at the user's request so they can edit it; canvas is the visual source of truth. Palette darkened at the user's request (background vs neutral 1.30 → 1.95 contrast). Room 1 middle hook moved x 250 → 240 during spec rule check so its field covers the centre line; canvas to follow. Physics walls defined at the inner edge of the 10-unit wall bands. Launch preview off; bots kept as Vitest tests in place of `checkRooms.js`.

### [23-09-26] — Exit marking made explicit
- **Added:** Exit tokens — radius 22, 3 px dashed rotating outer ring, "EXIT" pill with up-chevron, stronger dashed field ring, ink gate in the top wall. Exit label row in the rule-check table.
- **Removed:** "Canvas fix pending" note; the Room 1 hook x 240 fix is now on the canvas.
- **Notes:** User flagged that neither room layout marked the exit clearly. Change is visual only; exit latch behaviour and field radius (50) unchanged.

### [23-09-26] — Exit redesigned as a ceiling doorway
- **Added:** §6.1 exit doorway and entry hatch mechanics (pull zone, capture rule, posts as obstacles, entry launch without a flipping hook, entry buffer zone); two TDD-deviation rows; shaft tokens; `exitCaptured` event; exit/entry test group.
- **Removed:** Circular exit and entry tokens (radii, rings, EXIT pill, gate segment); entry/exit y values from room data; exit-latch wording in the state machine and tests.
- **Choices given:** Exit concept (ceiling doorway / finish gate / up-chute) → **Chosen:** ceiling doorway.
- **Notes:** User rejected the labelled circle (previous entry is superseded): an exit must not be circular or resemble a hook point and must read as an exit unaided. The doorway changes behaviour from the TDD (fly in instead of latch-and-orbit); flagged to the user before they chose. Room 1's hop to the exit mouth is now 214, inside maxReach 220 but the tightest in the build — first candidate for adjustment in playtest.

### [25-09-26] — Aligned with the canvas and the plan decisions
- **Added:** §4 chevrons: brightest at the bottom of each shaft, fading as they rise (canvas order). §4 shaft: posts end at the mouth line (exit y 0–52, hatch y 588–640). §8: the title tap flips the logo's F for 0.25 s before Playing, ignoring further taps; stall death as a second way into Dying.
- **Removed:** "brightest nearest the way out".
- **Choices given:** update the §4 chevron wording to the canvas (yes / no) → **Chosen:** yes. Transition after the title flip (yes / no) → **Chosen:** yes.
- **Notes:** The stall-death row records the decision already made during plan review (M1: stall death, time configurable), so the spec and the plans agree. The post geometry line records the canvas reading that corrected the dev plan.
