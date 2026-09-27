import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Zap, Shield, Target, ArrowLeft, Download, Activity, Eye, Hand, Crosshair, Sparkles, Sun, CircleDot, Swords } from 'lucide-react';

// --- CONFIGURATION & CONSTANTS ---
const HEROES = {
  SUPERMAN: {
    id: 'superman',
    name: 'SUPERMAN',
    color: '#005b9f',
    accent: '#ed1c24',
    powers: ['FLIGHT', 'HEAT VISION', 'SUPER STRENGTH'],
    description: 'Kryptonian physiology grants immense power.',
    tagline: 'Truth and Justice'
  },
  SPIDERMAN: {
    id: 'spiderman',
    name: 'SPIDER-MAN',
    color: '#d30022',
    accent: '#0047bb',
    powers: ['WEB SHOOTING', 'SPIDER-SENSE', 'AGILITY'],
    description: 'Bitten by a radioactive spider.',
    tagline: 'Friendly Neighborhood'
  },
  THOR: {
    id: 'thor',
    name: 'THOR',
    color: '#4a5568',
    accent: '#f6e05e',
    powers: ['MJOLNIR', 'LIGHTNING', 'GOD MODE'],
    description: 'God of Thunder, wielder of Mjolnir.',
    tagline: 'Bring the Thunder'
  },
  IRONMAN: {
    id: 'ironman',
    name: 'IRON MAN',
    color: '#b30000',
    accent: '#e6b800',
    powers: ['REPULSOR', 'FLIGHT', 'JARVIS HUD'],
    description: 'Genius, billionaire, armored avenger.',
    tagline: 'I am Iron Man'
  },
  WONDERWOMAN: {
    id: 'wonderwoman',
    name: 'WONDER WOMAN',
    color: '#c00000',
    accent: '#ffd700',
    powers: ['LASSO OF TRUTH', 'BRACELET DEFLECTION', 'SHIELD DEFENSE', 'AMAZONIAN POWER'],
    description: 'Amazonian warrior princess with divine gifts.',
    tagline: 'Spirit of Truth'
  }
};

// --- UTILITIES & MATH ---
const distance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
const angle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x);
const midPoint = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: (p1.z + p2.z) / 2 });

const getPerpendicular = (p1, p2, length) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;
  return { x: -(dy/dist) * length, y: (dx/dist) * length };
};

// Extrude a line into a polygon representing a body segment
const buildLimb = (p1, p2, widthStart, widthEnd) => {
  const perp1 = getPerpendicular(p1, p2, widthStart / 2);
  const perp2 = getPerpendicular(p1, p2, widthEnd / 2);
  return [
    { x: p1.x + perp1.x, y: p1.y + perp1.y, z: p1.z },
    { x: p2.x + perp2.x, y: p2.y + perp2.y, z: p2.z },
    { x: p2.x - perp2.x, y: p2.y - perp2.y, z: p2.z },
    { x: p1.x - perp1.x, y: p1.y - perp1.y, z: p1.z }
  ];
};

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// --- PROCEDURAL TEXTURE GENERATOR ---
const Textures = {
  cache: {},
  getPattern(ctx, type, color, accentColor) {
    const key = `${type}-${color}-${accentColor}`;
    if (this.cache[key]) return this.cache[key];

    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const cCtx = c.getContext('2d');
    
    // Base Color
    cCtx.fillStyle = color;
    cCtx.fillRect(0, 0, 64, 64);

    if (type === 'fabric') {
      // Fine mesh/spandex texture
      cCtx.fillStyle = 'rgba(0,0,0,0.15)';
      for(let i=0; i<64; i+=4) {
        cCtx.fillRect(i, 0, 1, 64);
        cCtx.fillRect(0, i, 64, 1);
      }
      cCtx.fillStyle = 'rgba(255,255,255,0.05)';
      for(let i=2; i<64; i+=4) {
        cCtx.fillRect(i, 0, 1, 64);
        cCtx.fillRect(0, i, 64, 1);
      }
    } else if (type === 'metal') {
      // Brushed metal texture
      cCtx.fillStyle = 'rgba(255,255,255,0.1)';
      for(let i=0; i<200; i++) {
        cCtx.fillRect(Math.random()*64, Math.random()*64, Math.random()*20+10, 1);
      }
      cCtx.fillStyle = 'rgba(0,0,0,0.1)';
      for(let i=0; i<200; i++) {
        cCtx.fillRect(Math.random()*64, Math.random()*64, Math.random()*20+10, 1);
      }
    } else if (type === 'gold') {
      // Metallic Gold finish
      cCtx.fillStyle = '#ffd700';
      cCtx.fillRect(0, 0, 64, 64);
      cCtx.fillStyle = 'rgba(255,255,255,0.3)';
      for(let i=0; i<64; i+=8) { cCtx.fillRect(i, 0, 3, 64); }
      cCtx.fillStyle = 'rgba(180,120,0,0.2)';
      for(let i=4; i<64; i+=8) { cCtx.fillRect(i, 0, 3, 64); }
    } else if (type === 'leather') {
      // Amazonian Battle Leather
      cCtx.fillStyle = '#0a1d37';
      cCtx.fillRect(0, 0, 64, 64);
      cCtx.fillStyle = 'rgba(255,255,255,0.08)';
      for(let i=0; i<64; i+=6) { cCtx.fillRect(i, 0, 2, 64); }
    } else if (type === 'carbon') {
      // Carbon fiber weave
      cCtx.fillStyle = 'rgba(0,0,0,0.3)';
      for(let y=0; y<64; y+=8) {
        for(let x=0; x<64; x+=8) {
          if ((x/8 + y/8) % 2 === 0) cCtx.fillRect(x, y, 8, 8);
        }
      }
      cCtx.strokeStyle = 'rgba(255,255,255,0.1)';
      cCtx.beginPath();
      for(let i=0; i<64; i+=4) { cCtx.moveTo(0, i); cCtx.lineTo(64, i+64); }
      cCtx.stroke();
    } else if (type === 'chainmail') {
      // Overlapping rings
      cCtx.strokeStyle = 'rgba(0,0,0,0.4)';
      cCtx.lineWidth = 1;
      for(let y=0; y<=64; y+=8) {
        for(let x=0; x<=64; x+=8) {
           cCtx.beginPath();
           cCtx.arc(x + (y%16===0?0:4), y, 5, 0, Math.PI*2);
           cCtx.stroke();
        }
      }
    }

    const pattern = ctx.createPattern(c, 'repeat');
    this.cache[key] = pattern;
    return pattern;
  }
};

