// The only place events turn into juice. Timers and particles only; art modules draw them.
// Art plan: change timings in theme.fx, looks in view/art/*, and add new cases here.
import { createParticles, spawn, burst, updateParticles } from '../particles.js';

function polColor(theme, pol) { return pol > 0 ? theme.color.positive : theme.color.negative; }

function requestShake(fx, s) {
  if (s.amount >= fx.shakeRequest.amount) {
    fx.shakeRequest.amount = s.amount;
    fx.shakeRequest.time = s.time;
  }
}

function nearestSolid(world) {
  const p = world.player.pos;
  let best = null, bestD = Infinity;
  for (const o of world.room.solids) {
    const d = Math.hypot(p.x - o.pos.x, p.y - o.pos.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

function tickMap(map, dt) {
  for (const [key, t] of map) {
    if (t - dt <= 0) map.delete(key);
    else map.set(key, t - dt);
  }
}

export function createEffects(theme) {
  const n = theme.fx.trailDots;
  return {
    theme,
    time: 0,
    particles: createParticles(),
    trail: { x: new Float32Array(n), y: new Float32Array(n), pol: new Int8Array(n), count: 0, head: 0, timer: 0 },
    flipRing: { t: 0 },
    latchPop: new Map(),          // HookPoint → seconds left
    obstacleFlash: new Map(),     // Obstacle → seconds left
    roomPop: 0,
    titleFlipped: true,           // logo starts with the F upside down
    shakeRequest: { amount: 0, time: 0 },
  };
}

export function handleEvent(fx, type, world) {
  const f = fx.theme.fx;
  const p = world.player;
  switch (type) {
    case 'flip':
      fx.flipRing.t = f.flipRingTime;
      break;
    case 'latch':
      if (p.latched) fx.latchPop.set(p.latched, f.latchPopTime);
      break;
    case 'launch': {
      const sp = Math.hypot(p.vel.x, p.vel.y) || 1;
      const bx = -p.vel.x / sp, by = -p.vel.y / sp;
      const n = f.launchPuffCount;
      for (let i = 0; i < n; i++) {
        const a = (n > 1 ? i / (n - 1) - 0.5 : 0) * f.launchPuffSpread;
        const c = Math.cos(a), s = Math.sin(a);
        const vx = (bx * c - by * s) * f.launchPuffSpeed;
        const vy = (bx * s + by * c) * f.launchPuffSpeed;
        spawn(fx.particles, p.pos.x, p.pos.y, vx, vy, f.particleLife, polColor(fx.theme, p.pol), f.particleSize);
      }
      break;
    }
    case 'entryLaunch':
      requestShake(fx, f.entryShake);
      break;
    case 'obstacleHit': {
      const o = nearestSolid(world);
      if (o) fx.obstacleFlash.set(o, f.obstacleFlashTime);
      break;
    }
    case 'death':
      burst(fx.particles, p.pos.x, p.pos.y, f.deathBurstCount, f.deathBurstSpeed, f.particleLife,
        polColor(fx.theme, p.pol), f.particleSize);
      requestShake(fx, f.deathShake);
      break;
    case 'exitCaptured':
      fx.roomPop = f.roomPopTime;
      break;
    case 'roomStart':
      fx.trail.count = 0;
      fx.latchPop.clear();
      fx.obstacleFlash.clear();
      break;
    case 'titleTap':
    case 'toTitle':
      fx.titleFlipped = !fx.titleFlipped;
      break;
    default:
      break;
  }
}

export function updateEffects(fx, dt, world) {
  fx.time += dt;
  fx.flipRing.t = Math.max(0, fx.flipRing.t - dt);
  fx.roomPop = Math.max(0, fx.roomPop - dt);
  tickMap(fx.latchPop, dt);
  tickMap(fx.obstacleFlash, dt);
  updateParticles(fx.particles, dt);

  const tr = fx.trail, p = world.player;
  tr.timer -= dt;
  if (tr.timer <= 0 && p.alive && world.phase === 'live') {
    tr.timer = fx.theme.fx.trailInterval;
    tr.x[tr.head] = p.pos.x;
    tr.y[tr.head] = p.pos.y;
    tr.pol[tr.head] = p.pol;
    tr.head = (tr.head + 1) % tr.x.length;
    tr.count = Math.min(tr.count + 1, tr.x.length);
  }
}
