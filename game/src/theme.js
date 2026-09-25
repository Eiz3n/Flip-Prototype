// Every visual value, read from the Flip Art canvas on 25-09-26 (art plan, "Canvas → code").
// Geometry that collides lives in config.js. Keys marked "compat" are read only by code this
// plan replaces; they stay until Task 9 removes them.
import { deepFreeze } from './deepFreeze.js';

export const theme = deepFreeze({
  color: {
    positive: '#6FA8DC',
    negative: '#E27D7D',
    background: '#EDE6D8',
    ink: '#26252E',
    neutral: '#A9A4B5',
  },
  font: {
    family: "'Baloo 2', ui-rounded, system-ui, sans-serif",
    file: './fonts/baloo2-subset.woff2', weights: '400 800', loadTimeoutMs: 1000,
    logo: 800, hud: 700, body: 400,
    logoSize: 96, logoTracking: -2,
    hudSize: 13, timerSize: 15,
    markPlayer: 10, markHook: 17,
    titleSize: 44,        // "Cleared"
    bodySize: 16,         // "tap to start", "tap to return"
    rowSize: 15,          // win panel rows
    smallSize: 13,        // "best —", "New best"
  },
  render: { maxDpr: 2 },
  stroke: { ink: 2 },
  size: { hook: 14, markScale: 0.55 },            // markScale: compat
  field: { idleWidth: 1, idleAlpha: 0.2, insideWidth: 2, insideAlpha: 0.5, titleAlpha: 0.12 },
  tether: { width: 1, alpha: 0.5 },
  walls: { innerEdge: 2, frontLineWidth: 1 },
  shaft: {
    postOutline: 2,
    chevronWidth: 18, chevronHeight: 10.8, chevronStroke: 3.6, chevronGap: 3,   // spacing = height + gap
    chevronSpacing: 13.8,                         // compat: the blockout shaft.js reads it until Task 4
    chevronAlphas: [0.35, 0.65, 1],               // top → bottom, as on the canvas
    chevronSpeed: 20,
    pullCueLength: 64, pullCueAlpha: 0.4, pullCueAngle: 30, pullCueWidth: 1.5, pullCueDash: [4, 3],
  },
  updraft: { dashWidth: 2, dashLength: 12, radius: 1, alpha: 0.14, count: 14, speed: 20 },
  hud: { y: 12, sidePad: 20, rowHeight: 24 },     // rowHeight ≈ the canvas row's line box; tune in Task 8
  title: {
    hooks: [
      { x: 90, y: 150, pol: +1 },
      { x: 280, y: 250, pol: -1 },
      { x: 110, y: 480, pol: -1 },
      { x: 270, y: 540, pol: +1 },
    ],
    columnY: 250, gap: 20, bestAlpha: 0.7,
  },
  win: { columnY: 190, gap: 28, panelX: 40, panelW: 280, panelRadius: 16, panelPadX: 24, panelPadY: 20, rowGap: 12 },
  fx: {
    latchPopScale: 1.1, latchPopTime: 0.12,
    flipRingTime: 0.25, flipRingGrow: 10,
    roomPopTime: 0.6, roomPopScale: 1.3,
    obstacleFlashTime: 0.15,
    trailDots: 3, trailSpacing: 10, trailRadii: [4, 3.5, 3], trailAlphas: [0.55, 0.35, 0.2],
    trailInterval: 0.03,                          // compat
    launchPuffCount: 4, launchPuffSpeed: 60, launchPuffSpread: 1.2, launchPuffLife: 0.35,
    launchPuffRadii: [2.5, 2, 2, 1.5], launchPuffAlphas: [0.5, 0.35, 0.35, 0.2],   // Sprites cell is 2×
    deathBurstCount: 8, deathBurstSpeed: 140, deathBurstInnerSpeed: 0.4, deathBurstAlpha: 0.7,
    deathBurstRadii: [2, 2, 2, 2, 2, 2, 1.35, 1.35],
    particleLife: 0.5, particleSize: 2,
    entryShake: { amount: 3, time: 0.1 },
    deathShake: { amount: 10, time: 0.3 },
  },
});
