import { test, expect } from '@playwright/test';
import { detectPower, createGestureTrigger } from '../src/gestures.js';

function pose() {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.7, visibility: 1 }));
  lm[11] = { x: 0.35, y: 0.4, visibility: 1 };
  lm[12] = { x: 0.65, y: 0.4, visibility: 1 };
  lm[5] = { x: 0.56, y: 0.22, visibility: 1 };
  lm[16] = { x: 0.59, y: 0.22, visibility: 1 };
  return lm;
}

test('gesture rejects missing/occluded joints and leaves original heroes alone', () => {
  expect(detectPower('superman', null)).toBeNull();
  const lm = pose();
  expect(detectPower('superman', lm)).toBe('heatVision');
  expect(detectPower('wonderwoman', lm)).toBeNull();
  expect(detectPower('thor', lm)).toBeNull();
  lm[16].visibility = 0.2;
  expect(detectPower('superman', lm)).toBeNull();
  lm[16] = undefined;
  expect(detectPower('superman', lm)).toBeNull();
});

test('stable hold, cooldown, and tracking-loss reset prevent accidental bursts', () => {
  const update = createGestureTrigger(), lm = pose();
  expect(update('superman', lm, 0)).toBeNull();
  expect(update('superman', lm, 249)).toBeNull();
  expect(update('superman', lm, 250)?.power).toBe('heatVision');
  expect(update('superman', lm, 300)).toBeNull();
  expect(update('superman', null, 1900)).toBeNull();
  expect(update('superman', lm, 2000)).toBeNull();
  expect(update('superman', lm, 2250)?.power).toBe('heatVision');
});
