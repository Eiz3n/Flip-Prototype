import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { theme } from '../src/theme.js';
import { LEVELS } from '../src/levels/index.js';
import { createGame, tap, update } from '../src/game.js';
import { createEffects, handleEvent, updateEffects } from '../src/view/anim/effects.js';
import { createCamera, updateCamera } from '../src/view/camera.js';
import { renderFrame } from '../src/view/render.js';
import { formatTime } from '../src/view/art/hud.js';

function fakeCtx() {
  const banned = new Set(['createLinearGradient', 'createRadialGradient', 'createConicGradient', 'filter']);
  const state = { measureText: (s) => ({ width: String(s).length * 8 }) };
  return new Proxy(state, {
    get(t, k) {
      if (banned.has(k)) throw new Error(`flat art rule: ${String(k)}`);
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) {
      if ((k === 'shadowBlur' && v > 0) || k === 'filter') throw new Error(`flat art rule: ${String(k)}`);
      t[k] = v;
      return true;
    },
  });
}

function setup() {
  const fx = createEffects(theme);
  const cam = createCamera();
  const game = createGame({ levels: LEVELS, cfg: config, storage: null, onEvent: (e) => handleEvent(fx, e, game.world) });
  const ctx = fakeCtx();
  const frame = (seconds) => {
    for (let i = 0; i < Math.round(seconds / config.step); i++) {
      update(game, config.step);
      updateEffects(fx, config.step, game.world);
    }
    updateCamera(cam, game, seconds);
    renderFrame(ctx, game, fx, cam, 0.5);
  };
  return { game, frame };
}

test('formatTime', () => {
  expect(formatTime(0)).toBe('0:00.00');
  expect(formatTime(83456)).toBe('1:23.45');
});

test('every state renders without error and without gradients or shadows', () => {
  const { game, frame } = setup();
  frame(0);                                            expect(game.state).toBe('title');
  tap(game); frame(0.2);                               // ready beat
  frame(0.6);                                          expect(game.state).toBe('playing');
  const w = game.world;
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });
  w.player.bufferEntry = false; w.player.latched = null;
  frame(0.05);                                         expect(game.state).toBe('transition');
  frame(0.2);                                          // mid-pan: both rooms drawn
  frame(0.4);                                          expect(game.world.roomIndex).toBe(1);
  Object.assign(w.player.pos, { x: 18, y: 320 });     // touching the wall: dies on the next step
  w.player.latched = null;
  frame(0.1);                                          expect(game.state).toBe('dying');
  frame(0.7);                                          // dying done, ready beat running
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });   // ready phase holds position
  frame(0.6);                                          // entry launch → exit pull → capture
  expect(game.state).toBe('win');
  frame(0.1);                                          // win screen
});
