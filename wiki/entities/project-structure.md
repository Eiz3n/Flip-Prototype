# Project Structure & Tech Stack

Source: [Flip TDD](../sources/flip-tdd.md).

## Stack decisions

| Layer | Choice | Reason |
|---|---|---|
| Language | JavaScript (ES2020), ES modules | Runs everywhere, no compile step |
| Rendering | Canvas 2D | Enough for flat shapes and trails at 60 fps |
| Audio | Web Audio API | Synthesized blips, zero audio assets |
| Build | Vite | Fast reload, outputs a static bundle |
| Storage | `localStorage` | Best time only |
| Version control | Git + GitHub | Standard |

**No engine.** Visuals are flat shapes and physics is custom, so an engine adds weight without saving work.

## Module layout

```
flip/
  index.html
  src/
    main.js          // boot, resize, start loop
    game.js          // state machine, update/render dispatch
    config.js        // all tuning values
    input.js         // tap / click / key -> timestamped flip event
    physics.js       // magnetic forces, integration, latch/launch
    wave.js          // wall polarity wave, local polarity lookup
    room.js          // room entity, exit, hook point setup
    rooms.js         // the 10 room definitions (data only)
    entities.js      // Player, HookPoint, Obstacle classes
    collision.js     // circle vs wall, exit detection
    camera.js        // pan between rooms, shake
    render.js        // flat drawing, wave bands, particles
    audio.js         // synth sounds
  tools/
    checkRooms.js    // headless timing check for all 10 rooms (Node)
```

## Module contracts

| Module | Owns | Must not |
|---|---|---|
| `main.js` | rAF loop, canvas sizing, DPR cap, `visibilitychange` pause | Contain gameplay logic |
| `game.js` | State machine, run timer, death counter, update/render dispatch | Compute forces directly |
| `config.js` | Every tuning number | Contain any logic |
| `input.js` | Queueing timestamped flip events (`event.timeStamp`) | Apply flips itself — events are consumed at the next physics step |
| `physics.js` | Force integration, latch/launch, orbit state | Draw anything |
| `wave.js` | `polarityAt(s, t)` lookup and front position | Know about the player |
| `room.js` | Runtime room instance from data, hook point setup | Hold room content |
| `rooms.js` | The 10 room definitions, **data only** | Contain functions |
| `entities.js` | `Player`, `HookPoint`, `Obstacle` classes — see [Entity schemas](entity-schemas.md) | Hold tuning constants |
| `collision.js` | Circle-vs-wall, circle-vs-rect, exit latch detection | Resolve game state |
| `camera.js` | Room pan easing, screen shake | Touch physics |
| `render.js` | All drawing, wave bands, particle pool | Mutate game state |
| `audio.js` | Web Audio synthesis | Block on first frame — unlocks on first tap |
| `tools/checkRooms.js` | Headless per-room timing + passive-bot verification (Node) | Ship in the bundle |

## Hard rules

- **All gameplay numbers live in `config.js`** so tuning never touches logic code. See [Tuning parameters](tuning-parameters.md).
- **`rooms.js` is plain data** — one object per room, no functions. See [Rooms & difficulty](../systems/rooms-and-difficulty.md).
- **No per-frame object allocation** in the update loop; reuse vector objects to avoid GC stutter.
- **Particles come from a fixed pool of 200**, never allocated during play.
- **No external requests, fonts or CDNs** — everything ships in the bundle.

## Coordinate system

All positions are in **logical units** on a 360 × 640 room, scaled to the canvas at render time. Canvas renders at device pixel ratio capped at 2.

## Related pages

- [Entity schemas](entity-schemas.md) — the four classes `entities.js` exports
- [Tuning parameters](tuning-parameters.md) — the contents of `config.js`
- [Game loop & state machine](../systems/game-loop-state-machine.md) — what `main.js` and `game.js` run
- [Build & deployment](../systems/build-and-deployment.md) — how this tree becomes an itch.io upload

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Stack table, module tree, per-module contract table, hard rules, coordinate system.
- **Notes:** Generated from the Flip TDD "Tech stack & project structure" and "Performance rules" sections. Module contract table is an implementation-weighted expansion of the source's inline comments — the "Must not" column is inferred from the source's separation-of-concerns rules, not quoted verbatim.
