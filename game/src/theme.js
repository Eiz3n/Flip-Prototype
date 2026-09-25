// Every visual value. Read from the Flip Art canvas (spec §4). Geometry that collides lives in config.js.
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
    logo: 800, hud: 700, body: 400,
    logoSize: 72, hudSize: 18, bodySize: 16, titleSize: 28,
    file: './fonts/baloo2-subset.woff2', weights: '400 800', loadTimeoutMs: 1000,
  },
  render: { maxDpr: 2 },
  stroke: { ink: 2 },
  size: { hook: 14, markScale: 0.55 },
  field: { idleWidth: 1, idleAlpha: 0.2, insideWidth: 2, insideAlpha: 0.5 },
  tether: { width: 1, alpha: 0.5 },
  walls: { innerEdge: 2, frontLineWidth: 1 },
  shaft: {
    postOutline: 2,
    chevronWidth: 18, chevronAlphas: [0.35, 0.65, 1], chevronSpacing: 12, chevronSpeed: 20,
    pullCueLength: 64, pullCueAlpha: 0.4, pullCueAngle: 30,
  },
  updraft: { dashWidth: 2, dashLength: 12, alpha: 0.14, count: 14, speed: 20 },
  hud: { y: 12, sidePad: 18 },
  fx: {
    latchPopScale: 1.1, latchPopTime: 0.12,
    flipRingTime: 0.25, flipRingGrow: 10,
    roomPopTime: 0.6,
    obstacleFlashTime: 0.15,
    trailDots: 5, trailInterval: 0.03,
    launchPuffCount: 6, launchPuffSpeed: 60, launchPuffSpread: 1.2,   // spread in radians
    deathBurstCount: 24, deathBurstSpeed: 140,
    particleLife: 0.5, particleSize: 3,
    entryShake: { amount: 3, time: 0.1 },
    deathShake: { amount: 10, time: 0.3 },
  },
});
