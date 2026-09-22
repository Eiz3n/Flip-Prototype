# Human Timing Rules

**Every timing requirement assumes a human, not a frame-perfect input.** This is a constraint system with machine verification, not a feel target. Source: [Flip TDD](../sources/flip-tdd.md).

## The budget

**350 ms** from seeing a cue to the tap registering:

- ~250 ms visual reaction
- 50–100 ms touch and display latency

> The source marks these as approximate figures, to confirm in playtesting.

**Every rule below is built around that budget.**

## The nine rules

### 1. Minimum launch window
For every hop a room requires, the range of orbit angles that produces a successful launch must last at least `minLaunchWindow`:

| Rooms | Window |
|---|---|
| 1–3 | 300 ms |
| 4–7 | 220 ms |
| 8–10 | 160 ms |

Measured at the room's **`minOrbitSpeed`**, because a player can always wait for the orbit to slow down. **A launch that hits an obstacle counts as a failure.**

### 2. Orbit speed cap
`maxOrbitSpeed` (6 rad/s) limits how fast a fast arrival can orbit. `orbitDrag` bleeds that speed off within a couple of seconds.

### 3. Minimum catch window
After the player leaves a hook point field **while being pulled toward a wall**, time until wall contact must be at least `minCatchWindow`:

| Rooms | Window |
|---|---|
| 1–3 | 600 ms |
| 4–7 | 480 ms |
| 8–10 | 400 ms |

`k_w` and hook point placement are tuned so this holds **at every point where a room's intended route leaves a field, including fields near the walls**. `checkRooms.js` measures each one.

### 4. Wave grace in free flight
When the front passes the player's height outside any field, wall force for that player stays **off for `waveGrace` (400 ms)**, then **ramps to full over 150 ms**.

400 ms > the 350 ms budget, so even a player cushioned right next to a wall has time to tap. See [Wall wave](wall-wave.md).

### 5. Minimum wave period
`wavePeriod` **never drops below 4 s**, so the walls at any height change at most every 4 s. Room 10 sits at the floor.

### 6. Latency compensation
Taps are timestamped with **`event.timeStamp`**. The launch uses the orbit angle from **`inputLatencyComp` (60 ms) before the tap was processed**. Tune in playtesting; **0 disables it**.

### 7. Launch assist
Launch direction is nudged by up to **`launchAssist` (6°)** toward the nearest hook point field (**never the one being left**) or the exit hook point. **0 disables it**.

### 8. Field edge spacing
Hook point fields **never touch a side wall** — at least `wallMargin` (30) of open space separates any field edge from a wall.

### 9. Obstacle clearance
- Obstacles **never cross an orbit** (`orbitRadius + player radius + 10` units).
- Every obstacle leaves a gap of **at least 3 player diameters** on one side.
- Sliding tracks stay **at least 3 player diameters** from side walls.

## Automated timing check — `tools/checkRooms.js`

Runs every room **headlessly** in Node. For each required hop:

1. Orbit at the room's `minOrbitSpeed`.
2. Try launching at **every 5 ms step** around the orbit.
3. Record which launches succeed.
4. Measure the **longest continuous success window**.

**A room fails if:**
- any hop's window is below that room's `minLaunchWindow`, **or**
- any catch window from rule 3 is too short, **or**
- either passive bot reaches the exit — see [No passive clears](no-passive-clears.md).

> **All 10 rooms must pass before a build goes to itch.io.** This is a hard gate, not advisory.

**Rerun it whenever any sensitive tuning value changes** (`k_w`, `fieldRadius`, `minOrbitSpeed`, `launchImpulse`) — they shift every launch and catch window. See [Tuning parameters](../entities/tuning-parameters.md).

## Rule → system map

| Rule | Binds on |
|---|---|
| 1, 2, 6, 7 | [Latch, orbit & launch](latch-orbit-launch.md) |
| 3 | [Polarity & force model](polarity-force-model.md) — wall pull strength and field placement |
| 4, 5 | [Wall wave](wall-wave.md) |
| 8, 9 | [Rooms & difficulty](../systems/rooms-and-difficulty.md) — room authoring constraints |

## Related risks

Two entries in [Milestones & risks](../systems/milestones-and-risks.md) are mitigated by this system: *"Timing too tight for humans"* and *"Walls turning feels unfair"*.

## Related pages

- [Latch, orbit & launch](latch-orbit-launch.md)
- [Wall wave](wall-wave.md)
- [No passive clears](no-passive-clears.md) — the other half of what `checkRooms.js` verifies
- [Rooms & difficulty](../systems/rooms-and-difficulty.md) — the per-room window values
- [Tuning parameters](../entities/tuning-parameters.md)

---

## Decision Log

### [22-09-26] — Page created
- **Added:** All nine rules verbatim with per-room window tables, the 350 ms budget breakdown, the `checkRooms.js` algorithm and its three failure conditions, rule→system map.
- **Notes:** The source's rule list is reproduced in full and in order because every rule is a hard constraint on other systems. The rule→system map is an added navigation aid.
