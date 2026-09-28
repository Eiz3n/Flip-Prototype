// Play order. To add a room: create room-NN-name.js, import it here, append it, and add it to a stage.
import room01 from './room-01-sidestep.js';
import room02 from './room-02-cluster.js';
import room03 from './room-03-leap.js';
import room04 from './room-04-switchback.js';
import room05 from './room-05-gauntlet.js';
import { deepFreeze } from '../deepFreeze.js';

export const LEVELS = [room01, room02, room03, room04, room05];

// Stages group rooms for the star rating: each stage ends on a clear screen with its own time
// and deaths. goldMs / silverMs are stage-time limits for 3 and 2 stars (src/stars.js). Starting
// values ≈ 3× the route bot's perfect clear; tune from phone playtests.
export const STAGES = deepFreeze([
  { rooms: [1, 2], goldMs: 12_000, silverMs: 25_000 },
  { rooms: [3, 4], goldMs: 15_000, silverMs: 30_000 },
  { rooms: [5], goldMs: 10_000, silverMs: 20_000 },
]);
