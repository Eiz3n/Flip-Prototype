import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS, STAGES } from '../src/levels/index.js';
import { createGame, tap, changeStage, update } from '../src/game.js';
import { bindInput } from '../src/input.js';

const DT = config.step;
const { stageBox, startBox } = config.select;
const centre = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}

function newGame(storage = memoryStorage()) {
  const events = [];
  const game = createGame({ levels: LEVELS, stages: STAGES, cfg: config, storage, onEvent: (e) => events.push(e) });
  return { game, events, storage };
}

function advance(game, seconds) {
  for (let i = 0; i < Math.round(seconds / DT); i++) update(game, DT);
}

// Title tap → logo flip → stage select.
function toSelect(game) {
  tap(game);
  advance(game, config.timing.titleFlipTime + 0.02);
}

// Select → Start → pan → ready beat → entry launch, then a little flight.
function beginPlay(game, stage = 0) {
  toSelect(game);
  for (let i = 0; i < stage; i++) { changeStage(game, 1); advance(game, config.timing.titleFlipTime + 0.02); }
  tap(game, centre(startBox));
  advance(game, config.timing.panTime + config.timing.readyBeat + 0.1);
}

function captureNow(game) {
  const w = game.world;
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });
  Object.assign(w.player.vel, { x: 0, y: -200 });
  w.player.bufferEntry = false;
  w.player.latched = null;
}

// From live play, clears every remaining room, tapping through each stage clear screen.
function finishRun(game) {
  for (let guard = 0; guard < 200 && game.state !== 'win'; guard++) {
    if (game.state === 'playing' && game.world.phase === 'live') { captureNow(game); advance(game, 0.05); }
    else if (game.state === 'stageClear') { advance(game, config.timing.clearTapDelay); tap(game); }
    else advance(game, 0.1);
  }
}

test('title tap plays the logo flip, then opens stage select on stage 1', () => {
  const { game, events } = newGame();
  expect(game.state).toBe('title');
  tap(game);
  expect(game.state).toBe('title');                   // the F flips on the title screen first
  expect(events).toEqual(['titleTap']);
  tap(game);                                          // taps during the flip are ignored
  advance(game, config.timing.titleFlipTime - 0.05);
  expect(game.state).toBe('title');
  advance(game, 0.1);
  expect(game.state).toBe('select');
  expect(game.selected).toBe(0);
  expect(events).toEqual(['titleTap']);
});

test('tapping the stage lettering flips to the next stage and wraps; taps mid-flip are ignored', () => {
  const { game, events } = newGame();
  toSelect(game);
  tap(game, centre(stageBox));
  expect(game.selected).toBe(1);
  expect(game.selectFrom).toBe(0);
  expect(game.selectFlip).toBe(config.timing.titleFlipTime);
  expect(events.at(-1)).toBe('stageFlip');
  tap(game, centre(stageBox));                        // still flipping
  tap(game, centre(startBox));                        // Start waits for the flip too
  expect(game.selected).toBe(1);
  expect(game.state).toBe('select');
  advance(game, config.timing.titleFlipTime + 0.02);
  expect(game.selectFlip).toBe(0);
  tap(game, { x: stageBox.x + 2, y: stageBox.y + stageBox.h - 2 });   // the hitbox reaches its corners
  advance(game, config.timing.titleFlipTime + 0.02);
  expect(game.selected).toBe(2);
  tap(game, centre(stageBox)); advance(game, config.timing.titleFlipTime + 0.02);
  expect(game.selected).toBe(0);                      // 3 → 1
});

test('arrow keys step the stage both ways; outside both boxes nothing happens', () => {
  const { game } = newGame();
  toSelect(game);
  changeStage(game, -1);
  expect(game.selected).toBe(2);
  advance(game, config.timing.titleFlipTime + 0.02);
  changeStage(game, 1);
  expect(game.selected).toBe(0);
  advance(game, config.timing.titleFlipTime + 0.02);
  tap(game, { x: 180, y: 600 });
  expect(game.state).toBe('select');
  expect(game.selectFlip).toBe(0);
  tap(game, null);                                    // Space starts
  expect(game.state).toBe('stageStart');
  changeStage(game, 1);                               // ignored outside the select screen
  expect(game.selected).toBe(0);
});

test('Start pans for panTime, then plays the first room of the chosen stage', () => {
  const { game, events } = newGame();
  toSelect(game);
  changeStage(game, 1);
  advance(game, config.timing.titleFlipTime + 0.02);
  tap(game, centre(startBox));
  expect(game.state).toBe('stageStart');
  expect(game.stageIndex).toBe(1);
  expect(game.world.roomIndex).toBe(2);               // stage 2 starts in room 3
  expect(events.at(-1)).toBe('stageStart');
  tap(game, centre(startBox));                        // taps during the pan are ignored
  advance(game, config.timing.panTime - 0.05);
  expect(game.state).toBe('stageStart');
  expect(game.world.phase).toBe('ready');
  advance(game, 0.1);
  expect(game.state).toBe('playing');
  expect(events.at(-1)).toBe('roomStart');
  expect(game.stageTime).toBe(0);                     // timer waits for the entry launch
  advance(game, config.timing.readyBeat + 0.05);
  expect(events).toContain('entryLaunch');
  expect(game.stageTime).toBeGreaterThan(0);
});

