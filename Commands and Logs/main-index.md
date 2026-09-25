# Flip-Prototype Wiki Index

## Systems
- [Game loop & state machine](../wiki/systems/game-loop-state-machine.md) — fixed 1/120 s accumulator loop, the five game states, reset semantics, run timer
- [Rooms & difficulty](../wiki/systems/rooms-and-difficulty.md) — layout vocabulary, the 10-room plan table, teaching order, room-building procedure
- [Rendering, feedback & audio](../wiki/systems/rendering-feedback-audio.md) — flat pastel palette, per-entity draw spec, readability aids, feedback and audio table
- [Performance, build & deployment](../wiki/systems/build-and-deployment.md) — 60 fps / 200 KB targets, performance rules, Vite build, itch.io setup, release gate
- [Milestones & risks](../wiki/systems/milestones-and-risks.md) — 8-day schedule, risk table, day-to-page and risk-to-system maps

## Entities
- [Entity schemas](../wiki/entities/entity-schemas.md) — Player, HookPoint, Obstacle, Room class definitions, bob formula, room data shape
- [Tuning parameters](../wiki/entities/tuning-parameters.md) — the full `config.js` table, sensitivity ranking, per-room overrides
- [Project structure & tech stack](../wiki/entities/project-structure.md) — stack choices, module tree, per-module contracts, coordinate system

## Concepts
- [Polarity & force model](../wiki/concepts/polarity-force-model.md) — the sign check, field-over-wall precedence, hook/wall/updraft formulas, the four-step hop loop
- [Wall wave](../wiki/concepts/wall-wave.md) — two-band polarity wave, the height/time lookup, wave grace, period floor
- [Latch, orbit & launch](../wiki/concepts/latch-orbit-launch.md) — latch conditions, orbit bleed, launch velocity, latency compensation and launch assist
- [Human timing rules](../wiki/concepts/human-timing-rules.md) — the 350 ms budget, all nine rules, the `checkRooms.js` gate
- [No passive clears](../wiki/concepts/no-passive-clears.md) — degenerate-play threat model, five structural rules, passive bots, authoring checklist
- [Room transitions](../wiki/concepts/room-transitions.md) — entry and exit hook points, the transition sequence, restarts, room streaming
- [Collision & input](../wiki/concepts/collision-and-input.md) — the three collision checks, obstacle response, tunneling margin, input spec, tap buffering and mobile page setup

## Source Summaries
- [Flip — Technical Design Document](../wiki/sources/flip-tdd.md) — the complete TDD for the Flip prototype (2026-09-21); source of every page above

---

## Decision Log

### [22-09-26] — Initial setup by GPS (Claude build)
- **Added:** File created by GPS setup sequence.
- **Notes:** Updated as content is added.

### [22-09-26] — Flip TDD ingested
- **Added:** 16 wiki pages indexed — 5 systems, 3 entities, 7 concepts, 1 source summary.
- **Choices given:** page granularity coarse / as-proposed / finer; emphasis design vs implementation → **Chosen:** as-proposed, weighted toward implementation.
- **Notes:** All pages derive from a single source, `Reference Files/Flip-TDD.md`. Cross-links are bidirectional per the Cross-Reference Rule. Index links use `../wiki/...` rather than the `wiki/...` form shown in the GPS §1.3 template — main-index.md lives in `Commands and Logs/`, so the template form resolves to `Commands and Logs/wiki/` and does not open. Verified by link check.

### [25-09-26] — Collision & input description revised
- **Added:** "mobile page setup" to the Collision & input entry description.
- **Notes:** Page gained a Mobile page setup subsection (safe area, tap gestures) documenting code changes; no new pages.
