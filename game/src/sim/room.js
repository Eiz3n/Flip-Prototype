import { HookPoint, Obstacle } from './entities.js';

const TAU = Math.PI * 2;

// Posts flank each shaft opening and end at its mouth line: exit posts run from the top edge
// down to exitMouthY (52 = depth 46 + postOverhang 6); hatch posts run from entryMouthY (588)
// to the bottom edge. Matches the Flip Art canvas (spec §4, §6.1).
// Exported so levels/validate.js checks the same rectangles the physics uses.
export function buildPosts(entryX, exitX, cfg) {
  const s = cfg.shaft;
  const half = s.opening / 2;
  const w = s.postWidth;
  const exitLen = s.exitMouthY;
  const hatchTop = s.entryMouthY;
  const hatchLen = cfg.room.height - hatchTop;
  return [
    new Obstacle('bar', exitX - half - w / 2, exitLen / 2, w, exitLen, 'post'),
    new Obstacle('bar', exitX + half + w / 2, exitLen / 2, w, exitLen, 'post'),
    new Obstacle('bar', entryX - half - w / 2, hatchTop + hatchLen / 2, w, hatchLen, 'post'),
    new Obstacle('bar', entryX + half + w / 2, hatchTop + hatchLen / 2, w, hatchLen, 'post'),
  ];
}

export class Room {
  constructor(def, cfg) {
    this.def = def;
    this.index = def.index;
    this.name = def.name;
    this.width = cfg.room.width;
    this.height = cfg.room.height;
    this.wave = { enabled: def.wave.enabled, period: def.wave.period, startPol: def.wave.startPol };
    this.time = 0;
    this.minOrbitSpeed = def.minOrbitSpeed;
    this.minLaunchWindow = def.minLaunchWindow;
    this.minCatchWindow = def.minCatchWindow;
    this.entryX = def.entry.x;
    this.exitX = def.exit.x;
    this.hookPoints = def.hookPoints.map((h, i) => new HookPoint(h, i, cfg));
    this.obstacles = def.obstacles.map((o) => new Obstacle(o.shape, o.x, o.y, o.w, o.h));
    this.posts = buildPosts(this.entryX, this.exitX, cfg);
    this.solids = [...this.obstacles, ...this.posts];
    this.reset();
  }

  reset() {
    this.time = 0;
    for (const h of this.hookPoints) h.cooldown = 0;
    this.updateBob();
  }

  updateBob() {
    const t = this.time;
    for (const h of this.hookPoints) {
      const b = h.bob;
      h.pos.x = h.home.x + b.ampX * Math.sin(TAU * b.freq * t + b.phase);
      h.pos.y = h.home.y + b.ampY * Math.sin(2 * TAU * b.freq * t + b.phase);
    }
  }
}
