# Flip v1 — Art & Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dev plan's blockout art with the final Flip v1 look from the Flip Art canvas: the self-hosted font, every sprite, the rooms, the HUD, title and win screens, and every feedback animation, each wired to the event that triggers it.

**Architecture:** All art is procedural Canvas 2D. The only shipped asset files are the font and its licence. Style values live in `src/theme.js`; each drawable is one module in `src/view/art/`, whose signature the dev plan fixed; event → animation wiring lives in `src/view/anim/effects.js`. This plan replaces those **bodies**, never the signatures, and never touches `src/sim/`, `src/game.js` or `src/levels/`.

**Tech Stack:** Canvas 2D, Baloo 2 (SIL OFL 1.1) subset to WOFF2 with `fonttools` (`pyftsubset`, dev machine only), Vitest with a recording fake 2D context.

**Spec:** [2026-09-23-flip-v1-design.md](2026-09-23-flip-v1-design.md) §2 (juice list) and §4 (art tokens).
**Depends on:** [2026-09-23-flip-v1-dev-plan.md](2026-09-23-flip-v1-dev-plan.md), **all 13 tasks done.** Read its section "Where things go — the art ↔ code contract" before starting.
**Visual source of truth:** Claude Design canvas [Flip Art](https://claude.ai/artifact/51tn6oK5ZfHmTbD2dnK5fw), 8 artboards: Palette & tokens, Sprites (3×), Title, Room 1 — Sidestep, Room 2 — Cluster, Win, Font options, Exit options. An offline export is in `Reference Files/Flip Art.html`. Where canvas and spec disagree on **looks**, the canvas wins; on **behaviour**, the spec wins.

## Global Constraints

- Palette only: `#6FA8DC` positive, `#E27D7D` negative, `#EDE6D8` background, `#26252E` ink, `#A9A4B5` neutral. No other colour is ever set on the context (Task 2 adds a test that enforces this).
- Flat fills and strokes only: no gradients, shadows, blur or `filter` (the dev plan's fake-context test enforces this). Transparency comes from `globalAlpha` in fixed steps.
- Every polarity-coloured shape carries a `+` or `−` (U+2212) ink mark.
- One font: Baloo 2, weights 800 (logo), 700 (HUD, labels, marks) and 400 (body). Self-hosted at `public/fonts/baloo2-subset.woff2`, keeping that exact name. No runtime network requests. Fallback stack `ui-rounded, system-ui, sans-serif`.
- Room coordinates are logical 360 × 640. Canvas artboards are drawn 1:1 in the same units, so canvas pixel = game unit.
- Geometry that collides (player radius, shaft posts, opening, mouth lines) comes from `config.js`; art modules never hard-code it.
- `dist/` stays under 200 KB with the font included.
- Art-module signatures from the dev plan's contract section must not change. Where this plan needs more inputs, it reads existing fields (`fx.*`, `game.*`, `world.*`).
- Project rule: plans live in `Working Files/`; code lives in `game/`; commits go to `Dev`.
- Project logs (CLAUDE.md): every new or edited `.md` file gets a Decision Log block at its end. Every new folder, deletion or move is appended to **both** `Commands and Logs/directory-log.md` and `Maintenance/setup-log.md` (Structural Change Log), in the format those files already use. Tasks 1, 8 and 9 name the entries they need.
- Shell: run `bash` blocks in Git Bash (the Bash tool). Python is `py -3` on this machine; `python` is the Windows Store placeholder.

## Canvas → code: every token

Values read from the canvas files on 25-09-26. "Now" is what the dev plan's blockout ships; "→" is what this plan sets.

| Element | Canvas | Now (blockout) | → |
|---|---|---|---|
| Player | ⌀16, fill polarity, 2 ink stroke **inside** the circle, mark Baloo 700 10 px | stroke centred on r 8, stroked `+`/`−` lines | fill r 8, stroke r 7 × 2, glyph mark 10 px |
| Hook point | ⌀28, 2 ink stroke inside, mark Baloo 700 17 px | stroke centred on r 14, stroked lines | fill r 14, stroke r 13 × 2, glyph 17 px |
| Field ring | r 70; idle 1 px ink @ 20 %, inside 2 px @ 50 % | same | same (stroke inside: r 69.5 / 69) |
| Tether | 1 px ink @ 50 %, hook centre → player centre | same | same |
| Trail | **3** dots behind the player, ⌀8 / 7 / 6, polarity colour, alpha .55 / .35 / .20, ~10 apart, no outline | 5 dots, time-sampled | 3 dots, distance-sampled every 10 |
| Launch puff | **4 ink** dots, ⌀5 / 4 / 4 / 3, alpha .5 / .35 / .35 / .2, behind the launch (the Sprites cell draws this one at **2×**: its player is ⌀32) | 6 dots in polarity colour | 4 ink dots, radii 2.5 / 2 / 2 / 1.5 |
| Death burst | **8** dots in a ring, alternating ink and polarity colour, 6 × ⌀4 + 2 × ⌀2.7 at the sheet's nominal 3×, alpha .7. The cell has no reference sprite, so its scale is unconfirmed: check it in Task 8 | 24 dots in polarity colour | 8 dots per canvas |
| Obstacle | neutral fill, 2 ink stroke inside; bar / square | stroke centred | stroke inset 1 |
| Side walls | 10 wide, full height, local wall colour, **no ink edge** | ink inner edge drawn | no edge |
| Top / bottom walls | 6 tall between x 10–350, neutral, 2 px ink edge facing the room; cut out between the outer post edges | full width, edge on both walls | per canvas, with the doorway / hatch cut-outs |
| Wave front line | 1 px ink, **full width 0–360** (crosses the walls) | 10–350 | 0–360 |
| Exit doorway | interior ink x ± 30, y 0–46; posts 8 × 52 (y 0–52) neutral with 2 ink stroke; 3 chevrons 18 × 10.8, stroke 3.6 background colour, round caps, alpha .35 / .65 / 1 **top → bottom**, column centred in y 6–40, gap 3 | interior to y 52 | per canvas; chevrons animate upward |
| Entry hatch | mirror: interior y 594–640, posts y 588–640, chevrons in y 600–634 | interior from 588 | per canvas |
| Exit pull cue | two dashed lines, 1.5 px ink @ 40 %, 64 long, from the posts' **outer** feet (x ± 38, y 52), 30° out from vertical | 1 px, dash [4, 4] | 1.5 px, dash [4, 3] |
| Updraft dash | 2 × 12, ink @ 14 %, rounded ends (radius 1) | square ends | rounded |
| HUD | row at left 20 / right 20, top 12; `n / 2` and `× d` Baloo 700 13 px; timer 700 **15 px, tabular, tenths** (`0:18.4`) | 18 px, hundredths, not tabular | per canvas |
| Title | 4 idle hook points (⌀28) with rings @ **12 %**: + (90, 150), − (280, 250), − (110, 480), + (270, 540); logo `Flip` 800 **96 px**, letter-spacing −2, F rotated 180°; `tap to start` 700 16 px; `best —` 400 13 px @ 70 %; column from y 250, gap 20 | logo 72, "Tap to flip" | per canvas; hooks bob; F flips on tap |
| Win | `Cleared` 800 44 px; panel x 40–320, neutral fill, 2 ink border **outside** the padding (no `box-sizing`, so the panel is 140 tall), radius 16, padding 20 / 24, rows `Time` / `Deaths` / `Best` 15 px (label 400, value 800 tabular), gap 12; `New best` 700 13 px; `tap to return` 700 16 px; column from y 190, gap 28 | plain text lines | per canvas |

**Canvas calls already agreed:**
1. **Chevron brightness.** The canvas draws the brightest chevron at the **bottom** of both shafts, and the chevrons fade as they rise. Spec §4 was updated to match on 25-09-26.
2. **Copy.** The canvas says `tap to start` and `tap to return`; the dev blockout said "Tap to flip" and "Tap to play again". This plan uses the canvas copy.
3. **Timer position.** The canvas row uses `space-between`, which puts the timer at 180 + (left label width − right label width) / 2, about 4 units right of centre. This plan centres it at exactly 180 so it never shifts when the death count reaches two digits.

## Asset list

| Asset | File | Made how | Where it goes | Loaded by |
|---|---|---|---|---|
| Baloo 2 subset (variable, wght 400–800) | `game/public/fonts/baloo2-subset.woff2` | `pyftsubset` from Google Fonts' `Baloo2[wght].ttf` (Task 1) | copied as-is to `dist/fonts/` | `src/view/fonts.js` (`FontFace`, 1 s cap) |
| Baloo 2 licence | `game/public/fonts/OFL.txt` | copied from the same source | ships next to the font (OFL requires it) | — |
| Everything else | — | procedural Canvas 2D in `src/view/art/*` | — | `src/view/render.js` |

**Subset glyphs:** `A–Z a–z 0–9`, space, `. , : / ? ! ' -`, `×` (U+00D7), `−` (U+2212), `—` (U+2014), `+`. That covers every string in the game: HUD, title, win, marks.

## Animations: what plays, when, where

| Event (source) | Animation | Timing | Drawn by | Lives in |
|---|---|---|---|---|
| `flip` (sim) | ring pops out from the player, ink 2 px, r 8 → 18, alpha 1 → 0 | 0.25 s, ease-out cubic | `player.js` | `fx.flipRing` |
| `latch` (sim) | hook scales 1 → 1.1 → 1 | 0.12 s, sine bump (`sin(π·p)`) | `hookPoint.js` | `fx.latchPop` |
| `launch` (sim) | 4 ink puff dots drift back along the launch, stepped fade | 0.35 s | `particles.js` | `fx.particles` |
| `entryLaunch` (sim) | shake 3 units | 0.1 s | camera | `fx.shakeRequest` |
| `obstacleHit` (sim) | the hit obstacle's stroke doubles to 4 px (capped so a thin shaft post never turns solid ink) | 0.15 s | `obstacle.js` | `fx.obstacleFlash` |
| `nearMiss` (sim) | 80 ms slow-mo only (TDD), nothing drawn | — | `game.js` (dev) | — |
| `death` (sim) | player replaced by the 8-dot burst flying outward, shake 10 | burst 0.5 s, shake 0.3 s | `particles.js` | `fx.particles` |
| `exitCaptured` (sim) | HUD room number pops 1 → 1.3 → 1 | 0.6 s, sine bump | `hud.js` | `fx.roomPop` |
| always | trail: 3 dots every 10 units of travel | continuous | `player.js` | `fx.trail` |
| always | chevrons rise 20 units/s inside both shafts, fading as they rise | continuous, loop | `shaft.js` | `fx.time` |
| always | updraft dashes drift up 20 units/s | continuous | `updraft.js` | `fx.time` |
| always (title) | background hook points bob (TDD figure eight) | continuous | `screens.js` | `fx.time` |
| `titleTap` / `toTitle` (game) | logo F rotates 180°; a tap mid-flip reverses from the current angle, with no jump | 0.25 s (`config.timing.titleFlipTime`), ease-out back | `logo.js` | `fx.titleFlip`, `fx.titleFlipFrom` |

## File changes

```
game/
  public/fonts/baloo2-subset.woff2   NEW  (Task 1)
  public/fonts/OFL.txt               NEW  (Task 1)
  tools/subset-font.md               NEW  exact subset command, for re-running (Task 1)
  src/theme.js                       REWRITE values; same shape plus new keys (Task 2)
  src/view/particles.js              EDIT  spawn(..., alpha = 1) optional 9th arg (Task 5)
  src/view/anim/effects.js           EDIT  trail by distance, canvas puff/burst, logo flip timer (Task 5)
  src/view/art/marks.js              REWRITE glyph marks (Task 3)
  src/view/art/hookPoint.js          REWRITE (Task 3)
  src/view/art/player.js             REWRITE (Task 3)
  src/view/art/walls.js              REWRITE (Task 4)
  src/view/art/shaft.js              REWRITE (Task 4)
  src/view/art/updraft.js            REWRITE (Task 4)
  src/view/art/obstacle.js           REWRITE (Task 5)
  src/view/art/hud.js                REWRITE tenths, tabular cells, pop (Task 6)
  src/view/art/logo.js               REWRITE animated flip (Task 7)
  src/view/screens.js                REWRITE title + win per canvas (Task 7)
  src/view/debug/poses.js            NEW  dev-only ?pose= freezes a canvas scene (Task 8)
  src/view/debug/colourBlind.js      NEW  dev-only ?cb= colour-vision filter (Task 8)
  src/main.js                        EDIT  mount poses in dev; ?cb= colour-blind filter (Task 8)
  test/recordingCtx.js               NEW  recording fake 2D context (Task 2)
  test/scenes.js                     NEW  rig + play-through driver (Task 2)
  test/art.test.js                   NEW  recording-context tests (Tasks 2–8)
  test/fonts.test.js                 NEW  font file checks (Task 1)
  test/render.test.js                EDIT  formatTime expectations (Task 6)
  test/view.test.js                  EDIT  time-based trail test removed (Task 5)
  public/fonts/.gitkeep              DELETE (Task 1)
  README.md                          EDIT  art section + Decision Log (Task 9)
```

## Tasks

1. Font asset: download, subset, licence, loader check
2. `theme.js` re-sync and the palette-only test
3. Marks, hook points, player, tether
4. Walls, wave front, shafts, updraft
5. Obstacles, particles, trail, puff, burst
6. HUD: tenths, tabular digits, room pop
7. Title and win screens, animated logo
8. Debug poses and side-by-side check against the canvas
9. Accessibility, size, performance and handover

---

### Task 1: Font asset — download, subset, licence, loader check

**Files:**
- Create: `game/public/fonts/baloo2-subset.woff2`, `game/public/fonts/OFL.txt`, `game/tools/subset-font.md`
- Delete: `game/public/fonts/.gitkeep`
- Test: `game/test/fonts.test.js`

**Interfaces:**
- Consumes: `theme.font.file` (`'./fonts/baloo2-subset.woff2'`) and `loadFonts` from dev Task 12. Neither changes.
- Produces: a real font file at the path the loader already requests. Later tasks measure text with it.

- [ ] **Step 1: Write the failing test** — `game/test/fonts.test.js`

```js
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from 'vitest';

const FONT = fileURLToPath(new URL('../public/fonts/baloo2-subset.woff2', import.meta.url));
const OFL = fileURLToPath(new URL('../public/fonts/OFL.txt', import.meta.url));

test('the Baloo 2 subset ships as WOFF2 within budget', () => {
  expect(existsSync(FONT)).toBe(true);
  expect(readFileSync(FONT).subarray(0, 4).toString('latin1')).toBe('wOF2');
  expect(statSync(FONT).size).toBeLessThan(80_000);
});

test('the OFL licence ships next to the font', () => {
  expect(readFileSync(OFL, 'utf8')).toMatch(/SIL OPEN FONT LICENSE/i);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd game && npx vitest run test/fonts.test.js`
Expected: FAIL — `expected false to be true` (file missing).

- [ ] **Step 3: Ask the user before downloading**

Downloads need explicit approval (project safety rule). Ask in chat, naming each item:
1. `Baloo2[wght].ttf` from `https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf` (Google Fonts repository, SIL OFL 1.1). Check the size with `curl -sIL <url> | grep -i content-length` and quote it; expect roughly 0.5–1.5 MB.
2. `OFL.txt` from `https://github.com/google/fonts/raw/main/ofl/baloo2/OFL.txt` (a few KB).
3. `py -3 -m pip install --user fonttools brotli`: the subsetting tool, dev machine only, never shipped.

**Python on this machine:** `python` is the Windows Store placeholder and does not run; use the launcher `py -3` (Python 3.9 at review time). Check `py -3 --version` first. If `pip` refuses the newest `fonttools` on that Python, install the newest release that supports it: `py -3 -m pip install --user "fonttools<4.60" brotli`.

Wait for a clear yes. On no, stop the task and report; the game keeps running on the fallback font.

- [ ] **Step 4: Download to a scratch folder outside the repo, then subset**

The full TTF never enters the repo; only the subset does. **Run this block in Git Bash** (the Bash tool), not PowerShell: it relies on `$TMPDIR` and `\` line continuations.

```bash
mkdir -p "$TMPDIR/flip-font" && cd "$TMPDIR/flip-font"
curl -sL -o Baloo2.ttf "https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf"
curl -sL -o OFL.txt "https://github.com/google/fonts/raw/main/ofl/baloo2/OFL.txt"
py -3 -m pip install --user fonttools brotli
py -3 -m fontTools.subset Baloo2.ttf \
  --unicodes="U+0020-007E,U+00D7,U+2014,U+2212" \
  --layout-features="kern,liga" \
  --flavor=woff2 \
  --output-file=baloo2-subset.woff2
ls -l baloo2-subset.woff2
```

Expected: a file of roughly 20–60 KB. The variable `wght` axis is kept by default, so one file serves weights 400, 700 and 800. `tnum` is left out on purpose: Canvas 2D cannot switch OpenType features on, and the HUD draws tabular digits itself (Task 6), so it would only add bytes.

- [ ] **Step 5: Place the files in the repo**

Copy `baloo2-subset.woff2` and `OFL.txt` into `game/public/fonts/`, and delete `game/public/fonts/.gitkeep`.

- [ ] **Step 6: Record the recipe** — `game/tools/subset-font.md`

Plain Markdown, three short sections:
- **Source:** the two URLs from Step 3, the download date, and the licence (SIL OFL 1.1, Baloo 2 © The Baloo Project Authors — copy the exact copyright line from `OFL.txt`).
- **Command:** the `py -3 -m fontTools.subset …` block from Step 4, verbatim, with the note that it runs in Git Bash.
- **When to re-run:** whenever a new on-screen string uses a character outside the subset (anything beyond printable ASCII, `×`, `—`, `−`). Keep the output file name.
- End the file with the project's Decision Log block (CLAUDE.md, Decision Log Rule): `---`, `## Decision Log`, and one entry `### [DD-MM-YY] — Font subset recipe recorded` listing the source, the glyph set and that `tnum` was dropped.

- [ ] **Step 6b: Log the structural changes**

Append one entry each to `Commands and Logs/directory-log.md` **and** `Maintenance/setup-log.md` (Structural Change Log), in those files' existing formats:
- `CREATED | game/tools/`: new folder holding the font recipe.
- `DELETED | game/public/fonts/.gitkeep`: the folder now holds the font and its licence.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd game && npx vitest run test/fonts.test.js`
Expected: PASS (2 tests)

- [ ] **Step 8: Check the loader in the browser**

Start the dev server (the dev plan's `.claude/launch.json` entry), open the game in the browser pane, and run with `javascript_tool`:

```js
[...document.fonts].filter((f) => f.family.replace(/["']/g, '') === 'Baloo 2').map((f) => [f.status, f.weight])
```

Expected: one entry, `['loaded', '400 800']`. (`document.fonts.check()` is not enough: it returns `true` when no matching face is registered at all.) `read_network_requests` with `urlPattern: 'baloo2'` shows one request, status 200. The font decode warning the dev plan noted is gone (`read_console_messages`, `onlyErrors: true`, returns nothing).

- [ ] **Step 9: Commit**

```bash
git add -A game/public/fonts game/tools/subset-font.md game/test/fonts.test.js "Commands and Logs/directory-log.md" Maintenance/setup-log.md
git commit -m "feat(art): ship Baloo 2 subset font and OFL licence"
```

---

### Task 2: `theme.js` re-sync and the palette-only test

**Files:**
- Modify: `game/src/theme.js` (values replaced, every existing key kept, new keys added)
- Create: `game/test/recordingCtx.js`, `game/test/scenes.js`, `game/test/art.test.js`

**Interfaces:**
- Consumes: the dev plan's `theme` shape. **Every key the dev code reads stays**, so nothing breaks before Tasks 3–7 replace the art bodies.
- Produces:
  - New theme keys used by Tasks 3–7: `font.{logoTracking, timerSize, markPlayer, markHook, rowSize, smallSize}`, `field.titleAlpha`, `shaft.{chevronHeight, chevronStroke, chevronGap, pullCueWidth, pullCueDash}`, `updraft.radius`, `title.*`, `win.*`, `fx.{roomPopScale, trailSpacing, trailRadii, trailAlphas, launchPuffRadii, launchPuffAlphas, launchPuffLife, deathBurstRadii, deathBurstAlpha, deathBurstInnerSpeed}`. The logo flip's duration is **not** a theme key: it is `config.timing.titleFlipTime`, which `game.js` also waits for before starting the run, so the animation and the transition can never drift apart.
  - `test/recordingCtx.js`: `recordingCtx() → ctx` whose `ctx.log` is an array of `{ op: 'call' | 'set', name, args?, value?, fill, stroke, alpha, font, lineWidth }`.
  - `test/scenes.js`: `playThrough(ctx)` renders title → room 1 → transition → room 2 → dying → win into `ctx`, and `renderState(ctx, setup)` renders one frame after `setup(game)`.

- [ ] **Step 1: Write the recording context** — `game/test/recordingCtx.js`

```js
// A Canvas 2D stand-in that records every call and property write, tracks save/restore, and
// enforces the flat-art rule (no gradients, patterns, shadows or filters).
export function recordingCtx() {
  const log = [];
  const state = {
    fillStyle: '#000000', strokeStyle: '#000000', globalAlpha: 1, lineWidth: 1,
    font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic', lineCap: 'butt',
  };
  const stack = [];
  const banned = new Set(['createLinearGradient', 'createRadialGradient', 'createConicGradient', 'createPattern']);
  const snapshot = () => ({ fill: state.fillStyle, stroke: state.strokeStyle, alpha: state.globalAlpha, font: state.font, lineWidth: state.lineWidth });
  const api = {
    save() { stack.push({ ...state }); },
    restore() { Object.assign(state, stack.pop() ?? {}); },
    measureText(s) {
      const size = parseFloat((/(\d+(?:\.\d+)?)px/.exec(state.font) ?? [0, 10])[1]);
      return { width: String(s).length * size * 0.55, actualBoundingBoxAscent: size * 0.7, actualBoundingBoxDescent: size * 0.1 };
    },
  };
  return new Proxy(api, {
    get(t, k) {
      if (banned.has(k)) throw new Error(`flat art rule: ${String(k)}`);
      if (k === 'log') return log;
      if (k in t) return t[k];
      if (k in state) return state[k];
      return (...args) => { log.push({ op: 'call', name: k, args, ...snapshot() }); };
    },
    set(t, k, v) {
      if ((k === 'shadowBlur' && v > 0) || k === 'filter') throw new Error(`flat art rule: ${String(k)}`);
      state[k] = v;
      log.push({ op: 'set', name: k, value: v, ...snapshot() });
      return true;
    },
  });
}
```

- [ ] **Step 2: Write the scene driver** — `game/test/scenes.js`

```js
// Drives the real game through every state and renders each into a context.
import { config } from '../src/config.js';
import { theme } from '../src/theme.js';
import { LEVELS } from '../src/levels/index.js';
import { createGame, tap, update } from '../src/game.js';
import { createEffects, handleEvent, updateEffects } from '../src/view/anim/effects.js';
import { createCamera, updateCamera } from '../src/view/camera.js';
import { renderFrame } from '../src/view/render.js';

export function makeRig() {
  const fx = createEffects(theme);
  const cam = createCamera();
  const seen = {};                                    // event name → count, for coverage checks
  const game = createGame({
    levels: LEVELS, cfg: config, storage: null,
    onEvent: (e) => { seen[e] = (seen[e] ?? 0) + 1; handleEvent(fx, e, game.world); },
  });
  game.seen = seen;
  const advance = (seconds) => {
    for (let i = 0; i < Math.round(seconds / config.step); i++) {
      update(game, config.step);
      updateEffects(fx, config.step, game.world);
    }
    updateCamera(cam, game, seconds);
  };
  const draw = (ctx) => renderFrame(ctx, game, fx, cam, 0.5);
  return { game, fx, cam, advance, draw };
}

function toExit(w) {
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });
  w.player.bufferEntry = false;
  w.player.latched = null;
}

export function playThrough(ctx) {
  const { game, advance, draw } = makeRig();
  draw(ctx);                                          // title
  tap(game); advance(0.8); draw(ctx);                 // room 1, live
  const w = game.world;
  for (let i = 0; i < 20; i++) { tap(game); advance(0.05); draw(ctx); }   // flips (flip ring)
  if (game.state === 'dying') { advance(0.2); draw(ctx); advance(1.0); }  // taps may kill: let it restart

  // Force every remaining drawing path so the palette and alpha guards see it.
  const h = w.room.hookPoints[0];
  Object.assign(w.player.pos, { x: h.pos.x + 25, y: h.pos.y });
  Object.assign(w.player.vel, { x: 0, y: 0 });
  w.player.pol = -h.pol; w.player.latched = null; w.player.bufferEntry = false; w.player.bufferHook = null;
  advance(0.05); draw(ctx);                           // latch: tether + latch pop
  tap(game); advance(0.05); draw(ctx);                // launch: puff
  Object.assign(w.player.pos, { x: 200, y: 280 });    // under room 1's bar (y 258–272)
  Object.assign(w.player.vel, { x: 0, y: -100 });
  w.player.latched = null; w.player.bufferHook = null;
  advance(0.02); draw(ctx);                           // obstacle hit: flash

  toExit(w); advance(0.05); draw(ctx);                // transition start
  advance(0.2); draw(ctx);                            // mid-pan, both rooms
  advance(0.4); draw(ctx);                            // room 2
  Object.assign(w.player.pos, { x: 18, y: 320 }); w.player.latched = null;
  advance(0.1); draw(ctx);                            // dying: burst
  advance(0.7); toExit(w); advance(0.6); draw(ctx);   // win
  tap(game); advance(0.1); draw(ctx);                 // back to title, logo mid-flip
  advance(0.3);
  return game;
}
```

- [ ] **Step 3: Write the failing tests** — `game/test/art.test.js`

```js
import { test, expect } from 'vitest';
import { theme } from '../src/theme.js';
import { recordingCtx } from './recordingCtx.js';
import { playThrough } from './scenes.js';

const PALETTE = ['#6FA8DC', '#E27D7D', '#EDE6D8', '#26252E', '#A9A4B5'];

test('the play-through reaches every drawing path', () => {
  const game = playThrough(recordingCtx());
  for (const e of ['titleTap', 'flip', 'latch', 'launch', 'obstacleHit', 'exitCaptured', 'death', 'win', 'toTitle']) {
    expect(game.seen[e], e).toBeGreaterThan(0);
  }
  expect(game.state).toBe('title');                   // won, then tapped back to the title
});

test('only palette colours are ever set on the context', () => {
  const ctx = recordingCtx();
  playThrough(ctx);
  const colours = new Set(ctx.log
    .filter((e) => e.op === 'set' && (e.name === 'fillStyle' || e.name === 'strokeStyle'))
    .map((e) => String(e.value).toUpperCase()));
  expect(colours.size).toBeGreaterThan(0);
  for (const c of colours) expect(PALETTE).toContain(c);
});

test('globalAlpha stays within 0..1', () => {
  const ctx = recordingCtx();
  playThrough(ctx);
  for (const e of ctx.log.filter((x) => x.op === 'set' && x.name === 'globalAlpha')) {
    expect(e.value).toBeGreaterThanOrEqual(0);
    expect(e.value).toBeLessThanOrEqual(1);
  }
});

test('theme carries the canvas tokens', () => {
  expect(theme.font).toMatchObject({ logoSize: 96, logoTracking: -2, hudSize: 13, timerSize: 15, markPlayer: 10, markHook: 17 });
  expect(theme.hud).toMatchObject({ y: 12, sidePad: 20 });
  expect(theme.field.titleAlpha).toBe(0.12);
  expect(theme.shaft).toMatchObject({ chevronWidth: 18, chevronHeight: 10.8, chevronStroke: 3.6, chevronGap: 3, pullCueWidth: 1.5 });
  expect(theme.fx).toMatchObject({ trailDots: 3, trailSpacing: 10, launchPuffCount: 4, deathBurstCount: 8, deathBurstAlpha: 0.7 });
  expect(theme.fx.trailRadii).toEqual([4, 3.5, 3]);
  expect(theme.fx.trailAlphas).toEqual([0.55, 0.35, 0.2]);
  expect(theme.title.hooks).toHaveLength(4);
});
```

- [ ] **Step 4: Run them to verify the token test fails**

Run: `cd game && npx vitest run test/art.test.js`
Expected: the coverage, palette and alpha guards PASS (the blockout already obeys them; they are regression guards), and `theme carries the canvas tokens` FAILS on `logoSize` (72 ≠ 96).

- [ ] **Step 5: Rewrite `game/src/theme.js`**

```js
// Every visual value, read from the Flip Art canvas on 25-09-26 (art plan, "Canvas → code").
// Geometry that collides lives in config.js. Keys marked "compat" are read only by code this
// plan replaces; they stay until Task 9 removes them.
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
    file: './fonts/baloo2-subset.woff2', weights: '400 800', loadTimeoutMs: 1000,
    logo: 800, hud: 700, body: 400,
    logoSize: 96, logoTracking: -2,
    hudSize: 13, timerSize: 15,
    markPlayer: 10, markHook: 17,
    titleSize: 44,        // "Cleared"
    bodySize: 16,         // "tap to start", "tap to return"
    rowSize: 15,          // win panel rows
    smallSize: 13,        // "best —", "New best"
  },
  render: { maxDpr: 2 },
  stroke: { ink: 2 },
  size: { hook: 14, markScale: 0.55 },            // markScale: compat
  field: { idleWidth: 1, idleAlpha: 0.2, insideWidth: 2, insideAlpha: 0.5, titleAlpha: 0.12 },
  tether: { width: 1, alpha: 0.5 },
  walls: { innerEdge: 2, frontLineWidth: 1 },
  shaft: {
    postOutline: 2,
    chevronWidth: 18, chevronHeight: 10.8, chevronStroke: 3.6, chevronGap: 3,   // spacing = height + gap
    chevronSpacing: 13.8,                         // compat: the blockout shaft.js reads it until Task 4
    chevronAlphas: [0.35, 0.65, 1],               // top → bottom, as on the canvas
    chevronSpeed: 20,
    pullCueLength: 64, pullCueAlpha: 0.4, pullCueAngle: 30, pullCueWidth: 1.5, pullCueDash: [4, 3],
  },
  updraft: { dashWidth: 2, dashLength: 12, radius: 1, alpha: 0.14, count: 14, speed: 20 },
  hud: { y: 12, sidePad: 20, rowHeight: 24 },     // rowHeight ≈ the canvas row's line box; tune in Task 8
  title: {
    hooks: [
      { x: 90, y: 150, pol: +1 },
      { x: 280, y: 250, pol: -1 },
      { x: 110, y: 480, pol: -1 },
      { x: 270, y: 540, pol: +1 },
    ],
    columnY: 250, gap: 20, bestAlpha: 0.7,
  },
  win: { columnY: 190, gap: 28, panelX: 40, panelW: 280, panelRadius: 16, panelPadX: 24, panelPadY: 20, rowGap: 12 },
  fx: {
    latchPopScale: 1.1, latchPopTime: 0.12,
    flipRingTime: 0.25, flipRingGrow: 10,
    roomPopTime: 0.6, roomPopScale: 1.3,
    obstacleFlashTime: 0.15,
    trailDots: 3, trailSpacing: 10, trailRadii: [4, 3.5, 3], trailAlphas: [0.55, 0.35, 0.2],
    trailInterval: 0.03,                          // compat
    launchPuffCount: 4, launchPuffSpeed: 60, launchPuffSpread: 1.2, launchPuffLife: 0.35,
    launchPuffRadii: [2.5, 2, 2, 1.5], launchPuffAlphas: [0.5, 0.35, 0.35, 0.2],   // Sprites cell is 2×
    deathBurstCount: 8, deathBurstSpeed: 140, deathBurstInnerSpeed: 0.4, deathBurstAlpha: 0.7,
    deathBurstRadii: [2, 2, 2, 2, 2, 2, 1.35, 1.35],
    particleLife: 0.5, particleSize: 2,
    entryShake: { amount: 3, time: 0.1 },
    deathShake: { amount: 10, time: 0.3 },
  },
});
```

- [ ] **Step 6: Run the whole suite**

Run: `cd game && npm test`
Expected: PASS — art (4), fonts (2), plus every dev test. `view.test.js` still passes because the trail is still time-sampled until Task 5.

- [ ] **Step 7: Commit**

```bash
git add game/src/theme.js game/test/recordingCtx.js game/test/scenes.js game/test/art.test.js
git commit -m "feat(art): sync theme with the Flip Art canvas; add palette-only guard"
```

---

### Task 3: Marks, hook points, player, tether

**Files:**
- Rewrite: `game/src/view/art/marks.js`, `game/src/view/art/hookPoint.js`, `game/src/view/art/player.js`
- Test: `game/test/art.test.js` (append)

**Interfaces:**
- Consumes: `theme` (Task 2); `easeOutCubic` from `view/anim/ease.js`; `config.playerRadius`; `fx.trail`, `fx.flipRing` (dev Task 11).
- Produces (the contract signatures, unchanged):
  - `drawMark(ctx, x, y, size, pol, theme)`: **`size` now means glyph size in px** (`theme.font.markPlayer` 10 or `markHook` 17). Its only callers are the modules this task rewrites.
  - `polColor(theme, pol)`, unchanged.
  - `drawHookPoint(ctx, hook, playerInside, pop, theme)`, plus a new export `drawHookDisc(ctx, x, y, pol, scale, theme)` that the title screen reuses in Task 7.
  - `drawPlayer(ctx, x, y, player, fx, theme)` and `drawTether(ctx, x, y, hook, theme)`.

**Canvas rule used throughout:** the canvas draws circles with CSS `box-sizing: border-box`, so the 2-px ink stroke sits **inside** the radius. In Canvas 2D: fill at radius `r`, stroke at `r − lineWidth / 2`.

- [ ] **Step 1: Write the failing tests** — append to `game/test/art.test.js`

```js
import { drawMark } from '../src/view/art/marks.js';
import { drawHookPoint } from '../src/view/art/hookPoint.js';
import { drawPlayer, drawTether } from '../src/view/art/player.js';

