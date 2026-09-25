// Plain data holders. All behaviour lives in physics.js / collision.js / world.js.

export class Player {
  constructor(radius) {
    this.pos = { x: 0, y: 0 };
    this.prev = { x: 0, y: 0 };      // position at the start of the last step (render interpolation)
    this.vel = { x: 0, y: 0 };
    this.radius = radius;
    this.pol = 1;                    // +1 blue, -1 red
    this.latched = null;             // HookPoint while orbiting
    this.theta = 0;
    this.omega = 0;                  // orbit speed, always >= 0
    this.orbitDir = 1;               // +1 or -1, follows arrival direction
    this.bufferedTap = false;
    this.bufferHook = null;          // taps are buffered while inside this hook point's field
    this.bufferEntry = false;        // taps are buffered while inside the entry hatch zone
    this.graceTimer = 0;
    this.lastWallPol = 0;            // 0 = not yet sampled this attempt
    this.inField = false;
    this.alive = true;
    this.nearMissArmed = true;
    this.onObstacle = false;
    this.stallTimer = 0;             // seconds pinned against a solid (stall death)
  }
}

export class HookPoint {
  constructor(def, index, cfg) {
    this.index = index;
    this.home = { x: def.x, y: def.y };
    this.pos = { x: def.x, y: def.y };
    this.pol = def.pol;
    this.fieldRadius = cfg.fieldRadius;
    this.bob = {
      ampX: def.ampX ?? cfg.bob.ampX,
      ampY: def.ampY ?? cfg.bob.ampY,
      freq: def.freq ?? cfg.bob.freq,
      phase: def.phase ?? index * cfg.bob.phaseStep,
    };
    this.cooldown = 0;
  }
}

export class Obstacle {
  constructor(shape, x, y, w, h, kind = 'obstacle') {
    this.shape = shape;              // 'bar' | 'square' — never round
    this.kind = kind;                // 'obstacle' | 'post' (shaft posts block like obstacles)
    this.pos = { x, y };
    this.w = w;
    this.h = h;
    this.left = x - w / 2;
    this.right = x + w / 2;
    this.top = y - h / 2;
    this.bottom = y + h / 2;
  }
}
