# Entity Schemas

Four entity types, all defined in `src/entities.js` except `Room` (see `room.js` / `rooms.js`). All positions in logical units on a 360 × 640 room. Source: [Flip TDD](../sources/flip-tdd.md).

## Player

The only fully simulated body. Hook points and obstacles are kinematic and are never pushed by the player.

```js
class Player {
  pos = {x, y};  vel = {x, y};
  radius = 8;
  pol = +1;               // +1 blue, -1 red
  latched = null;         // HookPoint or null
  theta = 0; omega = 0;   // orbit state while latched; omega bleeds off
  bufferedTap = false;    // tap made inside the launching field
  graceTimer = 0;         // free-flight wave grace countdown
  alive = true;
}
```

| Field | Purpose | Referenced by |
|---|---|---|
| `pol` | The one value the player controls | [Polarity & force model](../concepts/polarity-force-model.md) |
| `latched` | Non-null switches the player from force integration to orbit kinematics | [Latch, orbit & launch](../concepts/latch-orbit-launch.md) |
| `theta`, `omega` | Orbit angle and angular speed; `omega` decays toward the room's `minOrbitSpeed` | [Latch, orbit & launch](../concepts/latch-orbit-launch.md) |
| `bufferedTap` | A tap made inside the launching field is held and applied on field exit, so an early tap never pulls the player back | [Collision & input](../concepts/collision-and-input.md) |
| `graceTimer` | Counts down `waveGrace` after the wave front crosses the player in free flight; wall force is off while it runs | [Wall wave](../concepts/wall-wave.md) |

## HookPoint

```js
class HookPoint {
  kind;                   // 'normal' | 'entry' | 'exit'
  home = {x, y};          // fixed anchor point
  pos = {x, y};           // home + bob offset, recomputed each step
  radius = 14;            // always a circle
  fieldRadius = 70;       // 50 for entry/exit hook points
  pol;                    // fixed from room data; exit attracts any color
  bob = { ampX, ampY, freq, phase };  // idle motion
  cooldown = 0;           // seconds before re-latch allowed
}
```

**Bob motion**, recomputed every step:

```
pos = home + ( ampX·sin(2π·freq·t + phase),
               ampY·sin(4π·freq·t + phase) )
```

The doubled Y frequency traces a small figure-eight — readable, predictable, never still. The orbit follows the bob, so a latched player moves with the hook point.

**Kind semantics**

| `kind` | Polarity | Field radius | Behaviour |
|---|---|---|---|
| `normal` | Fixed from room data, never changes | 70 | Standard latch/launch |
| `entry` | Set at room start to match the walls at entry height, then flips to launch | 50 | The only hook point that ever flips |
| `exit` | Attracts the player **whatever** the player's color | 50 | Latching clears the room |

## Obstacle

No polarity, no field — magnetic forces pass straight through.

```js
class Obstacle {
  shape;                  // 'square' | 'bar' (never round)
  pos = {x, y};           // center
  w; h;                   // size
  track = null;           // { dx, dy, period } for sliding obstacles
}
```

- **Never circles** — so they can't be mistaken for hook points.
- Static in rooms 2–7. In rooms 8–10 some slide at **at most 30 units/s** along a short fixed track.
- On contact: push the player out of the overlap, remove velocity into the obstacle, cut sliding speed along the edge by `obstacleFriction` (0.85). No bounce, no death.
- **Exception:** a sliding obstacle that pushes the player into a side wall kills, even a cushioned player — the obstacle overpowers the cushion.

## Room

```js
class Room {
  index;                  // 1-10
  originY;                // world Y of this room's bottom edge
  wave = { enabled, period, startPol, time };
  minOrbitSpeed;          // orbit speed floor for this room
  minLaunchWindow; minCatchWindow;
  entry;                  // HookPoint, x = previous room's exit x
  exit;                   // HookPoint near the top, off the center line
  hookPoints = [];
  obstacles = [];
}
```

### Room data shape (`rooms.js`, plain data)

```js
{ index: 4, wave: { enabled: true, period: 7, startPol: +1 },
  minOrbitSpeed: 3.0, minLaunchWindow: 0.22, minCatchWindow: 0.48,
  entry: { x: 265, y: 590 },   // matches room 3's exit x
  exit:  { x: 95,  y: 80 },
  hookPoints: [ { x: 180, y: 470, pol: -1, ampX: 6, ampY: 4, freq: 0.4 },
                { x: 110, y: 320, pol: +1, ampX: 6, ampY: 4, freq: 0.4 },
                { x: 250, y: 200, pol: -1, ampX: 6, ampY: 4, freq: 0.4 } ],
  obstacles:  [ { shape: 'bar', x: 180, y: 250, w: 80, h: 14 } ] }
```

**Invariant:** room *n*'s `exit.x` **is** room *n+1*'s `entry.x`. The exit hook point object becomes the next room's entry hook point.

## World layout

Rooms stack vertically. Room *n*'s exit sits near its top; room *n+1*'s entry is that same hook point at the same x, near the bottom of room *n+1*. **Only the current and next room are kept in memory.**

## Related pages

- [Project structure](project-structure.md) — which module owns each class
- [Tuning parameters](tuning-parameters.md) — the constants these defaults come from
- [Polarity & force model](../concepts/polarity-force-model.md) — how `pol` is consumed
- [Room transitions](../concepts/room-transitions.md) — the exit→entry handoff
- [Rooms & difficulty](../systems/rooms-and-difficulty.md) — per-room values for the `Room` fields

---

## Decision Log

### [22-09-26] — Page created
- **Added:** All four class schemas verbatim from the TDD, bob formula, kind-semantics table, room data example, world layout invariant.
- **Notes:** Class bodies are quoted exactly as the source writes them. The `kind` semantics table and the per-field purpose table are restructured from prose elsewhere in the TDD for implementation lookup.