const calls = (ctx, name) => ctx.log.filter((e) => e.op === 'call' && e.name === name);
const radii = (ctx) => calls(ctx, 'arc').map((e) => e.args[2]);

function hookAt(pol) { return { pos: { x: 100, y: 200 }, pol, fieldRadius: 70 }; }

function fxStub(overrides = {}) {
  return {
    trail: { x: new Float32Array(3), y: new Float32Array(3), pol: new Int8Array(3), count: 0, head: 0 },
    flipRing: { t: 0 },
    ...overrides,
  };
}

test('marks are Baloo 2 glyphs in ink: + and U+2212', () => {
  const ctx = recordingCtx();
  drawMark(ctx, 50, 50, 17, -1, theme);
  drawMark(ctx, 50, 50, 10, +1, theme);
  const [minus, plus] = calls(ctx, 'fillText');
  expect(minus.args[0]).toBe('−');
  expect(minus.font).toBe(`700 17px ${theme.font.family}`);
  expect(minus.fill).toBe('#26252E');
  expect(plus.args[0]).toBe('+');
  expect(plus.font).toBe(`700 10px ${theme.font.family}`);
});

test('hook point: r 14 fill, stroke inside at r 13, field ring idle vs inside', () => {
  const idle = recordingCtx();
  drawHookPoint(idle, hookAt(-1), false, 0, theme);
  expect(radii(idle)).toEqual(expect.arrayContaining([69.5, 14, 13]));
  const ring = calls(idle, 'stroke')[0];
  expect([ring.alpha, ring.lineWidth]).toEqual([0.2, 1]);
  expect(calls(idle, 'fill').some((e) => e.fill === '#E27D7D')).toBe(true);
  expect(calls(idle, 'fillText')[0].args[0]).toBe('−');

  const inside = recordingCtx();
  drawHookPoint(inside, hookAt(+1), true, 0, theme);
  expect(radii(inside)).toContain(69);
  const r2 = calls(inside, 'stroke')[0];
  expect([r2.alpha, r2.lineWidth]).toEqual([0.5, 2]);
});

