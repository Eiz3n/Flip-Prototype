// Room 4 — Switchback (stage 2). Room-8 tier: same-colour pair and a guarded exit.
// Laid out in the room editor artifact (28-09-26).
//
// Intended route: entry launch → blue (215, 470) → red (125, 360) → red (240, 265), which needs a
// mid-air flip after leaving the first red → blue (190, 160) → launch left over the ledge and
// into the exit pull. The ledge under the exit blocks a straight rise.
//
// Any coordinate change must re-pass levels/validate.js and test/bots.test.js.
export default {
  index: 4,
  name: 'Switchback',
  wave: { enabled: true, period: 5, startPol: -1 },
  minOrbitSpeed: 3.6, minLaunchWindow: 0.16, minCatchWindow: 0.40,
  entry: { x: 250 },   // = room 3 exit x
  exit: { x: 95 },     // ceiling doorway, top left
  hookPoints: [
    { x: 215, y: 470, pol: +1, ampX: 12, ampY: 6 },
    { x: 125, y: 360, pol: -1, ampX: 12, ampY: 6 },
    { x: 240, y: 265, pol: -1, ampX: 12, ampY: 6 },
    { x: 190, y: 160, pol: +1, ampX: 12, ampY: 6 },
  ],
  obstacles: [
    { shape: 'bar', x: 90, y: 128, w: 90, h: 14 },
    { shape: 'square', x: 185, y: 225, w: 20, h: 20 },
    { shape: 'square', x: 60, y: 250, w: 28, h: 28 },
  ],
};
