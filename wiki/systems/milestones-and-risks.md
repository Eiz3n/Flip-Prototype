# Milestones & Risks

Solo developer, roughly 1–2 weeks; the schedule below is 8 days. Source: [Flip TDD](../sources/flip-tdd.md).

## Sequencing principle

**The plan front-loads the feel of latch and launch, because if that isn't fun by day 3, nothing built on top will fix it.**

That is the reason the schedule looks inverted — art, audio and 7 of the 10 rooms come *after* the core verb is proven.

## Milestones

| Day | Milestone | Done when |
|---|---|---|
| 1 | Loop, input, Room 1 shell, wall pull and cushion, updraft | Tap flips color; a cushioned player can't touch a wall, a pulled one can |
| 2–3 | Hook point fields, latch, orbit with speed bleed, launch, latency compensation | Launch-and-catch around Room 1 feels good |
| 4 | Wall wave, front line, free-flight grace, obstacles | The wave turns walls against the player fairly; obstacles block without killing |
| 5 | Entry and exit hook points, camera pan, restart, win screen, run timer | Rooms 1–3 playable back to back |
| 6 | `tools/checkRooms.js` (timing checks + passive bots) and rooms 4–10 | All 10 rooms pass; neither passive bot clears any room |
| 7 | Flat pastel art pass, feedback, audio | Matches the palette; responsive with sound on and off |
| 8 | itch.io build, device test, 3–5 player playtest | Most testers reach room 10 within 15 minutes |

**Day-to-page map**

| Day | Pages |
|---|---|
| 1 | [Game loop & state machine](game-loop-state-machine.md), [Polarity & force model](../concepts/polarity-force-model.md), [Collision & input](../concepts/collision-and-input.md) |
| 2–3 | [Latch, orbit & launch](../concepts/latch-orbit-launch.md) |
| 4 | [Wall wave](../concepts/wall-wave.md), [Entity schemas](../entities/entity-schemas.md) (Obstacle) |
| 5 | [Room transitions](../concepts/room-transitions.md) |
| 6 | [Human timing rules](../concepts/human-timing-rules.md), [No passive clears](../concepts/no-passive-clears.md), [Rooms & difficulty](rooms-and-difficulty.md) |
| 7 | [Rendering, feedback & audio](rendering-feedback-audio.md) |
| 8 | [Build & deployment](build-and-deployment.md) |

**Note the ordering constraint:** the day-1 acceptance test ("a cushioned player can't touch a wall, a pulled one can") is the `safeGap` hard clamp. It must hold before anything else is built on top.

Tuning note from [Tuning parameters](../entities/tuning-parameters.md): `k_w`, `fieldRadius`, `minOrbitSpeed` and `launchImpulse` are tuned **in Room 1 before building the other rooms** — i.e. during days 1–3, not day 6.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Launch feels floaty or random | Core loop fails | Tune in Room 1 first; keep launch preview in early rooms |
| Timing too tight for humans | Testers quit | 350 ms human budget, launch windows measured at the slowest orbit, orbit speed cap, automated timing check |
| Walls turning feels unfair | Players blame the game | Visible front line, free-flight wave grace, catch window (Human timing, rule 3) |
| Hops needing extra taps feel confusing | Players miss catches | Teach the color rule in room 3; field rings show when walls stop mattering |
| Pastel colors hard to tell apart | Misread polarity | `+` and `−` marks in ink on every polarity shape; test with a color-blind simulator |
| Mobile touch latency | Timing feels off | `pointerdown` events, latency compensation, test on a real phone **by day 5** |

**Status, mobile touch latency (25-09-26):** real-phone test done on a Samsung Galaxy S22+ — flips feel instant and timing felt good, with `inputLatencyComp` at 0.06. See [Collision & input](../concepts/collision-and-input.md#mobile-page-setup).

**Every mitigation is already a specified feature** — none is a "we'll watch for it". Each maps to a system:

| Risk | Mitigating system |
|---|---|
| Floaty launch | [Tuning parameters](../entities/tuning-parameters.md), [Rendering](rendering-feedback-audio.md) (launch preview, rooms 1–2) |
| Timing too tight | [Human timing rules](../concepts/human-timing-rules.md) |
| Walls unfair | [Wall wave](../concepts/wall-wave.md) (grace, front line), Human timing rule 3 |
| Extra taps confusing | [Rooms & difficulty](rooms-and-difficulty.md) (room 3 teaches color), field rings |
| Color-blind readability | [Rendering, feedback & audio](rendering-feedback-audio.md) |
| Touch latency | [Human timing rules](../concepts/human-timing-rules.md) rule 6, `inputLatencyComp` |

## Open questions

**None.** The TDD closes with "No open questions right now."

## Related pages

- [Flip TDD source summary](../sources/flip-tdd.md)
- [Rooms & difficulty](rooms-and-difficulty.md) — day 6 content
- [Build & deployment](build-and-deployment.md) — day 8
- [Human timing rules](../concepts/human-timing-rules.md) — the mitigation behind two risks

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Milestone table and risk table verbatim, sequencing principle, day-to-page map, risk-to-system map, open questions status.
- **Notes:** Both tables quoted exactly. The day-to-page and risk-to-system maps are navigation aids added during ingest. The observation that Room 1 tuning falls in days 1–3 rather than day 6 reconciles the milestone table with the tuning section; both are source statements.

### [25-09-26] — Mobile touch latency status added
- **Added:** Status line under the risk table: real-phone test on a Samsung Galaxy S22+ passed, flips feel instant; link to Collision & input.
- **Notes:** Risk table left verbatim; status sits below it.