test('latch pop peaks at 1.1× halfway through', () => {
  const ctx = recordingCtx();
  drawHookPoint(ctx, hookAt(+1), false, 0.5, theme);
  expect(radii(ctx).some((r) => Math.abs(r - 15.4) < 1e-9)).toBe(true);   // 14 × 1.1
});

test('player: r 8 body, stroke inside at 7, 10 px mark, 3-dot stepped trail', () => {
  const fx = fxStub();
  fx.trail.x.set([100, 100, 100]); fx.trail.y.set([230, 220, 210]); fx.trail.pol.set([1, 1, 1]);
  fx.trail.count = 3; fx.trail.head = 0;               // newest at index 2
  const ctx = recordingCtx();
  drawPlayer(ctx, 100, 200, { pol: +1 }, fx, theme);
  const r = radii(ctx);
  expect(r.slice(0, 3)).toEqual([4, 3.5, 3]);          // newest (largest) first
  expect(calls(ctx, 'fill').slice(0, 3).map((e) => e.alpha)).toEqual([0.55, 0.35, 0.2]);
  expect(r).toEqual(expect.arrayContaining([8, 7]));
  expect(calls(ctx, 'fillText')[0].font).toBe(`700 10px ${theme.font.family}`);
});

test('flip ring grows from the player edge and fades', () => {
  const ctx = recordingCtx();
  drawPlayer(ctx, 100, 200, { pol: -1 }, fxStub({ flipRing: { t: theme.fx.flipRingTime / 2 } }), theme);
  const ring = radii(ctx).at(-1);
  expect(ring).toBeGreaterThan(8);
  expect(ring).toBeLessThan(18);
});

