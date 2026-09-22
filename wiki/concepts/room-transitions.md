# Room Transitions — Entry & Exit Hook Points

Rooms connect through two special hook points **instead of gaps in the walls**; the top and bottom walls are solid. Source: [Flip TDD](../sources/flip-tdd.md).

## Exit hook point

- **One per room**, near the top.
- **Always on the opposite side of the room from that room's entry hook point**, so a player rising straight up from the entry launch never meets it. See [No passive clears](no-passive-clears.md).
- **Attracts the player whatever the player's color** — the only hook point that ignores the sign check.
- **Latching onto it clears the room.**
- `fieldRadius` = 50 (`exitFieldRadius`), not the normal 70.
- Allowed x range: **80–110 or 250–280**.

Since each exit becomes the next room's entry, **rooms alternate sides**.

## Transition sequence

```
1. Player latches the exit hook point           → state: Playing → Transition
2. Camera eases up one room height over 0.4 s   (ease-out cubic)
   - player stays HELD on top of the hook point
   - input IGNORED
   - wall wave PAUSED
3. Pan finishes                                 → state: Transition → Playing
4. Exit hook point becomes the next room's ENTRY hook point,
   at the same x, near the bottom of the new room
5. Player's color is SET to match the walls at entry height
6. Entry hook point FLIPS to that same color
   → launches the player straight up at entryLaunchSpeed (240 units/s)
   → new room's wave starts
   → screen shake 3 units for 0.1 s
```

**Every room therefore starts with the player cushioned and rising.**

> **The entry hook point is the only hook point that ever flips.** Every other hook point's polarity is fixed from room data — see [Polarity & force model](polarity-force-model.md).

## Room 1 and restarts

| Case | Behaviour |
|---|---|
| **Room 1 start** | Player on an entry hook point at the **bottom center** |
| **After a death** | Player reappears on the entry hook point and is launched again after a **0.5 s ready beat**. **Taps during the ready beat are ignored.** |

**On death the room fully resets:** player back on the entry hook point, hook points at home, wall wave at its **starting phase** — so **every attempt is identical**.

## Tap buffering across the entry launch

A tap made while the player is still inside the launching hook point's field — **including the entry hook point's, after an entry launch** — is buffered and applied the moment the player leaves that field. An early tap never pulls the player back. See [Collision & input](collision-and-input.md).

## Memory and streaming

- Rooms stack vertically; `Room.originY` is the world Y of a room's bottom edge.
- **Only the current and next room are kept in memory.**
- The previous room is **discarded once the pan finishes**.
- The room **after next** is loaded from `rooms.js` in the background.

## Data invariant

Room *n*'s `exit.x` **is** room *n+1*'s `entry.x`. In `rooms.js` this is written out explicitly per room, e.g. room 4's `entry: { x: 265, y: 590 }` carries the comment *"matches room 3's exit x"*. See [Entity schemas](../entities/entity-schemas.md).

## Rendering

Entry and exit hook points are **larger circles with a double ink ring**. The exit hook point is drawn **half blue and half red** — it attracts either color — and its **outer ring slowly rotates** so it reads as the way out. See [Rendering, feedback & audio](../systems/rendering-feedback-audio.md).

| Event | Visual | Audio |
|---|---|---|
| Entry launch | Entry hook point swaps color, small shake | Low thump |
| Room cleared | Room number pops | Ascending two-note chime |

## Related pages

- [Game loop & state machine](../systems/game-loop-state-machine.md) — the Transition state
- [No passive clears](no-passive-clears.md) — why exit sits opposite entry and off the center line
- [Wall wave](wall-wave.md) — the pause and the entry colour match
- [Latch, orbit & launch](latch-orbit-launch.md) — the entry launch is a launch
- [Collision & input](collision-and-input.md) — input ignored during Transition and the ready beat
- [Entity schemas](../entities/entity-schemas.md) — `HookPoint.kind`, `Room.entry` / `Room.exit`

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Exit hook point spec, the six-step transition sequence, room 1 / restart behaviour, tap buffering across entry launch, memory streaming rules, data invariant, render spec.
- **Notes:** The transition sequence is reassembled as an ordered list from prose spread across the source's "Entry and exit hook points" and "Camera & transitions" sections; every step is source content, the ordering is made explicit for implementation.
