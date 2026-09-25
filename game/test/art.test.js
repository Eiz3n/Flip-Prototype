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

import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { createWorld, startRoom, step } from '../src/sim/world.js';
import { createEffects, handleEvent, updateEffects, titleFlipValue } from '../src/view/anim/effects.js';
import { createParticles, spawn, drawParticles } from '../src/view/particles.js';
import { drawObstacle } from '../src/view/art/obstacle.js';

function liveWorld() {
  const w = createWorld(LEVELS, config);
  startRoom(w, 0, 0);
  step(w, config.step, 0);
  return w;
}
const alive = (fx) => fx.particles.items.filter((p) => p.alive);

test('obstacle: neutral fill, 2 px ink stroke inside, doubled while flashing', () => {
  const o = { left: 165, top: 258, w: 70, h: 14 };
  const a = recordingCtx();
  drawObstacle(a, o, 0, theme);
  expect(calls(a, 'fillRect')[0]).toMatchObject({ args: [165, 258, 70, 14], fill: '#A9A4B5' });
  expect(calls(a, 'strokeRect')[0]).toMatchObject({ args: [166, 259, 68, 12], lineWidth: 2, stroke: '#26252E' });
  const b = recordingCtx();
  drawObstacle(b, o, 0.5, theme);
  expect(calls(b, 'strokeRect')[0]).toMatchObject({ args: [167, 260, 66, 10], lineWidth: 4 });
});

test('a flashing shaft post keeps a neutral core', () => {
  const post = { left: 227, top: 0, w: 8, h: 52 };
  const ctx = recordingCtx();
  drawObstacle(ctx, post, 0.5, theme);
  expect(calls(ctx, 'strokeRect')[0].lineWidth).toBe(3);             // capped at min(w, h) / 2 − 1
});

test('launch puff: 4 ink dots with the canvas sizes and alphas', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  Object.assign(w.player.vel, { x: 100, y: -200 });
  handleEvent(fx, 'launch', w);
  const ps = alive(fx);
  expect(ps).toHaveLength(4);
  expect(ps.every((p) => p.color === '#26252E')).toBe(true);
  expect(ps.map((p) => p.alpha)).toEqual([0.5, 0.35, 0.35, 0.2]);
  expect(ps.map((p) => p.size)).toEqual([2.5, 2, 2, 1.5]);
  expect(ps.every((p) => p.vy > 0)).toBe(true);                    // puffs trail behind an upward launch
});

test('death burst: 8 dots alternating ink and player colour at 70 %', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  w.player.pol = -1;
  handleEvent(fx, 'death', w);
  const ps = alive(fx);
  expect(ps).toHaveLength(8);
  expect(ps.map((p) => p.color)).toEqual(['#26252E', '#E27D7D', '#26252E', '#E27D7D', '#26252E', '#E27D7D', '#26252E', '#E27D7D']);
  expect(ps.every((p) => p.alpha === 0.7)).toBe(true);
  expect(ps.map((p) => p.size)).toEqual([2, 2, 2, 2, 2, 2, 1.35, 1.35]);
});

test('particle alpha multiplies into the stepped fade', () => {
  const pool = createParticles();
  spawn(pool, 0, 0, 0, 0, 1, '#26252E', 2, 0.5);
  const ctx = recordingCtx();
  drawParticles(ctx, pool);
  expect(calls(ctx, 'fill')[0].alpha).toBe(0.5);                    // full life: step 1 × 0.5
});

test('the trail samples every 10 units of travel and keeps 3', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  for (let i = 0; i < 100; i++) {
    w.player.pos.y -= 1;                                             // 1 unit per frame
    updateEffects(fx, 1 / 60, w);
  }
  const tr = fx.trail;
  expect(tr.count).toBe(3);
  const ys = [0, 1, 2].map((i) => tr.y[(tr.head - 1 - i + 3) % 3]);
  expect(ys[1] - ys[0]).toBeCloseTo(10);
  expect(ys[2] - ys[1]).toBeCloseTo(10);
  handleEvent(fx, 'roomStart', w);                                   // a new attempt starts a fresh trail
  expect(fx.trail.count).toBe(0);
  expect(fx.trail.has).toBe(false);
});

test('a title tap starts the logo flip timer', () => {
  const fx = createEffects(theme);
  expect(titleFlipValue(fx)).toBe(1);                                // F upside down at rest
  handleEvent(fx, 'titleTap', liveWorld());
  expect(fx.titleFlip).toBe(config.timing.titleFlipTime);           // same clock game.js waits on
  expect(fx.titleFlipped).toBe(false);
});

