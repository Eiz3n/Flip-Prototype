// Authoring rules from spec §6 and wiki/concepts/no-passive-clears.md.
// Launch/catch windows and hop reach need a route and are checked by playtest + bots.
import { buildPosts } from '../sim/room.js';

function side(x, centre) { return x < centre ? -1 : x > centre ? 1 : 0; }

function bobReach(h, cfg) {
  return Math.hypot(h.ampX ?? cfg.bob.ampX, h.ampY ?? cfg.bob.ampY);
}

function rectDistance(o, px, py) {
  const cx = Math.max(o.x - o.w / 2, Math.min(px, o.x + o.w / 2));
  const cy = Math.max(o.y - o.h / 2, Math.min(py, o.y + o.h / 2));
  return Math.hypot(px - cx, py - cy);
}

export function levelErrors(def, prevDef, cfg) {
  const errors = [];
  const centre = cfg.room.width / 2;
  const innerLeft = cfg.room.wallBand;
  const innerRight = cfg.room.width - cfg.room.wallBand;

  if (def.wave.period < cfg.minWavePeriod) errors.push('wave period below 4 s');

  const ex = def.exit.x;
  if (!cfg.exitXRanges.some(([lo, hi]) => ex >= lo && ex <= hi)) errors.push('exit x outside allowed ranges');

  const entrySide = side(def.entry.x, centre);
  if (entrySide !== 0 && entrySide === side(ex, centre)) errors.push('exit on the same side as entry');

  if (prevDef && def.entry.x !== prevDef.exit.x) errors.push('entry x does not match previous exit x');

  def.hookPoints.forEach((h, i) => {
    const leftGap = h.x - cfg.fieldRadius - innerLeft;
    const rightGap = innerRight - (h.x + cfg.fieldRadius);
    if (Math.min(leftGap, rightGap) < cfg.wallMargin) errors.push(`hook point ${i} field too close to a wall`);
  });

  if (!def.hookPoints.some((h) => Math.abs(h.x - centre) <= cfg.fieldRadius)) {
    errors.push('no field covers the centre line');
  }

  // Rule 9: obstacles clear of orbits by 10 at the hook's home, and never touching the orbit
  // at any point of its bob (matters when a level overrides ampX / ampY).
  const orbitReach = cfg.orbitRadius + cfg.playerRadius;
  const clearance = orbitReach + 10;
  def.obstacles.forEach((o, i) => {
    if (o.shape !== 'bar' && o.shape !== 'square') errors.push(`obstacle ${i} is not a bar or square`);
    def.hookPoints.forEach((h, j) => {
      const d = rectDistance(o, h.x, h.y);
      if (d < clearance) errors.push(`obstacle ${i} crosses the orbit of hook point ${j}`);
      else if (d - bobReach(h, cfg) < orbitReach) errors.push(`obstacle ${i} touches the orbit of hook point ${j} when it bobs`);
    });
    const leftGap = o.x - o.w / 2 - innerLeft;
    const rightGap = innerRight - (o.x + o.w / 2);
    if (Math.max(leftGap, rightGap) < cfg.obstacleGap) errors.push(`obstacle ${i} leaves no passable gap to a wall`);
  });

  // No passive clears: an obstacle sits on the centre line in the upper half of the room.
  const upperCentre = def.obstacles.some((o) =>
    o.x - o.w / 2 <= centre && o.x + o.w / 2 >= centre && o.y < cfg.room.height / 2);
  if (!upperCentre) errors.push('no obstacle on the centre line in the upper half');

  // Shaft posts clear of every orbit, same clearance as obstacles.
  buildPosts(def.entry.x, ex, cfg).forEach((post) => {
    const rect = { x: post.pos.x, y: post.pos.y, w: post.w, h: post.h };
    def.hookPoints.forEach((h, j) => {
      if (rectDistance(rect, h.x, h.y) < clearance) errors.push(`shaft post crosses the orbit of hook point ${j}`);
    });
  });

  return errors;
}

export function validateLevels(levels, cfg) {
  levels.forEach((def, i) => {
    if (def.index !== i + 1) throw new Error(`Room ${def.index}: index does not match position ${i + 1}`);
    const errors = levelErrors(def, levels[i - 1] ?? null, cfg);
    if (errors.length) throw new Error(`Room ${def.index}: ${errors.join('; ')}`);
  });
}
