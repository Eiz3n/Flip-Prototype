# Flip — Prototype

A one-button browser game: tap to flip your polarity, swinging between floating hook points to climb through rooms whose walls change charge in a visible wave.

Built as a design test. 10 hand-made rooms, playable start to finish, shipped to itch.io.

**Status:** specification complete, implementation not started.

## The game

Get launched off the entry hook point. Tap to become the **opposite** colour of the next hook point to latch onto it, tap to **match** its colour to push off it, and keep your colour matched to the walls so they cushion you instead of pulling you in. Steer around obstacles, latch onto the room's exit hook point to move up.

Touching a wall restarts the room. Touching an obstacle only kills your momentum. Score is total time to clear all 10 rooms — lower is better.

## Stack

| | |
|---|---|
| Language | JavaScript (ES2020), ES modules |
| Rendering | Canvas 2D — no engine |
| Audio | Web Audio API, synthesised |
| Build | Vite → static `dist/` |
| Storage | `localStorage`, best time only |
| Resolution | 360 × 640 logical, portrait |
| Targets | 60 fps mid-range phone, < 200 KB |

## Repository layout

This repo uses the **GPS** knowledge-base system. The wiki is the working reference; the source document is read-only.

```
CLAUDE.md              Agent schema — generated, read at session start
wiki/                  Synthesised reference pages
  systems/               Loop, rooms, rendering, build, milestones
  entities/              Class schemas, tuning table, project structure
  concepts/              Force model, wave, latch/launch, timing rules
  sources/               One summary per ingested source
Reference Files/       Read-only source material (the TDD lives here)
Working Files/         In-progress documents
Output/                Final exports only
raw/                   Drop new sources here, then ingest them
Commands and Logs/     Indexes and append-only logs
Maintenance/           AI-managed — do not edit, move or delete
```

**Start at [`Commands and Logs/main-index.md`](Commands%20and%20Logs/main-index.md)** — it indexes all 16 wiki pages.

## Where the spec lives

The full technical design document is [`Reference Files/Flip-TDD.md`](Reference%20Files/Flip-TDD.md). It is the single source of truth for every number in this repo.

It has been synthesised into the wiki, weighted toward implementation. Useful entry points:

- [Polarity & force model](wiki/concepts/polarity-force-model.md) — the one sign check the whole game reduces to
- [Latch, orbit & launch](wiki/concepts/latch-orbit-launch.md) — the core verb
- [Human timing rules](wiki/concepts/human-timing-rules.md) — the nine constraints, machine-verified
- [Tuning parameters](wiki/entities/tuning-parameters.md) — the full `config.js` table
- [Rooms & difficulty](wiki/systems/rooms-and-difficulty.md) — the 10-room plan

## Build order

The plan front-loads the feel of latch and launch — if that is not fun by day 3, nothing built on top will fix it.

| Day | Milestone |
|---|---|
| 1 | Loop, input, Room 1 shell, wall pull and cushion, updraft |
| 2–3 | Hook point fields, latch, orbit, launch, latency compensation |
| 4 | Wall wave, front line, free-flight grace, obstacles |
| 5 | Entry/exit hook points, camera pan, restart, win screen, run timer |
| 6 | `tools/checkRooms.js` and rooms 4–10 |
| 7 | Art pass, feedback, audio |
| 8 | itch.io build, device test, playtest |

Day 1 is done when a cushioned player cannot touch a wall and a pulled one can.

## Release gate

No build ships until `tools/checkRooms.js` passes on all 10 rooms: every launch window, every catch window, and **both passive bots failing to reach the exit**. See [No passive clears](wiki/concepts/no-passive-clears.md).

## Branches

| Branch | Role |
|---|---|
| `Dev` | Default. App-building work goes here. |
| `main` | Reviewed and merged state. |
| `gps-wiki-setup` | Merged; retained as history. |

PRs default to targeting `Dev`. Pass `--base main` explicitly for anything meant to land on `main`.

## Working with the wiki

The wiki is maintained, not hand-edited ad hoc. `CLAUDE.md` holds the full ruleset. In short:

- Drop a new source in `raw/`, then ingest it — it becomes wiki pages plus a source summary.
- Every `.md` carries an append-only Decision Log at the bottom. Read it before editing.
- Structural changes dual-write to `Maintenance/setup-log.md` and `Commands and Logs/directory-log.md`.
- `Maintenance/` is AI-managed. Do not edit, move or delete anything in it.
