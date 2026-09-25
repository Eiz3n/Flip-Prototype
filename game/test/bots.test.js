import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { createWorld, startRoom, step } from '../src/sim/world.js';
import { wallPolAt } from '../src/sim/wave.js';

const DT = config.step;
const STEPS = Math.round(60 / DT);

const idleBot = () => 0;

function driftBot(w) {
  const p = w.player;
  if (w.phase !== 'live' || p.latched || p.inField) return 0;
  return p.pol !== wallPolAt(w.room, p.pos.y) ? 1 : 0;
}

// Stronger than the TDD bots: never latches at all. Inside a field it matches the nearest
// hook point (repelled); outside it stays cushioned. Catches rooms the drift bot only
// "fails" because it latches early and orbits forever.
function repelBot(w) {
  const p = w.player;
  if (w.phase !== 'live' || p.latched || p.bufferHook || p.bufferEntry) return 0;
  let near = null, nearD = Infinity;
  for (const h of w.room.hookPoints) {
    const d = Math.hypot(p.pos.x - h.pos.x, p.pos.y - h.pos.y);
    if (d < h.fieldRadius && d < nearD) { near = h; nearD = d; }
  }
  if (near) return p.pol !== near.pol ? 1 : 0;
  return p.pol !== wallPolAt(w.room, p.pos.y) ? 1 : 0;
}

// Returns true if the bot cleared the room within 60 simulated seconds.
function clears(roomIndex, bot, setup = () => {}) {
  const w = createWorld(LEVELS, config);
  startRoom(w, roomIndex, 0);
  setup(w);
  for (let i = 0; i < STEPS; i++) {
    const events = step(w, DT, bot(w));
    if (events.includes('exitCaptured')) return true;
    if (w.phase === 'dead') { startRoom(w, roomIndex, config.timing.readyBeat); setup(w); }
  }
  return false;
}

test('the harness detects a clear', () => {
  // Spawned straight under the exit mouth, the entry launch carries the player through the doorway.
  const underExit = (w) => { w.player.pos.x = w.room.exitX; w.player.pos.y = 70; };
  expect(clears(0, idleBot, underExit)).toBe(true);
});

for (const level of LEVELS) {
  test(`room ${level.index} (${level.name}): the idle bot never clears`, () => {
    expect(clears(level.index - 1, idleBot)).toBe(false);
  });
  test(`room ${level.index} (${level.name}): the drift bot never clears`, () => {
    expect(clears(level.index - 1, driftBot)).toBe(false);
  });
  test(`room ${level.index} (${level.name}): the repel bot never clears`, () => {
    expect(clears(level.index - 1, repelBot)).toBe(false);
  });
}
