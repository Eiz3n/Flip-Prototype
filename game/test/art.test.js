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

import { drawMark } from '../src/view/art/marks.js';
import { drawHookPoint } from '../src/view/art/hookPoint.js';
import { drawPlayer, drawTether } from '../src/view/art/player.js';

const calls = (ctx, name) => ctx.log.filter((e) => e.op === 'call' && e.name === name);
const radii = (ctx) => calls(ctx, 'arc').map((e) => e.args[2]);

function hookAt(pol) { return { pos: { x: 100, y: 200 }, pol, fieldRadius: 70 }; }

function fxStub(overrides = {}) {
  return {
    trail: { x: new Float32Array(3), y: new Float32Array(3), pol: new Int8Array(3), count: 0, head: 0 },
    flipRing: { t: 0 },
    ...overrides,
  };
}

test('marks are Baloo 2 glyphs in ink: + and U+2212', () => {
  const ctx = recordingCtx();
  drawMark(ctx, 50, 50, 17, -1, theme);
  drawMark(ctx, 50, 50, 10, +1, theme);
  const [minus, plus] = calls(ctx, 'fillText');
  expect(minus.args[0]).toBe('−');
  expect(minus.font).toBe(`700 17px ${theme.font.family}`);
  expect(minus.fill).toBe('#26252E');
  expect(plus.args[0]).toBe('+');
  expect(plus.font).toBe(`700 10px ${theme.font.family}`);
});

test('hook point: r 14 fill, stroke inside at r 13, field ring idle vs inside', () => {
  const idle = recordingCtx();
  drawHookPoint(idle, hookAt(-1), false, 0, theme);
  expect(radii(idle)).toEqual(expect.arrayContaining([69.5, 14, 13]));
  const ring = calls(idle, 'stroke')[0];
  expect([ring.alpha, ring.lineWidth]).toEqual([0.2, 1]);
  expect(calls(idle, 'fill').some((e) => e.fill === '#E27D7D')).toBe(true);
  expect(calls(idle, 'fillText')[0].args[0]).toBe('−');

  const inside = recordingCtx();
  drawHookPoint(inside, hookAt(+1), true, 0, theme);
  expect(radii(inside)).toContain(69);
  const r2 = calls(inside, 'stroke')[0];
  expect([r2.alpha, r2.lineWidth]).toEqual([0.5, 2]);
});

test('latch pop peaks at 1.1× halfway through', () => {
  const ctx = recordingCtx();
  drawHookPoint(ctx, hookAt(+1), false, 0.5, theme);
  expect(radii(ctx).some((r) => Math.abs(r - 15.4) < 1e-9)).toBe(true);   // 14 × 1.1
});

test('player: r 8 body, stroke inside at 7, 10 px mark, 3-dot stepped trail', () => {
  const fx = fxStub();
  fx.trail.x.set([100, 100, 100]); fx.trail.y.set([230, 220, 210]); fx.trail.pol.set([1, 1, 1]);
  fx.trail.count = 3; fx.trail.head = 0;               // newest at index 2
  const ctx = recordingCtx();
  drawPlayer(ctx, 100, 200, { pol: +1 }, fx, theme);
  const r = radii(ctx);
  expect(r.slice(0, 3)).toEqual([4, 3.5, 3]);          // newest (largest) first
  expect(calls(ctx, 'fill').slice(0, 3).map((e) => e.alpha)).toEqual([0.55, 0.35, 0.2]);
  expect(r).toEqual(expect.arrayContaining([8, 7]));
  expect(calls(ctx, 'fillText')[0].font).toBe(`700 10px ${theme.font.family}`);
});

test('flip ring grows from the player edge and fades', () => {
  const ctx = recordingCtx();
  drawPlayer(ctx, 100, 200, { pol: -1 }, fxStub({ flipRing: { t: theme.fx.flipRingTime / 2 } }), theme);
  const ring = radii(ctx).at(-1);
  expect(ring).toBeGreaterThan(8);
  expect(ring).toBeLessThan(18);
});

test('tether: 1 px ink at 50 % from player to hook centre', () => {
  const ctx = recordingCtx();
  drawTether(ctx, 120, 200, hookAt(-1), theme);
  const s = calls(ctx, 'stroke')[0];
  expect([s.stroke, s.alpha, s.lineWidth]).toEqual(['#26252E', 0.5, 1]);
  expect(calls(ctx, 'lineTo')[0].args).toEqual([100, 200]);
});

