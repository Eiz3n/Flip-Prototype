// DEV ONLY. Freezes a scene that matches one Flip Art artboard, for side-by-side comparison.
// Deliberately writes into game and world state; main.js only loads this in dev builds.
import { startRoom } from '../../sim/world.js';

function room(game, index, frontY) {
  const w = game.world;
  startRoom(w, index, 0);
  w.phase = 'live';
  game.state = 'playing';
  game.stateTime = 0;
  const r = w.room;
  r.time = (frontY / r.height) * r.wave.period;
  for (const h of r.hookPoints) { h.pos.x = h.home.x; h.pos.y = h.home.y; }
  w.player.bufferEntry = false;
  return w;
}

function place(p, x, y) {
  p.pos.x = p.prev.x = x;
  p.pos.y = p.prev.y = y;
  p.vel.x = 0; p.vel.y = 0;
}

const poses = {
  room1(game, fx) {
    const w = room(game, 0, 260);
    const p = w.player, h = w.room.hookPoints[0];
    p.pol = +1;
    p.latched = h;
    p.theta = -Math.PI / 4;
    p.omega = w.room.minOrbitSpeed;
    place(p, h.pos.x + 30 * Math.cos(p.theta), h.pos.y + 30 * Math.sin(p.theta));
    game.runTime = 18.4;
    game.deaths = 2;
    fx.trail.count = 0;
  },
  room2(game, fx) {
    const w = room(game, 1, 430);
    const p = w.player;
    p.pol = -1;
    p.latched = null;
    place(p, 265, 540);
    const tr = fx.trail;
    [572, 563, 553].forEach((y, i) => { tr.x[i] = 265; tr.y[i] = y; tr.pol[i] = -1; });
    tr.head = 0; tr.count = 3;                         // newest = index 2 = y 553
    game.runTime = 41.9;
    game.deaths = 3;
  },
  title(game, fx) {
    game.state = 'title';
    game.best = null;
    fx.time = 0;
    fx.titleFlipped = true;
    fx.titleFlip = 0;
  },
  win(game) {
    game.state = 'win';
    game.lastTimeMs = 62_700;
    game.deaths = 4;
    game.best = 62_700;
    game.newBest = true;
  },
};

export function applyPose(name, game, fx) {
  const pose = poses[name];
  if (!pose) return false;
  fx.time = 0;
  pose(game, fx);
  return true;
}