test('taps during play reach the sim', () => {
  const { game, events } = newGame();
  beginPlay(game);
  advance(game, 0.5);                                 // clear of the entry zone
  events.length = 0;
  tap(game, { x: 10, y: 10 });                        // anywhere flips
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
  expect(game.stageDeaths).toBe(1);
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

test('room 2 exit ends stage 1: timer stops, stars rated and saved as the stage best', () => {
  const { game, events, storage } = newGame();
  beginPlay(game);
  captureNow(game); advance(game, 0.5);              // → room 2
  advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  expect(game.state).toBe('stageClear');
  expect(events).not.toContain('win');
  const t = game.stageTime;
  const [result] = game.stageResults;
  expect(result).toMatchObject({ stage: 1, timeMs: Math.round(t * 1000), deaths: 0, stars: 3, newBest: true });
  advance(game, 1);
  expect(game.stageTime).toBe(t);                    // paused on the clear screen
  expect(JSON.parse(storage.map.get(config.progressKey)).stages['1']).toEqual({ bestMs: result.timeMs, stars: 3 });
});

test('stage clear ignores taps for clearTapDelay, then continues to the next stage in room 3', () => {
  const { game, events } = newGame();
  beginPlay(game);
  captureNow(game); advance(game, 0.5); advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  tap(game);
  expect(game.state).toBe('stageClear');
  advance(game, config.timing.clearTapDelay);
  tap(game);
  expect(game.state).toBe('playing');
  expect(game.world.roomIndex).toBe(2);
  expect(game.stageIndex).toBe(1);
  expect(game.stageTime).toBe(0);
  expect(game.stageDeaths).toBe(0);
  expect(events.at(-1)).toBe('roomStart');
  advance(game, config.timing.readyBeat - 0.05);
  expect(game.stageTime).toBe(0);                    // timer waits for room 3's entry launch
  advance(game, 0.2);
  expect(game.stageTime).toBeGreaterThan(0);
});

test('deaths cost a star; a slower clear keeps the best time but can raise the stars', () => {
  const { game, storage } = newGame();
  game.progress.stages['1'] = { bestMs: 1, stars: 1 };
  beginPlay(game);
  const p = game.world.player;
  Object.assign(p.pos, { x: 18, y: 320 });
  p.pol = -p.pol; p.latched = null;
  advance(game, 0.1);
  advance(game, config.timing.dyingTime + config.timing.readyBeat + 0.1);
  captureNow(game); advance(game, 0.5); advance(game, 0.1);
  captureNow(game); advance(game, 0.05);
  expect(game.stageResults[0]).toMatchObject({ deaths: 1, stars: 2, newBest: false });
  expect(JSON.parse(storage.map.get(config.progressKey)).stages['1']).toEqual({ bestMs: 1, stars: 2 });
});

test('a run started at stage 3 plays only room 5 and wins with one result', () => {
  const { game, events } = newGame();
  beginPlay(game, 2);
  expect(game.world.roomIndex).toBe(4);
  expect(game.stageIndex).toBe(2);
  finishRun(game);
  expect(game.state).toBe('win');
  expect(events.filter((e) => e === 'win')).toHaveLength(1);
  expect(game.stageResults.map((r) => r.stage)).toEqual([3]);
  const t = game.stageTime;
  advance(game, 1);
  expect(game.stageTime).toBe(t);
});

test('a run from stage 1 records all three stages', () => {
  const { game } = newGame();
  beginPlay(game);
  finishRun(game);
  expect(game.world.roomIndex).toBe(4);
  expect(game.stageResults.map((r) => r.stage)).toEqual([1, 2, 3]);
  expect(Object.keys(game.progress.stages)).toEqual(['1', '2', '3']);
});

test('win ignores taps for clearTapDelay, then returns to title; the next run starts fresh', () => {
  const { game, events } = newGame();
  beginPlay(game, 2);
  finishRun(game);
  tap(game);                                         // a late flip tap right at the exit
  expect(game.state).toBe('win');
  advance(game, config.timing.clearTapDelay);
  tap(game);
  expect(game.state).toBe('title');
  expect(events.at(-1)).toBe('toTitle');
  advance(game, config.timing.titleFlipTime + 0.02);
  expect(game.state).toBe('title');                  // the return flip does not reopen select
  toSelect(game);
  expect(game.state).toBe('select');
  expect(game.selected).toBe(2);                     // remembers the last stage shown
  tap(game, centre(startBox));
  expect(game.stageResults).toEqual([]);
});

test('slow-mo never slows the stage timer', () => {
  const { game } = newGame();
  beginPlay(game);
  const before = game.stageTime;
  game.slowmo = 0.08;
  update(game, DT);
  expect(game.timeScale).toBe(0.3);
  expect(game.stageTime).toBeCloseTo(before + DT, 12);
});

test('blocked storage means no saved progress, and the game still runs', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const { game } = newGame(broken);
  expect(game.progress).toEqual({ stages: {} });
  beginPlay(game);
  expect(() => finishRun(game)).not.toThrow();
  expect(game.state).toBe('win');
  expect(Object.keys(game.progress.stages)).toEqual(['1', '2', '3']);   // kept in memory
});

test('bindInput: pointer taps carry the client position, Space taps with null, arrows step, repeats ignored', () => {
  const pointer = new EventTarget(), keys = new EventTarget();
  const taps = [], arrows = [];
  const unbind = bindInput(pointer, keys, (p) => taps.push(p), (d) => arrows.push(d));
  const down = new Event('pointerdown', { cancelable: true }); down.clientX = 12; down.clientY = 34;
  pointer.dispatchEvent(down);
  const key = (code, repeat = false) => { const e = new Event('keydown', { cancelable: true }); e.code = code; e.repeat = repeat; keys.dispatchEvent(e); };
  key('Space');
  key('Space', true);
  key('KeyA');
  key('ArrowRight'); key('ArrowLeft'); key('ArrowUp', true);
  expect(taps).toEqual([{ x: 12, y: 34 }, null]);
  expect(arrows).toEqual([1, -1]);
  unbind();
  pointer.dispatchEvent(new Event('pointerdown'));
  expect(taps).toHaveLength(2);
});
