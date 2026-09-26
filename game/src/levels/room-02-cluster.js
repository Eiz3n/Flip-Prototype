// Room 2 — Cluster (spec §6). Room-5 tier.
// Five mixed-colour hook points packed mid-room; the skill is choosing which to catch
// and in what colour.
//
// Any coordinate change must re-pass levels/validate.js and test/bots.test.js.
export default {
  index: 2,
  name: 'Cluster',
  wave: { enabled: true, period: 6.5, startPol: -1 },
  minOrbitSpeed: 3.2, minLaunchWindow: 0.22, minCatchWindow: 0.48,
  entry: { x: 265 },   // = room 1 exit x
  exit: { x: 95 },     // ceiling doorway, top left
  hookPoints: [
    { x: 215, y: 480, pol: +1 },
    { x: 140, y: 400, pol: -1 },
    { x: 240, y: 320, pol: +1 },
    { x: 150, y: 250, pol: +1 },
    { x: 230, y: 180, pol: -1 },
  ],
  obstacles: [
    { shape: 'square', x: 185, y: 125, w: 28, h: 28 },
    { shape: 'bar', x: 290, y: 420, w: 14, h: 70 },
  ],
};
