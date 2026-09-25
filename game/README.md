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

---

## Decision Log

### [25-09-26] — Game README created
- **Added:** Map of the `game/` tree, "Add a room" steps, "Change how something looks" note.
- **Notes:** Written in dev plan Task 1. Several listed files (`config.js`, `theme.js`, `levels/`, `view/`) arrive in later tasks.
