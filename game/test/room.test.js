import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { Room } from '../src/sim/room.js';
import { blankLevel } from './helpers.js';

test('builds shaft posts from entry and exit x', () => {
  const room = new Room(blankLevel({ entry: { x: 180 }, exit: { x: 265 } }), config);
  const [exitL, exitR, hatchL, hatchR] = room.posts;
  expect([exitL.left, exitL.right, exitR.left, exitR.right]).toEqual([227, 235, 295, 303]);
  expect([exitL.top, exitL.bottom]).toEqual([0, 52]);                  // ends at the exit mouth
  expect([hatchL.left, hatchL.right, hatchR.left, hatchR.right]).toEqual([142, 150, 210, 218]);
  expect([hatchL.top, hatchL.bottom]).toEqual([588, 640]);             // starts at the hatch mouth
  expect(room.posts.every((p) => p.kind === 'post')).toBe(true);
  expect(room.solids.length).toBe(4);
});

test('hook points bob in a figure eight with staggered phases', () => {
  const room = new Room(blankLevel({ hookPoints: [{ x: 100, y: 300, pol: 1 }, { x: 200, y: 300, pol: -1 }] }), config);
  const [a, b] = room.hookPoints;
  expect(b.bob.phase).toBeCloseTo(1.1);
  room.time = 0.625;                               // quarter period at 0.4 Hz
  room.updateBob();
  expect(a.pos.x).toBeCloseTo(100 + 8 * Math.sin(Math.PI / 2));
  expect(a.pos.y).toBeCloseTo(300 + 5 * Math.sin(Math.PI));
});

test('reset rewinds time, cooldowns and bob so every attempt is identical', () => {
  const room = new Room(blankLevel({ hookPoints: [{ x: 100, y: 300, pol: 1 }] }), config);
  const h = room.hookPoints[0];
  room.reset();
  const x0 = h.pos.x, y0 = h.pos.y;
  room.time = 3; room.updateBob(); h.cooldown = 0.2;
  room.reset();
  expect(room.time).toBe(0);
  expect(h.cooldown).toBe(0);
  expect([h.pos.x, h.pos.y]).toEqual([x0, y0]);
});
