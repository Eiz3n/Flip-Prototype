# Wall Wave

Wall polarity changes as a **continuous wave, not a sudden flip**. Owned by `src/wave.js`. Source: [Flip TDD](../sources/flip-tdd.md).

## Behaviour

A horizontal front travels from the **top** of the room to the **bottom** over `wavePeriod` seconds.

- Walls **above** the front show the new polarity.
- Walls **below** still show the old one.
- When the front leaves the bottom, the next front starts at the top with the **opposite** polarity.

**The walls therefore always show exactly two bands.**

## The lookup

For a point at distance `s` below the top of a room of height `H`, with starting polarity `p₀` and `T` = `wavePeriod`:

```latex
n(s,t) = \left\lfloor \frac{t}{T} - \frac{s}{H} \right\rfloor + 1, \qquad p(s,t) = p_{0} \cdot (-1)^{\,n(s,t)}
```

This is the whole module — a pure function of height and time. `wave.js` exposes it as a local polarity lookup and a front position for rendering.

**The wave only changes the walls. Hook points keep their color.**

## Why every room has one

Room 1 introduces the wave together with hook points, using the slowest period (9.0 s), so that **a player who never taps is always eventually pulled into a wall.** This is load-bearing for [No passive clears](no-passive-clears.md) — it is why an idle player cannot survive indefinitely.

## Wave grace — rule 4 of [Human timing](human-timing-rules.md)

When the front passes the player's height **outside any field**, the walls flip relative to the player: a cushioned player suddenly becomes opposite the walls and gets pulled toward one.

To keep that fair:

```
front crosses player height (free flight)
  → wall force for that player OFF for waveGrace (400 ms)
  → then ramps to full over 150 ms
```

400 ms is **longer than the 350 ms human reaction budget**, so even a player cushioned right next to a wall has time to tap.

Tracked per-player by `Player.graceTimer` — see [Entity schemas](../entities/entity-schemas.md).

> The grace applies **only in free flight**. Inside a hook point field the walls don't act at all, so there is nothing to grace — see the force precedence rule in [Polarity & force model](polarity-force-model.md).

## Timing floor

**`wavePeriod` never drops below 4 s** (Human timing rule 5), so the walls at any height change at most every 4 seconds. Room 10 sits exactly at this floor.

| Room | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| `wavePeriod` | 9.0 | 8.5 | 8.0 | 7.0 | 6.5 | 6.0 | 5.5 | 5.0 | 4.5 | 4.0 |

## Wave state and resets

- **On death:** the wall wave resets to its **starting phase**, along with player and hook point positions, so **every attempt is identical**.
- **During Transition:** the wave is **paused**, so a new room never changes before the player can read it. It starts on the entry launch. See [Room transitions](room-transitions.md).
- `Room.wave` holds `{ enabled, period, startPol, time }` — see [Entity schemas](../entities/entity-schemas.md).

## Rendering

- Walls are **thick solid bands** in the local wall polarity color.
- The front is a **hard edge** between a blue band and a red band — **never a blend**.
- A thin ink **wave front line** crosses the full room at the front's height, so the player can see when it will reach its own height.

See [Rendering, feedback & audio](../systems/rendering-feedback-audio.md).

## Related pages

- [Polarity & force model](polarity-force-model.md) — what "opposite the walls" does to the player
- [Human timing rules](human-timing-rules.md) — rules 4 and 5 constrain this system
- [No passive clears](no-passive-clears.md) — the wave is why idling fails
- [Room transitions](room-transitions.md) — wave pause and entry-color matching
- [Rooms & difficulty](../systems/rooms-and-difficulty.md) — per-room periods
- [Tuning parameters](../entities/tuning-parameters.md) — `wavePeriod`, `waveGrace`

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Two-band behaviour, polarity lookup formula verbatim, wave grace with the 400 ms / 150 ms ramp, period floor and per-room table, reset and pause rules, render spec.
- **Notes:** The note that grace applies only in free flight is drawn together from the source's force-precedence rule and its rule-4 wording; the source states both but not adjacently.
