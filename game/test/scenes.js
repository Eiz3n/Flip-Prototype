// Drives the real game through every state and renders each into a context.
import { config } from '../src/config.js';
import { theme } from '../src/theme.js';
import { LEVELS, STAGES } from '../src/levels/index.js';
import { createGame, tap, changeStage, update } from '../src/game.js';
import { createEffects, handleEvent, updateEffects } from '../src/view/anim/effects.js';
import { createCamera, updateCamera } from '../src/view/camera.js';
import { renderFrame } from '../src/view/render.js';

export function makeRig() {
  const fx = createEffects(theme);
  const cam = createCamera();
  const seen = {};                                    // event name → count, for coverage checks
  const game = createGame({
    levels: LEVELS, stages: STAGES, cfg: config, storage: null,
    onEvent: (e) => { seen[e] = (seen[e] ?? 0) + 1; handleEvent(fx, e, game.world); },
  });
  game.seen = seen;
  const advance = (seconds) => {
    for (let i = 0; i < Math.round(seconds / config.step); i++) {
      update(game, config.step);
      updateEffects(fx, config.step, game.world);
    }
    updateCamera(cam, game, seconds);
  };
  const draw = (ctx) => renderFrame(ctx, game, fx, cam, 0.5);
  return { game, fx, cam, advance, draw };
}

function toExit(w) {
  Object.assign(w.player.pos, { x: w.room.exitX, y: 60 });
  w.player.bufferEntry = false;
  w.player.latched = null;
}

export function playThrough(ctx) {
  const { game, advance, draw } = makeRig();
  draw(ctx);                                          // title
  tap(game); advance(0.3); draw(ctx);                 // stage select
  tap(game, { x: 180, y: 250 }); advance(0.1); draw(ctx);   // numeral mid-flip → stage 2
  advance(0.3); changeStage(game, -1); advance(0.3);  // back to stage 1
  tap(game, null); advance(0.2); draw(ctx);           // stage start pan
  advance(0.3); advance(0.8); draw(ctx);              // room 1, live
  const w = game.world;
  for (let i = 0; i < 20; i++) { tap(game); advance(0.05); draw(ctx); }   // flips (flip ring)
  if (game.state === 'dying') { advance(0.2); draw(ctx); advance(1.0); }  // taps may kill: let it restart

  // Force every remaining drawing path so the palette and alpha guards see it.
  const h = w.room.hookPoints[0];
  Object.assign(w.player.pos, { x: h.pos.x + 25, y: h.pos.y });
  Object.assign(w.player.vel, { x: 0, y: 0 });
  w.player.pol = -h.pol; w.player.latched = null; w.player.bufferEntry = false; w.player.bufferHook = null;
  advance(0.05); draw(ctx);                           // latch: tether + latch pop
  tap(game); advance(0.05); draw(ctx);                // launch: puff
  Object.assign(w.player.pos, { x: 200, y: 280 });    // under room 1's bar (y 258–272)
  Object.assign(w.player.vel, { x: 0, y: -100 });
  w.player.latched = null; w.player.bufferHook = null;
  advance(0.02); draw(ctx);                           // obstacle hit: flash

  toExit(w); advance(0.05); draw(ctx);                // transition start
  advance(0.2); draw(ctx);                            // mid-pan, both rooms
  advance(0.4); draw(ctx);                            // room 2
  Object.assign(w.player.pos, { x: 18, y: 320 }); w.player.latched = null;
  advance(0.1); draw(ctx);                            // dying: burst
  advance(0.7); toExit(w); advance(0.6); draw(ctx);   // stage 1 clear screen
  for (let room = 3; room <= 5; room++) {
    if (game.state === 'stageClear') { advance(config.timing.clearTapDelay); tap(game); }
    advance(config.timing.readyBeat + 0.45);            // pan or ready beat, then the entry launch
    toExit(w); advance(0.05); draw(ctx);               // pan after room 3, stage clear after 4, win after 5
  }
  advance(0.1); draw(ctx);                            // win
  advance(config.timing.clearTapDelay);
  tap(game); advance(0.1); draw(ctx);                 // back to title, logo mid-flip
  advance(0.3);
  return game;
}
