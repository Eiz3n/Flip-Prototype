// Room 3 — Leap (stage 2). Room-6 tier: one long launch, then an updraft turn into the exit.
// Laid out in the room editor artifact (28-09-26).
//
// Intended route: entry launch → catch red (135, 480) → launch up-left around the low bar's left end to
// blue (115, 300) → launch flat to the right under the centre bar; the updraft lifts the player
// into red (250, 135), which sits straight under the exit → launch up through the doorway.
//
// Any coordinate change must re-pass levels/validate.js and test/bots.test.js.
export default {
  index: 3,
  name: 'Leap',
  wave: { enabled: true, period: 6, startPol: +1 },
  minOrbitSpeed: 3.4, minLaunchWindow: 0.22, minCatchWindow: 0.48,
  entry: { x: 95 },    // = room 2 exit x
  exit: { x: 250 },    // ceiling doorway, directly above hook point 2
  hookPoints: [
    { x: 135, y: 480, pol: -1 },
    { x: 115, y: 300, pol: +1 },
    { x: 250, y: 135, pol: -1 },
  ],
  obstacles: [
    { shape: 'bar', x: 180, y: 205, w: 60, h: 14 },
    { shape: 'square', x: 110, y: 135, w: 28, h: 28 },
    { shape: 'square', x: 270, y: 255, w: 28, h: 28 },
    { shape: 'bar', x: 145, y: 385, w: 60, h: 14 },
  ],
};
