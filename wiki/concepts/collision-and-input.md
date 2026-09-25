# Collision & Input

Owned by `src/collision.js` and `src/input.js`. Source: [Flip TDD](../sources/flip-tdd.md).

## Collision — three checks

Only three checks matter: player vs walls, player vs obstacles, and latching onto the exit hook point.

**Hook points have no solid collision.** Touching one while attracted *means* latching; a repelled player can't reach one. See [Latch, orbit & launch](latch-orbit-launch.md).

### Walls

- The room is an **axis-aligned rectangle with no gaps**.
- **Touching any wall kills.**
- A player can only reach a side wall **while being pulled by it**, or **when a sliding obstacle pushes it there**.
- Top and bottom walls exert no force but kill on contact.
- **Room links:** rooms connect *only* through the exit and entry hook points — see [Room transitions](room-transitions.md).

### Obstacles

Contact response:

```
1. push the player out of the overlap
2. remove velocity INTO the obstacle
3. sliding speed along the edge *= obstacleFriction   // 0.85
```

- **No bounce, no death.** The player just loses its momentum and has to find a way around.
- **Exception:** a *sliding* obstacle that pushes the player into a side wall **kills**, even a cushioned player — the obstacle overpowers the cushion.
- Magnetic forces pass straight through obstacles; they have no polarity and no field.

See [Entity schemas](../entities/entity-schemas.md).

### Tunneling

Not a problem, by arithmetic: at `maxSpeed` (480 units/s) a player moves **about 4 units per 1/120 s step**, well under its **8-unit radius**. **Simple overlap tests are safe** — no swept-shape or continuous collision needed.

## Input

- **Pointer down** (mouse or touch) **or Space** flips polarity.
- **One flip per press; holding does nothing.**
- Inputs are **queued and consumed at the next physics step**, so timing stays frame-rate independent.
- Taps are timestamped with **`event.timeStamp`** for latency compensation — see [Human timing rules](human-timing-rules.md) rule 6.
- **`touch-action: none`** on the canvas stops mobile scroll and zoom.
- **The first tap also unlocks Web Audio.**

### Mobile page setup

Implementation detail in `game/index.html` and `game/src/main.js`, not from the TDD:

- **Safe area:** the body is padded by `env(safe-area-inset-*)` (the viewport meta sets `viewport-fit=cover`), so the room never sits under a notch or rounded corner. The padding shows the same background colour as the canvas letterbox, so no seam shows.
- **Scaling reads the canvas box, not the window:** `resize()` fits the 360 × 640 room into `canvas.clientWidth × clientHeight`, i.e. inside the safe area.
- **No browser gestures on a tap:** `user-select: none`, `-webkit-touch-callout: none` (iOS long-press menu), `-webkit-tap-highlight-color: transparent` and `overscroll-behavior: none` (pull-to-refresh).
- **Multi-touch:** each new finger fires its own `pointerdown`, so a two-finger tap flips twice. Accepted as-is.
- Checked in a 375 × 812 phone emulation with simulated notch insets; **not yet checked on a real device** — see the touch-latency risk in [Milestones & risks](../systems/milestones-and-risks.md).

### Tap buffering

A tap made while the player is **still inside the launching hook point's field** — including the entry hook point's, after an entry launch — is **buffered** (`Player.bufferedTap`) and takes effect **the moment the player leaves that field**.

Rationale: an early tap must never pull the player back into the field it just left.

### When input is ignored

| State / window | Input |
|---|---|
| **Transition** (camera pan, ~0.4 s) | Ignored |
| **Dying** (0.6 s) | Ignored |
| **Ready beat** after a death (0.5 s) | Ignored |
| Title | Tap starts at room 1 |
| Win | Tap returns to title |

See [Game loop & state machine](../systems/game-loop-state-machine.md).

## Camera

- **During play the camera frames the current room exactly; nothing scrolls.**
- On latching the exit hook point, it eases up **one room height over 0.4 s (ease-out cubic)**.
- **Screen shake:** 3 units for 0.1 s on each entry launch; 10 units for 0.3 s on death.

Owned by `src/camera.js`.

## Related pages

- [Polarity & force model](polarity-force-model.md) — what "being pulled by a wall" means
- [Latch, orbit & launch](latch-orbit-launch.md) — latching is the exit-detection path too
- [Room transitions](room-transitions.md) — pan, ready beat, entry launch
- [Human timing rules](human-timing-rules.md) — `event.timeStamp` and `inputLatencyComp`
- [Entity schemas](../entities/entity-schemas.md) — `Player.bufferedTap`, `Obstacle`
- [Game loop & state machine](../systems/game-loop-state-machine.md) — which states consume input

---

## Decision Log

### [22-09-26] — Page created
- **Added:** The three collision checks, obstacle response as ordered pseudocode, the tunneling arithmetic, full input spec, tap buffering, the ignored-input table, camera and shake values.
- **Notes:** The ignored-input table merges the state machine's Input column with the death ready-beat rule stated separately in the source's "Entry and exit hook points" section.

### [25-09-26] — Mobile page setup added
- **Added:** "Mobile page setup" subsection: safe-area padding, scaling to the canvas box, disabled tap gestures, multi-touch note, verification status; link to Milestones & risks.
- **Choices given:** Add safe-area + gesture fixes and verify in phone emulation → **Chosen:** Yes.
- **Notes:** Documents code changes in `game/index.html` and `game/src/main.js`; not from an ingested source. Two-finger double flip left as-is.
