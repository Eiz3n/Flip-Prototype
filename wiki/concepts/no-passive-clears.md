# No Passive Clears

**A player must never clear a room by riding the updraft while doing nothing else.** A room-authoring constraint, machine-verified. Source: [Flip TDD](../sources/flip-tdd.md).

## The threat model

Two degenerate strategies, in ascending order of danger:

1. **Never tap.** Handled by the wave alone: every room has a wave, so a player who never taps is eventually pulled into a wall. See [Wall wave](wall-wave.md).
2. **Tap only when the wave turns the walls.** *This is the real risk.* Such a player stays permanently cushioned and rises almost straight up from where it was launched, drifting slowly toward the **center line** (the vertical middle of the room). It never dies.

Every rule below exists to keep that second path away from the exit.

## The five structural rules

### 1. Exit opposite the entry
The exit hook point is **always on the opposite side of the room from the entry hook point**, so the straight climb from the entry launch never reaches it.

Since each exit becomes the next room's entry, **rooms alternate sides**. See [Room transitions](room-transitions.md).

### 2. Exit off the center line
The exit hook point's field stays at least **`centerLineClearance` (20 units)** clear of the center line, so a player that drifts to the middle **rises past it into the top wall**.

Practically: exit hook points sit at **x 80–110 or 250–280**, keeping their fields clear of both the center line and the side walls.

### 3. Hook points on the center line
**At least one hook point field covers the center line**, so a drifting player is either caught (and must launch to move on) or pushed off course.

### 4. Obstacles on the center line
**From room 2**, at least one obstacle sits on the center line **in the upper half of the room**, stopping drifting players who slip past a hook point.

### 5. Reaching the exit takes skill
The exit hook point is reached either by launching toward it, or by letting the walls pull the player sideways and tapping to be cushioned in time. **Both need well-timed taps.**

## Passive bots — the verification

`tools/checkRooms.js` runs two bots in every room. **A room fails if either one reaches the exit.**

| Bot | Behaviour |
|---|---|
| **Idle bot** | Never taps after the entry launch |
| **Drift bot** | Never launches from a hook point, but **always taps to stay cushioned** when outside a field — riding the updraft for as long as it survives |

The drift bot is the one that matters. It is the exact embodiment of threat model 2, and rules 1–4 are what make it fail.

> Both bots run alongside the launch- and catch-window checks. All three must pass on all 10 rooms before a build goes to itch.io. See [Human timing rules](human-timing-rules.md).

## Why the updraft is safe to have

The updraft exists so the player **can never get permanently stuck** — there is no gravity to fall back on. It is made safe by being deliberately slow: `riseSpeed` 60 units/s, roughly **a quarter of a typical launch speed**, and it only ever moves the player **straight up**. See [Polarity & force model](polarity-force-model.md).

## Authoring checklist

When placing a room in `rooms.js`, verify against this page plus [Human timing](human-timing-rules.md) rules 8–9:

- [ ] Exit on the opposite side from entry
- [ ] Exit x within 80–110 or 250–280
- [ ] Exit field ≥ 20 units clear of the center line
- [ ] ≥ 1 hook point field covering the center line
- [ ] (Rooms 2–10) ≥ 1 obstacle on the center line, upper half
- [ ] No hook point field touching a side wall (`wallMargin` 30)
- [ ] No obstacle crossing an orbit; 3-player-diameter gap on one side
- [ ] Hops shorter than `maxReach` (220)
- [ ] `checkRooms.js` passes: every hop window, every catch window, both bots fail

## Related pages

- [Rooms & difficulty](../systems/rooms-and-difficulty.md) — the room-building procedure this checklist belongs to
- [Human timing rules](human-timing-rules.md) — the other half of `checkRooms.js`
- [Wall wave](wall-wave.md) — why never-tapping fails
- [Room transitions](room-transitions.md) — why rooms alternate sides
- [Polarity & force model](polarity-force-model.md) — cushioning and the updraft
- [Tuning parameters](../entities/tuning-parameters.md) — `centerLineClearance`, `maxReach`, `wallMargin`

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Threat model, the five structural rules verbatim, both passive bots, the authoring checklist.
- **Notes:** The authoring checklist is assembled from this section plus Human timing rules 8–9 and the "Building a room" procedure — it is a compiled aid, not a single source section. The threat-model framing restates the source's own "the real risk is…" paragraph.
