# Rendering, Feedback & Audio

Owned by `src/render.js` and `src/audio.js`. Source: [Flip TDD](../sources/flip-tdd.md).

## Visual language — the hard rule

**Flat pastel shapes on a light background: solid fills and solid strokes only. No gradients, glows, blur or shadows.**

This is both an art direction and a performance rule — flat fills keep mobile draw cost low. See [Build & deployment](build-and-deployment.md).

**Blue means positive and red means negative everywhere.** Every polarity-colored shape **also carries a `+` or `−` mark** in ink, so the game stays readable for color-blind players and pastel colors never rely on contrast alone.

## Palette

| Role | Color | Hex |
|---|---|---|
| Positive (+) | Pastel blue | `#9CC7F2` |
| Negative (−) | Pastel red | `#F4A3A3` |
| Background | Warm off-white | `#F7F3EC` |
| Ink (outlines, marks, text) | Soft charcoal | `#3B3A45` |
| Neutral (obstacles, UI panels) | Pastel grey | `#D9D6E0` |

## Per-entity draw spec

| Entity | Drawing |
|---|---|
| **Walls** | Thick solid bands in the local wall polarity color. The wave front is a **hard edge** between a blue band and a red band — **never a blend**. |
| **Hook points** | Always circles, in their polarity color, 2-unit ink outline, `+` or `−` mark. |
| **Entry / exit hook points** | Larger circles with a **double ink ring**. The exit is drawn **half blue and half red** (it attracts either color) and its **outer ring slowly rotates** so it reads as the way out. |
| **Obstacles** | Square blocks and bars in pastel grey, ink outline, **no mark, never round** — so they can't be confused with hook points. A sliding obstacle's track is a **faint dotted ink line**. |
| **Player** | A smaller solid circle in its polarity color, ink outline and mark. Motion trail is **a few fading solid dots** (opacity steps, **not a gradient**). |
| **Updraft** | A few faint ink dashes drifting slowly upward in open space, so players can see the air is moving. |

## Logo

The word **"Flip"** with the capital **F upside down**, in ink on the off-white background. The title screen **flips the F right side up and back on each tap**, matching the core mechanic.

## Readability aids

These exist to make the timing rules legible — each one is paired with a constraint in [Human timing rules](../concepts/human-timing-rules.md).

| Aid | Spec | Makes legible |
|---|---|---|
| **Wave front line** | Thin ink line across the full room at the front's height | When the wave will reach the player's own height — [Wall wave](../concepts/wall-wave.md) |
| **Field rings** | Solid ink ring at `fieldRadius` around each hook point. Thin and low-opacity normally, **thicker while the player is inside it** | Whether the walls can reach the player — the force precedence rule in [Polarity & force model](../concepts/polarity-force-model.md) |
| **Tether** | Thin ink line from player to hook point while latched | Current latch — [Latch, orbit & launch](../concepts/latch-orbit-launch.md) |
| **Launch preview** | Dotted line from the player showing where a tap right now would send it. **Rooms 1–2 only** | Launch aiming, during teaching |

## Feedback table

| Event | Visual | Audio (Web Audio synth) |
|---|---|---|
| Player flip | Instant color swap, one ring pop | Short blip, pitch by polarity |
| Latch | Hook point scales up 10% for one beat | Soft click |
| Launch | A few solid dots puff opposite the direction of travel | Short whoosh (filtered noise) |
| Entry launch | Entry hook point swaps color, small shake | Low thump |
| Obstacle hit | Obstacle flashes its ink outline | Dull tap |
| Near miss (within 6 units of a wall while pulled) | 80 ms slow-mo | Rising chime |
| Room cleared | Room number pops | Ascending two-note chime |
| Death | Player breaks into solid dots, shake, slow-mo | Descending buzz |

**Screen shake:** 3 units for 0.1 s on each entry launch; 10 units for 0.3 s on death.

## Audio implementation

- **Web Audio API synthesis only — no audio assets ship.**
- **The first tap unlocks Web Audio** (browser autoplay policy). See [Collision & input](../concepts/collision-and-input.md).
- The game must be responsive **with sound on and off** (day 7 milestone acceptance).

## Render-side performance rules

- **Flat fills and strokes only** (no gradients, blur or shadows).
- **Particles come from a fixed pool of 200**, never allocated during play.
- **The canvas renders at device pixel ratio, capped at 2**, for crisp edges on phones.
- Rendering happens **once per frame** and interpolates between physics states — see [Game loop & state machine](game-loop-state-machine.md).

## Accessibility

Two mechanisms, both mandatory:

1. **`+` / `−` ink marks on every polarity-colored shape** — polarity is never color-only.
2. **Test with a color-blind simulator** — listed as the mitigation for the "pastel colors hard to tell apart" risk in [Milestones & risks](milestones-and-risks.md).

## Related pages

- [Game loop & state machine](game-loop-state-machine.md) — interpolated render, slow-mo
- [Wall wave](../concepts/wall-wave.md) — band rendering and the front line
- [Human timing rules](../concepts/human-timing-rules.md) — what the readability aids serve
- [Entity schemas](../entities/entity-schemas.md) — radii and shapes being drawn
- [Build & deployment](build-and-deployment.md) — draw-call budget

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Flat-shape rule, palette table, per-entity draw spec, logo, readability aids with what each makes legible, full feedback table, audio implementation notes, render performance rules, accessibility.
- **Notes:** Palette and feedback tables quoted exactly. The "makes legible" column on readability aids is an added mapping to the timing rules each aid serves — the pairing is implied by the source, not stated as a table.
