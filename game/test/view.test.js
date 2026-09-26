import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { theme } from '../src/theme.js';
import { LEVELS } from '../src/levels/index.js';
import { createWorld, startRoom, step } from '../src/sim/world.js';
import { easeOutCubic } from '../src/view/anim/ease.js';
import { createCamera, shake, updateCamera } from '../src/view/camera.js';
import { createParticles, spawn, POOL_SIZE } from '../src/view/particles.js';
import { createEffects, handleEvent, updateEffects } from '../src/view/anim/effects.js';

test('easeOutCubic', () => {
  expect(easeOutCubic(0)).toBe(0);
  expect(easeOutCubic(1)).toBe(1);
  expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
});

test('camera pans up one room over panTime, only during transition', () => {
  const cam = createCamera();
  updateCamera(cam, { cfg: config, state: 'transition', stateTime: 0.2 }, 0);
  expect(cam.y).toBeCloseTo(-640 * 0.875);
  updateCamera(cam, { cfg: config, state: 'transition', stateTime: 1 }, 0);
  expect(cam.y).toBeCloseTo(-640);
  updateCamera(cam, { cfg: config, state: 'playing', stateTime: 0 }, 0);
  expect(cam.y).toBe(0);
});

test('shake decays to nothing; a weaker shake never cuts a stronger one short', () => {
  const cam = createCamera();
  const game = { cfg: config, state: 'playing', stateTime: 0 };
  shake(cam, 10, 0.3);
  shake(cam, 3, 0.1);
  expect(cam.shakeAmount).toBe(10);
  updateCamera(cam, game, 0.1, () => 1);
  expect(cam.offsetX).toBeCloseTo(10 * (0.2 / 0.3));
  updateCamera(cam, game, 0.25, () => 1);
  expect(cam.offsetX).toBe(0);
});

test('the particle pool never grows past 200 and recycles', () => {
  const pool = createParticles();
  for (let i = 0; i < 500; i++) spawn(pool, 0, 0, 0, 0, 1, '#000', 2);
  expect(pool.items).toHaveLength(POOL_SIZE);
  expect(pool.items.filter((p) => p.alive)).toHaveLength(200);
});

function liveWorld() {
  const w = createWorld(LEVELS, config);
  startRoom(w, 0, 0);
  step(w, config.step, 0);
  return w;
}

test('death bursts particles and requests the death shake', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  handleEvent(fx, 'death', w);
  expect(fx.particles.items.filter((p) => p.alive)).toHaveLength(theme.fx.deathBurstCount);
  expect(fx.shakeRequest).toEqual({ amount: 10, time: 0.3 });
});

test('latch pop and flip ring run for their theme time, then clear', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  w.player.latched = w.room.hookPoints[0];
  handleEvent(fx, 'latch', w);
  handleEvent(fx, 'flip', w);
  expect(fx.latchPop.get(w.room.hookPoints[0])).toBe(theme.fx.latchPopTime);
  expect(fx.flipRing.t).toBe(theme.fx.flipRingTime);
  updateEffects(fx, 1, w);
  expect(fx.latchPop.size).toBe(0);
  expect(fx.flipRing.t).toBe(0);
});
