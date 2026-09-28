// State machine on top of the sim (spec §8). Knows nothing about drawing.
// Title → stage select → stage start pan → rooms. Rooms are grouped into stages; each stage has
// its own timer and ends on a star clear screen (src/stars.js). Bests are per stage (src/progress.js).
import { createWorld, startRoom, step } from './sim/world.js';
import { starsFor } from './stars.js';
import { loadProgress, saveProgress, recordStage } from './progress.js';

function setState(game, state) {
  game.state = state;
  game.stateTime = 0;
}

// Without a stage table the whole run is one stage with no star limits.
const oneStage = (levels) => [{ rooms: levels.map((l) => l.index), goldMs: 0, silverMs: 0 }];

export function createGame({ levels, stages = oneStage(levels), cfg, storage = null, onEvent = () => {} }) {
  return {
    cfg,
    stages,
    storage,
    onEvent,
    world: createWorld(levels, cfg),
    state: 'title',
    stateTime: 0,
    pendingTaps: 0,
    timerRunning: false,
    timerArmed: false,            // the next entry launch starts the timer (stage start)
    stageIndex: 0,
    stageTime: 0,
    stageDeaths: 0,
    stageResults: [],             // { stage, timeMs, deaths, stars, newBest } per stage cleared this run
    progress: loadProgress(storage, cfg.progressKey),
    selected: 0,                  // stage index shown on the select screen
    selectFrom: 0,                // stage index the numeral is flipping away from
    selectFlip: 0,                // seconds left on the numeral flip
    slowmo: 0,
    timeScale: 1,
    startPending: 0,              // seconds left on the title logo flip before stage select opens
  };
}

const inBox = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

function firstRoomIndex(game, stageIndex) {
  const n = game.stages[stageIndex].rooms[0];
  return game.world.rooms.findIndex((r) => r.index === n);
}

function startStage(game, index) {
  game.stageIndex = index;
  game.stageTime = 0;
  game.stageDeaths = 0;
  game.timerArmed = true;
}

function finishStage(game) {
  game.timerRunning = false;
  const timeMs = Math.round(game.stageTime * 1000);
  const stars = starsFor(timeMs, game.stageDeaths, game.stages[game.stageIndex]);
  const stage = game.stageIndex + 1;
  const newBest = recordStage(game.progress, stage, timeMs, stars);
  saveProgress(game.storage, game.cfg.progressKey, game.progress);
  game.stageResults.push({ stage, timeMs, deaths: game.stageDeaths, stars, newBest });
}

// Start on the select screen: the chosen stage's first room is placed, then the camera pans up to it.
function startSelected(game) {
  game.stageResults = [];
  game.pendingTaps = 0;
  startStage(game, game.selected);
  startRoom(game.world, firstRoomIndex(game, game.selected), game.cfg.timing.readyBeat);
  setState(game, 'stageStart');
  game.onEvent('stageStart');
}

// Arrow keys and taps on the stage numeral. dir +1 next, −1 previous; wraps.
export function changeStage(game, dir = 1) {
  if (game.state !== 'select' || game.selectFlip > 0) return;
  const n = game.stages.length;
  game.selectFrom = game.selected;
  game.selected = (game.selected + dir + n) % n;
  game.selectFlip = game.cfg.timing.titleFlipTime;
  game.onEvent('stageFlip');
}

// point: logical room coordinates of a pointer press, or null for the keyboard (Space).
export function tap(game, point = null) {
  switch (game.state) {
    case 'title':
      // The logo's F flips first (spec §8); stage select opens when the flip ends.
      if (game.startPending > 0) break;             // already flipping: ignore extra taps
      game.onEvent('titleTap');
      game.startPending = game.cfg.timing.titleFlipTime;
      if (game.startPending <= 0) setState(game, 'select');
      break;
    case 'select': {
      const s = game.cfg.select;
      if (point && inBox(point, s.stageBox)) changeStage(game, 1);
      else if ((!point || inBox(point, s.startBox)) && game.selectFlip <= 0) startSelected(game);
      break;
    }
    case 'playing':
      game.pendingTaps++;
      break;
    case 'stageClear':
      if (game.stateTime < game.cfg.timing.clearTapDelay) break;
      startStage(game, game.stageIndex + 1);
      game.pendingTaps = 0;
      startRoom(game.world, game.world.roomIndex + 1, game.cfg.timing.readyBeat);
      setState(game, 'playing');
      game.onEvent('roomStart');
      break;
    case 'win':
      if (game.stateTime < game.cfg.timing.clearTapDelay) break;
      setState(game, 'title');
      game.onEvent('toTitle');
      break;
    default:
      break;                                          // stageStart, transition, dying: ignored
  }
}

function handleSimEvent(game, e) {
  const { cfg, world } = game;
  switch (e) {
    case 'entryLaunch':
      if (game.timerArmed) {
        game.timerArmed = false;
        game.timerRunning = true;
      }
      break;
    case 'nearMiss':
      game.slowmo = Math.max(game.slowmo, cfg.timing.nearMissSlowmo);
      break;
    case 'death':
      game.stageDeaths++;
      game.slowmo = cfg.timing.deathSlowmo;
      setState(game, 'dying');
      break;
    case 'exitCaptured': {
      const stage = game.stages[game.stageIndex];
      const stageDone = world.room.index === stage.rooms[stage.rooms.length - 1];
      if (stageDone) finishStage(game);
      if (world.roomIndex < world.rooms.length - 1) {
        if (stageDone) {
          setState(game, 'stageClear');
        } else {
          world.rooms[world.roomIndex + 1].reset();   // the pan shows the next room at its start state
          setState(game, 'transition');
        }
      }
      break;
    }
    case 'win':
      game.timerRunning = false;
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
  if (game.timerRunning) game.stageTime += dt;

  switch (game.state) {
    case 'title':
      if (game.startPending > 0) {
        game.startPending -= dt;
        if (game.startPending <= 0) {
          game.startPending = 0;
          setState(game, 'select');
        }
      }
      break;
    case 'select':
      if (game.selectFlip > 0) game.selectFlip = Math.max(0, game.selectFlip - dt);
      break;
    case 'stageStart':
      if (game.stateTime >= cfg.timing.panTime) {
        setState(game, 'playing');
        game.onEvent('roomStart');
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
