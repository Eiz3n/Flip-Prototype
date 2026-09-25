import { test, expect } from 'vitest';
import { resolveSolids, checkCapture, checkDeath, checkNearMiss } from '../src/sim/collision.js';
import { freeFlightStep } from '../src/sim/physics.js';
import { makeState } from './helpers.js';

const DT = 1 / 120;
const BAR = { shape: 'bar', x: 180, y: 300, w: 70, h: 14 };   // top edge y 293

function at(s, x, y, vx = 0, vy = 0) {
  Object.assign(s.player.pos, { x, y });
  Object.assign(s.player.vel, { x: vx, y: vy });
}

test('obstacle contact pushes out, removes inward velocity, applies friction', () => {
  const s = makeState({ obstacles: [BAR] });
  at(s, 180, 288, 50, 100);                             // 3 units into the bar's top, moving down
  expect(resolveSolids(s)).toBe(true);
  expect(s.player.pos.y).toBeCloseTo(285);
  expect(s.player.vel.y).toBeCloseTo(0);
  expect(s.player.vel.x).toBeCloseTo(50 * 0.85);
});

test('contact reports only on the step it starts', () => {
  const s = makeState({ obstacles: [BAR] });
  at(s, 180, 288, 0, 100);
  expect(resolveSolids(s)).toBe(true);
  s.player.pos.y += 100 * DT;                           // keep pressing in
  expect(resolveSolids(s)).toBe(false);
  at(s, 180, 200);
  resolveSolids(s);                                     // clear of the bar
  at(s, 180, 288, 0, 100);
  expect(resolveSolids(s)).toBe(true);
});

test('friction applies once per contact, not every step', () => {
  const s = makeState({ obstacles: [BAR] });
  at(s, 180, 288, 50, 100);
  resolveSolids(s);                                     // contact starts: 50 → 42.5
  s.player.pos.y += 100 * DT;
  s.player.vel.y = 100;
  resolveSolids(s);                                     // still touching: no more friction
  expect(s.player.vel.x).toBeCloseTo(42.5);
});

test('a pulled player pinned under a bar slides free', () => {
  const s = makeState({ obstacles: [{ shape: 'bar', x: 200, y: 265, w: 70, h: 14 }] });  // room 1's bar
  at(s, 185, 280);                                      // resting on the bar's underside (y 272)
  s.player.pol = -1;                                    // walls +1: pulled toward the right wall
  let freeAt = null;
  for (let i = 0; i < 960 && freeAt === null; i++) {
    freeFlightStep(s, DT);
    resolveSolids(s);
    if (i > 10 && !s.player.onObstacle) freeAt = i * DT;
  }
  expect(freeAt).not.toBe(null);                        // review measured ≈ 5.8 s
});

test('shaft posts block without killing', () => {
  const s = makeState();                                // exit x 265: left post x 227–235, y 0–58
  at(s, 210, 40, 200, 0);
  for (let i = 0; i < 60; i++) {
    s.player.pos.x += s.player.vel.x * DT;
    resolveSolids(s);
    expect(checkDeath(s)).toBe(false);
  }
  expect(s.player.pos.x).toBeLessThanOrEqual(227 - 8 + 1e-9);
});

test('exit capture fires only inside the mouth span', () => {
  const s = makeState();
  at(s, 265, 50); expect(checkCapture(s)).toBe(true);
  at(s, 265, 53); expect(checkCapture(s)).toBe(false);  // still below the mouth
  at(s, 286.9, 50); expect(checkCapture(s)).toBe(true); // span is |x − 265| < 30 − 8 = 22
  at(s, 287, 50); expect(checkCapture(s)).toBe(false);
});

test('walls kill; the doorway gap in the top wall does not', () => {
  const s = makeState();
  at(s, 18, 320); expect(checkDeath(s)).toBe(true);    // left: 18 − 8 = 10
  at(s, 342, 320); expect(checkDeath(s)).toBe(true);   // right: 342 + 8 = 350
  at(s, 180, 626); expect(checkDeath(s)).toBe(true);   // bottom: 626 + 8 = 634
  at(s, 200, 14); expect(checkDeath(s)).toBe(true);    // top wall beside the doorway
  at(s, 265, 14); expect(checkDeath(s)).toBe(false);   // inside the doorway span
  at(s, 180, 320); expect(checkDeath(s)).toBe(false);
});

test('tunnelling through a bar or a post is impossible at maxSpeed', () => {
  const s = makeState({ obstacles: [BAR] });
  at(s, 180, 200, 0, 480);
  for (let i = 0; i < 240; i++) {
    s.player.pos.y += s.player.vel.y * DT;
    resolveSolids(s);
    expect(s.player.pos.y).toBeLessThan(293);
  }
  const t = makeState();
  at(t, 150, 30, 480, 0);
  for (let i = 0; i < 240; i++) {
    t.player.pos.x += t.player.vel.x * DT;
    resolveSolids(t);
    expect(t.player.pos.x).toBeLessThan(227);
  }
});

test('near miss fires once per approach while pulled', () => {
  const s = makeState();                                // walls +1
  s.player.pol = -1;
  s.player.inField = false;
  at(s, 40, 320); expect(checkNearMiss(s)).toBe(false);  // gap 22
  at(s, 24, 320); expect(checkNearMiss(s)).toBe(true);   // gap 6
  at(s, 23, 320); expect(checkNearMiss(s)).toBe(false);  // already fired
  at(s, 60, 320); checkNearMiss(s);                      // gap 42 re-arms
  at(s, 24, 320); expect(checkNearMiss(s)).toBe(true);
  s.player.pol = +1;                                     // cushioned: never a near miss
  at(s, 60, 320); checkNearMiss(s);
  at(s, 24, 320); expect(checkNearMiss(s)).toBe(false);
});
