// Room 5 — Gauntlet (stage 3, final). Room-10 tier: the hardest room in the game.
// Laid out in the room editor artifact (28-09-26).
//
// Intended route: entry launch → red (120, 500) → red (225, 380) (mid-air flip) → blue (115, 270)
// → blue (150, 165) (mid-air flip) → flat launch right through the gap between the ledge and the
// exit posts. Wave at the 4 s floor, largest bob, fastest orbit.
//
// Any coordinate change must re-pass levels/validate.js and test/bots.test.js.
export default {
  index: 5,
  name: 'Gauntlet',
  wave: { enabled: true, period: 4, startPol: +1 },
  minOrbitSpeed: 4.0, minLaunchWindow: 0.16, minCatchWindow: 0.40,
  entry: { x: 95 },    // = room 4 exit x
  exit: { x: 265 },    // ceiling doorway, top right, over the ledge
  hookPoints: [
    { x: 120, y: 500, pol: -1, ampX: 16, ampY: 8 },
    { x: 225, y: 380, pol: -1, ampX: 16, ampY: 8 },
    { x: 115, y: 270, pol: +1, ampX: 16, ampY: 8 },
    { x: 150, y: 165, pol: +1, ampX: 16, ampY: 8 },
  ],
  obstacles: [
    { shape: 'bar', x: 255, y: 125, w: 100, h: 14 },
    { shape: 'bar', x: 185, y: 270, w: 14, h: 50 },
    { shape: 'square', x: 300, y: 280, w: 28, h: 28 },
    { shape: 'bar', x: 185, y: 470, w: 14, h: 50 },
    { shape: 'square', x: 165, y: 85, w: 28, h: 28 },
  ],
};
