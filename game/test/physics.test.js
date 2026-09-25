import { test, expect } from 'vitest';
import { fieldAccel, wallAccelX, graceScale, freeFlightStep } from '../src/sim/physics.js';
import { makeState, still } from './helpers.js';

const DT = 1 / 120;
const out = { x: 0, y: 0 };

function place(state, x, y, vx = 0, vy = 0) {
  state.player.pos.x = x; state.player.pos.y = y;
  state.player.vel.x = vx; state.player.vel.y = vy;
}

test('hook force attracts on opposite polarity and repels on same', () => {
  const s = makeState({ hookPoints: [{ x: 180, y: 320, pol: +1, ...still }] });
  place(s, 180, 370);
  s.player.pol = -1;
  expect(fieldAccel(s, out)).toBe(true);
  expect(out.y).toBeLessThan(0);                        // toward the hook (up)
  s.player.pol = +1;
  fieldAccel(s, out);
  expect(out.y).toBeGreaterThan(0);                     // away from the hook
  expect(Math.abs(out.y)).toBeCloseTo(2_000_000 / 50 ** 2);
});

test('inside a field, walls and updraft do nothing', () => {
  const s = makeState({ hookPoints: [{ x: 60, y: 320, pol: +1, ...still }] }, { k: 0 });
  place(s, 40, 320);
  s.player.pol = -1;                                    // opposite the +1 walls: would be pulled
  freeFlightStep(s, DT);
  expect(s.player.vel.x).toBe(0);
  expect(s.player.vel.y).toBe(0);
  expect(s.player.inField).toBe(true);
});

test('overlapping fields add together', () => {
  const s = makeState({ hookPoints: [{ x: 140, y: 320, pol: +1, ...still }, { x: 220, y: 320, pol: -1, ...still }] });
  place(s, 180, 320);
  s.player.pol = -1;                                    // pulled toward left hook, pushed off right hook
  fieldAccel(s, out);
  expect(out.x).toBeCloseTo(-2 * 2_000_000 / 40 ** 2);
  expect(out.y).toBeCloseTo(0);
});

test('exit pull attracts both colours and overrides walls', () => {
  for (const pol of [1, -1]) {
    const s = makeState();                              // exit x 265, mouth y 52
    place(s, 265, 80);
    s.player.pol = pol;
    expect(fieldAccel(s, out)).toBe(true);
    expect(out.y).toBeLessThan(0);                      // toward the mouth
    freeFlightStep(s, DT);
    expect(s.player.inField).toBe(true);                // walls and updraft skipped
  }
});

test('a cushioned player never gets closer than safeGap to a side wall', () => {
  let minGap = Infinity;
  for (let deg = 100; deg <= 260; deg += 10) {
    const s = makeState();                              // wave off, walls +1
    const a = (deg * Math.PI) / 180;
    place(s, 180, 320, Math.cos(a) * 480, Math.sin(a) * 480);
    s.player.pol = +1;                                  // matches walls: cushioned
    for (let i = 0; i < 1200; i++) {
      freeFlightStep(s, DT);
      s.player.pos.y = 320;                             // stay clear of top/bottom walls
      const gap = Math.min(s.player.pos.x - 8 - 10, 350 - s.player.pos.x - 8);
      minGap = Math.min(minGap, gap);
    }
  }
  expect(minGap).toBeGreaterThanOrEqual(12 - 1e-9);
});

test('a pulled player reaches the wall', () => {
  const s = makeState();
  place(s, 100, 320);
  s.player.pol = -1;
  let reached = false;
  for (let i = 0; i < 600 && !reached; i++) {
    freeFlightStep(s, DT);
    s.player.pos.y = 320;
    reached = s.player.pos.x - 8 <= 10;
  }
  expect(reached).toBe(true);
});

test('the updraft restores riseSpeed and drag bleeds faster launches back to it', () => {
  const s = makeState();
  place(s, 180, 320);
  s.player.pol = +1;
  for (let i = 0; i < 600; i++) { freeFlightStep(s, DT); s.player.pos.y = 320; }
  expect(s.player.vel.y).toBeCloseTo(-60, 0);

  place(s, 180, 320, 0, -400);
  for (let i = 0; i < 120; i++) { freeFlightStep(s, DT); s.player.pos.y = 320; }
  expect(-s.player.vel.y).toBeGreaterThan(60);
  expect(-s.player.vel.y).toBeLessThan(400);
});

test('speed is capped at maxSpeed', () => {
  const s = makeState();
  place(s, 180, 320, 1000, 0);
  s.player.pol = +1;
  freeFlightStep(s, DT);
  expect(Math.hypot(s.player.vel.x, s.player.vel.y)).toBeLessThanOrEqual(480 + 1e-9);
});

test('the wave front crossing the player starts the grace timer', () => {
  const s = makeState({ wave: { enabled: true, period: 6.5, startPol: +1 } });
  place(s, 60, 320);
  s.player.pol = +1;                                    // cushioned until the front arrives
  s.room.time = 0.5 * 6.5 - 0.05;                       // front 5 px above the player
  let triggered = false;
  for (let i = 0; i < 24 && !triggered; i++) {
    s.room.time += DT;
    freeFlightStep(s, DT);
    s.player.pos.y = 320;
    triggered = s.player.graceTimer > 0;
  }
  expect(triggered).toBe(true);
  expect(s.player.graceTimer).toBeCloseTo(0.55 - DT, 5);
  expect(wallAccelX(s, -1)).toBeCloseTo(0);             // now opposite the walls, but graced (may be -0)
});

test('grace is off for 0.40 s, then ramps to full over 0.15 s', () => {
  const cfg = { waveGrace: 0.4, waveGraceRamp: 0.15 };
  expect(graceScale({ graceTimer: 0.5 }, cfg)).toBe(0);
  expect(graceScale({ graceTimer: 0.15 }, cfg)).toBe(0);
  expect(graceScale({ graceTimer: 0.075 }, cfg)).toBeCloseTo(0.5);
  expect(graceScale({ graceTimer: 0 }, cfg)).toBe(1);
});
