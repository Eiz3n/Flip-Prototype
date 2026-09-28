import { test, expect } from 'vitest';
import { starsFor } from '../src/stars.js';

const stage = { goldMs: 12_000, silverMs: 25_000 };

test('time sets the base: gold 3, silver 2, slower 1, limits inclusive', () => {
  expect(starsFor(9_000, 0, stage)).toBe(3);
  expect(starsFor(12_000, 0, stage)).toBe(3);
  expect(starsFor(12_001, 0, stage)).toBe(2);
  expect(starsFor(25_000, 0, stage)).toBe(2);
  expect(starsFor(25_001, 0, stage)).toBe(1);
});

test('any deaths remove one star, once, never below one', () => {
  expect(starsFor(9_000, 1, stage)).toBe(2);
  expect(starsFor(9_000, 7, stage)).toBe(2);
  expect(starsFor(20_000, 1, stage)).toBe(1);
  expect(starsFor(60_000, 3, stage)).toBe(1);
});
