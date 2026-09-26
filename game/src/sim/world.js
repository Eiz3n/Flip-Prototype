// The simulation's single entry point. Pure: the caller supplies dt and the number of taps.
// v1 holds both rooms in memory; with more rooms, build only the current and next (TDD).
import { Room } from './room.js';
import { Player } from './entities.js';
import { wallPolAt } from './wave.js';
import { freeFlightStep, tryLatch, orbitStep, launch } from './physics.js';
import { resolveSolids, checkCapture, checkDeath, checkStall, checkNearMiss } from './collision.js';

export function createWorld(levels, cfg) {
  const rooms = levels.map((def) => new Room(def, cfg));
  return {
    cfg,
    rooms,
    roomIndex: 0,
    room: rooms[0],
    player: new Player(cfg.playerRadius),
    phase: 'idle',
    readyTimer: 0,
    events: [],
  };
}

export function startRoom(world, index, readyBeat) {
  const { cfg, player } = world;
  const room = world.rooms[index];
  world.roomIndex = index;
  world.room = room;
  room.reset();

  player.pos.x = player.prev.x = room.entryX;
  player.pos.y = player.prev.y = cfg.shaft.spawnY;
  player.vel.x = 0;
  player.vel.y = 0;
  player.pol = wallPolAt(room, cfg.shaft.spawnY);
  player.latched = null;
  player.bufferedTap = false;
  player.bufferHook = null;
  player.bufferEntry = false;
  player.graceTimer = 0;
  player.lastWallPol = 0;
  player.inField = false;
  player.alive = true;
  player.nearMissArmed = true;
  player.onObstacle = false;
  player.stallTimer = 0;

  world.phase = 'ready';
  world.readyTimer = readyBeat;
}

function entryLaunch(world) {
  const p = world.player;
  p.vel.x = 0;
  p.vel.y = -world.cfg.entryLaunchSpeed;
  p.bufferEntry = true;
  p.bufferedTap = false;
}

function handleFlip(world) {
  const p = world.player;
  if (p.latched) {
    launch(world);
    world.events.push('flip', 'launch');
    return;
  }
  if (p.bufferHook || p.bufferEntry) {
    p.bufferedTap = true;
    return;
  }
  p.pol = -p.pol;
  world.events.push('flip');
}

function releaseBuffers(world) {
  const { cfg, room, player: p } = world;
  if (p.bufferHook) {
    const h = p.bufferHook;
    const dx = p.pos.x - h.pos.x, dy = p.pos.y - h.pos.y;
    if (dx * dx + dy * dy >= h.fieldRadius * h.fieldRadius) p.bufferHook = null;
  }
  if (p.bufferEntry) {
    const dx = p.pos.x - room.entryX, dy = p.pos.y - cfg.shaft.entryMouthY;
    const r = cfg.shaft.entryZoneRadius;
    if (dx * dx + dy * dy >= r * r) p.bufferEntry = false;
  }
  if (p.bufferedTap && !p.bufferHook && !p.bufferEntry) {
    p.bufferedTap = false;
    p.pol = -p.pol;
    world.events.push('flip');
  }
}

export function step(world, dt, flips) {
  const ev = world.events;
  ev.length = 0;
  const { cfg, player } = world;
  player.prev.x = player.pos.x;
  player.prev.y = player.pos.y;

  if (world.phase === 'ready') {
    world.readyTimer -= dt;
    if (world.readyTimer <= 0) {
      entryLaunch(world);
      world.phase = 'live';
      ev.push('entryLaunch');
    }
    return ev;
  }
  if (world.phase === 'captured') {
    player.pos.y += player.vel.y * dt;
    return ev;
  }
  if (world.phase !== 'live') return ev;

  const room = world.room;
  room.time += dt;
  room.updateBob();
  for (const h of room.hookPoints) if (h.cooldown > 0) h.cooldown = Math.max(0, h.cooldown - dt);

  for (let i = 0; i < flips; i++) handleFlip(world);

  if (player.latched) {
    orbitStep(world, dt);
    return ev;
  }

  freeFlightStep(world, dt);
  releaseBuffers(world);
  if (tryLatch(world)) {
    ev.push('latch');
    return ev;
  }

  if (resolveSolids(world)) ev.push('obstacleHit');
  if (checkCapture(world)) {
    world.phase = 'captured';
    player.vel.x = 0;
    player.vel.y = -cfg.entryLaunchSpeed;
    ev.push('exitCaptured');
    if (world.roomIndex === world.rooms.length - 1) ev.push('win');
    return ev;
  }
  if (checkDeath(world) || checkStall(world, dt)) {
    world.phase = 'dead';
    player.alive = false;
    ev.push('death');
    return ev;
  }
  if (checkNearMiss(world)) ev.push('nearMiss');
  return ev;
}
