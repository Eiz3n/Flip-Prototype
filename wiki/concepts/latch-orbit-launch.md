# Latch, Orbit & Launch

The core verb of the game. Owned by `src/physics.js`. Source: [Flip TDD](../sources/flip-tdd.md).

## Latch

1. In free flight, if an **attracting** hook point is within `latchRadius` (30), the player latches to it.
2. On latch, the starting angular speed:

```
ω = (arrival speed along the orbit) / orbitRadius
ω = clamp(ω, room.minOrbitSpeed, maxOrbitSpeed)
```

`orbitRadius` = 30, `maxOrbitSpeed` = 6.0 rad/s, `minOrbitSpeed` is **per room** (2.8 → 4.0).

3. **Orbit direction follows the arrival direction.**

Hook points have **no solid collision**. Touching one while attracted *means* latching; a repelled player can't reach one.

## Orbit

While latched, `ω` bleeds off toward `minOrbitSpeed` through `orbitDrag` (0.8/s):

```
ω ← ω_min + (ω − ω_min)·e^(−orbitDrag·dt)
```

**Design consequence:** waiting makes a launch easier to time but **costs time on the clock**. That is the risk/reward of the scoring system — see [Game loop & state machine](../systems/game-loop-state-machine.md).

Each physics step:

```
θ += ω·dt
player.pos = hookPoint.pos + orbitRadius·(cos θ, sin θ)
```

- **Walls and other hook points are ignored while latched.** No force integration runs — the player is kinematic.
- `hookPoint.pos` includes the bob offset, so **the orbit follows the hook point's bob**.
- A faint **tether line** is drawn between player and hook point.

## Launch

A launch happens when the player **taps and becomes the same color as the latched hook point**, or when the entry hook point flips at the start of a room.

```
launchVel = tangentialVelocity(ω·r, along the orbit)
          + radialPush(launchImpulse, away from the hook point)
launchVel = clamp(launchVel, maxSpeed)
```

`launchImpulse` = 180 units/s, `maxSpeed` = 480 units/s.

- The released hook point gets a **`relatchCooldown`** (0.25 s) so the player cannot instantly re-latch to it. Stored as `HookPoint.cooldown`.
- **Aiming is purely about timing** — where the player is on the orbit when it taps decides the launch direction.

## Timing aids

Two [Human timing](human-timing-rules.md) rules act directly on launch:

| Aid | Value | Effect | Disabled at |
|---|---|---|---|
| **Latency compensation** (rule 6) | `inputLatencyComp` 60 ms | The launch uses the orbit angle from 60 ms **before the tap was processed**. Taps are timestamped with `event.timeStamp`. | `0` |
| **Launch assist** (rule 7) | `launchAssist` 6° | Launch direction nudged up to 6° toward the nearest hook point field (**never the one being left**) or the exit hook point. | `0` |

Both are explicitly marked "tune in playtesting".

## Constraints this system must satisfy

- **Minimum launch window** (rule 1): for every hop a room requires, the range of orbit angles producing a successful launch must last at least `minLaunchWindow` — 300 ms (rooms 1–3), 220 ms (4–7), 160 ms (8–10). **Measured at the room's `minOrbitSpeed`**, because a player can always wait for the orbit to slow. *A launch that hits an obstacle counts as a failure.*
- **Orbit speed cap** (rule 2): `maxOrbitSpeed` 6 rad/s limits how fast a fast arrival can orbit; `orbitDrag` bleeds it off within a couple of seconds.
- **Obstacle clearance** (rule 9): obstacles never cross an orbit — `orbitRadius + player radius + 10` units.

Verified per-room by `tools/checkRooms.js`; see [Human timing rules](human-timing-rules.md).

## Feedback

| Event | Visual | Audio |
|---|---|---|
| Latch | Hook point scales up 10% for one beat | Soft click |
| Launch | A few solid dots puff opposite the direction of travel | Short whoosh (filtered noise) |
| Player flip | Instant color swap, one ring pop | Short blip, pitch by polarity |

See [Rendering, feedback & audio](../systems/rendering-feedback-audio.md).

## Related pages

- [Polarity & force model](polarity-force-model.md) — the attract/repel rule and field precedence
- [Human timing rules](human-timing-rules.md) — rules 1, 2, 6, 7 and 9 all bind here
- [Room transitions](room-transitions.md) — the entry launch, the one hook point that flips
- [Collision & input](collision-and-input.md) — tap queueing and buffering
- [Entity schemas](../entities/entity-schemas.md) — `Player.theta`, `Player.omega`, `HookPoint.cooldown`
- [Tuning parameters](../entities/tuning-parameters.md) — `latchRadius`, `orbitRadius`, `orbitDrag`, `launchImpulse`, `maxSpeed`, `relatchCooldown`

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Latch conditions with the ω clamp, orbit bleed formula and kinematic step, launch velocity composition, latency compensation and launch assist table, the three binding timing rules.
- **Notes:** Formulas quoted from the source. The "no force integration runs while latched" framing is an implementation restatement of the source's "walls and other hook points are ignored while latched".
