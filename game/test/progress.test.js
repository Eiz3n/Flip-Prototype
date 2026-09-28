import { test, expect } from 'vitest';
import { emptyProgress, loadProgress, saveProgress, recordStage, starTotal } from '../src/progress.js';

const KEY = 'flip.stages.v1';
const store = (raw) => ({ getItem: () => raw, setItem() {} });

test('first clear is a new best; faster time replaces it, stars only go up', () => {
  const p = emptyProgress();
  expect(recordStage(p, 1, 20_000, 1)).toBe(true);
  expect(recordStage(p, 1, 25_000, 3)).toBe(false);      // slower, but more stars
  expect(p.stages['1']).toEqual({ bestMs: 20_000, stars: 3 });
  expect(recordStage(p, 1, 15_000, 2)).toBe(true);       // faster, fewer stars
  expect(p.stages['1']).toEqual({ bestMs: 15_000, stars: 3 });
});

test('star total sums best stars over cleared stages', () => {
  const p = emptyProgress();
  expect(starTotal(p)).toBe(0);
  recordStage(p, 1, 10_000, 2);
  recordStage(p, 3, 10_000, 1);
  expect(starTotal(p)).toBe(3);
});

test('save then load round-trips', () => {
  const m = new Map();
  const s = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  const p = emptyProgress();
  recordStage(p, 2, 13_400, 2);
  saveProgress(s, KEY, p);
  expect(loadProgress(s, KEY)).toEqual(p);
});

test('missing, blocked, corrupt or bad entries load as no progress', () => {
  expect(loadProgress(null, KEY)).toEqual(emptyProgress());
  expect(loadProgress(store(null), KEY)).toEqual(emptyProgress());
  expect(loadProgress({ getItem() { throw new Error('blocked'); } }, KEY)).toEqual(emptyProgress());
  expect(loadProgress(store('{not json'), KEY)).toEqual(emptyProgress());
  expect(loadProgress(store('{"stages":null}'), KEY)).toEqual(emptyProgress());
  const mixed = '{"stages":{"1":{"bestMs":9000,"stars":2},"2":{"bestMs":-1,"stars":2},"3":{"bestMs":9000,"stars":0}}}';
  expect(loadProgress(store(mixed), KEY)).toEqual({ stages: { 1: { bestMs: 9000, stars: 2 } } });
  expect(() => saveProgress({ setItem() { throw new Error('blocked'); } }, KEY, emptyProgress())).not.toThrow();
});
