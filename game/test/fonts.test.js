import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from 'vitest';

const FONT = fileURLToPath(new URL('../public/fonts/baloo2-subset.woff2', import.meta.url));
const OFL = fileURLToPath(new URL('../public/fonts/OFL.txt', import.meta.url));

test('the Baloo 2 subset ships as WOFF2 within budget', () => {
  expect(existsSync(FONT)).toBe(true);
  expect(readFileSync(FONT).subarray(0, 4).toString('latin1')).toBe('wOF2');
  expect(statSync(FONT).size).toBeLessThan(80_000);
});

test('the OFL licence ships next to the font', () => {
  expect(readFileSync(OFL, 'utf8')).toMatch(/SIL OPEN FONT LICENSE/i);
});
