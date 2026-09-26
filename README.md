# Flip — Prototype

**▶ Play it: [flip-playtest.vercel.app](https://flip-playtest.vercel.app)** (best on a phone, portrait)

A one-button browser game: tap to flip your polarity, swinging between floating hook points to climb through rooms whose walls change charge in a visible wave.

Built as a design test.

**Status:** a small set of playable rooms, start to finish (title → rooms → win). Tested on a real phone.

## The game

Get launched up through the floor hatch. Tap to become the **opposite** colour of the next hook point to latch onto it, tap to **match** its colour to push off it, and keep your colour matched to the walls so they cushion you instead of pulling you in. Steer around obstacles and fly up through the doorway in the top wall to reach the next room.

Touching a wall restarts the room. Touching an obstacle only kills your momentum. If you are stuck against something for 3 s, that also counts as a death. Score is total time to clear all rooms. Lower is better, and your best time is saved.

## Play it locally

```bash
cd game
npm install
npm run dev      # play at the printed localhost URL
npm test         # 121 tests: sim, bots, game, view, art
npm run build    # static dist/ (~54 KB)
```

Dev-only URL flags (never in a build): `?pose=title|room1|room2|win` freezes the scene to match an artboard on the art canvas, and `?cb=protan|deutan|tritan` applies a colour-blindness filter.

## Stack

| | |
|---|---|
| Language | JavaScript (ES2020), ES modules |
| Rendering | Canvas 2D, no engine, DPR capped at 2 |
| Build | Vite → static `dist/`, `base: './'` |
| Hosting | Vercel |
| Tests | Vitest, headless |
| Storage | `localStorage`, best time only |
| Resolution | 360 × 640 logical, portrait, kept inside the phone's safe area |
| Font | Baloo 2 subset, self-hosted, no network requests |
| Targets | 60 fps on a mid-range phone, < 200 KB |

## Code layout

All game code lives in [`game/`](game/). [`game/README.md`](game/README.md) is the full map, including how to add a room.

```
game/src/
  config.js        Every gameplay number
  theme.js         Every colour, font, size and effect timing (synced from the art canvas)
  levels/          One file per room; index.js sets the order; validate.js checks them
  sim/             Pure simulation: no DOM, no clock, no allocation in step()
  game.js          State machine, timer, deaths, best time
  view/art/        One module per drawable
  view/anim/       Turns game events into animations
  view/debug/      ?pose and ?cb dev tools
game/test/         Sim, physics, latch, collision, bots, game, render, art tests
```

The main rules: `sim/` stays pure so it can be tested and run by bots with no browser. Numbers go in `config.js` and styling in `theme.js`, never inline. Each room's values live only in its own level file.

## Where the spec lives

| Document | What it covers |
|---|---|
| [`Reference Files/Flip-TDD.md`](Reference%20Files/Flip-TDD.md) | Full technical design. The source of truth for behaviour and every number |
| [Flip Art canvas](https://claude.ai/artifact/51tn6oK5ZfHmTbD2dnK5fw) ([offline export](Reference%20Files/Flip%20Art.html)) | The source of truth for looks. Wins over the TDD on colour, font and size |
| [Design spec](Working%20Files/2026-09-23-flip-v1-design.md) | Rooms, deviations from the TDD and their reasons |
| [Dev plan](Working%20Files/2026-09-23-flip-v1-dev-plan.md) | 13 test-first tasks, and which files the code owns and which the art owns |
| [Art plan](Working%20Files/2026-09-25-flip-v1-art-plan.md) | 9 test-first tasks: font, canvas tokens, sprites, HUD, screens, animations, poses |

## Progress

| Milestone | Status |
|---|---|
| Loop, input, wall pull and cushion, updraft | ✅ |
| Hook point fields, latch, orbit, launch, latency compensation | ✅ |
| Wall wave, front line, free-flight grace, obstacles | ✅ |
| Entry hatch and exit doorway, camera pan, restart, win screen, run timer | ✅ |
| Art pass and feedback effects | ✅ |
| Real-phone touch test | ✅ Samsung Galaxy S22+: flips feel instant, timing good at `inputLatencyComp` 0.06 |
| Playtest build on Vercel | ✅ |

## Release gate

`npm test` must pass before anything ships: the room validator plus the idle, drift and repel bots. None of the bots may clear a room.

## Branches

| Branch | Role |
|---|---|
| `Dev` | Default. App-building work goes here. |
| `main` | Reviewed and merged state. |
| `gps-wiki-setup` | Merged; kept as history. |

PRs target `Dev` by default. Pass `--base main` explicitly for anything meant to land on `main`.
