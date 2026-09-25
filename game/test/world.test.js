import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { createWorld, startRoom, step } from '../src/sim/world.js';
import { blankLevel, still } from './helpers.js';

const DT = 1 / 120;

function run(world, seconds, flipsAt = () => 0) {
  const seen = [];
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    for (const e of step(world, DT, flipsAt(i))) seen.push(e);
  }
  return seen;
}

test('startRoom puts the player in the hatch, coloured to the walls, for the ready beat', () => {
  const w = createWorld([blankLevel({ wave: { enabled: true, period: 6.5, startPol: -1 } })], config);
  startRoom(w, 0, 0.5);
  expect(w.phase).toBe('ready');
  expect([w.player.pos.x, w.player.pos.y]).toEqual([180, 580]);
  expect(w.player.pol).toBe(-1);
  const early = run(w, 0.45, () => 1);                // taps during the ready beat do nothing
  expect(early).toEqual([]);
  expect(w.player.pol).toBe(-1);
  const later = run(w, 0.1);
  expect(later).toEqual(['entryLaunch']);
  expect(w.phase).toBe('live');
  expect(w.player.vel.y).toBeLessThan(0);
});

test('entry launch fires straight up at entryLaunchSpeed', () => {
  const w = createWorld([blankLevel()], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  expect(w.player.vel.x).toBe(0);
  expect(w.player.vel.y).toBe(-240);
});

test('taps inside the entry zone are buffered until the player leaves it', () => {
  const w = createWorld([blankLevel()], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);                                      // entry launch
  const events = step(w, DT, 1);
  expect(events).not.toContain('flip');
  expect(w.player.pol).toBe(+1);
  expect(w.player.bufferedTap).toBe(true);
  let flippedAt = null;
  for (let i = 0; i < 120 && flippedAt === null; i++) {
    if (step(w, DT, 0).includes('flip')) flippedAt = w.player.pos.y;
  }
  expect(w.player.pol).toBe(-1);
  expect(Math.hypot(0, flippedAt - 588)).toBeGreaterThanOrEqual(50);
});

test('latch, launch, and a tap buffered inside the launching field', () => {
  const w = createWorld([blankLevel({ hookPoints: [{ x: 180, y: 400, pol: -1, ...still }] })], config);
  startRoom(w, 0, 0);
  const toLatch = run(w, 2);
  expect(toLatch).toContain('latch');
  expect(w.player.latched).toBe(w.room.hookPoints[0]);

  expect(step(w, DT, 1)).toEqual(['flip', 'launch']);
  expect(w.player.pol).toBe(-1);                       // same as the hook: pushed out
  step(w, DT, 1);                                      // still inside the field → buffered
  expect(w.player.pol).toBe(-1);
  let flipped = false;
  for (let i = 0; i < 240 && !flipped; i++) flipped = step(w, DT, 0).includes('flip');
  expect(flipped).toBe(true);
  expect(w.player.pol).toBe(+1);
  const h = w.room.hookPoints[0];
  expect(Math.hypot(w.player.pos.x - h.pos.x, w.player.pos.y - h.pos.y)).toBeGreaterThanOrEqual(70);
});

test('exit capture ends the room, lifts the player and ignores taps; win on the last room', () => {
  const w = createWorld([blankLevel()], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  Object.assign(w.player.pos, { x: 265, y: 60 });
  Object.assign(w.player.vel, { x: 0, y: -200 });
  w.player.bufferEntry = false;
  const events = run(w, 0.2);
  expect(events).toEqual(['exitCaptured', 'win']);
  expect(w.phase).toBe('captured');
  const y = w.player.pos.y, pol = w.player.pol;
  expect(step(w, DT, 1)).toEqual([]);
  expect(w.player.pos.y).toBeLessThan(y);
  expect(w.player.pol).toBe(pol);
});

test('no win event when a room follows', () => {
  const w = createWorld([blankLevel(), blankLevel({ index: 2, entry: { x: 265 }, exit: { x: 95 } })], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  Object.assign(w.player.pos, { x: 265, y: 60 });
  w.player.bufferEntry = false;
  expect(run(w, 0.2)).toEqual(['exitCaptured']);
});

test('death stops the room', () => {
  const w = createWorld([blankLevel()], config);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  Object.assign(w.player.pos, { x: 19, y: 320 });
  w.player.pol = -1;                                   // pulled
  const events = run(w, 0.5);
  expect(events.filter((e) => e === 'death')).toHaveLength(1);
  expect(w.phase).toBe('dead');
  expect(w.player.alive).toBe(false);
});

const ROOM1_BAR = { shape: 'bar', x: 200, y: 265, w: 70, h: 14 };

function pinnedUnderBar(cfg) {
  // Cushioned (+1 player, +1 walls) at x 180, where the centre push is zero; the updraft
  // holds the player against the bar's underside (y 272).
  const w = createWorld([blankLevel({ obstacles: [ROOM1_BAR] })], cfg);
  startRoom(w, 0, 0);
  step(w, DT, 0);
  Object.assign(w.player.pos, { x: 180, y: 281 });
  Object.assign(w.player.vel, { x: 0, y: 0 });
  w.player.bufferEntry = false;
  return w;
}

test('a player pinned against an obstacle dies after stallTime', () => {
  const w = pinnedUnderBar(config);
  expect(run(w, 2.9)).not.toContain('death');
  expect(run(w, 0.3)).toContain('death');
  expect(w.phase).toBe('dead');
});

test('stallTime is configurable and 0 disables stall death', () => {
  expect(run(pinnedUnderBar({ ...config, stallTime: 1 }), 1.2)).toContain('death');
  expect(run(pinnedUnderBar({ ...config, stallTime: 0 }), 5)).not.toContain('death');
});

test('every attempt at a room is identical, and events reuse one array', () => {
  const w = createWorld(LEVELS, config);
  const trace = () => {
    startRoom(w, 0, 0.5);
    run(w, 3);
    return [w.player.pos.x, w.player.pos.y, w.room.hookPoints[0].pos.x];
  };
  expect(trace()).toEqual(trace());
  expect(step(w, DT, 0)).toBe(w.events);
});
