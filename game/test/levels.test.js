import { test, expect } from 'vitest';
import { config } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';
import { LEVELS as ALL, STAGES } from '../src/levels/index.js';
import { validateLevels, levelErrors, validateStages } from '../src/levels/validate.js';

test('all five rooms pass every authoring rule', () => {
  expect(LEVELS.map((l) => l.index)).toEqual([1, 2, 3, 4, 5]);
  expect(() => validateLevels(LEVELS, config)).not.toThrow();
});

test('room n+1 entry sits under room n exit', () => {
  for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].entry.x).toBe(LEVELS[i - 1].exit.x);
});

test('stages are 1+2, 3+4, then 5 alone, with gold below silver', () => {
  expect(STAGES.map((s) => s.rooms)).toEqual([[1, 2], [3, 4], [5]]);
  expect(() => validateStages(STAGES, ALL)).not.toThrow();
});

test('broken stage tables are refused', () => {
  expect(() => validateStages([{ rooms: [1, 2], goldMs: 1, silverMs: 2 }], ALL)).toThrow(/expected 1, 2, 3, 4, 5/);
  expect(() => validateStages([{ rooms: [2, 1, 3, 4, 5], goldMs: 1, silverMs: 2 }], ALL)).toThrow(/Stages cover/);
  const slow = [{ rooms: [1, 2, 3, 4, 5], goldMs: 5, silverMs: 5 }];
  expect(() => validateStages(slow, ALL)).toThrow(/Stage 1: gold/);
});

test('a broken room throws with its index', () => {
  const bad = { ...LEVELS[1], exit: { x: 180 } };
  expect(() => validateLevels([LEVELS[0], bad], config)).toThrow(/^Room 2: /);
});

test('each rule is reported', () => {
  const base = LEVELS[0];
  const errs = (def) => levelErrors(def, null, config);
  expect(errs({ ...base, wave: { ...base.wave, period: 3 } })).toContain('wave period below 4 s');
  expect(errs({ ...base, exit: { x: 180 } })).toContain('exit x outside allowed ranges');
  expect(errs({ ...base, entry: { x: 280 }, exit: { x: 265 } })).toContain('exit on the same side as entry');
  expect(errs({ ...base, hookPoints: [{ x: 100, y: 300, pol: 1 }] })).toContain('hook point 0 field too close to a wall');
  expect(errs({ ...base, hookPoints: [{ x: 108, y: 300, pol: 1 }] })).toContain('no field covers the centre line');
  expect(errs({ ...base, obstacles: [{ shape: 'bar', x: 110, y: 240, w: 20, h: 14 }] })).toContain('obstacle 0 crosses the orbit of hook point 2');
  expect(errs({ ...base, obstacles: [{ shape: 'circle', x: 180, y: 100, w: 20, h: 20 }] })).toContain('obstacle 0 is not a bar or square');
});

test('obstacle placement, bob and shaft-post rules are reported', () => {
  const base = LEVELS[0];
  const errs = (def) => levelErrors(def, null, config);
  expect(errs({ ...base, obstacles: [] })).toContain('no obstacle on the centre line in the upper half');
  expect(errs({ ...base, obstacles: [{ shape: 'bar', x: 180, y: 100, w: 300, h: 14 }] }))
    .toContain('obstacle 0 leaves no passable gap to a wall');       // 20 each side
  // Home distance 50 passes the 48 clearance; a 20-unit bob brings the hook within 38.
  const wobbly = [...base.hookPoints.slice(0, 2), { x: 110, y: 200, pol: -1, ampX: 20, ampY: 5 }];
  expect(errs({ ...base, hookPoints: wobbly, obstacles: [{ shape: 'square', x: 110, y: 257, w: 14, h: 14 }] }))
    .toContain('obstacle 0 touches the orbit of hook point 2 when it bobs');
  // (250, 90) is 35 from the exit's left post at x 227–235, y 0–58.
  expect(errs({ ...base, hookPoints: [...base.hookPoints, { x: 250, y: 90, pol: 1 }] }))
    .toContain('shaft post crosses the orbit of hook point 3');
});