test('a tap mid-flip reverses from the current angle, with no jump', () => {
  const fx = createEffects(theme);
  const w = liveWorld();
  handleEvent(fx, 'toTitle', w);
  updateEffects(fx, config.timing.titleFlipTime / 4, w);             // a quarter in (ease-out back overshoots past halfway)
  const before = titleFlipValue(fx);
  expect(before).toBeGreaterThan(0);
  expect(before).toBeLessThan(1);
  handleEvent(fx, 'titleTap', w);
  expect(titleFlipValue(fx)).toBeCloseTo(before, 6);
  updateEffects(fx, config.timing.titleFlipTime, w);
  expect(titleFlipValue(fx)).toBe(1);
});

import { drawHud, drawTabular, formatTime } from '../src/view/art/hud.js';

test('formatTime shows tenths like the canvas', () => {
  expect(formatTime(62_799)).toBe('1:02.7');
  expect(formatTime(600_000)).toBe('10:00.0');
});

test('drawTabular puts every character in its own slot, centred on cx', () => {
  const ctx = recordingCtx();
  ctx.font = `700 15px ${theme.font.family}`;
  drawTabular(ctx, '0:18.4', 180, 24);
  const xs = calls(ctx, 'fillText').map((e) => e.args[1]);
  expect(calls(ctx, 'fillText').map((e) => e.args[0])).toEqual(['0', ':', '1', '8', '.', '4']);
  expect(xs.reduce((a, b) => a + b, 0) / xs.length).toBeCloseTo(180);
  for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
});

test('HUD row: room left, tabular timer centre, deaths right, canvas sizes', () => {
  const ctx = recordingCtx();
  drawHud(ctx, { room: 1, rooms: 2, timeMs: 18_400, deaths: 2, roomPop: 0 }, theme);
  const texts = calls(ctx, 'fillText');
  const room = texts.find((e) => e.args[0] === '1 / 2');
  const deaths = texts.find((e) => e.args[0] === '× 2');
  expect(room.font).toBe(`700 13px ${theme.font.family}`);
  expect(deaths.font).toBe(`700 13px ${theme.font.family}`);
  expect(deaths.args[1]).toBe(340);
  expect(texts.filter((e) => e.font === `700 15px ${theme.font.family}`).map((e) => e.args[0]).join('')).toBe('0:18.4');
});

test('the room number pops while roomPop runs', () => {
  const ctx = recordingCtx();
  drawHud(ctx, { room: 1, rooms: 2, timeMs: 0, deaths: 0, roomPop: theme.fx.roomPopTime / 2 }, theme);
  const s = calls(ctx, 'scale')[0].args[0];
  expect(s).toBeCloseTo(1.3);                                          // sin(π/2) peak
});

import { drawLogo } from '../src/view/art/logo.js';
import { drawTitle, drawWin } from '../src/view/screens.js';

const fontOf = (ctx, text) => calls(ctx, 'fillText').find((e) => e.args[0] === text)?.font;

test('logo: F l i p drawn letter by letter at 800 96 px, F rotated by flip × π', () => {
  const ctx = recordingCtx();
  drawLogo(ctx, 180, 298, 96, 1, theme);
  expect(calls(ctx, 'fillText').map((e) => e.args[0])).toEqual(['F', 'l', 'i', 'p']);
  expect(fontOf(ctx, 'F')).toBe(`800 96px ${theme.font.family}`);
  expect(calls(ctx, 'rotate')[0].args[0]).toBeCloseTo(Math.PI);
  const mid = recordingCtx();
  drawLogo(mid, 180, 298, 96, 0.5, theme);
  expect(calls(mid, 'rotate')[0].args[0]).toBeCloseTo(Math.PI / 2);
  const up = recordingCtx();
  drawLogo(up, 180, 298, 96, false, theme);
  expect(calls(up, 'rotate')).toHaveLength(0);
});

test('logo tracking is −2 between letters', () => {
  const ctx = recordingCtx();
  drawLogo(ctx, 180, 298, 96, 0, theme);
  const xs = calls(ctx, 'fillText').map((e) => e.args[1]);
  const w = 96 * 0.55;                                              // fake measureText: one glyph = size × 0.55
  expect(xs[2] - xs[1]).toBeCloseTo(w - 2);
});

function titleGame(best = null) { return { best }; }
function titleFx() { return { titleFlipped: true, titleFlip: 0, time: 0 }; }

