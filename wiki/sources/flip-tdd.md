# Source Summary — Flip Technical Design Document

**Source file:** [`Reference Files/Flip-TDD.md`](../../Reference%20Files/Flip-TDD.md)
**Source date:** 2026-09-21
**Size:** 518 lines, 36 KB
**Ingested:** 22-09-26

## What this source is

The complete technical design document for **Flip**, a one-button proof-of-concept browser game built as a design test. It is the single authoritative specification for the prototype: scope, tech stack, physics model, timing constraints, room content, entity schemas, tuning values, build pipeline and schedule.

It is a *specification*, not a report — every section is written to be implemented directly. All numeric values in the wiki trace back to this document.

## The game in one paragraph

Tap to flip your polarity (+1 blue / −1 red). Swing between floating hook points to climb through 10 hand-made rooms. Be the **opposite** color of a hook point to latch onto it, the **same** color to launch off it. Keep your color **matching** the walls so they cushion you instead of pulling you in. Walls change polarity as a visible wave travelling top to bottom. Touching a wall restarts the room; touching an obstacle only kills momentum. Score is total time to clear all 10 rooms, lower is better.

## Key facts

| Fact | Value |
|---|---|
| Engine | None — vanilla JS (ES2020) + Canvas 2D |
| Build | Vite → static `dist/`, `base: './'` |
| Logical resolution | 360 × 640 (portrait, letterboxed on desktop) |
| Physics step | Fixed 1/120 s with accumulator |
| Rooms | 10, hand-made, data-only in `rooms.js` |
| Player radius | 8 logical units |
| Hook point radius | 14 (visual), `fieldRadius` 70 / 50 entry-exit |
| Human reaction budget | 350 ms |
| Size budget | < 200 KB |
| Target | 60 fps on mid-range phone browser |
| Persistence | `localStorage`, best time only |
| Deploy | itch.io, HTML project, 360 × 640 embed |
| Build time | 8 days, solo developer |

## Structural claims worth flagging

- **Every magnetic rule reduces to one sign check.** `p_a * p_b` → −1 attract, +1 repel. There is no second force type.
- **Hook point fields always override walls.** Inside a field, walls and updraft do not exist. This is a hard precedence rule, not a blend.
- **Only the player flips.** Hook points have fixed polarity from room data. The single exception is the entry hook point at room start.
- **There is no gravity.** An updraft replaces it, guaranteeing the player can never get permanently stuck.
- **Timing constraints are machine-verified.** `tools/checkRooms.js` gates every build; rooms failing a launch or catch window cannot ship.
- **Degenerate play is designed against explicitly** — see [No passive clears](../concepts/no-passive-clears.md).

## Pages this source informed

**Systems**
- [Game loop & state machine](../systems/game-loop-state-machine.md)
- [Rooms & difficulty](../systems/rooms-and-difficulty.md)
- [Rendering, feedback & audio](../systems/rendering-feedback-audio.md)
- [Build & deployment](../systems/build-and-deployment.md)
- [Milestones & risks](../systems/milestones-and-risks.md)

**Concepts**
- [Polarity & force model](../concepts/polarity-force-model.md)
- [Wall wave](../concepts/wall-wave.md)
- [Latch, orbit & launch](../concepts/latch-orbit-launch.md)
- [Human timing rules](../concepts/human-timing-rules.md)
- [No passive clears](../concepts/no-passive-clears.md)
- [Room transitions](../concepts/room-transitions.md)
- [Collision & input](../concepts/collision-and-input.md)

**Entities**
- [Entity schemas](../entities/entity-schemas.md)
- [Tuning parameters](../entities/tuning-parameters.md)
- [Project structure](../entities/project-structure.md)

## Explicitly out of scope

Procedural generation, endless mode, free movement, a player-controlled room-flip button, menus beyond start and end screens, leaderboards.

## Open questions in the source

None. The TDD closes with "No open questions right now."

---

## Decision Log

### [22-09-26] — Source ingested
- **Added:** Source summary page for the Flip TDD; 16 wiki pages generated from it.
- **Choices given:** page granularity coarse / as-proposed / finer; emphasis design vs implementation → **Chosen:** as-proposed (16 pages), weighted toward implementation.
- **Notes:** Source lives in `Reference Files/` (read-only), not `raw/`. Standard INGEST steps 7–8 (ingest-log update, archive to `raw/(Ingested) DD-MM-YY/`) were skipped — `ingest-log.md` tracks `raw/` only, and Reference Files/ must never be moved from. File left in place.
