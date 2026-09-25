import { test, expect } from 'vitest';
import { tryLatch, orbitStep, launch } from '../src/sim/physics.js';
import { makeState, still } from './helpers.js';

const DT = 1 / 120;
const HOOK = { x: 180, y: 320, pol: +1, ...still };

function latchedState(cfgOverrides = {}, theta = 0, omega = 4, dir = 1) {
  const s = makeState({ hookPoints: [HOOK] }, cfgOverrides);
  const h = s.room.hookPoints[0];
  Object.assign(s.player, { latched: h, theta, omega, orbitDir: dir, pol: -1 });
  return { s, h };
}

test('latches inside latchRadius only when attracted', () => {
  const s = makeState({ hookPoints: [HOOK] });
  Object.assign(s.player.pos, { x: 205, y: 320 });
  Object.assign(s.player.vel, { x: 0, y: 100 });
  s.player.pol = +1;
  expect(tryLatch(s)).toBe(null);                     // same colour: repelled
  s.player.pol = -1;
  s.player.pos.x = 215;
  expect(tryLatch(s)).toBe(null);                     // 35 away
  s.player.pos.x = 205;
  expect(tryLatch(s)).toBe(s.room.hookPoints[0]);
  expect(Math.hypot(s.player.pos.x - 180, s.player.pos.y - 320)).toBeCloseTo(30);
});

test('arrival speed sets omega, clamped to [minOrbitSpeed, maxOrbitSpeed]', () => {
  const s = makeState({ hookPoints: [HOOK] });
  s.player.pol = -1;
  Object.assign(s.player.pos, { x: 205, y: 320 });
  Object.assign(s.player.vel, { x: 0, y: 300 });      // 300/30 = 10 rad/s → 6
  tryLatch(s);
  expect(s.player.omega).toBe(6);

  const t = makeState({ hookPoints: [HOOK] });
  t.player.pol = -1;
  Object.assign(t.player.pos, { x: 205, y: 320 });
  Object.assign(t.player.vel, { x: 0, y: 30 });       // 1 rad/s → 3.2
  tryLatch(t);
  expect(t.player.omega).toBe(3.2);
});

test('orbit direction follows the arrival direction', () => {
  for (const [vy, dir] of [[100, 1], [-100, -1]]) {
    const s = makeState({ hookPoints: [HOOK] });
    s.player.pol = -1;
    Object.assign(s.player.pos, { x: 205, y: 320 });
    Object.assign(s.player.vel, { x: 0, y: vy });
    tryLatch(s);
    expect(s.player.orbitDir).toBe(dir);
  }
});

test('omega bleeds toward minOrbitSpeed by the TDD formula', () => {
  const { s } = latchedState({}, 0, 6);
  for (let i = 0; i < 120; i++) orbitStep(s, DT);
  expect(s.player.omega).toBeCloseTo(3.2 + (6 - 3.2) * Math.exp(-0.8), 6);
});

test('the orbit follows the bobbing hook point', () => {
  const { s, h } = latchedState();
  h.pos.x += 7; h.pos.y -= 4;
  orbitStep(s, DT);
  expect(Math.hypot(s.player.pos.x - h.pos.x, s.player.pos.y - h.pos.y)).toBeCloseTo(30);
});

test('launch velocity is tangential plus radial impulse', () => {
  const { s } = latchedState({ inputLatencyComp: 0, launchAssist: 0 }, 0, 4, 1);
  launch(s);
  expect(s.player.vel.x).toBeCloseTo(180);           // radial (1, 0) × 180
  expect(s.player.vel.y).toBeCloseTo(120);           // tangential (0, 1) × 4 × 30
  expect(s.player.pol).toBe(+1);                      // now matches the hook: pushed out
  expect(s.player.latched).toBe(null);
});

test('launch speed is capped at maxSpeed', () => {
  const { s } = latchedState({ inputLatencyComp: 0, launchAssist: 0, launchImpulse: 1000 });
  launch(s);
  expect(Math.hypot(s.player.vel.x, s.player.vel.y)).toBeCloseTo(480);
});

test('latency compensation aims from theta rewound by omega × inputLatencyComp, without moving the player', () => {
  const { s } = latchedState({ launchAssist: 0 }, 1, 4, 1);
  launch(s);
  const used = 1 - 4 * 0.06;
  expect(s.player.vel.x).toBeCloseTo(-120 * Math.sin(used) + 180 * Math.cos(used));
  expect(s.player.vel.y).toBeCloseTo(120 * Math.cos(used) + 180 * Math.sin(used));
  expect(s.player.pos.x).toBeCloseTo(180 + 30 * Math.cos(1));   // stays on the orbit at the live angle
  expect(s.player.pos.y).toBeCloseTo(320 + 30 * Math.sin(1));
});

test('relatchCooldown blocks an instant re-latch', () => {
  const { s, h } = latchedState({ inputLatencyComp: 0, launchAssist: 0 });
  launch(s);
  expect(h.cooldown).toBe(0.25);
  expect(s.player.bufferHook).toBe(h);
  s.player.pol = -1;                                  // force attraction to isolate the cooldown
  Object.assign(s.player.pos, { x: 200, y: 320 });
  expect(tryLatch(s)).toBe(null);
  h.cooldown = 0;
  expect(tryLatch(s)).toBe(h);
});

function assistCase(offsetDeg, targetPol = -1) {
  // Launch from below hook A; heading ≈ 118° (down-left), exit is up-right so it never competes.
  const A = { x: 100, y: 500, pol: +1, ...still };
  const base = makeState({ hookPoints: [A] }, { inputLatencyComp: 0, launchAssist: 0 });
  Object.assign(base.player, { latched: base.room.hookPoints[0], theta: Math.PI / 2, omega: 3.2, orbitDir: 1, pol: -1 });
  launch(base);
  const h0 = Math.atan2(base.player.vel.y, base.player.vel.x);
  const p = base.player.pos;
  const a = h0 + (offsetDeg * Math.PI) / 180;
  const B = { x: p.x + 60 * Math.cos(a), y: p.y + 60 * Math.sin(a), pol: targetPol, ...still };

  const s = makeState({ hookPoints: [A, B] }, { inputLatencyComp: 0 });
  Object.assign(s.player, { latched: s.room.hookPoints[0], theta: Math.PI / 2, omega: 3.2, orbitDir: 1, pol: -1 });
  launch(s);
  const h1 = Math.atan2(s.player.vel.y, s.player.vel.x);
  return ((h1 - h0) * 180) / Math.PI;
}

test('launch assist nudges at most 6° toward another hook point, never past it', () => {
  expect(assistCase(10)).toBeCloseTo(6);
  expect(assistCase(-10)).toBeCloseTo(-6);
  expect(assistCase(3)).toBeCloseTo(3);
  expect(assistCase(60)).toBeCloseTo(0);              // outside the 45° cone
});

test('launch assist ignores hook points that will repel the player', () => {
  // After the flip the player matches hook A (+1); another +1 hook would push it away.
  expect(assistCase(10, +1)).toBeCloseTo(0);
});
