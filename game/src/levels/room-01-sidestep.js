// Room 1 — Sidestep (spec §6). Room-5 tier.
// Hook points hug alternating walls; the player uses wall pull to move sideways
// and reads the wave to stay safe.
//
// Intended route: entry launch (blue, cushioned) → drift left on wall pull, catch red (110, 470)
// → launch up-right into blue (240, 340) as red → launch up-left around the bar to red (110, 200)
// → launch up-right into the exit pull and through the doorway.
//
// Any coordinate change must re-pass levels/validate.js and test/bots.test.js.
export default {
  index: 1,
  name: 'Sidestep',
  wave: { enabled: true, period: 6.5, startPol: +1 },
  minOrbitSpeed: 3.2, minLaunchWindow: 0.22, minCatchWindow: 0.48,
  entry: { x: 180 },   // floor hatch, bottom centre
  exit: { x: 265 },    // ceiling doorway, top right
  hookPoints: [
    { x: 110, y: 470, pol: -1 },
    { x: 240, y: 340, pol: +1 },
    { x: 110, y: 200, pol: -1 },
  ],
  obstacles: [
    { shape: 'bar', x: 200, y: 265, w: 70, h: 14 },
  ],
};
