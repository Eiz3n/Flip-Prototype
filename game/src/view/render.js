// Draw order for one frame. ctx is in logical units (360 × 640). Never mutates game or world.
import { config } from '../config.js';
import { theme } from '../theme.js';
import { frontY, wallPolAt } from '../sim/wave.js';
import { drawWalls } from './art/walls.js';
import { drawExitDoorway, drawEntryHatch } from './art/shaft.js';
import { drawHookPoint } from './art/hookPoint.js';
import { drawPlayer, drawTether } from './art/player.js';
import { drawObstacle } from './art/obstacle.js';
import { drawUpdraft } from './art/updraft.js';
import { drawHud } from './art/hud.js';
import { drawParticles } from './particles.js';
import { drawTitle, drawSelect, drawStageClear, drawWin } from './screens.js';

const wave = { frontY: -1, polAbove: 1, polBelow: 1 };
const hud = { room: 1, rooms: 1, timeMs: 0, deaths: 0, roomPop: 0 };

function readWave(room) {
  const w = room.wave;
  if (!w.enabled) {
    wave.frontY = -1;
    wave.polAbove = wave.polBelow = w.startPol;
    return wave;
  }
  const f = frontY(room.time, w.period, room.height);
  wave.frontY = f;
  wave.polAbove = wallPolAt(room, Math.max(0, f - 0.5));
  wave.polBelow = wallPolAt(room, Math.min(room.height, f + 0.5));
  return wave;
}

function drawRoom(ctx, room, player, fx, current) {
  drawUpdraft(ctx, fx.time, theme);
  drawWalls(ctx, room, readWave(room), theme);
  drawExitDoorway(ctx, room.exitX, fx.time, theme);
  drawEntryHatch(ctx, room.entryX, fx.time, theme);
  const flashTime = theme.fx.obstacleFlashTime;
  for (const o of room.obstacles) drawObstacle(ctx, o, (fx.obstacleFlash.get(o) ?? 0) / flashTime, theme);
  for (const o of room.posts) {
    const t = fx.obstacleFlash.get(o);
    if (t) drawObstacle(ctx, o, t / flashTime, theme);           // redraw a hit post with its flash
  }
  for (const h of room.hookPoints) {
    const inside = current && Math.hypot(player.pos.x - h.pos.x, player.pos.y - h.pos.y) < h.fieldRadius;
    const pop = (fx.latchPop.get(h) ?? 0) / theme.fx.latchPopTime;
    drawHookPoint(ctx, h, inside, pop, theme);
  }
}

export function renderFrame(ctx, game, fx, cam, alpha) {
  const R = config.room;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, R.width, R.height);
  ctx.clip();
  ctx.fillStyle = theme.color.background;
  ctx.fillRect(0, 0, R.width, R.height);

  if (game.state === 'title') {
    drawTitle(ctx, game, fx, theme);
    ctx.restore();
    return;
  }
  if (game.state === 'select') {
    drawSelect(ctx, game, theme);
    ctx.restore();
    return;
  }
  if (game.state === 'stageClear') {
    drawStageClear(ctx, game, theme);
    ctx.restore();
    return;
  }
  if (game.state === 'win') {
    drawWin(ctx, game, theme);
    ctx.restore();
    return;
  }

  const world = game.world;
  const p = world.player;
  ctx.translate(cam.offsetX, -cam.y + cam.offsetY);

  // Stage start: the select screen slides down and out while the stage's first room comes in
  // from above, the same camera move as a room transition.
  if (game.state === 'stageStart') {
    drawSelect(ctx, game, theme);
    ctx.translate(0, -R.height);
    drawRoom(ctx, world.room, p, fx, false);
    ctx.restore();
    return;
  }

  drawRoom(ctx, world.room, p, fx, true);
  const next = world.rooms[world.roomIndex + 1];
  if (game.state === 'transition' && next) {
    ctx.save();
    ctx.translate(0, -R.height);
    drawRoom(ctx, next, p, fx, false);
    ctx.restore();
  }

  drawParticles(ctx, fx.particles);
  if (p.alive) {
    const x = p.prev.x + (p.pos.x - p.prev.x) * alpha;
    const y = p.prev.y + (p.pos.y - p.prev.y) * alpha;
    if (p.latched) drawTether(ctx, x, y, p.latched, theme);
    drawPlayer(ctx, x, y, p, fx, theme);
  }
  ctx.restore();

  hud.room = world.roomIndex + 1;
  hud.rooms = world.rooms.length;
  hud.timeMs = Math.round(game.stageTime * 1000);   // stage time and deaths: what the stars rate
  hud.deaths = game.stageDeaths;
  hud.roomPop = fx.roomPop;
  drawHud(ctx, hud, theme);
}
