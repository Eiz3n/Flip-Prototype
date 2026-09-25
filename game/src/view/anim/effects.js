// The only place events turn into juice. Timers and particles only; art modules draw them.
// Art plan: change timings in theme.fx, looks in view/art/*, and add new cases here.
import { config } from '../../config.js';
import { createParticles, spawn, updateParticles } from '../particles.js';
import { easeOutBack } from './ease.js';

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
    trail: {
      x: new Float32Array(n), y: new Float32Array(n), pol: new Int8Array(n),
      count: 0, head: 0, lastX: 0, lastY: 0, has: false,
    },
    flipRing: { t: 0 },
    latchPop: new Map(),          // HookPoint → seconds left
    obstacleFlash: new Map(),     // Obstacle → seconds left
    roomPop: 0,
    titleFlipped: true,           // logo starts with the F upside down
    titleFlip: 0,                 // seconds left on the logo's F rotation
    titleFlipFrom: 1,             // turn value the current flip started from (1 = F upside down)
    shakeRequest: { amount: 0, time: 0 },
  };
}

// The logo F's current turn: 0 = upright, 1 = upside down. Eases from wherever the last flip
// started, so a tap mid-flip reverses smoothly instead of jumping to the other end.
export function titleFlipValue(fx) {
  const to = fx.titleFlipped ? 1 : 0;
  if (fx.titleFlip <= 0) return to;
  const p = 1 - fx.titleFlip / config.timing.titleFlipTime;
  return fx.titleFlipFrom + (to - fx.titleFlipFrom) * easeOutBack(p);
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
      // Canvas "Launch puff": four ink dots of falling size and alpha, fanned behind the launch.
      const sp = Math.hypot(p.vel.x, p.vel.y) || 1;
      const bx = -p.vel.x / sp, by = -p.vel.y / sp;
      const n = f.launchPuffCount;
      for (let i = 0; i < n; i++) {
        const a = (n > 1 ? i / (n - 1) - 0.5 : 0) * f.launchPuffSpread;
        const c = Math.cos(a), s = Math.sin(a);
        const speed = f.launchPuffSpeed * (1 - 0.15 * i);
        spawn(fx.particles, p.pos.x, p.pos.y,
          (bx * c - by * s) * speed, (bx * s + by * c) * speed,
          f.launchPuffLife, fx.theme.color.ink, f.launchPuffRadii[i], f.launchPuffAlphas[i]);
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
    case 'death': {
      // Canvas "Death burst": a ring of six, then two inner dots; ink and player colour alternate.
      const n = f.deathBurstCount, ring = n - 2;
      const pc = polColor(fx.theme, p.pol), ink = fx.theme.color.ink;
      for (let i = 0; i < n; i++) {
        const inner = i >= ring;
        const a = inner ? (i - ring) * Math.PI : (i / ring) * Math.PI * 2 - Math.PI / 2;
        const speed = f.deathBurstSpeed * (inner ? f.deathBurstInnerSpeed : 1);
        spawn(fx.particles, p.pos.x, p.pos.y, Math.cos(a) * speed, Math.sin(a) * speed,
          f.particleLife, i % 2 === 0 ? ink : pc, f.deathBurstRadii[i], f.deathBurstAlpha);
      }
      requestShake(fx, f.deathShake);
      break;
    }
    case 'exitCaptured':
      fx.roomPop = f.roomPopTime;
      break;
    case 'roomStart':
      fx.trail.count = 0;
      fx.trail.has = false;
      fx.latchPop.clear();
      fx.obstacleFlash.clear();
      break;
    case 'titleTap':
    case 'toTitle':
      fx.titleFlipFrom = titleFlipValue(fx);        // start from the current angle
      fx.titleFlipped = !fx.titleFlipped;
      fx.titleFlip = config.timing.titleFlipTime;   // game.js starts the run when this runs out
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

  fx.titleFlip = Math.max(0, fx.titleFlip - dt);

  // Trail: one sample every trailSpacing units of travel while flying.
  const tr = fx.trail, p = world.player, spacing = fx.theme.fx.trailSpacing;
  if (!p.alive || world.phase !== 'live') return;
  if (!tr.has) {
    tr.lastX = p.pos.x; tr.lastY = p.pos.y; tr.has = true;
    return;
  }
  const dx = p.pos.x - tr.lastX, dy = p.pos.y - tr.lastY;
  if (dx * dx + dy * dy < spacing * spacing) return;
  tr.lastX = p.pos.x; tr.lastY = p.pos.y;
  tr.x[tr.head] = p.pos.x;
  tr.y[tr.head] = p.pos.y;
  tr.pol[tr.head] = p.pol;
  tr.head = (tr.head + 1) % tr.x.length;
  tr.count = Math.min(tr.count + 1, tr.x.length);
}
