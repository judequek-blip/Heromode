import { test, expect } from '@playwright/test';

test('new effects paint the canvas and restore drawing state', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { drawSpiderMask, drawFlightSky, drawHammer } = await import('/src/heroEffects.js');
    const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 360;
    document.body.replaceChildren(canvas);
    const ctx = canvas.getContext('2d');
    const lm = Array.from({ length: 33 }, () => ({ x: 160, y: 165, visibility: 1 }));
    lm[2] = { x: 130, y: 135, visibility: 1 }; lm[5] = { x: 190, y: 145, visibility: 1 };
    drawSpiderMask(ctx, lm, 260);
    const mask = ctx.getImageData(0, 0, 320, 360).data;
    const whiteLensPixels = Array.from({length: mask.length / 4}, (_, i) => i * 4).filter(i => mask[i] > 220 && mask[i+1] > 220 && mask[i+2] > 220 && mask[i+3] > 0).length;
    ctx.save(); ctx.translate(320, 0); drawFlightSky(ctx, 320, 360, 1000); ctx.restore();
    lm[14] = { x: 800, y: 270, visibility: 1 }; lm[16] = { x: 800, y: 190, visibility: 1 };
    drawHammer(ctx, lm, 240, 1000);
    const hammer = ctx.getImageData(750, 70, 100, 160).data;
    const hammerPixels = Array.from({length: hammer.length / 4}, (_, i) => hammer[i * 4 + 3]).filter(a => a > 0).length;
    return { whiteLensPixels, hammerPixels, skyAlpha: ctx.getImageData(400, 20, 1, 1).data[3], identity: ctx.getTransform().isIdentity };
  });
  expect(result.whiteLensPixels).toBeGreaterThan(500);
  expect(result.hammerPixels).toBeGreaterThan(1000);
  expect(result.skyAlpha).toBe(255);
  expect(result.identity).toBe(true);
  await page.screenshot({ path: 'test-results/hero-effects.png' });
});

test('chest beam draws a bright reactor and a projected beam', async ({ page }) => {
  await page.goto('/');
  const pixels = await page.evaluate(async () => {
    const { drawChestBeam } = await import('/src/heroEffects.js');
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext('2d');
    drawChestBeam(ctx, { x: 320, y: 200 }, 150, 640, 480, 1000);
    return { origin: [...ctx.getImageData(320, 200, 1, 1).data], beam: [...ctx.getImageData(320, 400, 1, 1).data], outside: ctx.getImageData(10, 10, 1, 1).data[3], restored: ctx.getTransform().isIdentity && ctx.shadowBlur === 0 };
  });
  expect(pixels.origin.slice(0, 3).every(channel => channel >= 245)).toBe(true);
  expect(pixels.origin[3]).toBe(255);
  expect(pixels.beam[3]).toBeGreaterThan(180);
  expect(pixels.outside).toBe(0);
  expect(pixels.restored).toBe(true);
});

test('Spider-Man city and screen web render visibly', async ({ page }) => {
  await page.goto('/');
  const changes = await page.evaluate(async () => {
    const { drawSwingCity, drawSpiderWebs } = await import('/src/heroEffects.js');
    const c = document.createElement('canvas'); c.width = 640; c.height = 480;
    document.body.replaceChildren(c);
    const ctx = c.getContext('2d');
    drawSwingCity(ctx, 640, 480, 2000);
    const before = ctx.getImageData(0, 0, 640, 480).data;
    const lm = Array.from({length: 33}, () => ({x: 320, y: 240, visibility: 1}));
    lm[15].x = 540; lm[16].x = 100;
    drawSpiderWebs(ctx, lm, 640, 480, {left: true, right: true, screen: true, swing: true}, 2000);
    const after = ctx.getImageData(0, 0, 640, 480).data;
    return after.reduce((sum, value, i) => sum + (value !== before[i] ? 1 : 0), 0);
  });
  expect(changes).toBeGreaterThan(10000);
  await page.screenshot({path: 'test-results/spider-city.png'});
});

test('shockwave, earthquake, and downward jets paint visible pixels', async ({ page }) => {
  await page.goto('/');
  const counts = await page.evaluate(async () => {
    const { drawPowerShockwave, drawDownwardRepulsors } = await import('/src/heroEffects.js');
    const c = document.createElement('canvas'); c.width = 640; c.height = 480;
    const ctx = c.getContext('2d');
    const count = () => { const p = ctx.getImageData(0,0,640,480).data; let n=0; for(let i=3;i<p.length;i+=4) if(p[i]) n++; return n; };
    drawPowerShockwave(ctx, {x:320,y:240}, 150,640,480,500); const shock = count(); ctx.clearRect(0,0,640,480);
    drawPowerShockwave(ctx, {x:320,y:380},150,640,480,500,true); const quake=count(); ctx.clearRect(0,0,640,480);
    const lm=Array.from({length:33},()=>({x:200,y:280,visibility:1})); lm[16].x=440;
    drawDownwardRepulsors(ctx,lm,150,480,500);
    return [shock,quake,count(),ctx.getImageData(200,400,1,1).data[3],ctx.getImageData(440,400,1,1).data[3]];
  });
  for(const count of counts.slice(0,3)) expect(count).toBeGreaterThan(1000);
  for(const alpha of counts.slice(3)) expect(alpha).toBeGreaterThan(0);
});
