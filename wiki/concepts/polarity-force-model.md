# Polarity & Force Model

The whole physics system. Source: [Flip TDD](../sources/flip-tdd.md).

## The one rule

Polarity is `+1` (blue) or `−1` (red). **The product of two polarities decides the interaction:**

| `p_a * p_b` | Result |
|---|---|
| `−1` (opposite) | **Attract** |
| `+1` (same) | **Repel** |

There is no second force type. Every magnetic rule in the game reduces to this sign check.

- `player.pol` and `hookPoint.pol` are each ±1. Wall polarity varies with height — see [Wall wave](wall-wave.md). Obstacles have **no polarity**.
- **Hook points never change polarity.** Each one's color comes from room data; a room can mix both colors. Only the player flips. The single exception is the entry hook point at room start — see [Room transitions](room-transitions.md).
- The rule the player learns is about **color**: be the *opposite* color of a hook point to latch onto it, the *same* color to be pushed off it.

**There is no gravity.** The player is the only fully simulated body; hook points and obstacles are kinematic and are never pushed by the player.

## Force precedence — a hard switch, not a blend

Where the player is decides which forces apply. **Hook point fields always override the walls.**

| Location | Active forces |
|---|---|
| **Inside any hook point field** (within `fieldRadius`) | Hook point forces only. Where fields overlap, forces from every hook point containing the player **add together**. No walls, no updraft. |
| **Outside every field** | Side walls act horizontally; the updraft lifts vertically. |

This precedence is the single most important implementation detail in `physics.js`. It is a branch, not a weighted sum.

## Hook point force

With `d̂` pointing from player to hook point, `d` the distance:

```latex
\vec{F}_{hook} = -\,k \cdot p_{player} \, p_{hook} \cdot \frac{\hat{d}}{\max(d, d_{min})^{2}}
```

Inverse-square, clamped at `d_min` (24) so close range can't blow up. `k` = 2 000 000.

## Wall forces

Outside a field, the player compares its color with the wall color **at its own height**.

| Player vs. wall at player's height | Result |
|---|---|
| **Opposite** polarity | Pulled toward the nearest wall, faster the closer it gets — **danger** |
| **Same** polarity | **Cushioned**: movement toward the nearer wall is damped and a gentle push returns the player toward the center, while movement toward the center stays free. The player can never touch a wall in this state |

### Wall pull (player opposite the walls)

`x` = distance from the left wall, `W` = room width:

```latex
F_{pull,x} = -\,k_{w} \cdot \left( \frac{1}{\max(x, d_{min})^{2}} - \frac{1}{\max(W - x, d_{min})^{2}} \right)
```

`k_w` = 400 000. This is also **how the player moves sideways** — stay pulled to drift toward a side, then tap to be cushioned before reaching it.

### Wall cushion (player matches the walls)

A **damper, not a spring**. It only resists movement *toward* the nearer wall, and its push is deliberately much weaker than the pull. With `v_w` the player's speed toward the nearer wall (**zero when moving toward the center**):

```latex
a_{x} = -\,c_{w} \, v_{w} \; - \; k_{c} \cdot \frac{x - W/2}{W/2}
```

- `wallDamping` (c_w, 6/s) quickly removes speed toward the nearer wall.
- `centerPush` (k_c, 80 units/s²) drifts the player gently back toward the middle.

**Consequence worth implementing carefully:** because only movement toward a wall is damped, **a launch that crosses the room toward the center keeps its sideways speed.**

**Hard guarantee:** a cushioned player's speed toward a wall is **set to zero** within `safeGap` (12 units) of it. Like two repelling magnets, it can never touch. This is a clamp, not an emergent result of the damper.

### Top and bottom walls

Exert **no force**. They kill on contact.

## Updraft

Outside every field, a steady updraft keeps the player rising so it can never get permanently stuck.

```
if (player.vel.y_up < riseSpeed)
    raise vel.y_up toward riseSpeed at updraftGain per second
```

- `riseSpeed` = 60 units/s, `updraftGain` = 3/s.
- Faster upward speed from a launch is **kept**, and decays back toward `riseSpeed` through `drag` (0.25/s).
- The updraft only ever moves the player **straight up**.

It is deliberately slow — roughly a quarter of a typical launch speed. Drifting on it alone never finishes a room; see [No passive clears](no-passive-clears.md).

## Moving between hook points — the player's loop

Hook points never flip, so every hop is about the player's own color:

1. **Latched** — the player is the *opposite* color of the hook point.
2. **Tap to launch** — the player now *matches* the hook point and is pushed out of its field.
3. **Read the walls** — outside the field, if the player is *opposite* the walls at its height they pull it in, so it taps to *match* them and get cushioned. If it already matches, no tap is needed.
4. **Catch** — to latch onto the next hook point, the player must be its *opposite* color **when entering its field**, which may take one more tap just before arriving.

Because hook points come in both colors and the wave keeps changing the walls, **the number and timing of taps per hop varies — that is where the skill is.**

**Tap buffering:** a tap made while the player is still inside the launching hook point's field (including the entry hook point's, after an entry launch) is **buffered** and takes effect the moment the player leaves that field, so an early tap never pulls the player back. See [Collision & input](collision-and-input.md).

## Related pages

- [Wall wave](wall-wave.md) — how wall polarity varies with height and time
- [Latch, orbit & launch](latch-orbit-launch.md) — what happens once inside `latchRadius`
- [Human timing rules](human-timing-rules.md) — the constraints these forces must satisfy
- [No passive clears](no-passive-clears.md) — why the updraft alone can't win
- [Tuning parameters](../entities/tuning-parameters.md) — `k`, `k_w`, `wallDamping`, `centerPush`, `safeGap`, `d_min`, `riseSpeed`, `updraftGain`, `drag`
- [Entity schemas](../entities/entity-schemas.md) — `Player.pol`, `HookPoint.pol`

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Sign-check rule, force precedence table, all three force formulas verbatim, updraft pseudocode, the four-step hop loop, tap buffering.
- **Notes:** Formulas quoted exactly (LaTeX blocks as written in the source). Emphasis added on precedence being a branch not a blend, and on `safeGap` being a hard clamp — both are implementation traps the prose states but does not flag.