test('title: four idle hooks with faint rings, copy per canvas', () => {
  const ctx = recordingCtx();
  drawTitle(ctx, titleGame(), titleFx(), theme);
  const rings = calls(ctx, 'stroke').filter((e) => e.alpha === 0.12);
  expect(rings).toHaveLength(4);
  const discs = calls(ctx, 'fill').filter((e) => e.fill === '#6FA8DC' || e.fill === '#E27D7D');
  expect(discs).toHaveLength(4);
  expect(fontOf(ctx, 'tap to start')).toBe(`700 16px ${theme.font.family}`);
  const best = calls(ctx, 'fillText').find((e) => e.args[0] === 'best —');
  expect(best.font).toBe(`400 13px ${theme.font.family}`);
  expect(best.alpha).toBe(0.7);
});

test('title shows a stored best time', () => {
  const ctx = recordingCtx();
  drawTitle(ctx, titleGame(62_799), titleFx(), theme);
  expect(calls(ctx, 'fillText').some((e) => e.args[0] === 'best 1:02.7')).toBe(true);
});

function winGame(newBest) { return { lastTimeMs: 62_799, deaths: 4, best: 62_799, newBest }; }

test('win: Cleared, rounded neutral panel with three rows, New best only when beaten', () => {
  const ctx = recordingCtx();
  drawWin(ctx, winGame(true), theme);
  expect(fontOf(ctx, 'Cleared')).toBe(`800 44px ${theme.font.family}`);
  const panel = calls(ctx, 'roundRect')[0];
  expect(panel.args[0]).toBe(40);
  expect(panel.args[2]).toBe(280);
  expect(panel.args[4]).toBe(16);
  expect(calls(ctx, 'fill').some((e) => e.fill === '#A9A4B5')).toBe(true);
  for (const label of ['Time', 'Deaths', 'Best']) expect(fontOf(ctx, label)).toBe(`400 15px ${theme.font.family}`);
  expect(fontOf(ctx, 'New best')).toBe(`700 13px ${theme.font.family}`);
  expect(fontOf(ctx, 'tap to return')).toBe(`700 16px ${theme.font.family}`);

  const plain = recordingCtx();
  drawWin(plain, winGame(false), theme);
  expect(calls(plain, 'fillText').some((e) => e.args[0] === 'New best')).toBe(false);
  const y = (c) => calls(c, 'fillText').find((e) => e.args[0] === 'tap to return').args[2];
  expect(y(plain)).toBe(y(ctx));                                    // no layout jump
});

import { makeRig } from './scenes.js';
import { applyPose } from '../src/view/debug/poses.js';

test('room1 pose matches the Room 1 artboard state', () => {
  const { game, fx, draw } = makeRig();
  expect(applyPose('room1', game, fx)).toBe(true);
  const w = game.world, p = w.player;
  expect(game.state).toBe('playing');
  expect(w.roomIndex).toBe(0);
  expect(p.latched).toBe(w.room.hookPoints[0]);
  expect(p.pos.x).toBeCloseTo(131.21, 1);
  expect(p.pos.y).toBeCloseTo(448.79, 1);
  expect(game.runTime).toBeCloseTo(18.4);
  const ctx = recordingCtx();
  draw(ctx);
  expect(calls(ctx, 'fillRect').some((e) => e.fill === '#26252E' && e.args[1] === 260 && e.args[2] === 360)).toBe(true);
});

test('room2, title and win poses render; unknown names are refused', () => {
  for (const name of ['room2', 'title', 'win']) {
    const { game, fx, draw } = makeRig();
    expect(applyPose(name, game, fx)).toBe(true);
    expect(() => draw(recordingCtx())).not.toThrow();
  }
  const { game, fx } = makeRig();
  expect(applyPose('nope', game, fx)).toBe(false);
});

// Canvas side-by-side (Task 8): CSS centres each text's line box, so the baseline sits at
// centre + (fontAscent − fontDescent) / 2. Baloo 2 at 13 px: ascent 14, descent 7 → +3.5.
const BALOO = { ascent: 14 / 13, descent: 7 / 13 };

test('HUD text sits on the canvas baseline: line box centred on the row', () => {
  const ctx = recordingCtx(BALOO);
  drawHud(ctx, { room: 1, rooms: 2, timeMs: 18_400, deaths: 2, roomPop: 0 }, theme);
  const deaths = calls(ctx, 'fillText').find((e) => e.args[0] === '× 2');
  expect(deaths.args[2]).toBeCloseTo(27.5);                          // 24 + (14 − 7) / 2
  expect(ctx.textBaseline).toBe('alphabetic');
});

test('title and win text use the same line-box centring', () => {
  const ctx = recordingCtx(BALOO);
  drawWin(ctx, winGame(true), theme);
  const cleared = calls(ctx, 'fillText').find((e) => e.args[0] === 'Cleared');
  expect(cleared.args[2]).toBeCloseTo(190 + 44 * 1.6 / 2 + 44 * (BALOO.ascent - BALOO.descent) / 2);
});
