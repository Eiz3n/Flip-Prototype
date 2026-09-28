# Flip — game code

Vite + vanilla JS. `npm install`, then `npm run dev` (play), `npm test` (sim tests), `npm run build` (static `dist/`).

## Where things live

| Folder / file | Holds | Rule |
|---|---|---|
| `src/config.js` | every gameplay number | logic files read numbers from here |
| `src/theme.js` | every colour, font, stroke, size, fx timing | art files read style from here |
| `src/levels/` | one file per room; `index.js` sets the order and the stages with their star times | a room's numbers live only in its file |
| `src/sim/` | the simulation | pure: no DOM, no clock, no allocation in `step()` |
| `src/game.js` | state machine (title, stage select, stages), stage timer, deaths | talks to sim through `startRoom` / `step` only |
| `src/progress.js` | per-stage best time and stars | pure apart from the injected storage; blocked storage never throws |
| `src/stars.js` | stage star rating | pure: time and deaths in, stars out |
| `src/view/art/` | one module per drawable | reads sim state, never changes it |
| `src/view/anim/effects.js` | event → animation wiring | the only place events become juice |
| `public/fonts/` | `baloo2-subset.woff2` | keep the file name |

## Add a room

Lay it out in the [room editor](https://claude.ai/artifact/PnJjGK4xiSA3jsndsbFVZK) first: it runs this sim, the validator, the passive bots and a route bot live, and its Copy JS button writes the file below.

1. Copy the last room file to `src/levels/room-NN-<name>.js` and set `index`.
2. Set `entry.x` to the previous room's `exit.x`.
3. Add it to `LEVELS` in `src/levels/index.js`, and add its index to a stage in `STAGES` (a new stage needs `goldMs` below `silverMs`).
4. Run `npm test`: the validator, the stage check and all three passive bots must pass.

## Change how something looks

Find the drawable in `src/view/art/` or the value in `src/theme.js`. Collision shapes (player radius, shaft posts) come from `src/config.js`; change them there so drawing and physics stay matched.

## Art

The Claude Design canvas [Flip Art](https://claude.ai/artifact/51tn6oK5ZfHmTbD2dnK5fw) is the source of truth for looks (offline export: `Reference Files/Flip Art.html`). `src/theme.js` holds its tokens: palette, font sizes, strokes, fx sizes and timings. Whenever the canvas changes, re-sync `theme.js` first; `test/art.test.js` pins the canvas values and enforces the palette-only, flat-fill rules.

Dev-only tools (never in a build): `?pose=title|select|room1|room2|stage|win` freezes the scene of that canvas artboard for side-by-side checks, and `?cb=protan|deutan|tritan` applies a colour-vision filter to the canvas. Both can be combined, e.g. `?pose=room1&cb=deutan`.

The font is `public/fonts/baloo2-subset.woff2` (Baloo 2, variable weight 400–800) with its SIL OFL licence in `public/fonts/OFL.txt`. It only holds printable ASCII plus `×`, `—` and `−`; if new on-screen text needs another character, re-run the subset with `tools/subset-font.md` and keep the file name.

---

## Decision Log

### [25-09-26] — Game README created
- **Added:** Map of the `game/` tree, "Add a room" steps, "Change how something looks" note.
- **Notes:** Written in dev plan Task 1. Several listed files (`config.js`, `theme.js`, `levels/`, `view/`) arrive in later tasks.

### [25-09-26] — Art section added
- **Added:** `## Art` section: Flip Art canvas link and the `theme.js` re-sync rule, dev-only `?pose=` / `?cb=` tools, font file, licence and the `tools/subset-font.md` recipe.
- **Notes:** Written in art plan Task 9, after the art pass replaced the blockout.

### [28-09-26] — Rooms 3–5 and stage stars
- **Added:** `src/stars.js` row; stages and star times in the levels row; add-a-room steps now cover `STAGES` and point to the room editor artifact; `stage` pose.
- **Removed:** Add-a-room steps hard-wired to room 3.
- **Choices given:** clear screens 1+2 / 3+4 / 5 alone, or 4+5 final, or 3+4+5 → **Chosen:** 1+2, 3+4, 5 alone. Stars 3 max, floor 1, any deaths −1 → **Chosen.**
- **Notes:** Stars drawn in ink (filled / outline) to keep the palette-only rule; the day-1 hooks spec draws them the same way.

### [28-09-26] — Stage select
- **Added:** `src/progress.js` row; `select` pose.
- **Removed:** Run total best time from the `game.js` row.
- **Choices given:** after a clear continue / back to select → **Chosen:** continue. Stages all open / unlock in order → **Chosen:** all open. Run total best only from stage 1 / drop it → **Chosen:** timers per stage, title shows stars collected. Win returns to select / title → **Chosen:** title.
- **Notes:** The numeral flip reuses the title F's turn (0.25 s, easeOutBack); the digit swaps at the quarter turn. Start pans with the room-transition camera move. Tap areas live in `config.select`.
