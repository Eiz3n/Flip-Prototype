// Collision and room-exit checks. wiki/concepts/collision-and-input.md, spec §6.1.
// Simple overlap tests are enough: at maxSpeed a step moves 4 units, half the player radius.
import { wallPolAt } from './wave.js';

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export function resolveSolids(state) {
  const { cfg, room, player } = state;
  const p = player.pos, v = player.vel, r = player.radius;
  const touchR = r + cfg.contactSlop;
  let touching = false;

  for (const o of room.solids) {
    let nx = p.x - clamp(p.x, o.left, o.right);
    let ny = p.y - clamp(p.y, o.top, o.bottom);
    const d2 = nx * nx + ny * ny;
    if (d2 >= touchR * touchR) continue;
    touching = true;
    if (d2 >= r * r) continue;

    let pen;
    if (d2 > 0) {
      const d = Math.sqrt(d2);
      nx /= d; ny /= d;
      pen = r - d;
    } else {
      // Centre inside the rectangle: leave by the shallowest side
      const l = p.x - o.left, rt = o.right - p.x, t = p.y - o.top, b = o.bottom - p.y;
      const m = Math.min(l, rt, t, b);
      nx = m === l ? -1 : m === rt ? 1 : 0;
      ny = nx !== 0 ? 0 : m === t ? -1 : 1;
      pen = m + r;
    }
    p.x += nx * pen;
    p.y += ny * pen;
    const vn = v.x * nx + v.y * ny;
    if (vn < 0) { v.x -= vn * nx; v.y -= vn * ny; }
    if (!player.onObstacle) {                      // friction once per contact, not every step
      v.x *= cfg.obstacleFriction;
      v.y *= cfg.obstacleFriction;
    }
  }

  const started = touching && !player.onObstacle;
  player.onObstacle = touching;
  return started;
}

export function checkCapture(state) {
  const { cfg, room, player } = state;
  const halfSpan = cfg.shaft.opening / 2 - player.radius;
  return player.pos.y < cfg.shaft.exitMouthY && Math.abs(player.pos.x - room.exitX) < halfSpan;
}

export function checkDeath(state) {
  const { cfg, room, player } = state;
  const p = player.pos, r = player.radius, R = cfg.room;
  if (p.x - r <= R.wallBand || p.x + r >= R.width - R.wallBand) return true;
  if (p.y + r >= R.height - R.bottomWall) return true;
  if (p.y - r <= R.topWall && Math.abs(p.x - room.exitX) >= cfg.shaft.opening / 2) return true;
  return false;
}

export function sideGap(player, cfg) {
  const R = cfg.room;
  return Math.min(player.pos.x - player.radius - R.wallBand, R.width - R.wallBand - player.pos.x - player.radius);
}

// Stall death: pinned against a solid, moving slower than stallSpeed, for stallTime seconds.
export function checkStall(state, dt) {
  const { cfg, player } = state;
  if (cfg.stallTime <= 0 || !player.onObstacle) { player.stallTimer = 0; return false; }
  const moved = Math.hypot(player.pos.x - player.prev.x, player.pos.y - player.prev.y);
  if (moved > cfg.stallSpeed * dt) { player.stallTimer = 0; return false; }
  player.stallTimer += dt;
  return player.stallTimer >= cfg.stallTime;
}

export function checkNearMiss(state) {
  const { cfg, room, player } = state;
  const pulled = !player.inField && player.pol !== wallPolAt(room, player.pos.y);
  const gap = sideGap(player, cfg);
  if (!pulled || gap > cfg.safeGap) { player.nearMissArmed = true; return false; }
  if (player.nearMissArmed && gap <= cfg.nearMissDistance) { player.nearMissArmed = false; return true; }
  return false;
}
