# Flip — game code

Vite + vanilla JS. `npm install`, then `npm run dev` (play), `npm test` (sim tests), `npm run build` (static `dist/`).

## Where things live

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

## Add a room

1. Copy `src/levels/room-02-cluster.js` to `src/levels/room-03-<name>.js` and set `index: 3`.
2. Set `entry.x` to room 2's `exit.x`.
3. Add it to the array in `src/levels/index.js`.
4. Run `npm test` — the validator and both passive bots must pass.

## Change how something looks

Find the drawable in `src/view/art/` or the value in `src/theme.js`. Collision shapes (player radius, shaft posts) come from `src/config.js`; change them there so drawing and physics stay matched.

## Art

The Claude Design canvas [Flip Art](https://claude.ai/artifact/51tn6oK5ZfHmTbD2dnK5fw) is the source of truth for looks (offline export: `Reference Files/Flip Art.html`). `src/theme.js` holds its tokens: palette, font sizes, strokes, fx sizes and timings. Whenever the canvas changes, re-sync `theme.js` first; `test/art.test.js` pins the canvas values and enforces the palette-only, flat-fill rules.

Dev-only tools (never in a build): `?pose=title|room1|room2|win` freezes the scene of that canvas artboard for side-by-side checks, and `?cb=protan|deutan|tritan` applies a colour-vision filter to the canvas. Both can be combined, e.g. `?pose=room1&cb=deutan`.

The font is `public/fonts/baloo2-subset.woff2` (Baloo 2, variable weight 400–800) with its SIL OFL licence in `public/fonts/OFL.txt`. It only holds printable ASCII plus `×`, `—` and `−`; if new on-screen text needs another character, re-run the subset with `tools/subset-font.md` and keep the file name.

---

## Decision Log

### [25-09-26] — Game README created
- **Added:** Map of the `game/` tree, "Add a room" steps, "Change how something looks" note.
- **Notes:** Written in dev plan Task 1. Several listed files (`config.js`, `theme.js`, `levels/`, `view/`) arrive in later tasks.

### [25-09-26] — Art section added
- **Added:** `## Art` section: Flip Art canvas link and the `theme.js` re-sync rule, dev-only `?pose=` / `?cb=` tools, font file, licence and the `tools/subset-font.md` recipe.
- **Notes:** Written in art plan Task 9, after the art pass replaced the blockout.
