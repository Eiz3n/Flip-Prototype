// Every gameplay number. Distances in logical units (room 360 × 640), times in seconds.
// TDD values: wiki/entities/tuning-parameters.md. v1 additions are marked.
import { deepFreeze } from './deepFreeze.js';

export const config = deepFreeze({
  step: 1 / 120,
  maxFrameDelta: 0.25,          // clamp after a tab switch

  room: { width: 360, height: 640, wallBand: 10, topWall: 6, bottomWall: 6 },

  // Hook point fields
  k: 2_000_000,
  dMin: 24,
  fieldRadius: 70,
  exitFieldRadius: 50,          // v1: radius of the exit doorway pull zone

  // Walls
  kWall: 400_000,
  wallDamping: 6,
  centerPush: 80,
  safeGap: 12,

  // Updraft
  riseSpeed: 60,
  updraftGain: 3,
  drag: 0.25,
  maxSpeed: 480,

  // Latch / orbit / launch
  latchRadius: 30,
  orbitRadius: 30,
  maxOrbitSpeed: 6,
  orbitDrag: 0.8,
  launchImpulse: 180,
  entryLaunchSpeed: 240,
  relatchCooldown: 0.25,

  // Wave
  waveGrace: 0.4,
  waveGraceRamp: 0.15,
  minWavePeriod: 4,

  // Human timing aids
  inputLatencyComp: 0.06,       // 0 disables
  launchAssist: 6,              // degrees, 0 disables
  launchAssistCone: 45,         // v1: only nudge toward targets within this many degrees
  launchPreview: false,         // v1: off (spec §2)

  // Obstacles: sliding speed along an edge is multiplied by this once, on the step contact starts
  obstacleFriction: 0.85,
  contactSlop: 0.5,             // v1: resting within this of a solid still counts as touching

  // v1 stall death: touching a solid and moving slower than stallSpeed for stallTime seconds
  // counts as a death, so a player pinned under a centre-line obstacle is never stuck forever.
  stallTime: 3,                 // seconds; 0 disables
  stallSpeed: 5,                // units/s

  // Room authoring rules (checked by levels/validate.js)
  centerLineClearance: 20,
  maxReach: 220,
  wallMargin: 30,
  exitXRanges: [[80, 110], [250, 280]],   // v1 spec §6.1
  obstacleGap: 48,                        // v1 spec §6: each obstacle leaves this gap to a wall on one side

  // Bodies
  playerRadius: 8,
  nearMissDistance: 6,

  // v1: exit doorway and entry hatch (spec §6.1)
  shaft: {
    opening: 60,
    depth: 46,
    postWidth: 8,
    postOverhang: 6,
    exitMouthY: 52,
    entryMouthY: 588,
    spawnY: 580,
    entryZoneRadius: 50,
  },

  // Default hook point bob; a level may override per hook point
  bob: { ampX: 8, ampY: 5, freq: 0.4, phaseStep: 1.1 },

  // State machine timings
  timing: {
    titleFlipTime: 0.25,        // v1: the logo's F flips on the title tap before the run starts
    dyingTime: 0.6,
    readyBeat: 0.5,
    panTime: 0.4,
    nearMissSlowmo: 0.08,
    deathSlowmo: 0.3,
    slowmoScale: 0.3,
    clearTapDelay: 0.5,         // stage clear and win screens ignore taps this long, so a late flip tap can't skip them
  },

  // v1.1 stage select: tap areas in room units. The stage box covers the "Stage N" lettering and
  // the stats line under it (invisible, full width); the start box is a little bigger than the button.
  select: {
    stageBox: { x: 20, y: 190, w: 320, h: 170 },
    startBox: { x: 80, y: 405, w: 200, h: 86 },
  },

  progressKey: 'flip.stages.v1',      // per-stage best time and stars (src/progress.js)
});
