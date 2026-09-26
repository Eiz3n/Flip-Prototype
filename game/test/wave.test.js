import { test, expect } from 'vitest';
import { polarityAt, frontY, wallPolAt } from '../src/sim/wave.js';
import { set, len, clampLen, rotate } from '../src/sim/vec.js';

const H = 640, T = 6.5;

test('at t = 0 every height shows the starting polarity', () => {
  for (let s = 10; s < H; s += 50) expect(polarityAt(s, 0, T, H, +1)).toBe(+1);
});

test('above the front shows the new polarity, below the old', () => {
  const t = 0.25 * T;                        // front at 160
  expect(frontY(t, T, H)).toBeCloseTo(160);
  expect(polarityAt(100, t, T, H, +1)).toBe(-1);
  expect(polarityAt(200, t, T, H, +1)).toBe(+1);
});

test('the next front brings the opposite polarity again', () => {
  const t = 1.25 * T;                        // second front at 160
  expect(polarityAt(100, t, T, H, +1)).toBe(+1);
  expect(polarityAt(200, t, T, H, +1)).toBe(-1);
  expect(polarityAt(200, t, T, H, -1)).toBe(+1);
});

test('wallPolAt reads the room and ignores time when the wave is off', () => {
  const room = { wave: { enabled: true, period: T, startPol: -1 }, time: 0.25 * T, height: H };
  expect(wallPolAt(room, 100)).toBe(+1);
  room.wave = { enabled: false, period: T, startPol: -1 };
  expect(wallPolAt(room, 100)).toBe(-1);
});

test('vector helpers work in place', () => {
  const v = { x: 0, y: 0 };
  set(v, 30, 40);
  expect(len(v.x, v.y)).toBe(50);
  clampLen(v, 10);
  expect(v.x).toBeCloseTo(6); expect(v.y).toBeCloseTo(8);
  set(v, 1, 0); rotate(v, Math.PI / 2);
  expect(v.x).toBeCloseTo(0); expect(v.y).toBeCloseTo(1);
});
