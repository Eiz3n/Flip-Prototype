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
    game.stageTime = 18.4;
    game.stageDeaths = 2;
    fx.trail.count = 0;
  },
  room2(game, fx) {
    const w = room(game, 1, 430);
    const p = w.player;
    p.pol = -1;
    p.latched = null;
    place(p, 265, 540);
    const tr = fx.trail;
    [572, 563, 553, 543].forEach((y, i) => { tr.x[i] = 265; tr.y[i] = y; tr.pol[i] = -1; });
    tr.head = 0; tr.count = 4;                         // newest (index 3, under the player) is not drawn
    game.stageTime = 41.9;
    game.stageDeaths = 3;
  },
  title(game, fx) {
    game.state = 'title';
    game.progress = { stages: { 1: { bestMs: 21_300, stars: 2 }, 2: { bestMs: 13_400, stars: 3 } } };
    fx.time = 0;
    fx.titleFlipped = true;
    fx.titleFlip = 0;
  },
  select(game) {
    game.state = 'select';
    game.selected = 0;
    game.selectFlip = 0;
    game.progress = { stages: { 1: { bestMs: 13_400, stars: 2 } } };
  },
  stage(game) {
    game.state = 'stageClear';
    game.stageIndex = 1;
    game.stageResults = [{ stage: 1, timeMs: 21_300, deaths: 1, stars: 2, newBest: false }, { stage: 2, timeMs: 13_400, deaths: 1, stars: 2, newBest: true }];
  },
  win(game) {
    game.state = 'win';
    game.stageResults = [
      { stage: 1, timeMs: 21_300, deaths: 1, stars: 2, newBest: false },
      { stage: 2, timeMs: 13_400, deaths: 1, stars: 2, newBest: false },
      { stage: 3, timeMs: 28_000, deaths: 2, stars: 1, newBest: true },
    ];
  },
};

export function applyPose(name, game, fx) {
  const pose = poses[name];
  if (!pose) return false;
  fx.time = 0;
  pose(game, fx);
  return true;
}
