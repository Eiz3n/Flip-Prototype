// State machine on top of the sim (spec §8). Knows nothing about drawing.
import { createWorld, startRoom, step } from './sim/world.js';

function readBest(storage, key) {
  try {
    const raw = storage ? storage.getItem(key) : null;
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function recordBest(game) {
  const ms = Math.round(game.runTime * 1000);
  game.lastTimeMs = ms;
  game.newBest = game.best === null || ms < game.best;
  if (!game.newBest) return;
  game.best = ms;
  try {
    if (game.storage) game.storage.setItem(game.cfg.bestTimeKey, String(ms));
  } catch {
    // Storage blocked: keep the in-memory best only.
  }
}

function setState(game, state) {
  game.state = state;
  game.stateTime = 0;
}

export function createGame({ levels, cfg, storage = null, onEvent = () => {} }) {
  return {
    cfg,
    storage,
    onEvent,
    world: createWorld(levels, cfg),
    state: 'title',
    stateTime: 0,
    pendingTaps: 0,
    runTime: 0,
    timerRunning: false,
    deaths: 0,
    best: readBest(storage, cfg.bestTimeKey),
    lastTimeMs: 0,
    newBest: false,
    slowmo: 0,
    timeScale: 1,
    startPending: 0,              // seconds left on the title logo flip before the run starts
  };
}

function startRun(game) {
  game.runTime = 0;
  game.timerRunning = false;
  game.deaths = 0;
  game.newBest = false;
  game.pendingTaps = 0;
  startRoom(game.world, 0, game.cfg.timing.readyBeat);
  setState(game, 'playing');
  game.onEvent('roomStart');
}

export function tap(game) {
  switch (game.state) {
    case 'title':
      // The logo's F flips first (spec §8); the run starts when the flip ends.
      if (game.startPending > 0) break;             // already flipping: ignore extra taps
      game.onEvent('titleTap');
      game.startPending = game.cfg.timing.titleFlipTime;
      if (game.startPending <= 0) startRun(game);
      break;
    case 'playing':
      game.pendingTaps++;
      break;
    case 'win':
      setState(game, 'title');
      game.onEvent('toTitle');
      break;
    default:
      break;                                          // transition, dying: ignored
  }
}

function handleSimEvent(game, e) {
  const { cfg, world } = game;
  switch (e) {
    case 'entryLaunch':
      if (world.roomIndex === 0 && !game.timerRunning && game.runTime === 0) game.timerRunning = true;
      break;
    case 'nearMiss':
      game.slowmo = Math.max(game.slowmo, cfg.timing.nearMissSlowmo);
      break;
    case 'death':
      game.deaths++;
      game.slowmo = cfg.timing.deathSlowmo;
      setState(game, 'dying');
      break;
    case 'exitCaptured':
      if (world.roomIndex < world.rooms.length - 1) {
        world.rooms[world.roomIndex + 1].reset();     // the pan shows the next room at its start state
        setState(game, 'transition');
      }
      break;
    case 'win':
      game.timerRunning = false;
      recordBest(game);
      setState(game, 'win');
      break;
    default:
      break;
  }
  game.onEvent(e);
}

export function update(game, dt) {
  const { cfg, world } = game;
  if (game.slowmo > 0) game.slowmo = Math.max(0, game.slowmo - dt);
  game.timeScale = game.slowmo > 0 ? cfg.timing.slowmoScale : 1;
  const simDt = dt * game.timeScale;
  game.stateTime += dt;
  if (game.timerRunning) game.runTime += dt;

  switch (game.state) {
    case 'title':
      if (game.startPending > 0) {
        game.startPending -= dt;
        if (game.startPending <= 0) {
          game.startPending = 0;
          startRun(game);
        }
      }
      break;
    case 'playing': {
      const taps = game.pendingTaps;
      game.pendingTaps = 0;
      const events = step(world, simDt, taps);
      for (let i = 0; i < events.length; i++) handleSimEvent(game, events[i]);
      break;
    }
    case 'transition':
      step(world, simDt, 0);
      if (game.stateTime >= cfg.timing.panTime) {
        startRoom(world, world.roomIndex + 1, 0);
        setState(game, 'playing');
        game.onEvent('roomStart');
      }
      break;
    case 'dying':
      if (game.stateTime >= cfg.timing.dyingTime) {
        startRoom(world, world.roomIndex, cfg.timing.readyBeat);
        setState(game, 'playing');
        game.pendingTaps = 0;
        game.onEvent('roomStart');
      }
      break;
    default:
      break;
  }
}
