// Forces and integration. Formulas: wiki/concepts/polarity-force-model.md.
// Mass is 1, so every force here is an acceleration. Nothing in this file allocates per call.
import { wallPolAt } from './wave.js';
import { clampLen } from './vec.js';

const acc = { x: 0, y: 0 };

// Hook fields and the exit pull. Returns true if the player is inside any of them.
export function fieldAccel(state, out) {
  const { cfg, room, player } = state;
  const p = player.pos;
  out.x = 0; out.y = 0;
  let inside = false;

  for (const h of room.hookPoints) {
    const dx = h.pos.x - p.x, dy = h.pos.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= h.fieldRadius) continue;
    inside = true;
    if (d === 0) continue;
    const m = Math.max(d, cfg.dMin);
    // F = -k·p_player·p_hook·d̂/m², d̂ from player to hook: opposite colours attract
    const s = (-cfg.k * player.pol * h.pol) / (m * m * d);
    out.x += s * dx; out.y += s * dy;
  }

  // Exit pull (spec §6.1): hook force with the product fixed at −1, only below the mouth
  const mouthY = cfg.shaft.exitMouthY;
  const dx = room.exitX - p.x, dy = mouthY - p.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (p.y > mouthY && d < cfg.exitFieldRadius) {
    inside = true;
    if (d > 0) {
      const m = Math.max(d, cfg.dMin);
      const s = cfg.k / (m * m * d);
      out.x += s * dx; out.y += s * dy;
    }
  }
  return inside;
}

export function graceScale(player, cfg) {
  const t = player.graceTimer;
  if (t <= 0) return 1;
  if (t >= cfg.waveGraceRamp) return 0;
  return 1 - t / cfg.waveGraceRamp;
}

export function wallAccelX(state, wallPol) {
  const { cfg, player } = state;
  const inner = cfg.room.wallBand;
  const W = cfg.room.width - 2 * inner;
  const x = player.pos.x - inner;
  let ax;
  if (player.pol !== wallPol) {
    // Pull toward the nearer wall
    const l = Math.max(x, cfg.dMin), r = Math.max(W - x, cfg.dMin);
    ax = -cfg.kWall * (1 / (l * l) - 1 / (r * r));
  } else {
    // Cushion: damp only motion toward the nearer wall, plus a weak push to centre
    const toward = x < W / 2 ? -1 : 1;
    const damp = player.vel.x * toward > 0 ? -cfg.wallDamping * player.vel.x : 0;
    ax = damp - (cfg.centerPush * (x - W / 2)) / (W / 2);
  }
  return ax * graceScale(player, cfg);
}

export function applyUpdraft(vel, dt, cfg) {
  let up = -vel.y;
  if (up < cfg.riseSpeed) up += (cfg.riseSpeed - up) * (1 - Math.exp(-cfg.updraftGain * dt));
  else up = cfg.riseSpeed + (up - cfg.riseSpeed) * Math.exp(-cfg.drag * dt);
  vel.y = -up;
  vel.x *= Math.exp(-cfg.drag * dt);
}

// Hard clamp: a cushioned player may not cross the safeGap line this step.
function enforceSafeGap(player, cfg, xBefore) {
  const left = cfg.room.wallBand + player.radius + cfg.safeGap;
  const right = cfg.room.width - cfg.room.wallBand - player.radius - cfg.safeGap;
  const p = player.pos, v = player.vel;
  if (p.x < left && v.x < 0) { v.x = 0; if (xBefore >= left) p.x = left; }
  if (p.x > right && v.x > 0) { v.x = 0; if (xBefore <= right) p.x = right; }
}

export function freeFlightStep(state, dt) {
  const { cfg, room, player } = state;
  const v = player.vel, p = player.pos;

  const wallPol = wallPolAt(room, p.y);
  const inField = fieldAccel(state, acc);
  if (!inField && player.lastWallPol !== 0 && wallPol !== player.lastWallPol) {
    player.graceTimer = cfg.waveGrace + cfg.waveGraceRamp;
  }
  player.lastWallPol = wallPol;
  player.inField = inField;

  if (inField) {
    v.x += acc.x * dt;
    v.y += acc.y * dt;
  } else {
    v.x += wallAccelX(state, wallPol) * dt;
    applyUpdraft(v, dt, cfg);
  }
  clampLen(v, cfg.maxSpeed);

  const xBefore = p.x;
  p.x += v.x * dt;
  p.y += v.y * dt;
  if (!inField && player.pol === wallPol) enforceSafeGap(player, cfg, xBefore);

  if (player.graceTimer > 0) player.graceTimer = Math.max(0, player.graceTimer - dt);
}
