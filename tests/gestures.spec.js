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

test('flight and hammer gestures stay hero-specific and need visible landmarks', () => {
  const lm = pose();
  lm[16] = { x: 0.65, y: 0.01, visibility: 1 };
  expect(detectPower('superman', lm)).toBe('flight');
  expect(detectPower('spiderman', lm)).toBeNull();
  lm[14] = { x: 0.8, y: 0.4, visibility: 1 };
  lm[16] = { x: 0.96, y: 0.4, visibility: 1 };
  expect(detectPower('thor', lm)).toBe('hammer');
  expect(detectPower('spiderman', lm)).toBe('web');
  lm[14].visibility = 0.1;
  expect(detectPower('thor', lm)).toBeNull();
});

test('chest beam requires both visible wrists above chest and wins over repulsor', () => {
  const lm = pose();
  lm[14] = { x: 0.8, y: 0.5, visibility: 1 };
  lm[16] = { x: 0.72, y: 0.3, visibility: 1 };
  expect(detectPower('ironman', lm)).toBe('repulsor');
  lm[15] = { x: 0.3, y: 0.42, visibility: 1 };
  expect(detectPower('ironman', lm)).toBe('chestBeam');
  lm[16].y = 0.42;
  expect(detectPower('ironman', lm)).toBe('chestBeam');
  lm[15].visibility = 0.1;
  expect(detectPower('ironman', lm)).toBeNull();
  lm[15].visibility = 1; lm[15].y = 0.55;
  expect(detectPower('ironman', lm)).toBeNull();
  lm[15].y = 0.42; lm[16].y = 0.55;
  expect(detectPower('ironman', lm)).toBeNull();
});
