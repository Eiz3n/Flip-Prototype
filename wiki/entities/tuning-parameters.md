# Tuning Parameters (`config.js`)

Every gameplay number lives here so tuning never touches logic code. Distances in logical units (room is 360 × 640), times in seconds. These are **starting values**, meant to change during playtesting. Source: [Flip TDD](../sources/flip-tdd.md).

## Full table

| Parameter | Start value | Controls |
|---|---|---|
| `k` (hook point force) | 2 000 000 | How hard hook points pull and push inside their field |
| `k_w` (wall pull) | 400 000 | How hard walls pull a player of the opposite color |
| `wallDamping` (c_w) | 6 per second | How fast the cushion removes speed toward the nearer wall |
| `centerPush` (k_c) | 80 units/s² | Gentle push back to the center while cushioned |
| `safeGap` | 12 | Closest a cushioned player can get to a side wall |
| `d_min` | 24 | Force cap at close range |
| `fieldRadius` | 70 | Size of a normal hook point's field |
| `exitFieldRadius` | 50 | Size of entry and exit hook point fields |
| `latchRadius` | 30 | Distance at which the player latches |
| `orbitRadius` | 30 | Orbit size while latched |
| `minOrbitSpeed` | 2.8 → 4.0 rad/s | Orbit speed floor (per room) |
| `maxOrbitSpeed` | 6.0 rad/s | Orbit speed cap on arrival |
| `orbitDrag` | 0.8 per second | How fast orbit speed bleeds toward the floor |
| `launchImpulse` | 180 units/s | Extra radial push on launch |
| `entryLaunchSpeed` | 240 units/s | Upward launch from the entry hook point |
| `relatchCooldown` | 0.25 | Time before re-latching the same hook point |
| `riseSpeed` | 60 units/s | Updraft speed outside fields |
| `updraftGain` | 3 per second | How fast the updraft restores rising speed |
| `drag` | 0.25 per second | Decays launch speed back toward `riseSpeed` |
| `maxSpeed` | 480 units/s | Overall speed cap |
| `obstacleFriction` | 0.85 | Share of sliding speed lost on obstacle contact |
| `centerLineClearance` | 20 | Minimum gap between the exit field and the center line |
| `maxReach` | 220 | Hook point spacing limit when building rooms |
| `wallMargin` | 30 | Minimum gap between a field edge and a side wall |
| `wavePeriod` | 9.0 → 4.0 | Time for the wave front to cross the room (per room) |
| `waveGrace` | 0.40 | Wall force delay after the front passes the player |
| `minLaunchWindow` | 0.30 → 0.16 | Shortest allowed launch window (per room) |
| `minCatchWindow` | 0.60 → 0.40 | Shortest time from field exit to wall contact (per room) |
| `inputLatencyComp` | 0.06 | Orbit-angle rewind to offset touch latency |
| `launchAssist` | 6° | Maximum launch-direction nudge |
| player `radius` | 8 | Hitbox size |
| hook point `radius` | 14 | Visual size |

## Tune these first

The four most sensitive values:

1. `k_w` — wall pull
2. `fieldRadius`
3. `minOrbitSpeed`
4. `launchImpulse`

Together they decide whether launching feels **snappy or floaty** and how much time the catch tap gets. **Tune them in Room 1 before building the other rooms.**

> **Rerun `tools/checkRooms.js` whenever any of them change** — they shift every launch and catch window. See [Human timing rules](../concepts/human-timing-rules.md).

## Per-room parameters

Five values are overridden per room rather than held global — they are the difficulty curve. See [Rooms & difficulty](../systems/rooms-and-difficulty.md) for the full 10-room table.

| Parameter | Room 1 | Room 10 |
|---|---|---|
| `wavePeriod` | 9.0 s | 4.0 s |
| `minOrbitSpeed` | 2.8 rad/s | 4.0 rad/s |
| `minLaunchWindow` | 300 ms | 160 ms |
| `minCatchWindow` | 600 ms | 400 ms |
| bob amplitude | 0 | 16 |

**Floor:** `wavePeriod` never drops below 4 s (Human timing rule 5).

## Parameters that disable cleanly

| Parameter | Disabled at | Effect |
|---|---|---|
| `inputLatencyComp` | `0` | No orbit-angle rewind; taps use the live angle |
| `launchAssist` | `0` | No launch-direction nudge; pure player aim |

Both are explicitly marked as playtest-tunable in the source, with 0 as a valid setting.

## Grouped by system

| System | Parameters |
|---|---|
| [Hook point fields](../concepts/polarity-force-model.md) | `k`, `d_min`, `fieldRadius`, `exitFieldRadius` |
| [Wall forces](../concepts/polarity-force-model.md) | `k_w`, `wallDamping`, `centerPush`, `safeGap` |
| [Updraft](../concepts/polarity-force-model.md) | `riseSpeed`, `updraftGain`, `drag` |
| [Latch / orbit / launch](../concepts/latch-orbit-launch.md) | `latchRadius`, `orbitRadius`, `minOrbitSpeed`, `maxOrbitSpeed`, `orbitDrag`, `launchImpulse`, `entryLaunchSpeed`, `relatchCooldown`, `maxSpeed` |
| [Wall wave](../concepts/wall-wave.md) | `wavePeriod`, `waveGrace` |
| [Human timing](../concepts/human-timing-rules.md) | `minLaunchWindow`, `minCatchWindow`, `inputLatencyComp`, `launchAssist` |
| [Obstacles](entity-schemas.md) | `obstacleFriction` |
| [Room authoring](../concepts/no-passive-clears.md) | `centerLineClearance`, `maxReach`, `wallMargin` |

## Related pages

- [Project structure](project-structure.md) — `config.js` holds no logic
- [Entity schemas](entity-schemas.md) — the defaults baked into class fields
- [Human timing rules](../concepts/human-timing-rules.md) — which parameters are constraints rather than taste

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Full 32-row parameter table verbatim, sensitivity ranking, per-room override summary, disable-cleanly table, grouping by owning system.
- **Notes:** Values quoted exactly from the TDD "Tuning parameters" section. The grouped-by-system table is an added navigation aid, not source content.
