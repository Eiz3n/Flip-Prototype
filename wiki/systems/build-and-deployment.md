# Performance, Build & Deployment

Source: [Flip TDD](../sources/flip-tdd.md).

## Targets

| Target | Value |
|---|---|
| Frame rate | Steady **60 fps** on a mid-range phone browser |
| Download size | **Under 200 KB** |
| Logical resolution | 360 × 640 portrait, letterboxed on desktop |

**Scale is tiny** — 1 player, at most 12 hook points across two rooms — so **the budget is spent on draw calls, not physics**.

## Performance rules

- **Physics is O(hook points) per step; no spatial partitioning needed.**
- **Particles come from a fixed pool of 200**, never allocated during play.
- **Flat fills and strokes only** (no gradients, blur or shadows), which also keeps mobile draw cost low. See [Rendering, feedback & audio](rendering-feedback-audio.md).
- **No per-frame object allocation in the update loop** — reuse vector objects to avoid garbage-collection stutter.
- **Pause the loop on `visibilitychange`** so switching tabs doesn't cause a physics jump. See [Game loop & state machine](game-loop-state-machine.md).

> The loop's `Math.min(dt, 0.25)` clamp is the second half of the tab-switch defence — the pause prevents the gap, the clamp survives it.

**Memory:** only the current and next room are held; the room after next streams in from `rooms.js` in the background. See [Room transitions](../concepts/room-transitions.md).

## Build

- **`npm run build`** (Vite) outputs **`dist/`** with `index.html` at the root and **relative asset paths (`base: './'`)**.
- **No external requests, fonts or CDNs** — everything ships in the bundle.

The relative-base setting is not optional: itch.io serves the game from a nested path, so absolute asset paths break it.

## itch.io setup

1. **Zip the *contents* of `dist/`** (not the folder itself) so **`index.html` is at the zip root**.
2. Create a project with **Kind of project = HTML**, upload the zip, and tick **"This file will be played in the browser"**.
3. **Viewport: 360 × 640 embed**, with **"Mobile friendly" enabled** and **fullscreen button on**.
4. **Test in the itch.io preview** on **desktop Chrome, desktop Firefox, iOS Safari and Android Chrome** before publishing.
5. **Keep the page restricted or draft** until submission if the company wants a private link.

## Release gate

A build does not ship until **`tools/checkRooms.js` passes on all 10 rooms** — every launch window, every catch window, and both passive bots failing. See [Human timing rules](../concepts/human-timing-rules.md) and [No passive clears](../concepts/no-passive-clears.md).

`tools/` is a Node-side directory and **does not ship in the bundle** — see [Project structure](../entities/project-structure.md).

## Storage

`localStorage`, **best time only**. Nothing else persists.

## Related pages

- [Project structure](../entities/project-structure.md) — stack choices and module tree
- [Game loop & state machine](game-loop-state-machine.md) — the loop and its clamp
- [Rendering, feedback & audio](rendering-feedback-audio.md) — draw-call rules and DPR cap
- [Human timing rules](../concepts/human-timing-rules.md) — the release gate
- [Milestones & risks](milestones-and-risks.md) — day 8 is the itch.io build and device test

---

## Decision Log

### [22-09-26] — Page created
- **Added:** Performance targets, the five performance rules, Vite build settings, the five-step itch.io procedure, the release gate, storage scope.
- **Notes:** itch.io steps and performance rules quoted from the source. The note on why `base: './'` is mandatory, and the pairing of `visibilitychange` pause with the loop's 0.25 s clamp, are implementation inferences from two source facts stated in separate sections — flagged here rather than presented as source claims.
