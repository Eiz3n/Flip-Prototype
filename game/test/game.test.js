import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { createGame, tap, update } from '../src/game.js';
import { bindInput } from '../src/input.js';

const DT = config.step;

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}

function newGame(storage = memoryStorage()) {
  const events = [];
  const game = createGame({ levels: LEVELS, cfg: config, storage, onEvent: (e) => events.push(e) });
  return { game, events, storage };
}

function advance(game, seconds) {
  for (let i = 0; i < Math.round(seconds / DT); i++) update(game, DT);
}

// Title tap → logo flip (titleFlipTime) → room 1 ready beat → entry launch, then a little flight.
function beginPlay(game) {
  tap(game);
  advance(game, config.timing.titleFlipTime + config.timing.readyBeat + 0.1);
}

function captureNow(game) {
  const w = game.world;
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });
  Object.assign(w.player.vel, { x: 0, y: -200 });
  w.player.bufferEntry = false;
  w.player.latched = null;
}

test('title tap plays the logo flip, then starts room 1 after the ready beat', () => {
  const { game, events } = newGame();
  expect(game.state).toBe('title');
  tap(game);
  expect(game.state).toBe('title');                   // the F flips on the title screen first
  expect(events).toEqual(['titleTap']);
  tap(game);                                          // taps during the flip are ignored
  advance(game, config.timing.titleFlipTime - 0.05);
  expect(game.state).toBe('title');
  advance(game, 0.1);
  expect(game.state).toBe('playing');
  expect(events).toEqual(['titleTap', 'roomStart']);
  advance(game, 0.6);
  expect(events).toContain('entryLaunch');
  expect(game.world.phase).toBe('live');
});

test('taps during play reach the sim', () => {
  const { game, events } = newGame();
  tap(game);
  advance(game, config.timing.titleFlipTime + 1.0);   // clear of the entry zone
  events.length = 0;
  tap(game);
  update(game, DT);
  expect(events).toContain('flip');
});

test('death → dying 0.6 s (taps ignored) → same room with ready beat', () => {
  const { game, events } = newGame();
  beginPlay(game);
  const p = game.world.player;
  Object.assign(p.pos, { x: 18, y: 320 });            // 18 − 8 = 10: touching the wall, dies on the next step
  p.pol = -p.pol; p.latched = null;
  advance(game, 0.1);
  expect(game.state).toBe('dying');
  expect(game.deaths).toBe(1);
  tap(game);
  advance(game, 0.4);
  expect(game.state).toBe('dying');
  advance(game, 0.25);
  expect(game.state).toBe('playing');
  expect(game.world.roomIndex).toBe(0);
  expect(game.world.phase).toBe('ready');
  expect(events.filter((e) => e === 'roomStart')).toHaveLength(2);
});

test('room 1 exit → transition 0.4 s → room 2 entry launch', () => {
  const { game, events } = newGame();
  beginPlay(game);
  game.world.rooms[1].time = 5;                       // stale state from an earlier run
  captureNow(game);
  advance(game, 0.05);
  expect(game.state).toBe('transition');
  expect(game.world.rooms[1].time).toBe(0);           // reset before the pan draws it
  advance(game, 0.4);
  expect(game.state).toBe('playing');
  expect(game.world.roomIndex).toBe(1);
  advance(game, 0.02);
  expect(events.filter((e) => e === 'entryLaunch')).toHaveLength(2);
});

test('room 2 exit wins, stops the timer and stores the best time', () => {
  const { game, storage } = newGame();
  beginPlay(game);
  captureNow(game); advance(game, 0.5);              // → room 2
  advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  expect(game.state).toBe('win');
  const t = game.runTime;
  advance(game, 1);
  expect(game.runTime).toBe(t);
  expect(game.newBest).toBe(true);
  expect(game.lastTimeMs).toBe(Math.round(t * 1000));
  expect(storage.map.get('flip.bestTime.v1')).toBe(String(game.lastTimeMs));
});

test('a slower run keeps the old best', () => {
  const storage = memoryStorage();
  storage.setItem('flip.bestTime.v1', '1');
  const { game } = newGame(storage);
  expect(game.best).toBe(1);
  beginPlay(game);
  captureNow(game); advance(game, 0.5); advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  expect(game.newBest).toBe(false);
  expect(game.best).toBe(1);
});

test('win tap returns to title', () => {
  const { game, events } = newGame();
  beginPlay(game);
  captureNow(game); advance(game, 0.5); advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  tap(game);
  expect(game.state).toBe('title');
  expect(events.at(-1)).toBe('toTitle');
});

test('slow-mo never slows the run timer', () => {
  const { game } = newGame();
  beginPlay(game);
  const before = game.runTime;
  game.slowmo = 0.08;
  update(game, DT);
  expect(game.timeScale).toBe(0.3);
  expect(game.runTime).toBeCloseTo(before + DT, 12);
});

test('blocked storage means no best time, and the game still runs', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const { game } = newGame(broken);
  expect(game.best).toBe(null);
  beginPlay(game);
  captureNow(game); advance(game, 0.5); advance(game, 0.1);
  captureNow(game);
  expect(() => advance(game, 0.05)).not.toThrow();
  expect(game.state).toBe('win');
});

test('bindInput sends one tap per press and ignores key repeat', () => {
  const pointer = new EventTarget(), keys = new EventTarget();
  const taps = [];
  const unbind = bindInput(pointer, keys, (t) => taps.push(t));
  pointer.dispatchEvent(new Event('pointerdown', { cancelable: true }));
  const space = new Event('keydown', { cancelable: true }); space.code = 'Space'; space.repeat = false;
  keys.dispatchEvent(space);
  const held = new Event('keydown', { cancelable: true }); held.code = 'Space'; held.repeat = true;
  keys.dispatchEvent(held);
  const other = new Event('keydown', { cancelable: true }); other.code = 'KeyA'; other.repeat = false;
  keys.dispatchEvent(other);
  expect(taps).toHaveLength(2);
  unbind();
  pointer.dispatchEvent(new Event('pointerdown'));
  expect(taps).toHaveLength(2);
});