import { drawWalls } from '../src/view/art/walls.js';
import { drawExitDoorway, drawEntryHatch } from '../src/view/art/shaft.js';
import { drawUpdraft } from '../src/view/art/updraft.js';

const rects = (ctx, colour) => calls(ctx, 'fillRect').filter((e) => e.fill === colour).map((e) => e.args);
const near = (a, b) => Math.abs(a - b) < 1e-6;

test('walls: full-height side bands split at the front, no ink edge, cut-outs, full-width front line', () => {
  const ctx = recordingCtx();
  drawWalls(ctx, { exitX: 265, entryX: 180 }, { frontY: 260, polAbove: -1, polBelow: +1 }, theme);
  expect(rects(ctx, '#E27D7D')).toEqual([[0, 0, 10, 260], [350, 0, 10, 260]]);
  expect(rects(ctx, '#6FA8DC')).toEqual([[0, 260, 10, 380], [350, 260, 10, 380]]);
  const neutral = rects(ctx, '#A9A4B5');
  expect(neutral).toEqual(expect.arrayContaining([[10, 0, 217, 6], [303, 0, 47, 6], [10, 634, 132, 6], [218, 634, 132, 6]]));
  const ink = rects(ctx, '#26252E');
  expect(ink).toContainEqual([0, 260, 360, 1]);                           // front line crosses the walls
  expect(ink.some((r) => r[3] === 640)).toBe(false);                     // no side-wall ink edge
});

test('exit doorway: 46-deep interior, posts to the mouth, rising chevrons, dashed pull cue', () => {
  const ctx = recordingCtx();
  drawExitDoorway(ctx, 265, 0, theme);
  expect(rects(ctx, '#26252E')).toContainEqual([235, 0, 60, 46]);
  expect(rects(ctx, '#A9A4B5')).toEqual([[227, 0, 8, 52], [295, 0, 8, 52]]);
  const chev = calls(ctx, 'stroke').filter((e) => e.stroke === '#EDE6D8');
  expect(chev.map((e) => e.alpha)).toEqual([1, 1, 0.65, 0.35]);          // entering (below the interior), then bottom → top
  const ys = calls(ctx, 'moveTo').filter((e) => e.stroke === '#EDE6D8').map((e) => e.args[1] - 3.6);
  expect(ys.slice(1).map((y) => Math.round(y * 10) / 10)).toEqual([36.8, 23, 9.2]);   // canvas centres
  expect(chev.every((e) => e.lineWidth === 3.6)).toBe(true);
  expect(calls(ctx, 'setLineDash')[0].args[0]).toEqual([4, 3]);
  const cue = calls(ctx, 'lineTo').filter((e) => e.alpha === 0.4);
  expect(cue).toHaveLength(2);
  expect(near(cue[0].args[0], 195) && near(cue[0].args[1], 52 + 64 * Math.cos(Math.PI / 6))).toBe(true);
});

test('chevrons move up over time and keep the canvas brightness order', () => {
  const at = (t) => {
    const ctx = recordingCtx();
    drawExitDoorway(ctx, 265, t, theme);
    return calls(ctx, 'moveTo').filter((e) => e.stroke === '#EDE6D8').map((e) => e.args[1]);
  };
  const y0 = at(0), y1 = at(0.1);
  expect(y1[0]).toBeLessThan(y0[0]);                                       // 2 units higher after 0.1 s
});

test('entry hatch mirrors the doorway in the floor', () => {
  const ctx = recordingCtx();
  drawEntryHatch(ctx, 180, 0, theme);
  expect(rects(ctx, '#26252E')).toContainEqual([150, 594, 60, 46]);
  expect(rects(ctx, '#A9A4B5')).toEqual([[142, 588, 8, 52], [210, 588, 8, 52]]);
});

test('updraft dashes: 2 × 12 rounded, ink at 14 %', () => {
  const ctx = recordingCtx();
  drawUpdraft(ctx, 0, theme);
  const dashes = calls(ctx, 'roundRect');
  expect(dashes).toHaveLength(theme.updraft.count);
  expect(dashes.every((e) => e.args[2] === 2 && e.args[3] === 12 && e.args[4] === 1)).toBe(true);
  expect(calls(ctx, 'fill').every((e) => e.alpha === 0.14 && e.fill === '#26252E')).toBe(true);
});
