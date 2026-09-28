# Flip — Prototype

**▶ Play it: [flip-playtest.vercel.app](https://flip-playtest.vercel.app)** (best on a phone, portrait)

**Controls:** click, tap or press Space to flip. That's the only input in play. On the stage select screen, tap the stage name (or press the arrow keys) to change stage, and tap Start (or press Space).

A one-button browser game: tap to flip your polarity, swinging between floating hook points to climb through rooms whose walls change charge in a visible wave.

Built as a design test.

**Status:** a small set of playable rooms, start to finish (title → rooms → win). Tested on a real phone.

## The game

Get launched up through the floor hatch. Tap to become the **opposite** colour of the next hook point to latch onto it, tap to **match** its colour to push off it, and keep your colour matched to the walls so they cushion you instead of pulling you in. Steer around obstacles and fly up through the doorway in the top wall to reach the next room.

Touching a wall restarts the room. Touching an obstacle only kills your momentum. If you are stuck against something for 3 s, that also counts as a death. Rooms come in three stages (1–2, 3–4, then 5). Each stage ends on a clear screen with up to 3 stars: a faster stage time earns more, and any death in the stage costs one star (a clear always earns at least one). Timers are per stage: each stage's best time and best stars are saved, and the title shows the stars collected. Pick any stage on the select screen; play carries on into the next stage after each clear.

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
| Storage | `localStorage`, per-stage best time and stars |
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
  game.js          State machine: title, stage select, stages, timers, deaths
  stars.js         Stage star rating
  progress.js      Per-stage best time and stars, saved to localStorage
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
| Rooms 3–5, stage clear screens with star rating | ✅ |
| Stage select screen, per-stage bests | ✅ |

## Release gate

`npm test` must pass before anything ships: the room validator plus the idle, drift and repel bots. None of the bots may clear a room.

## How this was built with AI

Built with Claude Code as a pair programmer. Commits it helped write carry a `Co-Authored-By: Claude` line.

- **Spec first.** The [TDD](Reference%20Files/Flip-TDD.md) was ingested into an LLM-maintained wiki (`wiki/`, indexed in [`Commands and Logs/main-index.md`](Commands%20and%20Logs/main-index.md)), so each session starts from the same source of truth instead of re-reading the full spec.
- **Plans before code.** The [dev plan](Working%20Files/2026-09-23-flip-v1-dev-plan.md) and [art plan](Working%20Files/2026-09-25-flip-v1-art-plan.md) break the build into small test-first tasks. Each task starts with a failing test.
- **Bots as a release gate.** Idle, drift and repel bots play every room headlessly. If a bot can clear a room without real input, the room is too easy and the build fails.
- **Look set on an art canvas.** Colours, font and sizes were designed on a shared [art canvas](https://claude.ai/artifact/51tn6oK5ZfHmTbD2dnK5fw) and synced into `theme.js`. `?pose=` renders the matching artboard in-game for side-by-side checks.
- **Real-device checks by hand.** Touch feel and flip timing were tested on a real phone. Those results were fed back into the wiki and `config.js`.

## Branches

`main` is the submitted, protected state. `Dev` is where work continues.
