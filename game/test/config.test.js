import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { theme } from '../src/theme.js';

test('config holds the TDD tuning table', () => {
  expect(config).toMatchObject({
    step: 1 / 120,
    k: 2_000_000, kWall: 400_000, wallDamping: 6, centerPush: 80, safeGap: 12, dMin: 24,
    fieldRadius: 70, exitFieldRadius: 50, latchRadius: 30, orbitRadius: 30,
    maxOrbitSpeed: 6, orbitDrag: 0.8, launchImpulse: 180, entryLaunchSpeed: 240,
    relatchCooldown: 0.25, riseSpeed: 60, updraftGain: 3, drag: 0.25, maxSpeed: 480,
    obstacleFriction: 0.85, centerLineClearance: 20, maxReach: 220, wallMargin: 30,
    waveGrace: 0.4, waveGraceRamp: 0.15, inputLatencyComp: 0.06, launchAssist: 6,
    playerRadius: 8, nearMissDistance: 6, minWavePeriod: 4, launchPreview: false,
    progressKey: 'flip.stages.v1',
  });
});

test('stage select tap areas sit inside the room and do not overlap', () => {
  const { stageBox: a, startBox: b } = config.select;
  for (const r of [a, b]) {
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.w).toBeLessThanOrEqual(config.room.width);
    expect(r.y + r.h).toBeLessThanOrEqual(config.room.height);
  }
  expect(a.y + a.h).toBeLessThanOrEqual(b.y);
});

test('config holds the v1 room, shaft and timing geometry', () => {
  expect(config.room).toEqual({ width: 360, height: 640, wallBand: 10, topWall: 6, bottomWall: 6 });
  expect(config.shaft).toMatchObject({ opening: 60, depth: 46, postWidth: 8, postOverhang: 6,
    exitMouthY: 52, entryMouthY: 588, spawnY: 580, entryZoneRadius: 50 });
  expect(config.timing).toMatchObject({ titleFlipTime: 0.25, dyingTime: 0.6, readyBeat: 0.5, panTime: 0.4 });
  expect(config.bob).toEqual({ ampX: 8, ampY: 5, freq: 0.4, phaseStep: 1.1 });
  expect(config.exitXRanges).toEqual([[80, 110], [250, 280]]);
  expect(config).toMatchObject({ stallTime: 3, stallSpeed: 5, obstacleGap: 48 });
});

test('config and theme are deep-frozen', () => {
  expect(Object.isFrozen(config)).toBe(true);
  expect(Object.isFrozen(config.shaft)).toBe(true);
  expect(Object.isFrozen(theme.color)).toBe(true);
});

test('theme holds the canvas palette and font', () => {
  expect(theme.color).toEqual({
    positive: '#6FA8DC', negative: '#E27D7D', background: '#EDE6D8', ink: '#26252E', neutral: '#A9A4B5',
  });
  expect(theme.font.family.startsWith("'Baloo 2'")).toBe(true);
  expect(theme.font).toMatchObject({ logo: 800, hud: 700, body: 400 });
  expect(theme.size.hook).toBe(14);
});
