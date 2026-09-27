import { test, expect } from '@playwright/test';

async function trackingFixture(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.Pose = class {
      setOptions() {}
      onResults(callback) { this.callback = callback; }
      async send({image}) {
        window.testCamera = image.srcObject;
        if (window.testTrackingFailure) throw new Error('Tracking failed');
        const poseLandmarks = Array.from({length: 33}, (_, i) => ({x: 0.35 + (i % 2) * 0.3, y: 0.25 + Math.floor(i / 2) * 0.025, z: 0, visibility: 1}));
        const mask = document.createElement('canvas'); mask.width = 640; mask.height = 480;
        const ctx = mask.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 640, 480);
        this.callback({poseLandmarks: window.testNoPerson ? null : (window.testPose || poseLandmarks), segmentationMask: mask});
      }
      async close() {}
    }`,
  }));
}

const heroes = [
  ['SUPERMAN', ['HEAT VISION']],
  ['SPIDER-MAN', ['THWIP', 'MASK ON']],
  ['THOR', ['THUNDER']],
  ['IRON MAN', ['REPULSOR', 'CLOSE HUD']],
  ['WONDER WOMAN', ['LASSO', 'BRACELETS', 'SHIELD', 'AMAZONIAN POWER']],
];

for (const [hero, controls] of heroes) {
  test(`${hero}: select, render, use powers, capture, release camera`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await trackingFixture(page);
    await page.goto('/');
    await page.getByRole('button', { name: `Select ${hero}`, exact: true }).click();
    await expect(page.getByRole('heading', { name: hero, exact: true })).toBeVisible();
    for (const control of controls) await page.getByRole('button', { name: control, exact: true }).click();
    if (hero === 'SPIDER-MAN') await expect(page.getByRole('button', { name: 'MASK OFF' })).toBeVisible();
    if (hero === 'IRON MAN') await expect(page.getByRole('button', { name: 'OPEN HUD' })).toBeVisible();
    if (hero === 'WONDER WOMAN') {
      const shield = page.getByRole('button', { name: 'SHIELD', exact: true });
      await expect(shield).toHaveClass(/bg-yellow-500\/40/);
      await expect.poll(() => page.evaluate(() => document.querySelector('video').currentTime)).toBeGreaterThan(0.2);
      await expect(shield).toHaveClass(/bg-yellow-500\/40/);
    }
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download superhero photo' }).click();
    expect((await download).suggestedFilename()).toMatch(/hero-mode-.*\.png/);
    await page.getByRole('button', { name: 'Return to hero selection' }).click();
    await expect(page.getByRole('heading', { name: 'BECOME A SUPERHERO' })).toBeVisible();
    expect(await page.evaluate(() => window.testCamera.getTracks().every(track => track.readyState === 'ended'))).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('camera denial explains recovery', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError'); };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Select SUPERMAN', exact: true }).click();
  await expect(page.getByText(/Camera permission was denied/)).toBeVisible();
  await page.getByRole('button', { name: 'RETURN TO BASE' }).click();
  await expect(page.getByRole('button', { name: 'Select THOR', exact: true })).toBeVisible();
});

test('no person keeps camera view live; tracking failure releases camera', async ({ page }) => {
  await trackingFixture(page);
  await page.addInitScript(() => { window.testNoPerson = true; });
  await page.goto('/');
  await page.getByRole('button', { name: 'Select THOR', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'THOR', exact: true })).toBeVisible();
  await page.evaluate(() => { window.testTrackingFailure = true; });
  await expect(page.getByText(/Tracking stopped/)).toBeVisible();
  expect(await page.evaluate(() => window.testCamera.getTracks().every(track => track.readyState === 'ended'))).toBe(true);
});

test('mobile hero selection fits viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Select / })).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('leaving during camera permission request stops a late stream', async ({ page }) => {
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async options => {
      const stream = await original(options);
      window.testLateStream = stream;
      await new Promise(resolve => { window.resolveCamera = resolve; });
      return stream;
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Select THOR', exact: true }).click();
  await expect.poll(() => page.evaluate(() => typeof window.resolveCamera)).toBe('function');
  await page.getByRole('button', { name: 'RETURN TO BASE' }).click();
  await page.evaluate(() => window.resolveCamera());
  await expect.poll(() => page.evaluate(() => window.testLateStream.getTracks().every(track => track.readyState === 'ended'))).toBe(true);
});

const gestureCases = [
  ['SUPERMAN', 'HEAT VISION', { x: 0.59, y: 0.22 }],
  ['SPIDER-MAN', 'THWIP', { x: 0.95, y: 0.4 }],
  ['IRON MAN', 'REPULSOR', { x: 0.72, y: 0.3 }],
];
for (const [hero, button, wrist] of gestureCases) {
  test(`${hero}: gesture activates power and tracking loss lets it expire`, async ({ page }) => {
    await trackingFixture(page);
    await page.goto('/');
    await page.getByRole('button', { name: `Select ${hero}`, exact: true }).click();
    const power = page.getByRole('button', { name: button, exact: true });
    await expect(power).toHaveAttribute('aria-pressed', 'false');
    await page.evaluate(wrist => {
      const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.7, z: 0, visibility: 1 }));
      Object.assign(lm[11], { x: 0.35, y: 0.4 });
      Object.assign(lm[12], { x: 0.65, y: 0.4 });
      Object.assign(lm[14], { x: 0.8, y: 0.5 });
      Object.assign(lm[5], { x: 0.56, y: 0.22 });
      Object.assign(lm[16], wrist);
      window.testPose = lm;
    }, wrist);
    await expect(power).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => { window.testNoPerson = true; });
    await expect(power).toHaveAttribute('aria-pressed', 'false');
  });
}
