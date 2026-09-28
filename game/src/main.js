// Boot: canvas + DPR-capped letterbox, fixed-step loop, visibility pause.
import { config } from './config.js';
import { theme } from './theme.js';
import { LEVELS, STAGES } from './levels/index.js';
import { validateLevels, validateStages } from './levels/validate.js';
import { createGame, tap, changeStage, update } from './game.js';
import { bindInput } from './input.js';
import { createCamera, shake, updateCamera } from './view/camera.js';
import { createEffects, handleEvent, updateEffects } from './view/anim/effects.js';
import { renderFrame } from './view/render.js';
import { loadFonts } from './view/fonts.js';

if (import.meta.env.DEV) {
  validateLevels(LEVELS, config);
  validateStages(STAGES, LEVELS);
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const view = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };

function safeStorage() {
  try { return window.localStorage; } catch { return null; }
}

const fx = createEffects(theme);
const cam = createCamera();
const game = createGame({
  levels: LEVELS,
  stages: STAGES,
  cfg: config,
  storage: safeStorage(),
  onEvent: (e) => handleEvent(fx, e, game.world),
});

// Dev-only visual tools: ?pose=title|select|room1|room2|stage|win freezes a canvas scene; ?cb=protan|deutan|tritan.
let posed = false;
if (import.meta.env.DEV) {
  const params = new URLSearchParams(location.search);
  if (params.has('pose')) {
    const { applyPose } = await import('./view/debug/poses.js');
    posed = applyPose(params.get('pose'), game, fx);
  }
  if (params.has('cb')) {
    const { applyColourBlindFilter } = await import('./view/debug/colourBlind.js');
    applyColourBlindFilter(canvas, params.get('cb'));
  }
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, theme.render.maxDpr);
  // The canvas box, not the window: body padding keeps it inside the safe area.
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const R = config.room;
  view.scale = Math.min(w / R.width, h / R.height);
  view.offsetX = (w - R.width * view.scale) / 2;
  view.offsetY = (h - R.height * view.scale) / 2;
  view.dpr = dpr;
}

function draw(alpha) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = theme.color.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const s = view.scale * view.dpr;
  ctx.setTransform(s, 0, 0, s, view.offsetX * view.dpr, view.offsetY * view.dpr);
  renderFrame(ctx, game, fx, cam, alpha);
}

let last = 0, acc = 0, running = false, rafId = 0;

function frame(now) {
  // The first rAF timestamp can be earlier than the performance.now() taken in start().
  const dt = Math.max(0, Math.min((now - last) / 1000, config.maxFrameDelta));
  last = now;
  acc += dt;
  if (posed) {
    acc = 0;
  } else {
    while (acc >= config.step) {
      update(game, config.step);
      updateEffects(fx, config.step * game.timeScale, game.world);
      acc -= config.step;
    }
  }
  if (fx.shakeRequest.time > 0) {
    shake(cam, fx.shakeRequest.amount, fx.shakeRequest.time);
    fx.shakeRequest.amount = 0;
    fx.shakeRequest.time = 0;
  }
  updateCamera(cam, game, dt);
  draw(acc / config.step);
  rafId = requestAnimationFrame(frame);
}

function start() {
  if (running) return;
  running = true;
  last = performance.now();
  acc = 0;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  cancelAnimationFrame(rafId);
}

window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
resize();
// Client position → room units (the letterbox offset and scale set in resize()).
function toRoom(p) {
  if (!p) return null;
  const r = canvas.getBoundingClientRect();
  return { x: (p.x - r.left - view.offsetX) / view.scale, y: (p.y - r.top - view.offsetY) / view.scale };
}

bindInput(canvas, window, (p) => { if (!posed) tap(game, toRoom(p)); }, (dir) => { if (!posed) changeStage(game, dir); });
loadFonts(theme.font).finally(start);