test('tether: 1 px ink at 50 % from player to hook centre', () => {
  const ctx = recordingCtx();
  drawTether(ctx, 120, 200, hookAt(-1), theme);
  const s = calls(ctx, 'stroke')[0];
  expect([s.stroke, s.alpha, s.lineWidth]).toEqual(['#26252E', 0.5, 1]);
  expect(calls(ctx, 'lineTo')[0].args).toEqual([100, 200]);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd game && npx vitest run test/art.test.js`
Expected: 4 of the 6 new tests FAIL (marks, hook point, latch pop, player). For example, `marks are Baloo 2 glyphs` fails with `fillText` undefined (the blockout strokes lines), and the hook test fails because the radii are `[70, 14]`. `flip ring grows…` and `tether…` already pass: the blockout draws those the same way, and the tests pin it.

- [ ] **Step 3: Rewrite `game/src/view/art/marks.js`**

```js
// + / − marks as Baloo 2 glyphs in ink, vertically centred on the shape (canvas: Sprites).
// size = glyph size in px (theme.font.markPlayer / markHook).
const MINUS = '−';

export function polColor(theme, pol) {
  return pol > 0 ? theme.color.positive : theme.color.negative;
}

export function drawMark(ctx, x, y, size, pol, theme) {
  const glyph = pol > 0 ? '+' : MINUS;
  ctx.font = `${theme.font.hud} ${size}px ${theme.font.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Centre the font's line box on y, as the canvas does (flex centring, line-height 1): baseline
  // at y + (fontAscent − fontDescent) / 2. Measured each call so it is right before and after
  // the font finishes loading; about ten marks a frame, so the cost is negligible.
  const m = ctx.measureText(glyph);
  const a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
  const offset = Number.isFinite(a) && Number.isFinite(d) ? (a - d) / 2 : size * 0.3;
  ctx.fillText(glyph, x, y + offset);
}
```

- [ ] **Step 4: Rewrite `game/src/view/art/hookPoint.js`**

```js
import { drawMark, polColor } from './marks.js';

const TAU = Math.PI * 2;

// The coloured disc with its inside ink stroke and mark. scale 1 = 28 px across.
export function drawHookDisc(ctx, x, y, pol, scale, theme) {
  const r = theme.size.hook * scale;
  const w = theme.stroke.ink;
  ctx.fillStyle = polColor(theme, pol);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(x, y, r - w / 2, 0, TAU);
  ctx.stroke();
  drawMark(ctx, x, y, theme.font.markHook * scale, pol, theme);
}

// pop: 1 at the moment of latching, falling to 0 over latchPopTime. The scale rises to
// latchPopScale halfway and settles back, a single smooth beat.
export function drawHookPoint(ctx, hook, playerInside, pop, theme) {
  const f = theme.field;
  const w = playerInside ? f.insideWidth : f.idleWidth;
  ctx.globalAlpha = playerInside ? f.insideAlpha : f.idleAlpha;
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(hook.pos.x, hook.pos.y, hook.fieldRadius - w / 2, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const bump = pop > 0 ? Math.sin(Math.PI * pop) : 0;
  drawHookDisc(ctx, hook.pos.x, hook.pos.y, hook.pol, 1 + (theme.fx.latchPopScale - 1) * bump, theme);
}
```

- [ ] **Step 5: Rewrite `game/src/view/art/player.js`**

```js
import { config } from '../../config.js';
import { easeOutCubic } from '../anim/ease.js';
import { drawMark, polColor } from './marks.js';

const TAU = Math.PI * 2;

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

function drawTrail(ctx, fx, theme) {
  const tr = fx.trail, f = theme.fx;
  const n = Math.min(tr.count, f.trailRadii.length);
  for (let i = 0; i < n; i++) {
    const idx = (tr.head - 1 - i + tr.x.length) % tr.x.length;   // newest first
    ctx.globalAlpha = f.trailAlphas[i];
    ctx.fillStyle = polColor(theme, tr.pol[idx]);
    ctx.beginPath();
    ctx.arc(tr.x[idx], tr.y[idx], f.trailRadii[i], 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawPlayer(ctx, x, y, player, fx, theme) {
  drawTrail(ctx, fx, theme);

  const r = config.playerRadius;
  const w = theme.stroke.ink;
  ctx.fillStyle = polColor(theme, player.pol);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(x, y, r - w / 2, 0, TAU);
  ctx.stroke();
  drawMark(ctx, x, y, theme.font.markPlayer, player.pol, theme);

  if (fx.flipRing.t > 0) {
    const e = easeOutCubic(1 - fx.flipRing.t / theme.fx.flipRingTime);
    ctx.globalAlpha = 1 - e;
    ctx.strokeStyle = theme.color.ink;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(x, y, r + e * theme.fx.flipRingGrow, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd game && npm test`
Expected: PASS — art (10) plus everything earlier. In the player test the newest sample is at index `head − 1 = 2` (y 210), so the first arc is at y 210 with radius 4.

- [ ] **Step 7: Look at it**

Run the dev server, play room 1 in the browser pane, and take a zoomed screenshot (`computer` `zoom`) around a hook point and the player. Check: the marks are centred in their discs; the stroke sits inside the disc edge; the trail shows three shrinking, fading dots in the player's colour.

- [ ] **Step 8: Commit**

```bash
git add game/src/view/art/marks.js game/src/view/art/hookPoint.js game/src/view/art/player.js game/test/art.test.js
git commit -m "feat(art): canvas hook points, player, glyph marks, trail and flip ring"
```

---

### Task 4: Walls, wave front, shafts, updraft

**Files:**
- Rewrite: `game/src/view/art/walls.js`, `game/src/view/art/shaft.js`, `game/src/view/art/updraft.js`
- Test: `game/test/art.test.js` (append)

**Interfaces:**
- Consumes: `config.room`, `config.shaft` (post geometry as corrected in the dev plan: exit posts y 0–52, hatch posts y 588–640, interior 46 deep); `theme.shaft`, `theme.updraft`, `theme.walls`.
- Produces (contract signatures, unchanged): `drawWalls(ctx, room, wave, theme)`, `drawExitDoorway(ctx, x, time, theme)`, `drawEntryHatch(ctx, x, time, theme)`, `drawUpdraft(ctx, time, theme)`. `drawWalls` now also reads `room.exitX` and `room.entryX` to cut the doorway and hatch out of the top and bottom walls.

**Geometry** (exit x = 265, as in room 1):

| Part | Rect (x, y, w, h) |
|---|---|
| Top wall left / right | (10, 0, 217, 6) / (303, 0, 47, 6): neutral, ink edge at y 4–6 |
| Exit interior | (235, 0, 60, 46): ink |
| Exit posts | (227, 0, 8, 52), (295, 0, 8, 52): neutral, 2-px ink stroke inside |
| Chevron centres at t = 0 | y 36.8, 23.0, 9.2 (alpha 1, .65, .35); x = 265 |
| Pull-cue lines | (227, 52) → (195, 107.4) and (303, 52) → (335, 107.4) |
| Hatch (entry x 180) | interior (150, 594, 60, 46); posts (142, 588, 8, 52), (210, 588, 8, 52); chevron centres y 630.8, 617.0, 603.2 |

- [ ] **Step 1: Write the failing tests** — append to `game/test/art.test.js`

```js
import { drawWalls } from '../src/view/art/walls.js';
import { drawExitDoorway, drawEntryHatch } from '../src/view/art/shaft.js';
import { drawUpdraft } from '../src/view/art/updraft.js';

const rects = (ctx, colour) => calls(ctx, 'fillRect').filter((e) => e.fill === colour).map((e) => e.args);
const near = (a, b) => Math.abs(a - b) < 1e-6;

test('walls: full-height side bands split at the front, no ink edge, cut-outs, full-width front line', () => {
  const ctx = recordingCtx();
  drawWalls(ctx, { exitX: 265, entryX: 180 }, { frontY: 260, polAbove: -1, polBelow: +1 }, theme);
  expect(rects(ctx, '#E27D7D')).toEqual([[0, 0, 10, 260], [350, 0, 10, 260]]);
  expect(rects(ctx, '#6FA8DC')).toEqual([[0, 260, 10, 380], [350, 260, 10, 380]]);
  const neutral = rects(ctx, '#A9A4B5');
  expect(neutral).toEqual(expect.arrayContaining([[10, 0, 217, 6], [303, 0, 47, 6], [10, 634, 132, 6], [218, 634, 132, 6]]));
  const ink = rects(ctx, '#26252E');
  expect(ink).toContainEqual([0, 260, 360, 1]);                           // front line crosses the walls
  expect(ink.some((r) => r[3] === 640)).toBe(false);                     // no side-wall ink edge
});

test('exit doorway: 46-deep interior, posts to the mouth, rising chevrons, dashed pull cue', () => {
  const ctx = recordingCtx();
  drawExitDoorway(ctx, 265, 0, theme);
  expect(rects(ctx, '#26252E')).toContainEqual([235, 0, 60, 46]);
  expect(rects(ctx, '#A9A4B5')).toEqual([[227, 0, 8, 52], [295, 0, 8, 52]]);
  const chev = calls(ctx, 'stroke').filter((e) => e.stroke === '#EDE6D8');
  expect(chev.map((e) => e.alpha)).toEqual([1, 1, 0.65, 0.35]);          // entering (below the interior), then bottom → top
  const ys = calls(ctx, 'moveTo').filter((e) => e.stroke === '#EDE6D8').map((e) => e.args[1] - 3.6);
  expect(ys.slice(1).map((y) => Math.round(y * 10) / 10)).toEqual([36.8, 23, 9.2]);   // canvas centres
  expect(chev.every((e) => e.lineWidth === 3.6)).toBe(true);
  expect(calls(ctx, 'setLineDash')[0].args[0]).toEqual([4, 3]);
  const cue = calls(ctx, 'lineTo').filter((e) => e.alpha === 0.4);
  expect(cue).toHaveLength(2);
  expect(near(cue[0].args[0], 195) && near(cue[0].args[1], 52 + 64 * Math.cos(Math.PI / 6))).toBe(true);
});

test('chevrons move up over time and keep the canvas brightness order', () => {
  const at = (t) => {
    const ctx = recordingCtx();
    drawExitDoorway(ctx, 265, t, theme);
    return calls(ctx, 'moveTo').filter((e) => e.stroke === '#EDE6D8').map((e) => e.args[1]);
  };
  const y0 = at(0), y1 = at(0.1);
  expect(y1[0]).toBeLessThan(y0[0]);                                       // 2 units higher after 0.1 s
});

test('entry hatch mirrors the doorway in the floor', () => {
  const ctx = recordingCtx();
  drawEntryHatch(ctx, 180, 0, theme);
  expect(rects(ctx, '#26252E')).toContainEqual([150, 594, 60, 46]);
  expect(rects(ctx, '#A9A4B5')).toEqual([[142, 588, 8, 52], [210, 588, 8, 52]]);
});

test('updraft dashes: 2 × 12 rounded, ink at 14 %', () => {
  const ctx = recordingCtx();
  drawUpdraft(ctx, 0, theme);
  const dashes = calls(ctx, 'roundRect');
  expect(dashes).toHaveLength(theme.updraft.count);
  expect(dashes.every((e) => e.args[2] === 2 && e.args[3] === 12 && e.args[4] === 1)).toBe(true);
  expect(calls(ctx, 'fill').every((e) => e.alpha === 0.14 && e.fill === '#26252E')).toBe(true);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd game && npx vitest run test/art.test.js`
Expected: 4 of the 5 new tests FAIL (walls, exit doorway, chevron motion, updraft). For example, the blockout draws the side bands with an ink edge `[8, 0, 2, 640]`, draws three chevrons instead of four, and makes no `roundRect` calls. `entry hatch mirrors the doorway` already passes on the blockout, whose geometry the dev plan corrected; it is here to pin that behaviour.

- [ ] **Step 3: Rewrite `game/src/view/art/walls.js`**

```js
// Side bands (full height, local wall polarity, no edge), neutral top/bottom walls with an ink
// edge facing the room and the shaft openings cut out, and the full-width ink wave-front line.
import { config } from '../../config.js';
import { polColor } from './marks.js';

function wallRun(ctx, x0, x1, top, edgeAtBottom, theme) {
  if (x1 <= x0) return;
  const R = config.room, e = theme.walls.innerEdge;
  const h = edgeAtBottom ? R.topWall : R.bottomWall;
  ctx.fillStyle = theme.color.neutral;
  ctx.fillRect(x0, top, x1 - x0, h);
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x0, edgeAtBottom ? top + h - e : top, x1 - x0, e);
}

export function drawWalls(ctx, room, wave, theme) {
  const R = config.room, s = config.shaft;
  const cut = s.opening / 2 + s.postWidth;              // 38: from the centre to a post's outer edge
  const f = wave.frontY < 0 ? 0 : wave.frontY;

  for (const x of [0, R.width - R.wallBand]) {
    ctx.fillStyle = polColor(theme, wave.polAbove);
    ctx.fillRect(x, 0, R.wallBand, f);
    ctx.fillStyle = polColor(theme, wave.polBelow);
    ctx.fillRect(x, f, R.wallBand, R.height - f);
  }

  const L = R.wallBand, Rt = R.width - R.wallBand;
  wallRun(ctx, L, room.exitX - cut, 0, true, theme);
  wallRun(ctx, room.exitX + cut, Rt, 0, true, theme);
  const bottom = R.height - R.bottomWall;
  wallRun(ctx, L, room.entryX - cut, bottom, false, theme);
  wallRun(ctx, room.entryX + cut, Rt, bottom, false, theme);

  if (wave.frontY >= 0) {
    ctx.fillStyle = theme.color.ink;
    ctx.fillRect(0, wave.frontY, R.width, theme.walls.frontLineWidth);
  }
}
```

- [ ] **Step 4: Rewrite `game/src/view/art/shaft.js`**

```js
// Exit doorway (ceiling) and entry hatch (floor), per the canvas: ink interior 46 deep, neutral
// posts ending at the mouth line, chevrons rising and fading (three visible), the exit's dashed pull cue.
import { config } from '../../config.js';

function posts(ctx, x, top, bottom, theme) {
  const s = config.shaft, half = s.opening / 2, w = theme.shaft.postOutline;
  for (const left of [x - half - s.postWidth, x + half]) {
    ctx.fillStyle = theme.color.neutral;
    ctx.fillRect(left, top, s.postWidth, bottom - top);
    ctx.strokeStyle = theme.color.ink;
    ctx.lineWidth = w;
    ctx.strokeRect(left + w / 2, top + w / 2, s.postWidth - w, bottom - top - w);
  }
}

// Four chevrons on a loop of four slots, `spacing` apart, moving up at chevronSpeed. Slot 0 sits
// just below the interior, so a wrapping chevron slides in from the bottom edge instead of
// popping into view. Slots 1–3 are the canvas's three visible chevrons: brightest at the bottom,
// faintest at the top. At t = 0 the visible centres match the canvas (exit: 36.8, 23.0, 9.2).
function chevrons(ctx, x, top, time, theme) {
  const t = theme.shaft, s = config.shaft;
  const spacing = t.chevronHeight + t.chevronGap;        // 13.8
  const span = 4 * spacing;
  const base = top + s.depth / 2 + 2 * spacing;          // slot 0 centre (exit: 50.6)
  const hw = (t.chevronWidth * 0.8) / 2;                 // canvas path spans x 1–9 of 10
  const hh = (t.chevronHeight * (4 / 6)) / 2;            // and y 1–5 of 6

  ctx.save();
  ctx.beginPath();
  ctx.rect(x - s.opening / 2, top, s.opening, s.depth);
  ctx.clip();
  ctx.strokeStyle = theme.color.background;
  ctx.lineWidth = t.chevronStroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const [faint, mid, bright] = t.chevronAlphas;
  for (let i = 0; i < 4; i++) {
    const rise = (time * t.chevronSpeed + i * spacing) % span;
    const y = base - rise;
    const slot = Math.min(3, Math.floor(rise / spacing + 1e-6));
    ctx.globalAlpha = slot <= 1 ? bright : slot === 2 ? mid : faint;
    ctx.beginPath();
    ctx.moveTo(x - hw, y + hh);
    ctx.lineTo(x, y - hh);
    ctx.lineTo(x + hw, y + hh);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function pullCue(ctx, x, theme) {
  const s = config.shaft, t = theme.shaft;
  const a = (t.pullCueAngle * Math.PI) / 180;
  const foot = s.opening / 2 + s.postWidth;
  ctx.strokeStyle = theme.color.ink;
  ctx.globalAlpha = t.pullCueAlpha;
  ctx.lineWidth = t.pullCueWidth;
  ctx.setLineDash(t.pullCueDash);
  for (const sign of [-1, 1]) {
    const fx = x + sign * foot;
    ctx.beginPath();
    ctx.moveTo(fx, s.exitMouthY);
    ctx.lineTo(fx + sign * Math.sin(a) * t.pullCueLength, s.exitMouthY + Math.cos(a) * t.pullCueLength);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function drawExitDoorway(ctx, x, time, theme) {
  const s = config.shaft;
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x - s.opening / 2, 0, s.opening, s.depth);
  chevrons(ctx, x, 0, time, theme);
  posts(ctx, x, 0, s.exitMouthY, theme);
  pullCue(ctx, x, theme);
}

export function drawEntryHatch(ctx, x, time, theme) {
  const s = config.shaft, H = config.room.height;
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x - s.opening / 2, H - s.depth, s.opening, s.depth);
  chevrons(ctx, x, H - s.depth, time, theme);
  posts(ctx, x, s.entryMouthY, H, theme);
}
```

The test reads the chevron `moveTo` calls: each chevron's first point is `(x − 7.2, y + 3.6)`, so its y moves up with the chevron.

- [ ] **Step 5: Rewrite `game/src/view/art/updraft.js`**

```js
// Faint rounded ink dashes drifting up through open air. Fixed scatter, no randomness, so poses
// and screenshots are repeatable.
import { config } from '../../config.js';

export function drawUpdraft(ctx, time, theme) {
  const u = theme.updraft, R = config.room;
  const inner = R.width - 2 * R.wallBand - u.dashWidth;
  ctx.fillStyle = theme.color.ink;
  ctx.globalAlpha = u.alpha;
  for (let i = 0; i < u.count; i++) {
    const x = R.wallBand + ((i * 97) % inner);
    const y = R.height - ((time * u.speed + i * 53) % R.height);
    ctx.beginPath();
    ctx.roundRect(x, y, u.dashWidth, u.dashLength, u.radius);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd game && npm test`
Expected: PASS — art (15) plus everything earlier.

- [ ] **Step 7: Look at it**

In the browser pane, zoom on room 1's doorway and hatch (`computer` `zoom`, region around x 220–310, y 0–110). Check against the canvas Room 1 artboard: the top-wall gap sits exactly between the posts' outer edges; the posts run past the ink interior by 6; the chevrons rise and fade; the dashed cue fans out from the posts' outer feet.

- [ ] **Step 8: Commit**

```bash
git add game/src/view/art/walls.js game/src/view/art/shaft.js game/src/view/art/updraft.js game/test/art.test.js
git commit -m "feat(art): canvas walls, wave front, doorway, hatch and updraft"
```

---

### Task 5: Obstacles, particles, trail, launch puff, death burst

**Files:**
- Rewrite: `game/src/view/art/obstacle.js`
- Modify: `game/src/view/particles.js` (optional `alpha` argument), `game/src/view/anim/effects.js` (trail, puff, burst, logo-flip timer)
- Modify: `game/test/view.test.js` (replace the time-based trail test)
- Test: `game/test/art.test.js` (append)

**Interfaces:**
- Consumes: `fx` shape from dev Task 11; `theme.fx` (Task 2); `world.player` (`pos`, `vel`, `pol`, `alive`), `world.phase`.
- Produces:
  - `drawObstacle(ctx, obstacle, flash, theme)`: contract signature unchanged.
  - `spawn(pool, x, y, vx, vy, life, color, size, alpha = 1)`: new optional last argument; every existing call keeps working. Particles gain an `alpha` field; `drawParticles` multiplies it into the stepped fade.
  - `effects.js`: the trail is sampled **every `trailSpacing` units of travel** (not by time). New fields `fx.trail.lastX`, `fx.trail.lastY`, `fx.trail.has`, `fx.titleFlip` (seconds left on the logo flip) and `fx.titleFlipFrom`. New export `titleFlipValue(fx) → number` (0 = F upright, 1 = upside down, continuous through a mid-flip tap); Task 7's title screen draws the logo with it.

- [ ] **Step 1: Write the failing tests** — append to `game/test/art.test.js`

```js
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { createWorld, startRoom, step } from '../src/sim/world.js';
import { createEffects, handleEvent, updateEffects, titleFlipValue } from '../src/view/anim/effects.js';
import { createParticles, spawn, drawParticles } from '../src/view/particles.js';
import { drawObstacle } from '../src/view/art/obstacle.js';

function liveWorld() {
  const w = createWorld(LEVELS, config);
  startRoom(w, 0, 0);
  step(w, config.step, 0);
  return w;
}
const alive = (fx) => fx.particles.items.filter((p) => p.alive);

test('obstacle: neutral fill, 2 px ink stroke inside, doubled while flashing', () => {
  const o = { left: 165, top: 258, w: 70, h: 14 };
  const a = recordingCtx();
  drawObstacle(a, o, 0, theme);
  expect(calls(a, 'fillRect')[0]).toMatchObject({ args: [165, 258, 70, 14], fill: '#A9A4B5' });
  expect(calls(a, 'strokeRect')[0]).toMatchObject({ args: [166, 259, 68, 12], lineWidth: 2, stroke: '#26252E' });
  const b = recordingCtx();
  drawObstacle(b, o, 0.5, theme);
  expect(calls(b, 'strokeRect')[0]).toMatchObject({ args: [167, 260, 66, 10], lineWidth: 4 });
});

test('a flashing shaft post keeps a neutral core', () => {
  const post = { left: 227, top: 0, w: 8, h: 52 };
  const ctx = recordingCtx();
  drawObstacle(ctx, post, 0.5, theme);
  expect(calls(ctx, 'strokeRect')[0].lineWidth).toBe(3);             // capped at min(w, h) / 2 − 1
});

test('launch puff: 4 ink dots with the canvas sizes and alphas', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  Object.assign(w.player.vel, { x: 100, y: -200 });
  handleEvent(fx, 'launch', w);
  const ps = alive(fx);
  expect(ps).toHaveLength(4);
  expect(ps.every((p) => p.color === '#26252E')).toBe(true);
  expect(ps.map((p) => p.alpha)).toEqual([0.5, 0.35, 0.35, 0.2]);
  expect(ps.map((p) => p.size)).toEqual([2.5, 2, 2, 1.5]);
  expect(ps.every((p) => p.vy > 0)).toBe(true);                    // puffs trail behind an upward launch
});

test('death burst: 8 dots alternating ink and player colour at 70 %', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  w.player.pol = -1;
  handleEvent(fx, 'death', w);
  const ps = alive(fx);
  expect(ps).toHaveLength(8);
  expect(ps.map((p) => p.color)).toEqual(['#26252E', '#E27D7D', '#26252E', '#E27D7D', '#26252E', '#E27D7D', '#26252E', '#E27D7D']);
  expect(ps.every((p) => p.alpha === 0.7)).toBe(true);
  expect(ps.map((p) => p.size)).toEqual([2, 2, 2, 2, 2, 2, 1.35, 1.35]);
});

test('particle alpha multiplies into the stepped fade', () => {
  const pool = createParticles();
  spawn(pool, 0, 0, 0, 0, 1, '#26252E', 2, 0.5);
  const ctx = recordingCtx();
  drawParticles(ctx, pool);
  expect(calls(ctx, 'fill')[0].alpha).toBe(0.5);                    // full life: step 1 × 0.5
});

test('the trail samples every 10 units of travel and keeps 3', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  for (let i = 0; i < 100; i++) {
    w.player.pos.y -= 1;                                             // 1 unit per frame
    updateEffects(fx, 1 / 60, w);
  }
  const tr = fx.trail;
  expect(tr.count).toBe(3);
  const ys = [0, 1, 2].map((i) => tr.y[(tr.head - 1 - i + 3) % 3]);
  expect(ys[1] - ys[0]).toBeCloseTo(10);
  expect(ys[2] - ys[1]).toBeCloseTo(10);
  handleEvent(fx, 'roomStart', w);                                   // a new attempt starts a fresh trail
  expect(fx.trail.count).toBe(0);
  expect(fx.trail.has).toBe(false);
});

test('a title tap starts the logo flip timer', () => {
  const fx = createEffects(theme);
  expect(titleFlipValue(fx)).toBe(1);                                // F upside down at rest
  handleEvent(fx, 'titleTap', liveWorld());
  expect(fx.titleFlip).toBe(config.timing.titleFlipTime);           // same clock game.js waits on
  expect(fx.titleFlipped).toBe(false);
});

test('a tap mid-flip reverses from the current angle, with no jump', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  handleEvent(fx, 'toTitle', w);
  updateEffects(fx, config.timing.titleFlipTime / 4, w);             // a quarter in (ease-out back overshoots past halfway)
  const before = titleFlipValue(fx);
  expect(before).toBeGreaterThan(0);
  expect(before).toBeLessThan(1);
  handleEvent(fx, 'titleTap', w);
  expect(titleFlipValue(fx)).toBeCloseTo(before, 6);
  updateEffects(fx, config.timing.titleFlipTime, w);
  expect(titleFlipValue(fx)).toBe(1);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd game && npx vitest run test/art.test.js`
Expected: all 8 new tests FAIL. The blockout puff spawns in the polarity colour with no `alpha` field, the trail is time-sampled, the post flash is 4 px, and `titleFlipValue` is not exported yet.

- [ ] **Step 3: Rewrite `game/src/view/art/obstacle.js`**

```js
// Bars and squares: neutral fill, ink stroke inside the edge; the stroke doubles while flashing,
// capped so a thin shape (an 8-wide shaft post) keeps a neutral core instead of turning solid ink.
export function drawObstacle(ctx, o, flash, theme) {
  const w = flash > 0 ? Math.min(theme.stroke.ink * 2, Math.min(o.w, o.h) / 2 - 1) : theme.stroke.ink;
  ctx.fillStyle = theme.color.neutral;
  ctx.fillRect(o.left, o.top, o.w, o.h);
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = w;
  ctx.strokeRect(o.left + w / 2, o.top + w / 2, o.w - w, o.h - w);
}
```

- [ ] **Step 4: Edit `game/src/view/particles.js`**

Replace `createParticles`, `spawn` and `drawParticles` with the versions below; `burst` and `updateParticles` stay as they are.

```js
export function createParticles() {
  const items = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    items.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#26252E', size: 2, alpha: 1 });
  }
  return { items, next: 0 };
}

export function spawn(pool, x, y, vx, vy, life, color, size, alpha = 1) {
  const p = pool.items[pool.next];
  pool.next = (pool.next + 1) % POOL_SIZE;
  p.alive = true;
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.life = life; p.maxLife = life;
  p.color = color; p.size = size; p.alpha = alpha;
}

// Opacity = the particle's own alpha × a four-step fade over its life (flat look, no smooth fade).
export function drawParticles(ctx, pool) {
  for (const p of pool.items) {
    if (!p.alive) continue;
    ctx.globalAlpha = p.alpha * (Math.ceil((p.life / p.maxLife) * 4) / 4);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
```

- [ ] **Step 5: Edit `game/src/view/anim/effects.js`**

(a) In `createEffects`, replace the `trail` line and add `titleFlip`:

```js
    trail: {
      x: new Float32Array(n), y: new Float32Array(n), pol: new Int8Array(n),
      count: 0, head: 0, lastX: 0, lastY: 0, has: false,
    },
    titleFlip: 0,                 // seconds left on the logo's F rotation
    titleFlipFrom: 1,             // turn value the current flip started from (1 = F upside down)
```

(`timer` is gone; nothing else read it.) Also add this export below `createEffects`, and add `import { easeOutBack } from './ease.js';` to the imports:

```js
// The logo F's current turn: 0 = upright, 1 = upside down. Eases from wherever the last flip
// started, so a tap mid-flip reverses smoothly instead of jumping to the other end.
export function titleFlipValue(fx) {
  const to = fx.titleFlipped ? 1 : 0;
  if (fx.titleFlip <= 0) return to;
  const p = 1 - fx.titleFlip / config.timing.titleFlipTime;
  return fx.titleFlipFrom + (to - fx.titleFlipFrom) * easeOutBack(p);
}
```

(b) Replace the `'launch'` and `'death'` cases and the `'roomStart'` / title cases in `handleEvent`:

```js
    case 'launch': {
      // Canvas "Launch puff": four ink dots of falling size and alpha, fanned behind the launch.
      const sp = Math.hypot(p.vel.x, p.vel.y) || 1;
      const bx = -p.vel.x / sp, by = -p.vel.y / sp;
      const n = f.launchPuffCount;
      for (let i = 0; i < n; i++) {
        const a = (n > 1 ? i / (n - 1) - 0.5 : 0) * f.launchPuffSpread;
        const c = Math.cos(a), s = Math.sin(a);
        const speed = f.launchPuffSpeed * (1 - 0.15 * i);
        spawn(fx.particles, p.pos.x, p.pos.y,
          (bx * c - by * s) * speed, (bx * s + by * c) * speed,
          f.launchPuffLife, fx.theme.color.ink, f.launchPuffRadii[i], f.launchPuffAlphas[i]);
      }
      break;
    }
    case 'death': {
      // Canvas "Death burst": a ring of six, then two inner dots; ink and player colour alternate.
      const n = f.deathBurstCount, ring = n - 2;
      const pc = polColor(fx.theme, p.pol), ink = fx.theme.color.ink;
      for (let i = 0; i < n; i++) {
        const inner = i >= ring;
        const a = inner ? (i - ring) * Math.PI : (i / ring) * Math.PI * 2 - Math.PI / 2;
        const speed = f.deathBurstSpeed * (inner ? f.deathBurstInnerSpeed : 1);
        spawn(fx.particles, p.pos.x, p.pos.y, Math.cos(a) * speed, Math.sin(a) * speed,
          f.particleLife, i % 2 === 0 ? ink : pc, f.deathBurstRadii[i], f.deathBurstAlpha);
      }
      requestShake(fx, f.deathShake);
      break;
    }
```

```js
    case 'roomStart':
      fx.trail.count = 0;
      fx.trail.has = false;
      fx.latchPop.clear();
      fx.obstacleFlash.clear();
      break;
    case 'titleTap':
    case 'toTitle':
      fx.titleFlipFrom = titleFlipValue(fx);        // start from the current angle
      fx.titleFlipped = !fx.titleFlipped;
      fx.titleFlip = config.timing.titleFlipTime;   // game.js starts the run when this runs out
      break;
```

At the top of `effects.js`, drop the now-unused `burst` import and add the config import:

```js
import { config } from '../../config.js';
import { createParticles, spawn, updateParticles } from '../particles.js';
```

(c) Replace the trail block at the end of `updateEffects`, and tick the logo flip:

```js
  fx.titleFlip = Math.max(0, fx.titleFlip - dt);

  // Trail: one sample every trailSpacing units of travel while flying.
  const tr = fx.trail, p = world.player, spacing = fx.theme.fx.trailSpacing;
  if (!p.alive || world.phase !== 'live') return;
  if (!tr.has) {
    tr.lastX = p.pos.x; tr.lastY = p.pos.y; tr.has = true;
    return;
  }
  const dx = p.pos.x - tr.lastX, dy = p.pos.y - tr.lastY;
  if (dx * dx + dy * dy < spacing * spacing) return;
  tr.lastX = p.pos.x; tr.lastY = p.pos.y;
  tr.x[tr.head] = p.pos.x;
  tr.y[tr.head] = p.pos.y;
  tr.pol[tr.head] = p.pol;
  tr.head = (tr.head + 1) % tr.x.length;
  tr.count = Math.min(tr.count + 1, tr.x.length);
```

- [ ] **Step 6: Replace the dev trail test** — in `game/test/view.test.js`, delete the test `'the trail keeps at most trailDots samples'`. `art.test.js` now covers the trail, sampled by distance.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd game && npm test`
Expected: PASS — art (23), view (6) plus everything else. The dev test `'death bursts particles and requests the death shake'` still passes: 8 alive particles = `theme.fx.deathBurstCount`.

- [ ] **Step 8: Look at it**

Play room 1 in the browser pane; die on a wall once and launch off a hook a few times. Check: puffs are small ink dots behind the launch; the death burst is a ring of eight alternating ink and colour dots; the trail shows three dots about 10 apart; obstacle outlines thicken briefly on contact.

- [ ] **Step 9: Commit**

```bash
git add game/src/view/art/obstacle.js game/src/view/particles.js game/src/view/anim/effects.js game/test/art.test.js game/test/view.test.js
git commit -m "feat(art): canvas obstacles, launch puff, death burst and distance-sampled trail"
```

---

### Task 6: HUD — tenths, tabular digits, room pop

**Files:**
- Rewrite: `game/src/view/art/hud.js`
- Modify: `game/test/render.test.js` (`formatTime` expectations)
- Test: `game/test/art.test.js` (append)

**Interfaces:**
- Consumes: the `hud` object `render.js` fills: `{ room, rooms, timeMs, deaths, roomPop }` (dev Task 12); `theme.font`, `theme.hud`, `theme.fx.roomPop*`.
- Produces:
  - `formatTime(ms) → 'm:ss.t'` (tenths, as on the canvas: `0:18.4`, `1:02.7`). `screens.js` uses it for the title's best time and the win panel.
  - `drawTabular(ctx, text, cx, y)`: draws `text` centred on `cx` with every digit in a fixed-width cell (the widest digit), so a running timer never jitters. It uses the current `ctx.font`.
  - `drawHud(ctx, hud, theme)`: contract signature unchanged.

**Layout** (canvas Room 1 / Room 2): one row, `top: 12`, padding 20 on both sides, items vertically centred. The row's centre is `hud.y + hud.rowHeight / 2` = 24. Room label left-aligned at x 20, 700 13 px; timer centred at exactly x 180, 700 15 px, tabular (the canvas's `space-between` puts it about 4 right of centre; the fixed centre is agreed canvas call 3); `× n` right-aligned at x 340, 700 13 px. At these sizes the room label ends near x 45, clear of room 2's doorway (x 57–133); this resolves the dev plan's HUD-overlap handover item.

- [ ] **Step 1: Update the dev test's expectations** — in `game/test/render.test.js`, change the `formatTime` test body to:

```js
  expect(formatTime(0)).toBe('0:00.0');
  expect(formatTime(83456)).toBe('1:23.4');
  expect(formatTime(18449)).toBe('0:18.4');
```

- [ ] **Step 2: Write the failing tests** — append to `game/test/art.test.js`

```js
import { drawHud, drawTabular, formatTime } from '../src/view/art/hud.js';

test('formatTime shows tenths like the canvas', () => {
  expect(formatTime(62_799)).toBe('1:02.7');
  expect(formatTime(600_000)).toBe('10:00.0');
});

test('drawTabular puts every character in its own slot, centred on cx', () => {
  const ctx = recordingCtx();
  ctx.font = `700 15px ${theme.font.family}`;
  drawTabular(ctx, '0:18.4', 180, 24);
  const xs = calls(ctx, 'fillText').map((e) => e.args[1]);
  expect(calls(ctx, 'fillText').map((e) => e.args[0])).toEqual(['0', ':', '1', '8', '.', '4']);
  expect(xs.reduce((a, b) => a + b, 0) / xs.length).toBeCloseTo(180);
  for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
});

test('HUD row: room left, tabular timer centre, deaths right, canvas sizes', () => {
  const ctx = recordingCtx();
  drawHud(ctx, { room: 1, rooms: 2, timeMs: 18_400, deaths: 2, roomPop: 0 }, theme);
  const texts = calls(ctx, 'fillText');
  const room = texts.find((e) => e.args[0] === '1 / 2');
  const deaths = texts.find((e) => e.args[0] === '× 2');
  expect(room.font).toBe(`700 13px ${theme.font.family}`);
  expect(deaths.font).toBe(`700 13px ${theme.font.family}`);
  expect(deaths.args[1]).toBe(340);
  expect(texts.filter((e) => e.font === `700 15px ${theme.font.family}`).map((e) => e.args[0]).join('')).toBe('0:18.4');
});

test('the room number pops while roomPop runs', () => {
  const ctx = recordingCtx();
  drawHud(ctx, { room: 1, rooms: 2, timeMs: 0, deaths: 0, roomPop: theme.fx.roomPopTime / 2 }, theme);
  const s = calls(ctx, 'scale')[0].args[0];
  expect(s).toBeCloseTo(1.3);                                          // sin(π/2) peak
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `cd game && npx vitest run test/art.test.js test/render.test.js`
Expected: FAIL — `formatTime(0)` returns `'0:00.00'`, and `drawTabular` is not exported.

- [ ] **Step 4: Rewrite `game/src/view/art/hud.js`**

```js
// HUD row (canvas Room 1 / Room 2): "n / N" left, timer centre (tabular, tenths), "× d" right.
import { config } from '../../config.js';

const DIGITS = '0123456789';
const isDigit = (ch) => ch >= '0' && ch <= '9';
const pad2 = (n) => (n < 10 ? '0' : '') + n;

export function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor(ms / 1000) % 60;
  const t = Math.floor(ms / 100) % 10;
  return `${m}:${pad2(s)}.${t}`;
}

// Fixed-width digit cells so a counting timer never shifts. Uses the current ctx.font.
export function drawTabular(ctx, text, cx, y) {
  let cell = 0;
  for (const d of DIGITS) cell = Math.max(cell, ctx.measureText(d).width);
  let total = 0;
  for (const ch of text) total += isDigit(ch) ? cell : ctx.measureText(ch).width;
  let x = cx - total / 2;
  ctx.textAlign = 'center';
  for (const ch of text) {
    const w = isDigit(ch) ? cell : ctx.measureText(ch).width;
    ctx.fillText(ch, x + w / 2, y);
    x += w;
  }
}

export function drawHud(ctx, hud, theme) {
  const f = theme.font, h = theme.hud, R = config.room;
  const y = h.y + h.rowHeight / 2;
  ctx.fillStyle = theme.color.ink;
  ctx.textBaseline = 'middle';
  ctx.font = `${f.hud} ${f.hudSize}px ${f.family}`;

  // Room label, popping once when the room is cleared.
  const k = hud.roomPop > 0 ? 1 - hud.roomPop / theme.fx.roomPopTime : 1;
  const s = hud.roomPop > 0 ? 1 + (theme.fx.roomPopScale - 1) * Math.sin(Math.PI * k) : 1;
  ctx.textAlign = 'left';
  ctx.save();
  ctx.translate(h.sidePad, y);
  if (s !== 1) ctx.scale(s, s);
  ctx.fillText(`${hud.room} / ${hud.rooms}`, 0, 0);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.fillText(`× ${hud.deaths}`, R.width - h.sidePad, y);

  ctx.font = `${f.hud} ${f.timerSize}px ${f.family}`;
  drawTabular(ctx, formatTime(hud.timeMs), R.width / 2, y);
}
```

After `save()` / `translate()` the recording context still sees the literal `fillText('1 / 2', 0, 0)`; the test finds the label by its text, not its position.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd game && npm test`
Expected: PASS — art (27), render (2) plus everything else.

- [ ] **Step 6: Look at it**

In the browser pane, play for 20 s and watch the timer: the digits must not shift sideways as they change. Clear room 1: `1 / 2` pops once, then the row reads `2 / 2`.

- [ ] **Step 7: Commit**

```bash
git add game/src/view/art/hud.js game/test/art.test.js game/test/render.test.js
git commit -m "feat(art): canvas HUD with tabular tenths timer and room pop"
```

---

### Task 7: Title and win screens, animated logo

**Files:**
- Rewrite: `game/src/view/art/logo.js`, `game/src/view/screens.js`
- Modify: `game/src/theme.js` (add `font.lineHeight`), `game/src/view/art/hud.js` (export `tabularWidth`)
- Test: `game/test/art.test.js` (append)

**Interfaces:**
- Consumes: `drawHookDisc` (Task 3); `drawTabular`, `formatTime` (Task 6); `fx.titleFlipped`, `fx.titleFlip`, `fx.time` (Task 5); `game.best`, `game.lastTimeMs`, `game.deaths`, `game.newBest`; `config.bob`.
- Produces:
  - `drawLogo(ctx, cx, cy, size, flip, theme)`: same signature. **`flip` is now a number**: 0 = F upright, 1 = F upside down, in between = mid-rotation. `true` / `false` still work (they coerce to 1 / 0).
  - `tabularWidth(ctx, text) → number` (new export in `hud.js`).
  - `drawTitle(ctx, game, fx, theme)`, `drawWin(ctx, game, theme)`: contract signatures unchanged.

**Layout.** The canvas stacks the text in flex columns; the centres below come from its sizes, with line box = font size × `font.lineHeight` (1.6, Baloo 2's normal line height, approximately; Task 8 tunes it against the canvas).

| Screen | Element | Centre y | Style |
|---|---|---|---|
| Title | logo `Flip`, F rotated | 298 (box 250–346, line-height 1) | 800 96 px, tracking −2 |
| Title | `tap to start` | 250 + 96 + 20 + 12.8 = 378.8 | 700 16 px |
| Title | `best —` / `best 1:02.7` | 378.8 + 12.8 + 20 + 10.4 = 422.0 | 400 13 px @ 70 % |
| Title | 4 hook discs + rings @ 12 % | per `theme.title.hooks`, bobbing | as Task 3 |
| Win | `Cleared` | 190 + 35.2 = 225.2 | 800 44 px |
| Win | panel | rect (40, 288.4, 280, 140), radius 16: height = 2 × 2 border + 2 × 20 padding + 3 × 24 + 2 × 12 | neutral, 2 ink border as its outer 2 px |
| Win | rows Time / Deaths / Best | panel top + 2 + 20 + 12 + i × (24 + 12) | label 400 15 px at x 66, value 800 15 px tabular, right edge x 294 |
| Win | `New best` (only when beaten) | panel bottom + 28 + 10.4 | 700 13 px |
| Win | `tap to return` | panel bottom + 28 + 20.8 + 28 + 12.8 | 700 16 px |

`tap to return` keeps its position whether or not `New best` shows, so the screen never jumps.

**Start tap:** `game.js` (dev plan, Task 10) keeps the title on screen for `config.timing.titleFlipTime` after the tap and ignores further taps while `game.startPending > 0`, so the F's full flip plays before room 1 appears. `drawTitle` needs no special case: the state is still `title` during the flip. The same flip plays in reverse on `toTitle` when returning from the win screen.

- [ ] **Step 1: Add the theme key and the width helper**

In `game/src/theme.js`, add `lineHeight: 1.6,` to the `font` block (after `smallSize`).

In `game/src/view/art/hud.js`, add (after `drawTabular`):

```js
export function tabularWidth(ctx, text) {
  let cell = 0;
  for (const d of DIGITS) cell = Math.max(cell, ctx.measureText(d).width);
  let total = 0;
  for (const ch of text) total += isDigit(ch) ? cell : ctx.measureText(ch).width;
  return total;
}
```

Then replace `drawTabular` so it reuses the helper:

```js
export function drawTabular(ctx, text, cx, y) {
  let cell = 0;
  for (const d of DIGITS) cell = Math.max(cell, ctx.measureText(d).width);
  let x = cx - tabularWidth(ctx, text) / 2;
  ctx.textAlign = 'center';
  for (const ch of text) {
    const w = isDigit(ch) ? cell : ctx.measureText(ch).width;
    ctx.fillText(ch, x + w / 2, y);
    x += w;
  }
}
```

- [ ] **Step 2: Write the failing tests** — append to `game/test/art.test.js`

```js
import { drawLogo } from '../src/view/art/logo.js';
import { drawTitle, drawWin } from '../src/view/screens.js';

const fontOf = (ctx, text) => calls(ctx, 'fillText').find((e) => e.args[0] === text)?.font;

test('logo: F l i p drawn letter by letter at 800 96 px, F rotated by flip × π', () => {
  const ctx = recordingCtx();
  drawLogo(ctx, 180, 298, 96, 1, theme);
  expect(calls(ctx, 'fillText').map((e) => e.args[0])).toEqual(['F', 'l', 'i', 'p']);
  expect(fontOf(ctx, 'F')).toBe(`800 96px ${theme.font.family}`);
  expect(calls(ctx, 'rotate')[0].args[0]).toBeCloseTo(Math.PI);
  const mid = recordingCtx();
  drawLogo(mid, 180, 298, 96, 0.5, theme);
  expect(calls(mid, 'rotate')[0].args[0]).toBeCloseTo(Math.PI / 2);
  const up = recordingCtx();
  drawLogo(up, 180, 298, 96, false, theme);
  expect(calls(up, 'rotate')).toHaveLength(0);
});

test('logo tracking is −2 between letters', () => {
  const ctx = recordingCtx();
  drawLogo(ctx, 180, 298, 96, 0, theme);
  const xs = calls(ctx, 'fillText').map((e) => e.args[1]);
  const w = 96 * 0.55;                                              // fake measureText: one glyph = size × 0.55
  expect(xs[2] - xs[1]).toBeCloseTo(w - 2);
});

function titleGame(best = null) { return { best }; }
function titleFx() { return { titleFlipped: true, titleFlip: 0, time: 0 }; }

test('title: four idle hooks with faint rings, copy per canvas', () => {
  const ctx = recordingCtx();
  drawTitle(ctx, titleGame(), titleFx(), theme);
  const rings = calls(ctx, 'stroke').filter((e) => e.alpha === 0.12);
  expect(rings).toHaveLength(4);
  const discs = calls(ctx, 'fill').filter((e) => e.fill === '#6FA8DC' || e.fill === '#E27D7D');
  expect(discs).toHaveLength(4);
  expect(fontOf(ctx, 'tap to start')).toBe(`700 16px ${theme.font.family}`);
  const best = calls(ctx, 'fillText').find((e) => e.args[0] === 'best —');
  expect(best.font).toBe(`400 13px ${theme.font.family}`);
  expect(best.alpha).toBe(0.7);
});

test('title shows a stored best time', () => {
  const ctx = recordingCtx();
  drawTitle(ctx, titleGame(62_799), titleFx(), theme);
  expect(calls(ctx, 'fillText').some((e) => e.args[0] === 'best 1:02.7')).toBe(true);
});

function winGame(newBest) { return { lastTimeMs: 62_799, deaths: 4, best: 62_799, newBest }; }

test('win: Cleared, rounded neutral panel with three rows, New best only when beaten', () => {
  const ctx = recordingCtx();
  drawWin(ctx, winGame(true), theme);
  expect(fontOf(ctx, 'Cleared')).toBe(`800 44px ${theme.font.family}`);
  const panel = calls(ctx, 'roundRect')[0];
  expect(panel.args[0]).toBe(40);
  expect(panel.args[2]).toBe(280);
  expect(panel.args[4]).toBe(16);
  expect(calls(ctx, 'fill').some((e) => e.fill === '#A9A4B5')).toBe(true);
  for (const label of ['Time', 'Deaths', 'Best']) expect(fontOf(ctx, label)).toBe(`400 15px ${theme.font.family}`);
  expect(fontOf(ctx, 'New best')).toBe(`700 13px ${theme.font.family}`);
  expect(fontOf(ctx, 'tap to return')).toBe(`700 16px ${theme.font.family}`);

  const plain = recordingCtx();
  drawWin(plain, winGame(false), theme);
  expect(calls(plain, 'fillText').some((e) => e.args[0] === 'New best')).toBe(false);
  const y = (c) => calls(c, 'fillText').find((e) => e.args[0] === 'tap to return').args[2];
  expect(y(plain)).toBe(y(ctx));                                    // no layout jump
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `cd game && npx vitest run test/art.test.js`
Expected: the five new tests FAIL. The blockout logo draws `F` and `lip` as two strings, and the copy reads "Tap to flip".

- [ ] **Step 4: Rewrite `game/src/view/art/logo.js`**

```js
// "Flip" with the capital F rotated. flip: 0 upright, 1 upside down (canvas default), between = mid-turn.
// Drawn letter by letter so the −2 tracking works without ctx.letterSpacing.
export function drawLogo(ctx, cx, cy, size, flip, theme) {
  const f = theme.font;
  const letters = 'Flip';
  ctx.font = `${f.logo} ${size}px ${f.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let total = 0;
  for (let i = 0; i < letters.length; i++) total += ctx.measureText(letters[i]).width + (i > 0 ? f.logoTracking : 0);

  // Baseline that centres the font's line box on cy, as the canvas does (line-height 1). cy is
  // also the F's rotation centre, matching CSS rotate() on the inline-block F.
  const m = ctx.measureText('F');
  const a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
  const baseY = cy + (Number.isFinite(a) && Number.isFinite(d) ? (a - d) / 2 : size * 0.35);

  let x = cx - total / 2;
  for (let i = 0; i < letters.length; i++) {
    const ch = letters[i];
    const w = ctx.measureText(ch).width;
    const turn = Number(flip) * Math.PI;
    if (i === 0 && turn !== 0) {
      ctx.save();
      ctx.translate(x + w / 2, cy);
      ctx.rotate(turn);
      ctx.fillText(ch, -w / 2, baseY - cy);
      ctx.restore();
    } else {
      ctx.fillText(ch, x, baseY);
    }
    x += w + f.logoTracking;
  }
}
```

- [ ] **Step 5: Rewrite `game/src/view/screens.js`**

```js
// Title and win screens, laid out from the Flip Art canvas (art plan Task 7 table).
import { config } from '../config.js';
import { titleFlipValue } from './anim/effects.js';
import { drawLogo } from './art/logo.js';
import { drawHookDisc } from './art/hookPoint.js';
import { drawTabular, tabularWidth, formatTime } from './art/hud.js';

const TAU = Math.PI * 2;
const DASH = '—';

function text(ctx, s, x, y, size, weight, theme, align = 'center', alpha = 1) {
  ctx.font = `${weight} ${size}px ${theme.font.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = alpha;
  ctx.fillText(s, x, y);
  ctx.globalAlpha = 1;
}

const box = (size, theme) => size * theme.font.lineHeight;

export function drawTitle(ctx, game, fx, theme) {
  const f = theme.font, t = theme.title, b = config.bob;
  const cx = config.room.width / 2;

  // Idle hook points: faint rings, bobbing in the TDD figure eight. Offsets are relative to the
  // starting phase so at time 0 every hook sits exactly where the canvas draws it.
  t.hooks.forEach((h, i) => {
    const ph = i * b.phaseStep;
    const x = h.x + b.ampX * (Math.sin(TAU * b.freq * fx.time + ph) - Math.sin(ph));
    const y = h.y + b.ampY * (Math.sin(2 * TAU * b.freq * fx.time + ph) - Math.sin(ph));
    ctx.strokeStyle = theme.color.ink;
    ctx.lineWidth = theme.field.idleWidth;
    ctx.globalAlpha = theme.field.titleAlpha;
    ctx.beginPath();
    ctx.arc(x, y, config.fieldRadius - theme.field.idleWidth / 2, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawHookDisc(ctx, x, y, h.pol, 1, theme);
  });

  const logoY = t.columnY + f.logoSize / 2;
  drawLogo(ctx, cx, logoY, f.logoSize, titleFlipValue(fx), theme);
  const tapY = t.columnY + f.logoSize + t.gap + box(f.bodySize, theme) / 2;
  text(ctx, 'tap to start', cx, tapY, f.bodySize, f.hud, theme);
  const bestY = tapY + box(f.bodySize, theme) / 2 + t.gap + box(f.smallSize, theme) / 2;
  const best = game.best === null ? DASH : formatTime(game.best);
  text(ctx, `best ${best}`, cx, bestY, f.smallSize, f.body, theme, 'center', t.bestAlpha);
}

export function drawWin(ctx, game, theme) {
  const f = theme.font, w = theme.win;
  const cx = config.room.width / 2;

  const clearedBox = box(f.titleSize, theme);
  text(ctx, 'Cleared', cx, w.columnY + clearedBox / 2, f.titleSize, f.logo, theme);

  // The canvas panel has no box-sizing, so its 2 px border sits outside the padding.
  const sw = theme.stroke.ink;
  const rowBox = box(f.rowSize, theme);
  const top = w.columnY + clearedBox + w.gap;
  const height = 2 * sw + 2 * w.panelPadY + 3 * rowBox + 2 * w.rowGap;   // 140
  ctx.fillStyle = theme.color.neutral;
  ctx.beginPath();
  ctx.roundRect(w.panelX, top, w.panelW, height, w.panelRadius);
  ctx.fill();
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = sw;
  ctx.beginPath();
  ctx.roundRect(w.panelX + sw / 2, top + sw / 2, w.panelW - sw, height - sw, w.panelRadius - sw / 2);
  ctx.stroke();

  const rows = [
    ['Time', formatTime(game.lastTimeMs)],
    ['Deaths', String(game.deaths)],
    ['Best', game.best === null ? DASH : formatTime(game.best)],
  ];
  const left = w.panelX + sw + w.panelPadX;                // 66
  const right = w.panelX + w.panelW - sw - w.panelPadX;    // 294
  rows.forEach(([label, value], i) => {
    const y = top + sw + w.panelPadY + rowBox / 2 + i * (rowBox + w.rowGap);
    text(ctx, label, left, y, f.rowSize, f.body, theme, 'left');
    ctx.font = `${f.logo} ${f.rowSize}px ${f.family}`;
    ctx.fillStyle = theme.color.ink;
    ctx.textBaseline = 'middle';
    drawTabular(ctx, value, right - tabularWidth(ctx, value) / 2, y);
  });

  const bottom = top + height;
  const newBestY = bottom + w.gap + box(f.smallSize, theme) / 2;
  if (game.newBest) text(ctx, 'New best', cx, newBestY, f.smallSize, f.hud, theme);
  const tapY = bottom + w.gap + box(f.smallSize, theme) + w.gap + box(f.bodySize, theme) / 2;
  text(ctx, 'tap to return', cx, tapY, f.bodySize, f.hud, theme);
}
```

`drawTitle` reads `config.fieldRadius` for the ring size so it matches the in-game rings.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd game && npm test`
Expected: PASS — art (32) plus everything else, including the palette guard over the new screens.

- [ ] **Step 7: Look at it**

In the browser pane: the title shows four bobbing hooks, the logo with the F upside down, and the canvas copy. Play through to the win screen and check the panel; tap back to the title and watch the F turn over.

- [ ] **Step 8: Commit**

```bash
git add game/src/view/art/logo.js game/src/view/screens.js game/src/view/art/hud.js game/src/theme.js game/test/art.test.js
git commit -m "feat(art): canvas title and win screens with animated logo"
```

---

### Task 8: Debug poses and side-by-side check against the canvas

**Files:**
- Create: `game/src/view/debug/poses.js`, `game/src/view/debug/colourBlind.js`
- Modify: `game/src/main.js` (dev-only `?pose=` and `?cb=` hooks)
- Modify, only while tuning: `game/src/theme.js` (`hud.rowHeight`, `font.lineHeight`)
- Test: `game/test/art.test.js` (append)

**Interfaces:**
- Consumes: `startRoom` (dev Task 8), `game` and `fx` objects, `drawHookDisc` positions (`theme.title.hooks`).
- Produces:
  - `applyPose(name, game, fx) → boolean`: sets up a frozen scene that matches one canvas artboard. Names: `title`, `room1`, `room2`, `win`. Returns `false` for an unknown name.
  - `applyColourBlindFilter(canvas, kind)`: `kind` is `protan`, `deutan` or `tritan`. Adds an inline SVG colour matrix and sets the canvas element's CSS `filter`. The context's `filter` is never used, so the flat-art rule holds.
  - `main.js`: in dev builds only, `?pose=<name>` freezes the loop on that scene and ignores taps, and `?cb=<kind>` applies the filter. Both sit behind `import.meta.env.DEV`, so production builds drop them.

**Boundary exception:** poses write directly into `world` and `game` state. That breaks the "view never mutates the sim" rule on purpose, is dev-only, and never runs in a build.

**Pose values** (from the canvas artboards):

| Pose | Scene |
|---|---|
| `room1` | room 1, `room.time` = 260 / 640 × 6.5 (front at y 260: red above, blue below); hooks at home; player blue, latched on (110, 470) at θ = −45° → (131.2, 448.8); timer 18.4 s; deaths 2 |
| `room2` | room 2, `room.time` = 430 / 640 × 6.5 (blue above, red below); player red, free at (265, 540); trail samples (265, 553), (265, 563), (265, 572) (canvas dot centres); timer 41.9 s; deaths 3 |
| `title` | title, `fx.time` = 0, F upside down, best `—` |
| `win` | win, time 1:02.7, deaths 4, best 1:02.7, `New best` |

- [ ] **Step 1: Write the failing tests** — append to `game/test/art.test.js`

```js
import { makeRig } from './scenes.js';
import { applyPose } from '../src/view/debug/poses.js';

test('room1 pose matches the Room 1 artboard state', () => {
  const { game, fx, draw } = makeRig();
  expect(applyPose('room1', game, fx)).toBe(true);
  const w = game.world, p = w.player;
  expect(game.state).toBe('playing');
  expect(w.roomIndex).toBe(0);
  expect(p.latched).toBe(w.room.hookPoints[0]);
  expect(p.pos.x).toBeCloseTo(131.21, 1);
  expect(p.pos.y).toBeCloseTo(448.79, 1);
  expect(game.runTime).toBeCloseTo(18.4);
  const ctx = recordingCtx();
  draw(ctx);
  expect(calls(ctx, 'fillRect').some((e) => e.fill === '#26252E' && e.args[1] === 260 && e.args[2] === 360)).toBe(true);
});

test('room2, title and win poses render; unknown names are refused', () => {
  for (const name of ['room2', 'title', 'win']) {
    const { game, fx, draw } = makeRig();
    expect(applyPose(name, game, fx)).toBe(true);
    expect(() => draw(recordingCtx())).not.toThrow();
  }
  const { game, fx } = makeRig();
  expect(applyPose('nope', game, fx)).toBe(false);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd game && npx vitest run test/art.test.js`
Expected: FAIL — `Failed to resolve import "../src/view/debug/poses.js"`

- [ ] **Step 3: Write `game/src/view/debug/poses.js`**

```js
// DEV ONLY. Freezes a scene that matches one Flip Art artboard, for side-by-side comparison.
// Deliberately writes into game and world state; main.js only loads this in dev builds.
import { startRoom } from '../../sim/world.js';

function room(game, index, frontY) {
  const w = game.world;
  startRoom(w, index, 0);
  w.phase = 'live';
  game.state = 'playing';
  game.stateTime = 0;
  const r = w.room;
  r.time = (frontY / r.height) * r.wave.period;
  for (const h of r.hookPoints) { h.pos.x = h.home.x; h.pos.y = h.home.y; }
  w.player.bufferEntry = false;
  return w;
}

function place(p, x, y) {
  p.pos.x = p.prev.x = x;
  p.pos.y = p.prev.y = y;
  p.vel.x = 0; p.vel.y = 0;
}

const poses = {
  room1(game, fx) {
    const w = room(game, 0, 260);
    const p = w.player, h = w.room.hookPoints[0];
    p.pol = +1;
    p.latched = h;
    p.theta = -Math.PI / 4;
    p.omega = w.room.minOrbitSpeed;
    place(p, h.pos.x + 30 * Math.cos(p.theta), h.pos.y + 30 * Math.sin(p.theta));
    game.runTime = 18.4;
    game.deaths = 2;
    fx.trail.count = 0;
  },
  room2(game, fx) {
    const w = room(game, 1, 430);
    const p = w.player;
    p.pol = -1;
    p.latched = null;
    place(p, 265, 540);
    const tr = fx.trail;
    [572, 563, 553].forEach((y, i) => { tr.x[i] = 265; tr.y[i] = y; tr.pol[i] = -1; });
    tr.head = 0; tr.count = 3;                         // newest = index 2 = y 553
    game.runTime = 41.9;
    game.deaths = 3;
  },
  title(game, fx) {
    game.state = 'title';
    game.best = null;
    fx.time = 0;
    fx.titleFlipped = true;
    fx.titleFlip = 0;
  },
  win(game) {
    game.state = 'win';
    game.lastTimeMs = 62_700;
    game.deaths = 4;
    game.best = 62_700;
    game.newBest = true;
  },
};

export function applyPose(name, game, fx) {
  const pose = poses[name];
  if (!pose) return false;
  fx.time = 0;
  pose(game, fx);
  return true;
}
```

- [ ] **Step 4: Write `game/src/view/debug/colourBlind.js`**

```js
// DEV ONLY. Simulates colour-vision deficiency on the canvas element (Machado et al. 2009,
// severity 1.0) so the + / − marks can be checked. CSS filter on the element, not ctx.filter.
const MATRICES = {
  protan: '0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0',
  deutan: '0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0',
  tritan: '1.255528 -0.076749 -0.178779 0 0  -0.078411 0.930809 0.147602 0 0  0.004733 0.691367 0.303900 0 0  0 0 0 1 0',
};

export function applyColourBlindFilter(canvas, kind) {
  const values = MATRICES[kind];
  if (!values) return false;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  const filter = document.createElementNS(ns, 'filter');
  filter.setAttribute('id', `cb-${kind}`);
  const m = document.createElementNS(ns, 'feColorMatrix');
  m.setAttribute('type', 'matrix');
  m.setAttribute('values', values);
  filter.appendChild(m);
  svg.appendChild(filter);
  document.body.appendChild(svg);
  canvas.style.filter = `url(#cb-${kind})`;
  return true;
}
```

- [ ] **Step 5: Wire both into `game/src/main.js`**

After `const game = createGame({ … });`, add:

```js
// Dev-only visual tools: ?pose=title|room1|room2|win freezes a canvas scene; ?cb=protan|deutan|tritan.
let posed = false;
if (import.meta.env.DEV) {
  const params = new URLSearchParams(location.search);
  if (params.has('pose')) {
    const { applyPose } = await import('./view/debug/poses.js');
    posed = applyPose(params.get('pose'), game, fx);
  }
  if (params.has('cb')) {
    const { applyColourBlindFilter } = await import('./view/debug/colourBlind.js');
    applyColourBlindFilter(canvas, params.get('cb'));
  }
}
```

In `frame`, wrap the update loop so a pose stays frozen:

```js
  if (posed) {
    acc = 0;
  } else {
    while (acc >= config.step) {
      update(game, config.step);
      updateEffects(fx, config.step * game.timeScale, game.world);
      acc -= config.step;
    }
  }
```

Change the input line to `bindInput(canvas, window, () => { if (!posed) tap(game); });`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd game && npm test`
Expected: PASS — art (34) plus everything else.

- [ ] **Step 7: Compare each pose with its artboard**

1. Serve the offline canvas export without installing anything, from the repo root: `py -3 -m http.server 5180 --directory "Reference Files"` (`python` is the Windows Store placeholder on this machine). Open `http://localhost:5180/Flip%20Art.html` in a second browser-pane tab and zoom the canvas to 100 % on the artboard being checked.
2. In the game tab, `resize_window` to width 360, height 640, then open `http://localhost:5173/?pose=room1`.
3. Screenshot both. Use `computer` `zoom` on the same regions of each: HUD row (0, 0)–(360, 40), doorway (220, 0)–(310, 110), player and hook (80, 420)–(160, 500), hatch (140, 580)–(220, 640).
4. Record every difference over 1 unit in a table in the task report: element, canvas, game, fix.
5. Fix by editing `theme.js` only: `hud.rowHeight` for HUD row height, `font.lineHeight` for title and win spacing. If a difference needs a code change, fix it in the art module and add a test in `art.test.js` that pins the corrected value.
6. Repeat for `room2`, `title`, `win`. Reset the viewport with `resize_window` preset `desktop` when done.

7. **Death burst scale.** The Sprites cell for the burst has no reference sprite, so its dot sizes (`theme.fx.deathBurstRadii`) assume the sheet's nominal 3×. Trigger a death in normal play, screenshot the burst mid-flight, and compare it with the launch puff and the trail. If the burst dots look clearly smaller than the puff's, scale `deathBurstRadii` by 1.5 (the 2×-vs-3× ratio), note it in the difference table, and update the `death burst` test's expected sizes.

Expected leftovers, which are not bugs: the updraft dash positions (the canvas places five by hand, the game scatters fourteen), the timer sitting at exactly x 180 (agreed canvas call 3), and text anti-aliasing.

- [ ] **Step 7b: Log the new folder**

Append `CREATED | game/src/view/debug/` (dev-only pose and colour-blind tools, never in the production bundle) to both `Commands and Logs/directory-log.md` and `Maintenance/setup-log.md` (Structural Change Log).

- [ ] **Step 8: Commit**

```bash
git add game/src/view/debug game/src/main.js game/src/theme.js game/test/art.test.js "Commands and Logs/directory-log.md" Maintenance/setup-log.md
git commit -m "feat(art): dev poses and colour-blind filter; tune layout against the canvas"
```

---

### Task 9: Accessibility, size, performance, clean-up and handover

**Files:**
- Modify: `game/src/theme.js` (drop compat keys), `game/README.md` (art section)
- Test: whole suite

**Interfaces:**
- Consumes: everything above.
- Produces: the finished art pass and a report of each check.

- [ ] **Step 1: Drop the compat keys**

Run: `grep -rn "markScale\|trailInterval\|particleSize\|chevronSpacing" game/src game/test`
Expected: matches only in `theme.js`. Delete all four keys from `theme.js`. If anything else matches, that code still reads a retired value: switch it to the Task 2 key that replaced it (`font.markPlayer` / `font.markHook`, `fx.trailSpacing`, `fx.launchPuffRadii` / `fx.deathBurstRadii`, `chevronHeight + chevronGap`).

- [ ] **Step 2: Full test run**

Run: `cd game && npm test`
Expected: PASS, 0 failures, including `art.test.js` (34), `fonts.test.js` (2) and every dev test.

- [ ] **Step 3: Colour-blind check**

Open `?pose=room1&cb=deutan`, then `protan`, then `tritan`, and screenshot each. Record pass/fail per filter for two things:
1. **Marks (must pass):** every hook point and the player is readable by its `+` / `−` mark alone. If a mark is hard to read, raise `theme.font.markHook` / `markPlayer` by 1–2 px and re-check.
2. **Side bands (report, do not fix):** can the two wall colours still be told apart on sight? Judge by visible difference, not a lightness ratio: blue `#6FA8DC` and red `#E27D7D` are close in lightness by design (1.12:1), so a lightness rule would fail even without a filter. The bands carry no mark, and wall polarity drives the game. So if they are hard to tell apart under any filter, **stop and tell the user**, with screenshots. Offer two options: `+` / `−` marks on the side bands (an art change), or a palette tweak (the user's call; the palette is theirs). Do not change colours yourself.

- [ ] **Step 4: Size budget with the font**

Run: `cd game && npm run build`, then run the dev plan's Task 13 Step 4 size command **from the repo root** (it reads `game/dist`). From inside `game/`, change `'game/dist'` to `'dist'` in the command.
Expected: `OK` (under 204 800 bytes). Record the total and the font's share.

- [ ] **Step 5: Frame rate with final art**

Repeat the dev plan's Task 13 Step 6 measurement on `npx vite preview` (a normal run, not a pose). Expected: ≥ 58 fps on desktop Chrome. If lower, the likeliest cost is per-frame `measureText` in `drawMark` / `drawTabular`. Cache each result by font string and clear the cache once `loadFonts` resolves. Re-measure.

- [ ] **Step 6: Update `game/README.md`** — add a section `## Art`

Three short paragraphs:
- The canvas is the source of truth (link it), and `theme.js` holds its tokens; re-sync `theme.js` whenever the canvas changes.
- Dev-only tools: `?pose=title|room1|room2|win` and `?cb=protan|deutan|tritan`.
- The font: file, licence, and `tools/subset-font.md` for re-running the subset when new characters appear.

Insert the Art section **above** the README's `---` / `## Decision Log` block (dev plan Task 1 creates it), then append an entry to that log: `### [DD-MM-YY] — Art section added` (canvas link, dev tools, font recipe). If the block is missing, the dev plan was run before that step existed: create it with one entry for the original README and one for this edit.

- [ ] **Step 7: Report to the user**

Include:
1. The Task 8 difference table and what was tuned.
2. Colour-blind results.
3. Size and fps numbers.
4. Confirmation that the title tap shows the full F flip before room 1 appears, and that returning from the win screen flips it back.
5. The death-burst scale result from Task 8 Step 7.7.

- [ ] **Step 8: Commit**

```bash
git add game/src/theme.js game/README.md
git commit -m "chore(art): retire compat theme keys; document art tools"
```

---

## Spec coverage

| Spec item | Task |
|---|---|
| §4 palette, contrast | 2 (palette guard), 9 (colour-blind check) |
| §4 Baloo 2, weights 800 / 700 / 400, self-hosted, no network | 1, 2, 7 |
| §4 ink stroke 2, player 8, hook 14 | 3 |
| §4 shaft: opening 60, depth 46, posts 8, chevrons, pull cue | 4 |
| §4 field ring idle / inside, tether | 3 |
| §4 side bands 10, top/bottom 6 with ink edge, updraft dashes | 4 |
| §4 HUD row | 6 |
| §2 juice: trail, launch puff, death burst, shake, slow-mo, near-miss, latch pop, flip ring pop, room-number pop, flipped-F logo | 3, 5, 6, 7; shake and slow-mo timing stay in the dev code |
| §2 title and win screens | 7 |
| §11.3 visuals match the canvas tokens | 8 (poses, side by side), 9 |
| §11.4 `dist/` under 200 KB | 9 |
| §11.5 60 fps | 9 |

## Resolved questions

1. **Start-tap logo flip.** Resolved 25-09-26: the screen transitions after the flip plays. `game.js` waits `config.timing.titleFlipTime` (0.25 s) after the title tap (dev plan, Task 10).
2. **Chevron brightness.** Resolved 25-09-26: spec §4 now matches the canvas. The brightest chevron is at the bottom of each shaft, and chevrons fade as they rise.

---

## Decision Log

### [25-09-26] — Art & Design implementation plan written from the Flip Art canvas
- **Added:** 9-task TDD plan: font subset and licence; theme re-sync with a palette-only guard; glyph marks, hook points, player, tether; walls, doorway, hatch, updraft; obstacles, particles, trail, puff, burst; HUD with tabular tenths; title and win screens with an animated logo; dev poses and colour-blind filter for side-by-side checks; accessibility, size, performance and handover. Canvas → code token table, asset list, animation map.
- **Removed:** —
- **Choices given:** art plan now or start the dev build → **Chosen:** fix B2, then write the art plan.
- **Notes:** Values were read from the canvas files on 25-09-26. The canvas read found the dev plan's shaft posts running 6 past each mouth; the dev plan was corrected the same session (its Decision Log records it). Canvas-over-spec calls: chevron brightness order, and the copy `tap to start` / `tap to return`. Canvas values that differ from the dev blockout: 3 trail dots, 4 ink puff dots, 8-dot alternating burst, glyph marks, 13 / 15 px HUD with tenths, 96 px logo, win panel. The font download needs explicit user approval at execution time (Task 1 Step 3). The plan was written section by section so progress stayed visible.

### [25-09-26] — Both open questions resolved
- **Added:** The logo flip runs on `config.timing.titleFlipTime`, the same value `game.js` waits for before starting the run. `effects.js` imports `config` for it.
- **Removed:** `theme.fx.logoFlipTime`; the "known limit" note; the open-questions list (now "Resolved questions").
- **Choices given:** start delay so the F flip is seen (yes / no) → **Chosen:** yes, transition after the flip. Update spec §4 chevron wording to the canvas (yes / no) → **Chosen:** yes.
- **Notes:** The delay itself is behaviour and lives in the dev plan (Task 10); this plan only animates it.

### [25-09-26] — Subagent review findings fixed (2 major, 13 minor)
- **Added:** Play-through now forces latch, launch, obstacle hit and the return-to-title flip, plus a coverage test that proves every drawing path runs under the palette and alpha guards (M2). `py -3` for every Python step, Git Bash for the subset block, and a fonttools fallback for Python 3.9 (M1). Project-log constraints and explicit directory-log / setup-log steps (Tasks 1, 8), Decision Log blocks for `tools/subset-font.md` and `game/README.md` (m12). Four-slot chevron loop, so a wrapping chevron slides in instead of popping; spacing is computed from height + gap (m3). `titleFlipValue` / `fx.titleFlipFrom`, so a tap mid-flip reverses from the current angle (m13). Post flash capped at `min(w, h) / 2 − 1` (m13). Death-burst scale check in Task 8 (m4). A trail reset check (m8). Agreed canvas call 3: timer fixed at x 180 (m6).
- **Removed:** `chevronInset`, `chevronSpacing`, and `tnum` from the subset. `particleSize` is retired in Task 9. The puff radii `[1.7, 1.35, 1.35, 1]` (m4). The old centring on the ink box (m2).
- **Choices given:** fix all / pick a subset → **Chosen:** fix all.
- **Notes:** Win panel border now sits outside the padding (panel 140 tall, labels x 66, values to x 294) (m1). Marks and logo centre on font metrics (`fontBoundingBox*`) like the canvas's `line-height: 1` flex centring (m2). Puff radii are now `[2.5, 2, 2, 1.5]`: that Sprites cell is 2× (m4). Room 2 pose trail is at y 553 / 563 / 572 (m5). Fail-first counts corrected (m7). The size command is run from the repo root (m9). The font check uses `document.fonts` entries (m10). The colour-blind band check reports instead of failing on a palette property and escalates to the user (m11). The file-changes list is completed. The latch and room pops are described as sine bumps (m13). Art test totals: 4 / 10 / 15 / 23 / 27 / 32 / 34 by task.

### [25-09-26] — Re-verification fixes
- **Added:** `theme.shaft.chevronSpacing` kept as a compat key through Tasks 2–3, because the blockout `shaft.js` reads it until Task 4 replaces it. Task 9 Step 1 now retires it with the other compat keys.
- **Removed:** —
- **Notes:** The subagent re-ran the updated plan from a clean dev baseline. Tasks 2 and 3 went red on `globalAlpha stays within 0..1` (NaN alpha from the missing key); this entry fixes that. Task 4's fail-first count is corrected to 4 of 5. Every other finding was confirmed resolved; totals 4 / 10 / 15 / 23 / 27 / 32 / 34, build 32.7 KB with the stand-in font. Accepted as is: the entering chevron shows a 0.8-unit sliver at the bottom edge of the shaft. Lowering `base` would move all three visible chevrons off the canvas centres (36.8 / 23.0 / 9.2).
