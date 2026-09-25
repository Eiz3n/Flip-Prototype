import { test, expect } from 'vitest';
import { theme } from '../src/theme.js';
import { recordingCtx } from './recordingCtx.js';
import { playThrough } from './scenes.js';

const PALETTE = ['#6FA8DC', '#E27D7D', '#EDE6D8', '#26252E', '#A9A4B5'];

test('the play-through reaches every drawing path', () => {
  const game = playThrough(recordingCtx());
  for (const e of ['titleTap', 'flip', 'latch', 'launch', 'obstacleHit', 'exitCaptured', 'death', 'win', 'toTitle']) {
    expect(game.seen[e], e).toBeGreaterThan(0);
  }
  expect(game.state).toBe('title');                   // won, then tapped back to the title
});

test('only palette colours are ever set on the context', () => {
  const ctx = recordingCtx();
  playThrough(ctx);
  const colours = new Set(ctx.log
    .filter((e) => e.op === 'set' && (e.name === 'fillStyle' || e.name === 'strokeStyle'))
    .map((e) => String(e.value).toUpperCase()));
  expect(colours.size).toBeGreaterThan(0);
  for (const c of colours) expect(PALETTE).toContain(c);
});

test('globalAlpha stays within 0..1', () => {
  const ctx = recordingCtx();
  playThrough(ctx);
  for (const e of ctx.log.filter((x) => x.op === 'set' && x.name === 'globalAlpha')) {
    expect(e.value).toBeGreaterThanOrEqual(0);
    expect(e.value).toBeLessThanOrEqual(1);
  }
});

test('theme carries the canvas tokens', () => {
  expect(theme.font).toMatchObject({ logoSize: 96, logoTracking: -2, hudSize: 13, timerSize: 15, markPlayer: 10, markHook: 17 });
  expect(theme.hud).toMatchObject({ y: 12, sidePad: 20 });
  expect(theme.field.titleAlpha).toBe(0.12);
  expect(theme.shaft).toMatchObject({ chevronWidth: 18, chevronHeight: 10.8, chevronStroke: 3.6, chevronGap: 3, pullCueWidth: 1.5 });
  expect(theme.fx).toMatchObject({ trailDots: 3, trailSpacing: 10, launchPuffCount: 4, deathBurstCount: 8, deathBurstAlpha: 0.7 });
  expect(theme.fx.trailRadii).toEqual([4, 3.5, 3]);
  expect(theme.fx.trailAlphas).toEqual([0.55, 0.35, 0.2]);
  expect(theme.title.hooks).toHaveLength(4);
});
