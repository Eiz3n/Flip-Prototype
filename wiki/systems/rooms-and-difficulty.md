# Rooms & Difficulty

10 hand-made rooms, stored as **data** in `src/rooms.js`. Each room introduces or combines one idea. **Difficulty rises through tuning, never through new rules.** Source: [Flip TDD](../sources/flip-tdd.md).

## Layout vocabulary

| Layout | Arrangement | What it tests |
|---|---|---|
| **Ladder** | Hook points zigzagging upward | Basic launch and catch rhythm |
| **Leap** | 2 hook points with a wide vertical gap | Precise launch timing |
| **Sidestep** | Hook points near alternating side walls | Launching away from walls |
| **Cluster** | 4–5 hook points packed in the middle | Choosing which hook point to catch |

## The 10-room plan

| Room | Layout | Teaches | Hook points | Obstacles | Wave period | Min orbit speed | Bob amplitude | Min launch window |
|---|---|---|---|---|---|---|---|---|
| 1 | Single | Wave walls and hook points | 1 | 0 | 9.0 s | 2.8 rad/s | 0 | 300 ms |
| 2 | Ladder | Obstacles | 2 | 1 | 8.5 s | 2.8 rad/s | 4 | 300 ms |
| 3 | Ladder | Hook points of both colors | 2 | 1 | 8.0 s | 2.8 rad/s | 4 | 300 ms |
| 4 | Ladder | Longer climb, aiming around obstacles | 3 | 1 | 7.0 s | 3.0 rad/s | 6 | 220 ms |
| 5 | Sidestep | Launching away from walls | 3 | 1 | 6.5 s | 3.2 rad/s | 8 | 220 ms |
| 6 | Leap | One long launch past obstacles | 2 | 2 | 6.0 s | 3.2 rad/s | 8 | 220 ms |
| 7 | Cluster | Picking the right hook point | 5 | 2 | 5.5 s | 3.4 rad/s | 10 | 220 ms |
| 8 | Sidestep | First sliding obstacle, bigger bob | 4 | 3 | 5.0 s | 3.6 rad/s | 14 | 160 ms |
| 9 | Leap + Ladder | Long launch into a climb | 4 | 3 | 4.5 s | 3.8 rad/s | 14 | 160 ms |
| 10 | Mixed finale | Everything combined | 5 | 4 | 4.0 s | 4.0 rad/s | 16 | 160 ms |

**Reading the table**

- Hook point counts **exclude** the entry and exit hook points.
- Wave periods never drop below 4 s (Human timing rule 5) — room 10 sits at the floor.
- Bob amplitude is in logical units; room 1 has **no bob at all**.
- `minCatchWindow` tracks the same bands: 600 ms (rooms 1–3), 480 ms (4–7), 400 ms (8–10).

## Teaching order

Each room adds exactly one thing:

1. **Room 1** — the wave and hook points together, at the slowest settings and a static hook point
2. **Room 2** — obstacles
3. **Room 3** — hook points of *both* colors (the color rule proper)
4. **Rooms 4–7** — tighter windows, more hook points, aiming and selection
5. **Room 8** — the first *sliding* obstacle
6. **Rooms 9–10** — combination

Obstacles are static in rooms 2–7; in rooms 8–10 some slide at **at most 30 units/s** along a short fixed track.

## Exit placement constraint

Exit hook points sit at **x 80–110 or 250–280**, so their fields stay clear of both the center line and the side walls, and **always on the opposite side from the room's entry hook point**. See [No passive clears](../concepts/no-passive-clears.md).

## Building a room — the procedure

1. **Sketch the intended route:** which hook points the player uses, in what order, their colors, where the wave turns the walls, and which launches the obstacles block.
2. **Place hook points and obstacles in `rooms.js`**, following [Human timing](../concepts/human-timing-rules.md) rules 8–9, keeping hops shorter than `maxReach` (220), and placing the exit hook point in its allowed x range.
3. **Run `tools/checkRooms.js`.** Adjust spacing, colors, orbit speed, bob or obstacle positions until every hop meets the room's windows **and both passive bots fail**.
4. **Playtest by hand.** A room is done when a first-time player clears it within **5 attempts (rooms 1–5)** or **10 attempts (rooms 6–10)**.

> Step 3 is a hard gate: all 10 rooms must pass before a build goes to itch.io.

The full authoring checklist lives in [No passive clears](../concepts/no-passive-clears.md).

## Room data format

See [Entity schemas](../entities/entity-schemas.md) for the `Room` class and the `rooms.js` object shape. The key invariant: **room *n*'s `exit.x` is room *n+1*'s `entry.x`**.

## Related pages

- [Entity schemas](../entities/entity-schemas.md) — `Room` and the `rooms.js` data shape
- [Human timing rules](../concepts/human-timing-rules.md) — per-room windows and `checkRooms.js`
- [No passive clears](../concepts/no-passive-clears.md) — authoring constraints and passive bots
- [Room transitions](../concepts/room-transitions.md) — how rooms connect and alternate sides
- [Wall wave](../concepts/wall-wave.md) — per-room periods
- [Tuning parameters](../entities/tuning-parameters.md) — which values are per-room
- [Milestones & risks](milestones-and-risks.md) — rooms 4–10 land on day 6

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Layout vocabulary, full 10-room plan table verbatim, teaching order, exit placement constraint, the four-step build procedure, table-reading notes.
- **Notes:** Room plan table quoted exactly. The "teaching order" list and the `minCatchWindow` band note are compiled from the Teaches column and the Human timing section respectively — both restate source facts rather than adding new ones.