// --- ADVANCED RENDERING ENGINE ---
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.w = canvas.width;
    this.h = canvas.height;
    
    // Internal off-screen canvases for layered compositing
    this.userCanvas = document.createElement('canvas');
    this.userCanvas.width = this.w; this.userCanvas.height = this.h;
    this.suitCanvas = document.createElement('canvas');
    this.suitCanvas.width = this.w; this.suitCanvas.height = this.h;
    
    this.skinTightQueue = [];
    this.bulkyQueue = [];
    this.effectsQueue = [];
  }

  // Map normalized landmark to canvas coordinates (flips X to match unmirrored drawing logic)
  mapPoint(lm) {
    return { 
      x: (1 - lm.x) * this.w, // Flip X mathematically instead of CSS/Ctx transform to preserve lighting logic
      y: lm.y * this.h, 
      z: lm.z * this.w // scale Z relative to width for depth sorting
    };
  }

  queueSegment(queue, points, type, color, accentColor, isBackground = false) {
    if (!points || points.some(p => !p)) return;
    const zAvg = points.reduce((sum, p) => sum + p.z, 0) / points.length;
    queue.push({ points, type, color, accentColor, z: zAvg, isBackground });
  }

  drawPolygon(ctx, points, type, color, accentColor) {
    if (points.length < 3) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();

    // Fill with procedural texture
    ctx.fillStyle = Textures.getPattern(ctx, type, color, accentColor);
    ctx.fill();

    // DYNAMIC LIGHTING PASS
    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));

    // Directional light from top-left
    const lightGrad = ctx.createLinearGradient(minX, minY, maxX, maxY);
    if (type === 'metal') {
      lightGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
      lightGrad.addColorStop(0.3, 'rgba(255,255,255,0)');
      lightGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
      lightGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
    } else {
      lightGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
      lightGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
      lightGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    }

    ctx.fillStyle = lightGrad;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Armor panel seams
    if (type === 'metal') {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Inner highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawGlow(ctx, p, radius, color, innerColor = '#fff') {
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = innerColor;
    ctx.shadowBlur = radius * 2;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // The core loop: Renders reality, masks the user, applies tight suits, then adds armor.
  render(landmarksRaw, maskImg, videoElement, heroConfig, state) {
    const mainCtx = this.canvas.getContext('2d');
    const uCtx = this.userCanvas.getContext('2d');
    const sCtx = this.suitCanvas.getContext('2d');

    // 1. Draw Reality Background
    mainCtx.clearRect(0, 0, this.w, this.h);
    
    // We flip the video horizontally when drawing to match our math flip
    mainCtx.save();
    mainCtx.scale(-1, 1);
    mainCtx.translate(-this.w, 0);
    mainCtx.drawImage(videoElement, 0, 0, this.w, this.h);
    mainCtx.restore();

    if (!landmarksRaw || !maskImg) return;

    // Process landmarks
    const lm = landmarksRaw.map(p => this.mapPoint(p));
    this.skinTightQueue = [];
    this.bulkyQueue = [];
    this.effectsQueue = [];

    // Parse specific hero geometry
    this.parseHeroGeometry(lm, heroConfig.id, state);

    // Wonder Woman Atmospheric Power Overlay
    if (heroConfig.id === 'wonderwoman' && state.powers.amazonianPower) {
      mainCtx.save();
      mainCtx.fillStyle = 'rgba(40, 20, 0, 0.35)';
      mainCtx.fillRect(0, 0, this.w, this.h);
      
      // Floating particles
      const now = Date.now() * 0.003;
      mainCtx.fillStyle = '#ffe680';
      for (let i = 0; i < 25; i++) {
        const px = (Math.sin(now + i * 1.5) * 0.5 + 0.5) * this.w;
        const py = ((now * 50 + i * 40) % this.h);
        const pSize = 2 + (i % 3);
        mainCtx.beginPath();
        mainCtx.arc(px, this.h - py, pSize, 0, Math.PI * 2);
        mainCtx.shadowBlur = 10;
        mainCtx.shadowColor = '#ffd700';
        mainCtx.fill();
      }
      mainCtx.restore();
    }

    // 2. Draw Background Capes (behind user)
    const bgBulky = this.bulkyQueue.filter(q => q.isBackground);
    bgBulky.sort((a, b) => b.z - a.z);
    bgBulky.forEach(q => this.drawPolygon(mainCtx, q.points, q.type, q.color, q.accentColor));

    // 3. Extract User Silhouette from Reality
    // Flip mask drawing to align with flipped video coordinates
    uCtx.clearRect(0, 0, this.w, this.h);
    uCtx.save();
    uCtx.scale(-1, 1);
    uCtx.translate(-this.w, 0);
    uCtx.drawImage(maskImg, 0, 0, this.w, this.h);
    uCtx.restore();
    
    // Use the mask to clip the original video to just the user
    uCtx.globalCompositeOperation = 'source-in';
    uCtx.save();
    uCtx.scale(-1, 1);
    uCtx.translate(-this.w, 0);
    uCtx.drawImage(videoElement, 0, 0, this.w, this.h);
    uCtx.restore();
    uCtx.globalCompositeOperation = 'source-over';

    // 4. Draw User over the Background/Capes (Physical Presence)
    mainCtx.drawImage(this.userCanvas, 0, 0);

    // 5. Render Skin-Tight Suit Layer
    sCtx.clearRect(0, 0, this.w, this.h);
    // Draw the segmentation mask first
    sCtx.save();
    sCtx.scale(-1, 1);
    sCtx.translate(-this.w, 0);
    sCtx.drawImage(maskImg, 0, 0, this.w, this.h);
    sCtx.restore();
    
    // Source-in ensures the costume NEVER bleeds off the actual body
    sCtx.globalCompositeOperation = 'source-in';
    
    this.skinTightQueue.sort((a, b) => b.z - a.z); // Z-Depth Sorting for arms crossing body
    this.skinTightQueue.forEach(q => this.drawPolygon(sCtx, q.points, q.type, q.color, q.accentColor));
    
    // Add custom overlays on skin-tight (e.g. Spider webs)
    this.drawSkinTightOverlays(sCtx, lm, heroConfig.id);
    
    sCtx.globalCompositeOperation = 'source-over';

    // 6. Composite Skin-Tight layer onto Main
    mainCtx.drawImage(this.suitCanvas, 0, 0);

    // 7. Render Bulky Foreground Armor
    const fgBulky = this.bulkyQueue.filter(q => !q.isBackground);
    fgBulky.sort((a, b) => b.z - a.z);
    fgBulky.forEach(q => this.drawPolygon(mainCtx, q.points, q.type, q.color, q.accentColor));

    // 8. Render Glowing Effects (Top Layer)
    this.effectsQueue.forEach(effect => effect(mainCtx));
  }

  // Calculates dynamic widths and builds polygons for body parts based on pose
  parseHeroGeometry(lm, heroId, state) {
    const sDist = distance(lm[11], lm[12]); // Shoulder width defines proportions
    const torso = [lm[11], lm[12], lm[24], lm[23]];
    
    // Base geometry definitions mapped to physical joints
    const arms = [
      { p1: lm[11], p2: lm[13], w1: sDist*0.4, w2: sDist*0.3 }, // L Upper Arm
      { p1: lm[13], p2: lm[15], w1: sDist*0.3, w2: sDist*0.2 }, // L Forearm
      { p1: lm[12], p2: lm[14], w1: sDist*0.4, w2: sDist*0.3 }, // R Upper Arm
      { p1: lm[14], p2: lm[16], w1: sDist*0.3, w2: sDist*0.2 }  // R Forearm
    ];
    
    const legs = [
      { p1: lm[23], p2: lm[25], w1: sDist*0.5, w2: sDist*0.4 }, // L Thigh
      { p1: lm[24], p2: lm[26], w1: sDist*0.5, w2: sDist*0.4 }  // R Thigh
    ];

    if (heroId === 'spiderman') {
      // Skin-tight full body (Masked by segmentation)
      this.queueSegment(this.skinTightQueue, torso, 'carbon', '#002266', null);
      arms.forEach(a => this.queueSegment(this.skinTightQueue, buildLimb(a.p1, a.p2, a.w1, a.w2), 'carbon', '#aa0000', null));
      legs.forEach(l => this.queueSegment(this.skinTightQueue, buildLimb(l.p1, l.p2, l.w1, l.w2), 'carbon', '#002266', null));
      
      // Red central stripe on torso
      const centerTorso = [
         {x: lm[11].x + sDist*0.2, y: lm[11].y, z: lm[11].z},
         {x: lm[12].x - sDist*0.2, y: lm[12].y, z: lm[12].z},
         {x: lm[24].x - sDist*0.2, y: lm[24].y, z: lm[24].z},
         {x: lm[23].x + sDist*0.2, y: lm[23].y, z: lm[23].z}
      ];
      this.queueSegment(this.skinTightQueue, centerTorso, 'fabric', '#aa0000', null);

      if (state.helmetActive) {
         // Head polygon (oversized slightly, segmentation will clip it perfectly)
         const headW = sDist * 0.8;
         const head = [
           {x: lm[0].x - headW/2, y: lm[0].y - headW, z: lm[0].z},
           {x: lm[0].x + headW/2, y: lm[0].y - headW, z: lm[0].z},
           {x: lm[0].x + headW/2, y: lm[0].y + headW/2, z: lm[0].z},
           {x: lm[0].x - headW/2, y: lm[0].y + headW/2, z: lm[0].z}
         ];
         this.queueSegment(this.skinTightQueue, head, 'fabric', '#aa0000', null);
      }

      if (state.powers.web) {
         this.effectsQueue.push((ctx) => {
           ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
           ctx.beginPath(); ctx.moveTo(lm[16].x, lm[16].y); ctx.lineTo(this.w/2, 0); ctx.stroke();
         });
      }
    }

    else if (heroId === 'superman') {
      // Background Cape
      const cape = [
        {x: lm[11].x - sDist*0.2, y: lm[11].y, z: lm[11].z + 50},
        {x: lm[12].x + sDist*0.2, y: lm[12].y, z: lm[12].z + 50},
        {x: lm[12].x + sDist*0.8, y: this.h, z: lm[12].z + 100},
        {x: lm[11].x - sDist*0.8, y: this.h, z: lm[11].z + 100}
      ];
      this.queueSegment(this.bulkyQueue, cape, 'fabric', '#990000', null, true); // true = Background

      // Blue Suit
      this.queueSegment(this.skinTightQueue, torso, 'fabric', '#003366', null);
      arms.forEach(a => this.queueSegment(this.skinTightQueue, buildLimb(a.p1, a.p2, a.w1, a.w2), 'fabric', '#003366', null));
      legs.forEach(l => this.queueSegment(this.skinTightQueue, buildLimb(l.p1, l.p2, l.w1, l.w2), 'fabric', '#003366', null));

      // S-Shield (Bulky so it pops off the chest slightly)
      const cX = (lm[11].x + lm[12].x) / 2;
      const cY = (lm[11].y + lm[12].y) / 2 + sDist*0.3;
      const sSize = sDist * 0.35;
      const shield = [
        {x: cX - sSize, y: cY - sSize/2, z: lm[11].z - 10},
        {x: cX + sSize, y: cY - sSize/2, z: lm[11].z - 10},
        {x: cX, y: cY + sSize, z: lm[11].z - 10}
      ];
      this.queueSegment(this.bulkyQueue, shield, 'metal', '#ee1111', '#ffee00');

      if (state.powers.heatVision && lm[2] && lm[5]) {
         this.effectsQueue.push((ctx) => {
            ctx.strokeStyle = 'rgba(255,50,0,0.8)'; ctx.lineWidth = 10;
            ctx.shadowBlur = 20; ctx.shadowColor = 'red';
            ctx.beginPath(); ctx.moveTo(lm[2].x, lm[2].y); ctx.lineTo(lm[2].x + (lm[2].x - lm[5].x)*10, this.h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(lm[5].x, lm[5].y); ctx.lineTo(lm[5].x - (lm[2].x - lm[5].x)*10, this.h); ctx.stroke();
            ctx.shadowBlur = 0;
         });
      }
    }

    else if (heroId === 'ironman') {
      // Iron Man is purely Bulky armor extending past the body mask
      this.queueSegment(this.bulkyQueue, torso, 'metal', '#a30000', null);
      arms.forEach(a => this.queueSegment(this.bulkyQueue, buildLimb(a.p1, a.p2, a.w1*1.2, a.w2*1.2), 'metal', '#a30000', null));
      
      // Shoulder plates
      const padSize = sDist * 0.3;
      this.queueSegment(this.bulkyQueue, [
        {x: lm[11].x - padSize, y: lm[11].y - padSize, z: lm[11].z - 20},
        {x: lm[11].x + padSize, y: lm[11].y - padSize/2, z: lm[11].z - 20},
        {x: lm[11].x, y: lm[11].y + padSize, z: lm[11].z - 10}
      ], 'metal', '#ccaa00', null);
      this.queueSegment(this.bulkyQueue, [
        {x: lm[12].x + padSize, y: lm[12].y - padSize, z: lm[12].z - 20},
        {x: lm[12].x - padSize, y: lm[12].y - padSize/2, z: lm[12].z - 20},
        {x: lm[12].x, y: lm[12].y + padSize, z: lm[12].z - 10}
      ], 'metal', '#ccaa00', null);

      // Arc Reactor
      const cX = (lm[11].x + lm[12].x) / 2;
      const cY = (lm[11].y + lm[12].y) / 2 + sDist*0.3;
      this.effectsQueue.push((ctx) => this.drawGlow(ctx, {x: cX, y: cY}, sDist*0.15, '#00ffff', '#ffffff'));

      if (state.helmetActive) {
         const headW = sDist * 0.7;
         const faceplate = [
           {x: lm[0].x - headW/2, y: lm[0].y - headW, z: lm[0].z - 30},
           {x: lm[0].x + headW/2, y: lm[0].y - headW, z: lm[0].z - 30},
           {x: lm[0].x + headW/3, y: lm[0].y + headW/1.5, z: lm[0].z - 30},
           {x: lm[0].x - headW/3, y: lm[0].y + headW/1.5, z: lm[0].z - 30}
         ];
         this.queueSegment(this.bulkyQueue, faceplate, 'metal', '#ccaa00', null);
         this.effectsQueue.push((ctx) => {
            if(lm[2]) this.drawGlow(ctx, lm[2], headW*0.15, '#00ffff');
            if(lm[5]) this.drawGlow(ctx, lm[5], headW*0.15, '#00ffff');
         });
      }

      if (state.powers.repulsor) {
         this.effectsQueue.push((ctx) => {
            this.drawGlow(ctx, lm[16], 40 + Math.random()*20, '#00ffff', '#fff');
            ctx.beginPath(); ctx.moveTo(lm[16].x, lm[16].y); ctx.lineTo(lm[16].x, 0);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; ctx.lineWidth = 30; ctx.shadowBlur = 20; ctx.shadowColor = '#00ffff';
            ctx.stroke(); ctx.shadowBlur = 0;
         });
      }
    }

    else if (heroId === 'thor') {
      // Cape background
      const cape = [
        {x: lm[11].x - sDist*0.1, y: lm[11].y, z: lm[11].z + 50},
        {x: lm[12].x + sDist*0.1, y: lm[12].y, z: lm[12].z + 50},
        {x: lm[12].x + sDist*0.7, y: this.h, z: lm[12].z + 100},
        {x: lm[11].x - sDist*0.7, y: this.h, z: lm[11].z + 100}
      ];
      this.queueSegment(this.bulkyQueue, cape, 'fabric', '#880000', null, true);

      // Skin tight chainmail arms
      arms.forEach(a => this.queueSegment(this.skinTightQueue, buildLimb(a.p1, a.p2, a.w1, a.w2), 'chainmail', '#444444', null));
      
      // Bulky Chest Armor
      this.queueSegment(this.bulkyQueue, torso, 'metal', '#222222', null);
      
      // Disks
      const dRad = sDist * 0.12;
      const dPos = [
        {x: lm[11].x + dRad*1.5, y: lm[11].y + dRad*2, z: lm[11].z - 15}, 
        {x: lm[12].x - dRad*1.5, y: lm[12].y + dRad*2, z: lm[12].z - 15},
        {x: lm[11].x + dRad*1.5, y: lm[11].y + dRad*5, z: lm[23].z - 10}, 
        {x: lm[12].x - dRad*1.5, y: lm[12].y + dRad*5, z: lm[24].z - 10}
      ];
      dPos.forEach(p => {
         this.effectsQueue.push((ctx) => {
            ctx.beginPath(); ctx.arc(p.x, p.y, dRad, 0, Math.PI*2);
            ctx.fillStyle = '#666'; ctx.fill();
            ctx.strokeStyle = '#999'; ctx.lineWidth = 3; ctx.stroke();
         });
      });

      if (state.powers.lightning) {
         this.effectsQueue.push((ctx) => {
            ctx.strokeStyle = '#aaddff'; ctx.lineWidth = 4; ctx.shadowBlur = 15; ctx.shadowColor = '#0088ff';
            for(let i=0; i<3; i++) {
               ctx.beginPath(); ctx.moveTo(lm[16].x, lm[16].y);
               ctx.lineTo(lm[16].x + (Math.random()-0.5)*300, 0); ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(0,0,this.w, this.h);
         });
      }
    }

    else if (heroId === 'wonderwoman') {
      // 1. Red Metallic Cuirass (Torso Armor)
      this.queueSegment(this.skinTightQueue, torso, 'metal', '#a0001a', '#ffd700');

      // Golden Eagle Crest on chest
      const cX = (lm[11].x + lm[12].x) / 2;
      const cY = lm[11].y + sDist * 0.2;
      const eagleWing = [
        { x: cX - sDist * 0.45, y: lm[11].y, z: lm[11].z - 5 },
        { x: cX + sDist * 0.45, y: lm[12].y, z: lm[12].z - 5 },
        { x: cX + sDist * 0.2, y: cY + sDist * 0.15, z: lm[12].z - 5 },
        { x: cX, y: cY, z: lm[11].z - 5 },
        { x: cX - sDist * 0.2, y: cY + sDist * 0.15, z: lm[11].z - 5 }
      ];
      this.queueSegment(this.bulkyQueue, eagleWing, 'gold', '#ffd700', null);

      // Gold Belt W-Emblem
      const beltY = (lm[23].y + lm[24].y) / 2;
      const belt = [
        { x: lm[23].x - sDist*0.05, y: beltY - sDist*0.12, z: lm[23].z - 5 },
        { x: lm[24].x + sDist*0.05, y: beltY - sDist*0.12, z: lm[24].z - 5 },
        { x: cX, y: beltY + sDist*0.1, z: lm[23].z - 10 }
      ];
      this.queueSegment(this.bulkyQueue, belt, 'gold', '#ffd700', null);

      // 2. Blue Battle Armor Skirt
      const skirt = [
        { x: lm[23].x - sDist*0.1, y: beltY, z: lm[23].z },
        { x: lm[24].x + sDist*0.1, y: beltY, z: lm[24].z },
        { x: lm[26].x + sDist*0.15, y: (lm[24].y + lm[26].y)/2, z: lm[26].z },
        { x: lm[25].x - sDist*0.15, y: (lm[23].y + lm[25].y)/2, z: lm[25].z }
      ];
      this.queueSegment(this.skinTightQueue, skirt, 'leather', '#0f2b5c', null);

      // 3. Armored Boots & Greaves
      legs.forEach(l => this.queueSegment(this.skinTightQueue, buildLimb(l.p1, l.p2, l.w1*0.8, l.w2*0.8), 'metal', '#a0001a', '#ffd700'));

      // 4. Metallic Bracelets on Forearms
      const leftForearm = buildLimb(lm[13], lm[15], sDist*0.28, sDist*0.22);
      const rightForearm = buildLimb(lm[14], lm[16], sDist*0.28, sDist*0.22);
      this.queueSegment(this.bulkyQueue, leftForearm, 'metal', '#e2e8f0', '#ffd700');
      this.queueSegment(this.bulkyQueue, rightForearm, 'metal', '#e2e8f0', '#ffd700');

      // 5. Golden Tiara
      if (lm[0]) {
        const tW = sDist * 0.45;
        const tiaraY = lm[0].y - sDist * 0.25;
        const tiara = [
          { x: lm[0].x - tW/2, y: tiaraY, z: lm[0].z - 10 },
          { x: lm[0].x, y: tiaraY - sDist*0.12, z: lm[0].z - 15 },
          { x: lm[0].x + tW/2, y: tiaraY, z: lm[0].z - 10 },
          { x: lm[0].x, y: tiaraY + sDist*0.08, z: lm[0].z - 10 }
        ];
        this.queueSegment(this.bulkyQueue, tiara, 'gold', '#ffd700', null);
      }

      // 6. Lasso of Truth (Attached to Hip or Hand/Throwing)
      const hipPos = { x: lm[24].x + sDist*0.15, y: lm[24].y, z: lm[24].z };
      const rightHand = lm[16] || hipPos;

      this.effectsQueue.push((ctx) => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffea00';
        ctx.strokeStyle = '#fff066';
        ctx.lineWidth = 4;

        if (state.powers.lassoSpin || state.powers.lassoThrow) {
          // Animated spinning / thrown golden lasso
          const hand = rightHand;
          const time = Date.now() * 0.01;
          ctx.beginPath();
          if (state.powers.lassoThrow) {
            ctx.moveTo(hipPos.x, hipPos.y);
            ctx.quadraticCurveTo(hand.x, hand.y - 100, this.w / 2, 50);
            ctx.lineWidth = 6;
            ctx.stroke();

            // Lasso loop
            ctx.beginPath();
            ctx.ellipse(this.w / 2, 50, 60, 25, time, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // Spinning loop around hand
            ctx.beginPath();
            for (let i = 0; i < Math.PI * 4; i += 0.2) {
              const r = 35 + Math.sin(time + i) * 10;
              const lx = hand.x + Math.cos(i + time) * r;
              const ly = hand.y + Math.sin(i * 2 + time) * (r * 0.5);
              if (i === 0) ctx.moveTo(lx, ly);
              else ctx.lineTo(lx, ly);
            }
            ctx.stroke();
          }
        } else {
          // Coiled on Hip
          ctx.beginPath();
          ctx.ellipse(hipPos.x, hipPos.y + 10, 18, 25, Math.PI / 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 7. Shield Defense
      if (state.powers.shield) {
        this.effectsQueue.push((ctx) => {
          const hand = lm[15]; // Left forearm/wrist shield
          if (!hand) return;
          const rad = sDist * 0.45;
          ctx.save();
          ctx.translate(hand.x, hand.y);

          // Shield Rim & Layers
          ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.fillStyle = '#1e293b'; ctx.fill();
          ctx.lineWidth = 6; ctx.strokeStyle = '#ffd700'; ctx.stroke();

          ctx.beginPath(); ctx.arc(0, 0, rad * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = '#8c0d0d'; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = '#c0c0c0'; ctx.stroke();

          // Center Gold Star
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const sx = Math.cos(a) * rad * 0.35;
            const sy = Math.sin(a) * rad * 0.35;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath(); ctx.fill();

          // Shield Impact Sparks
          if (Math.random() > 0.4) {
            ctx.strokeStyle = '#ffffff';
            ctx.shadowBlur = 10; ctx.shadowColor = '#ffd700';
            for (let k = 0; k < 4; k++) {
              const ang = Math.random() * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(Math.cos(ang) * rad * 0.5, Math.sin(ang) * rad * 0.5);
              ctx.lineTo(Math.cos(ang) * (rad + 20), Math.sin(ang) * (rad + 20));
              ctx.stroke();
            }
          }
          ctx.restore();
        });
      }

      // 8. Bracelet Deflection & Shockwave
      if (state.powers.braceletDeflect || state.powers.shockwave) {
        const wristMid = midPoint(lm[15], lm[16]);
        this.effectsQueue.push((ctx) => {
          ctx.save();
          const rad = state.powers.shockwave ? 180 : 80;
          ctx.shadowBlur = 30; ctx.shadowColor = '#ffd700';

          // Bright flash center
          ctx.beginPath();
          ctx.arc(wristMid.x, wristMid.y, rad * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff'; ctx.fill();

          // Golden Shockwave Ring
          ctx.beginPath();
          ctx.arc(wristMid.x, wristMid.y, rad, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 8; ctx.stroke();

          // Spark bursts
          for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6;
            ctx.beginPath();
            ctx.moveTo(wristMid.x + Math.cos(a) * (rad * 0.5), wristMid.y + Math.sin(a) * (rad * 0.5));
            ctx.lineTo(wristMid.x + Math.cos(a) * (rad + 40), wristMid.y + Math.sin(a) * (rad + 40));
            ctx.strokeStyle = '#ffea00'; ctx.lineWidth = 3; ctx.stroke();
          }
          ctx.restore();
        });
      }

      // 9. Amazonian Power Mode Glowing Body Aura & Tiara Glow
      if (state.powers.amazonianPower) {
        this.effectsQueue.push((ctx) => {
          ctx.save();
          if (lm[0]) this.drawGlow(ctx, lm[0], sDist * 0.25, '#ffd700', '#ffffff');
          this.drawGlow(ctx, lm[15], sDist * 0.2, '#ffd700', '#ffffff');
          this.drawGlow(ctx, lm[16], sDist * 0.2, '#ffd700', '#ffffff');
          ctx.restore();
        });
      }
    }
  }

  // Draw explicit features ON the skin-tight masked layer
  drawSkinTightOverlays(ctx, lm, heroId) {
     if (heroId === 'spiderman') {
        const cX = (lm[11].x + lm[12].x) / 2;
        const cY = (lm[11].y + lm[12].y) / 2 + distance(lm[11], lm[12])*0.3;
        // Webs
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
        for(let i=1; i<5; i++) {
           ctx.beginPath(); ctx.moveTo(cX, cY); ctx.lineTo(lm[11].x + i*20, lm[11].y + i*30); ctx.stroke();
           ctx.beginPath(); ctx.moveTo(cX, cY); ctx.lineTo(lm[12].x - i*20, lm[12].y + i*30); ctx.stroke();
        }
        // Spider
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cX, cY, distance(lm[11], lm[12])*0.1, 0, Math.PI*2); ctx.fill();
     }
  }
}

// --- MAIN COMPONENTS ---

const ARScreen = ({ heroId, onBack }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [powerState, setPowerState] = useState({ helmetActive: false, powers: {} });
  const [transformationBanner, setTransformationBanner] = useState(null);
  
  const powerStateRef = useRef(powerState);
  useEffect(() => { powerStateRef.current = powerState; }, [powerState]);

  const wristCrossTimerRef = useRef(0);
  const wristCrossStartRef = useRef(null);

  const triggerPower = useCallback((powerName, duration = 800) => {
    setPowerState(prev => ({...prev, powers: {...prev.powers, [powerName]: true}}));
    setTimeout(() => {
      setPowerState(prev => ({...prev, powers: {...prev.powers, [powerName]: false}}));
    }, duration);
  }, []);

  const toggleHelmet = () => setPowerState(prev => ({...prev, helmetActive: !prev.helmetActive}));

  // Transformation Sequence Effect
  useEffect(() => {
    if (heroId === 'wonderwoman') {
      setTransformationBanner('AMAZONIAN WARRIOR DETECTED');
      const t1 = setTimeout(() => setTransformationBanner('MATERIALIZING AMAZONIAN ARSENAL...'), 1200);
      const t2 = setTimeout(() => {
        setTransformationBanner('WONDER WOMAN MODE ACTIVATED');
        triggerPower('braceletDeflect', 600);
      }, 2500);
      const t3 = setTimeout(() => setTransformationBanner(null), 4000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [heroId, triggerPower]);

  useEffect(() => {
    let camera;
    let pose;

    const setupAR = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise(resolve => videoRef.current.onloadedmetadata = resolve);
          videoRef.current.play();
        }

        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');

        if (!window.Pose) throw new Error("MediaPipe Pose failed to load.");

        pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: true, // CRITICAL: Enables physically masked suits
          smoothSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        rendererRef.current = new Renderer(canvasRef.current);

        pose.onResults((results) => {
          if (!canvasRef.current || !rendererRef.current || !results.poseLandmarks || !results.segmentationMask) return;
          
          const lm = results.poseLandmarks;

          // HERO-SPECIFIC GESTURE DETECTION (ISOLATED TO ACTIVE HERO)
          if (heroId === 'thor') {
            const rWrist = lm[16];
            const nose = lm[0];
            if (rWrist && nose && rWrist.y < nose.y - 0.2) {
               if (!powerStateRef.current.powers.lightning) triggerPower('lightning', 1000);
            }
          } else if (heroId === 'wonderwoman') {
            const lWrist = lm[15];
            const rWrist = lm[16];
            const hip = lm[24];

            // 1. Crossed Bracelets Detection
            if (lWrist && rWrist) {
              const wristDist = Math.hypot(lWrist.x - rWrist.x, lWrist.y - rWrist.y);
              if (wristDist < 0.12) {
                if (!wristCrossStartRef.current) wristCrossStartRef.current = Date.now();
                const duration = Date.now() - wristCrossStartRef.current;

                if (duration > 2000 && !powerStateRef.current.powers.amazonianPower) {
                  triggerPower('amazonianPower', 6000);
                } else if (duration > 300 && duration < 800 && !powerStateRef.current.powers.braceletDeflect) {
                  triggerPower('braceletDeflect', 500);
                }
              } else {
                if (wristCrossStartRef.current) {
                  const duration = Date.now() - wristCrossStartRef.current;
                  if (duration >= 800 && duration < 2000 && !powerStateRef.current.powers.shockwave) {
                    triggerPower('shockwave', 700);
                  }
                  wristCrossStartRef.current = null;
                }
              }
            }

            // 2. Lasso Hand Pose Detection
            if (rWrist && hip) {
              const distToHip = Math.hypot(rWrist.x - hip.x, rWrist.y - hip.y);
              if (distToHip < 0.15 && !powerStateRef.current.powers.lassoSpin) {
                triggerPower('lassoSpin', 1200);
              }
            }

            // 3. Shield Defensive Pose
            if (lWrist && lm[11]) {
              const shieldRaised = lWrist.y < lm[11].y && Math.abs(lWrist.x - lm[11].x) < 0.2;
              setPowerState(prev => ({...prev, powers: {...prev.powers, shield: shieldRaised}}));
            }
          }

          rendererRef.current.render(
            results.poseLandmarks, 
            results.segmentationMask, 
            videoRef.current, 
            HEROES[heroId.toUpperCase()], 
            powerStateRef.current
          );
        });

        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
             if (videoRef.current) await pose.send({image: videoRef.current});
          },
          width: 640,
          height: 480
        });

        await camera.start();
        setIsReady(true);

      } catch (err) {
        console.error(err);
        setError("Could not initialize AR. Ensure camera permissions are granted.");
      }
    };

    setupAR();

    return () => {
      if (camera) camera.stop();
      if (pose) pose.close();
      if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [heroId, triggerPower]);

  const handleCapture = () => {
    // The main canvas is already perfectly composited. Just export it.
    const link = document.createElement('a');
    link.download = `hero-mode-${heroId}-advanced.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const heroConfig = HEROES[heroId.toUpperCase()];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      
      {/* Video & Canvas Layers */}
      <div className="absolute inset-0 flex justify-center items-center">
        {/* We keep video mirrored via CSS for intuitive user feedback. The Renderer reverses math internally. */}
        <video 
          ref={videoRef} 
          className="absolute w-full h-full object-cover transform scale-x-[-1] opacity-0" 
          playsInline muted autoPlay 
        />
        {/* Canvas is NOT mirrored via CSS. It draws the pre-composited mirrored frame + effects directly. */}
        <canvas 
          ref={canvasRef} 
          width={640} height={480} 
          className="absolute w-full h-full object-cover z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        />
      </div>

      {/* Loading/Error State */}
      {!isReady && !error && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 text-white backdrop-blur-sm">
          <Activity className="w-16 h-16 animate-spin mb-6 text-blue-500" />
          <h2 className="text-3xl font-black tracking-widest uppercase">Initializing Depth Mapping</h2>
          <p className="text-gray-400 mt-2 font-mono">Loading person segmentation and surface materials...</p>
        </div>
      )}

      {/* Transformation Banner Overlay */}
      {transformationBanner && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-red-900/90 via-yellow-600/90 to-red-900/90 text-yellow-300 px-8 py-3 rounded-2xl border-2 border-yellow-400 font-black tracking-widest text-lg md:text-2xl shadow-[0_0_30px_rgba(255,215,0,0.6)] animate-pulse text-center">
          {transformationBanner}
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 text-white">
          <Shield className="w-20 h-20 mb-4 text-red-500" />
          <h2 className="text-3xl font-bold">SENSOR FAILURE</h2>
          <p className="text-red-200 mt-2">{error}</p>
          <button onClick={onBack} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200">RETURN TO BASE</button>
        </div>
      )}

      {/* HUD Layer */}
      {isReady && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
          <div className="flex justify-between items-start w-full">
             <div className="flex flex-col drop-shadow-lg">
                <span className="text-white/70 text-xs font-mono tracking-widest">
                  {heroId === 'wonderwoman' ? 'AMAZONIAN ARSENAL // ACTIVE' : 'ADVANCED AR // TEXTURE MAPPING ACTIVE'}
                </span>
                <h1 className="text-5xl font-black italic tracking-tighter mt-1" style={{color: heroConfig.accent, textShadow: `0 0 20px ${heroConfig.color}`}}>
                  {heroConfig.name}
                </h1>
             </div>
             
             <div className="flex gap-4 pointer-events-auto">
                <button onClick={onBack} className="p-4 bg-black/50 border border-white/20 rounded-full text-white hover:bg-white/20 backdrop-blur transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button onClick={handleCapture} className="p-4 bg-black/50 border border-white/20 rounded-full text-white hover:bg-white/20 backdrop-blur transition-all">
                  <Download className="w-6 h-6" />
                </button>
             </div>
          </div>

          <div className="flex-1 flex items-center justify-center opacity-20">
             {heroId === 'ironman' && <Crosshair className="w-96 h-96 text-cyan-400 animate-pulse" strokeWidth={0.5} />}
             {heroId === 'wonderwoman' && <Sun className="w-96 h-96 text-yellow-400 animate-spin" style={{ animationDuration: '20s' }} strokeWidth={0.5} />}
          </div>

          {/* Controls */}
          <div className="w-full flex justify-center pointer-events-auto pb-4">
             <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex gap-6 overflow-x-auto shadow-2xl">
                
                {heroId === 'superman' && (
                  <button onClick={() => triggerPower('heatVision', 1500)} className="flex flex-col items-center px-4 py-2 rounded-xl hover:bg-red-500/20 text-white transition-colors">
                    <Eye className="w-8 h-8 mb-2 text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
                    <span className="text-xs font-bold font-mono">HEAT VISION</span>
                  </button>
                )}
                
                {heroId === 'ironman' && (
                  <>
                    <button onClick={() => triggerPower('repulsor', 1000)} className="flex flex-col items-center px-4 py-2 rounded-xl hover:bg-cyan-500/20 text-white transition-colors">
                      <Hand className="w-8 h-8 mb-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                      <span className="text-xs font-bold font-mono">REPULSOR</span>
                    </button>
                    <button onClick={toggleHelmet} className="flex flex-col items-center px-4 py-2 rounded-xl hover:bg-yellow-500/20 text-white transition-colors">
                      <Shield className="w-8 h-8 mb-2 text-yellow-400" />
                      <span className="text-xs font-bold font-mono">{powerState.helmetActive ? 'OPEN HUD' : 'CLOSE HUD'}</span>
                    </button>
                  </>
                )}

                {heroId === 'thor' && (
                  <button onClick={() => triggerPower('lightning', 2000)} className="flex flex-col items-center px-4 py-2 rounded-xl hover:bg-blue-500/20 text-white transition-colors">
                    <Zap className="w-8 h-8 mb-2 text-blue-300 fill-blue-300 drop-shadow-[0_0_10px_rgba(0,100,255,0.8)]" />
                    <span className="text-xs font-bold font-mono">THUNDER</span>
                  </button>
                )}

                {heroId === 'spiderman' && (
                  <>
                    <button onClick={() => triggerPower('web', 500)} className="flex flex-col items-center px-4 py-2 rounded-xl hover:bg-white/20 text-white transition-colors">
                      <Target className="w-8 h-8 mb-2 text-white" />
                      <span className="text-xs font-bold font-mono">THWIP</span>
                    </button>
                     <button onClick={toggleHelmet} className="flex flex-col items-center px-4 py-2 rounded-xl hover:bg-red-500/20 text-white transition-colors">
                      <Eye className="w-8 h-8 mb-2 text-red-500" />
                      <span className="text-xs font-bold font-mono">{powerState.helmetActive ? 'MASK OFF' : 'MASK ON'}</span>
                    </button>
                  </>
                )}

                {heroId === 'wonderwoman' && (
                  <>
                    <button 
                      onClick={() => triggerPower('lassoThrow', 1200)} 
                      className={`flex flex-col items-center px-4 py-2 rounded-xl transition-colors ${powerState.powers.lassoThrow ? 'bg-yellow-500/40 border border-yellow-400' : 'hover:bg-yellow-500/20'} text-white`}
                    >
                      <CircleDot className="w-8 h-8 mb-2 text-yellow-300 drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]" />
                      <span className="text-xs font-bold font-mono">LASSO</span>
                    </button>

                    <button 
                      onClick={() => triggerPower('braceletDeflect', 800)} 
                      className={`flex flex-col items-center px-4 py-2 rounded-xl transition-colors ${powerState.powers.braceletDeflect ? 'bg-yellow-500/40 border border-yellow-400' : 'hover:bg-yellow-500/20'} text-white`}
                    >
                      <Zap className="w-8 h-8 mb-2 text-yellow-300 drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]" />
                      <span className="text-xs font-bold font-mono">BRACELETS</span>
                    </button>

                    <button 
                      onClick={() => setPowerState(prev => ({...prev, powers: {...prev.powers, shield: !prev.powers.shield}}))} 
                      className={`flex flex-col items-center px-4 py-2 rounded-xl transition-colors ${powerState.powers.shield ? 'bg-yellow-500/40 border border-yellow-400' : 'hover:bg-yellow-500/20'} text-white`}
                    >
                      <Shield className="w-8 h-8 mb-2 text-yellow-300" />
                      <span className="text-xs font-bold font-mono">SHIELD</span>
                    </button>

                    <button 
                      onClick={() => triggerPower('amazonianPower', 5000)} 
                      className={`flex flex-col items-center px-4 py-2 rounded-xl transition-colors ${powerState.powers.amazonianPower ? 'bg-yellow-500/50 border border-yellow-300 animate-pulse' : 'hover:bg-yellow-500/20'} text-white`}
                    >
                      <Sparkles className="w-8 h-8 mb-2 text-yellow-200 drop-shadow-[0_0_12px_rgba(255,255,255,1)]" />
                      <span className="text-xs font-bold font-mono">AMAZONIAN POWER</span>
                    </button>
                  </>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function HeroModeApp() {
  const [selectedHero, setSelectedHero] = useState(null);

  if (selectedHero) return <ARScreen heroId={selectedHero} onBack={() => setSelectedHero(null)} />;

  return (
    <div className="min-h-screen bg-yellow-400 text-gray-900 font-sans overflow-hidden flex flex-col relative selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-200 via-yellow-400 to-yellow-600 pointer-events-none" />
      
      <header className="w-full p-8 text-center relative z-10 flex flex-col items-center mt-12">
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter drop-shadow-[0_0_15px_rgba(0,0,0,0.1)]">
          BECOME A <span className="text-blue-700">SUPERHERO</span>
        </h1>
        <p className="text-xl md:text-2xl mt-4 text-gray-800 tracking-widest uppercase font-light">
          Step in front of the camera and discover your superpowers
        </p>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 relative z-10 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full">
          {Object.values(HEROES).map((hero) => (
            <div 
              key={hero.id} onClick={() => setSelectedHero(hero.id)}
              className="group relative h-[420px] rounded-3xl bg-gray-900 border border-gray-800 overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(var(--hero-color),0.4)]"
              style={{'--hero-color': hero.color}}
            >
              <div className="absolute inset-0 opacity-20 group-hover:opacity-70 transition-opacity duration-500"
                   style={{ background: `radial-gradient(circle at bottom, ${hero.color}, transparent 70%)` }} />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black via-black/80 to-transparent">
                <h2 className="text-3xl font-black italic tracking-tight mb-1" style={{ color: hero.accent }}>
                  {hero.name}
                </h2>
                <p className="text-xs text-gray-300 italic mb-4">{hero.tagline}</p>
                
                <ul className="space-y-1.5 mb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  {hero.powers.map((power, idx) => (
                    <li key={idx} className="text-xs font-mono tracking-wider text-gray-400 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" style={{color: hero.accent}} /> {power}
                    </li>
                  ))}
                </ul>

                <button className="w-full py-3.5 rounded-xl font-bold tracking-widest text-xs uppercase transition-all duration-300 shadow-xl"
                        style={{ backgroundColor: hero.color, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  SELECT HERO
                </button>
              </div>
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: hero.accent, opacity: 0.7 }} />
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: hero.color, opacity: 0.5 }} />
            </div>
          ))}
        </div>
      </main>
      
      <footer className="w-full p-6 text-center text-gray-800 text-sm font-mono relative z-10 flex items-center justify-center gap-2">
        <Activity className="w-4 h-4" /> Real-time Body Segmentation & Dynamic Lighting Enabled
      </footer>
    </div>
  );
}