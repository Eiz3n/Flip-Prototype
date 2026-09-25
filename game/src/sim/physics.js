// Forces and integration. Formulas: wiki/concepts/polarity-force-model.md.
// Mass is 1, so every force here is an acceleration. Nothing in this file allocates per call.
import { wallPolAt } from './wave.js';
import { clampLen, rotate } from './vec.js';

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

// ── Latch, orbit, launch ── wiki/concepts/latch-orbit-launch.md

const DEG = Math.PI / 180;

function placeOnOrbit(player, cfg) {
  const h = player.latched;
  const r = cfg.orbitRadius;
  const c = Math.cos(player.theta), s = Math.sin(player.theta);
  player.pos.x = h.pos.x + r * c;
  player.pos.y = h.pos.y + r * s;
  const w = player.orbitDir * player.omega * r;
  player.vel.x = -w * s;
  player.vel.y = w * c;
}

export function tryLatch(state) {
  const { cfg, room, player } = state;
  const p = player.pos;
  const r2 = cfg.latchRadius * cfg.latchRadius;
  for (const h of room.hookPoints) {
    if (h.cooldown > 0 || player.pol * h.pol !== -1) continue;
    const dx = p.x - h.pos.x, dy = p.y - h.pos.y;
    if (dx * dx + dy * dy >= r2) continue;
    const theta = Math.atan2(dy, dx);
    const vt = -player.vel.x * Math.sin(theta) + player.vel.y * Math.cos(theta);
    player.latched = h;
    player.theta = theta;
    player.orbitDir = vt >= 0 ? 1 : -1;
    player.omega = Math.min(Math.max(Math.abs(vt) / cfg.orbitRadius, room.minOrbitSpeed), cfg.maxOrbitSpeed);
    player.bufferHook = null;
    player.bufferEntry = false;
    player.bufferedTap = false;
    placeOnOrbit(player, cfg);
    return h;
  }
  return null;
}

export function orbitStep(state, dt) {
  const { cfg, room, player } = state;
  const min = room.minOrbitSpeed;
  player.omega = min + (player.omega - min) * Math.exp(-cfg.orbitDrag * dt);
  player.theta += player.orbitDir * player.omega * dt;
  placeOnOrbit(player, cfg);
}

function angleDiff(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

// Rotate the launch velocity up to launchAssist degrees toward the best-aligned target, if one
// lies within the cone. Targets: the exit mouth, and every hook point within maxReach that will
// attract the player after the flip (opposite colour to the hook being left). Never the one left.
function applyLaunchAssist(state, from) {
  const { cfg, room, player } = state;
  if (cfg.launchAssist <= 0) return;
  const p = player.pos, v = player.vel;
  const heading = Math.atan2(v.y, v.x);
  const reach2 = cfg.maxReach * cfg.maxReach;
  let best = angleDiff(heading, Math.atan2(cfg.shaft.exitMouthY - p.y, room.exitX - p.x));
  for (const h of room.hookPoints) {
    if (h === from || h.pol === from.pol) continue;
    const dx = h.pos.x - p.x, dy = h.pos.y - p.y;
    if (dx * dx + dy * dy > reach2) continue;
    const d = angleDiff(heading, Math.atan2(dy, dx));
    if (Math.abs(d) < Math.abs(best)) best = d;
  }
  if (Math.abs(best) > cfg.launchAssistCone * DEG) return;
  const max = cfg.launchAssist * DEG;
  rotate(v, Math.max(-max, Math.min(max, best)));
}

// Latency compensation (TDD rule 6) aims the launch from the angle inputLatencyComp seconds ago.
// The player stays where it is on the orbit, so there is no visible jump backwards.
export function launch(state) {
  const { cfg, player } = state;
  const h = player.latched;
  const r = cfg.orbitRadius;
  player.pos.x = h.pos.x + r * Math.cos(player.theta);
  player.pos.y = h.pos.y + r * Math.sin(player.theta);
  const aim = player.theta - player.orbitDir * player.omega * cfg.inputLatencyComp;
  const c = Math.cos(aim), s = Math.sin(aim);
  const w = player.orbitDir * player.omega * r;
  player.vel.x = -w * s + cfg.launchImpulse * c;
  player.vel.y = w * c + cfg.launchImpulse * s;
  applyLaunchAssist(state, h);
  clampLen(player.vel, cfg.maxSpeed);
  player.pol = -player.pol;
  player.latched = null;
  h.cooldown = cfg.relatchCooldown;
  player.bufferHook = h;
  player.bufferedTap = false;
}
