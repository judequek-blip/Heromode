// Canvas-native effects track the mirrored pixel landmarks supplied by Renderer.
export function drawSpiderMask(ctx, lm, shoulderWidth) {
  if (![0, 2, 5].every(i => lm[i] && lm[i].visibility >= 0.65)) return;
  const eyes = [lm[2], lm[5]].sort((a, b) => a.x - b.x);
  const gap = Math.hypot(eyes[1].x - eyes[0].x, eyes[1].y - eyes[0].y);
  if (gap < 4 || shoulderWidth < 10) return;
  const width = Math.min(shoulderWidth * 0.7, Math.max(shoulderWidth * 0.36, gap * 2.5));
  const height = width * 1.38;
  ctx.save();
  ctx.translate((eyes[0].x + eyes[1].x) / 2, (eyes[0].y + eyes[1].y) / 2);
  ctx.rotate(Math.atan2(eyes[1].y - eyes[0].y, eyes[1].x - eyes[0].x));
  ctx.beginPath(); ctx.ellipse(0, height * 0.12, width / 2, height / 2, 0, 0, Math.PI * 2);
  const red = ctx.createLinearGradient(-width / 2, 0, width / 2, height / 2);
  red.addColorStop(0, '#650d20'); red.addColorStop(0.35, '#f33445'); red.addColorStop(0.7, '#c51630'); red.addColorStop(1, '#570e21');
  ctx.fillStyle = red; ctx.fill(); ctx.strokeStyle = '#370b18'; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  ctx.strokeStyle = 'rgba(28,10,22,0.72)'; ctx.lineWidth = Math.max(1, width * 0.012);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ctx.beginPath(); ctx.moveTo(0, height * 0.13);
    ctx.lineTo(Math.cos(a) * width, height * 0.13 + Math.sin(a) * height); ctx.stroke();
  }
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath(); ctx.ellipse(0, height * 0.13, width * i * 0.12, height * i * 0.12, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // Swept white lenses with thick dark borders, symmetric about the face.
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1);
    ctx.beginPath(); ctx.moveTo(width * 0.07, -height * 0.01);
    ctx.quadraticCurveTo(width * 0.24, -height * 0.05, width * 0.42, -height * 0.14);
    ctx.quadraticCurveTo(width * 0.4, height * 0.17, width * 0.18, height * 0.15);
    ctx.quadraticCurveTo(width * 0.08, height * 0.1, width * 0.07, -height * 0.01);
    ctx.closePath(); ctx.fillStyle = '#f1faff'; ctx.fill();
    ctx.strokeStyle = '#101522'; ctx.lineWidth = Math.max(3, width * 0.045); ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawFlightSky(ctx, width, height, now) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#07549e'); sky.addColorStop(0.6, '#47b9ed'); sky.addColorStop(1, '#d4f5ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 12; i++) {
    const x = (i * 173) % (width + 140) - 70;
    const y = (now * (0.12 + i % 3 * 0.025) + i * 83) % (height + 180) - 90;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.ellipse(x, y, 80, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 18, y - 15, 42, 28, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    const x = (i * 97) % width, y = (now * 0.65 + i * 59) % (height + 130) - 130;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 65); ctx.stroke();
  }
  ctx.restore();
}

export function drawHammer(ctx, lm, size, now) {
  if (![14, 16].every(i => lm[i] && lm[i].visibility >= 0.65) || size < 10) return;
  ctx.save(); ctx.translate(lm[16].x, lm[16].y);
  // The handle extends from the grip in the direction of the forearm.
  ctx.rotate(Math.atan2(lm[16].y - lm[14].y, lm[16].x - lm[14].x) + Math.PI / 2);
  ctx.scale(size, size);
  ctx.fillStyle = '#633d2d'; ctx.strokeStyle = '#c6a981'; ctx.lineWidth = 0.012;
  ctx.fillRect(-0.035, -0.36, 0.07, 0.48);
  for (let y = -0.32; y < 0.12; y += 0.045) { ctx.beginPath(); ctx.moveTo(-0.035, y); ctx.lineTo(0.035, y + 0.025); ctx.stroke(); }
  const metal = ctx.createLinearGradient(-0.24, -0.5, 0.24, -0.28);
  metal.addColorStop(0, '#f0f7ff'); metal.addColorStop(0.4, '#8497ac'); metal.addColorStop(0.65, '#d2e2ef'); metal.addColorStop(1, '#465970');
  ctx.beginPath(); ctx.moveTo(-0.24, -0.5); ctx.lineTo(0.2, -0.5); ctx.lineTo(0.25, -0.45);
  ctx.lineTo(0.25, -0.28); ctx.lineTo(-0.2, -0.28); ctx.lineTo(-0.24, -0.33); ctx.closePath();
  ctx.fillStyle = metal; ctx.shadowColor = '#76dfff'; ctx.shadowBlur = 12 + Math.sin(now * 0.008) * 4;
  ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#314960'; ctx.lineWidth = 0.018; ctx.stroke();
  ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 0.012;
  ctx.strokeRect(-0.18, -0.46, 0.34, 0.14);
  ctx.beginPath(); ctx.moveTo(-0.025, -0.45); ctx.lineTo(0.025, -0.4); ctx.lineTo(-0.02, -0.36); ctx.lineTo(0.03, -0.31); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0.17, 0.06, 0.09, 0, 0, Math.PI * 2); ctx.strokeStyle = '#86624b'; ctx.stroke();
  ctx.restore();
}

export function drawChestBeam(ctx, center, size, width, height, now) {
  ctx.save();
  const pulse = 1 + Math.sin(now * 0.025) * 0.08;
  const radius = Math.max(8, size * 0.13) * pulse;
  // A widening cone projects from the arc reactor toward the viewer.
  const beam = ctx.createLinearGradient(center.x, center.y, width / 2, height);
  beam.addColorStop(0, 'rgba(235,255,255,0.98)');
  beam.addColorStop(0.3, 'rgba(95,235,255,0.8)');
  beam.addColorStop(1, 'rgba(25,150,255,0.05)');
  ctx.fillStyle = beam; ctx.shadowColor = '#43ddff'; ctx.shadowBlur = 25;
  ctx.beginPath(); ctx.moveTo(center.x - radius, center.y);
  ctx.lineTo(width / 2 - size * 0.9, height); ctx.lineTo(width / 2 + size * 0.9, height);
  ctx.lineTo(center.x + radius, center.y); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(center.x - radius * 0.3, center.y);
  ctx.lineTo(width / 2 - size * 0.18, height); ctx.lineTo(width / 2 + size * 0.18, height);
  ctx.lineTo(center.x + radius * 0.3, center.y); ctx.closePath();
  ctx.fillStyle = 'rgba(240,255,255,0.85)'; ctx.fill();
  ctx.beginPath(); ctx.arc(center.x, center.y, radius, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(center.x, center.y, radius * 1.6, 0, Math.PI * 2);
  ctx.lineWidth = 3; ctx.strokeStyle = '#8af4ff'; ctx.stroke();
  ctx.restore();
}

export function drawSwingCity(ctx, width, height, now) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#152753'); sky.addColorStop(0.65, '#a94e70'); sky.addColorStop(1, '#ffc48a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  // Parallax buildings and a bobbing horizon suggest a pendulum swing.
  const bob = Math.sin(now * 0.0025) * height * 0.045;
  for (let layer = 0; layer < 3; layer++) {
    const spacing = 85 + layer * 30, speed = 0.018 + layer * 0.04;
    for (let i = -1; i < Math.ceil(width / spacing) + 2; i++) {
      const x = i * spacing - (now * speed % spacing);
      const buildingHeight = height * (0.22 + layer * 0.12) + Math.sin(i * 7 + layer) * 35;
      const y = height - buildingHeight + bob * (layer + 1) / 3;
      ctx.fillStyle = ['#536080', '#293953', '#101d36'][layer];
      ctx.fillRect(x, y, spacing - 8, height);
      ctx.fillStyle = layer === 2 ? '#ffdfa1' : '#95b3d2';
      for (let wx = 12; wx < spacing - 14; wx += 18) {
        for (let wy = 15; wy < buildingHeight; wy += 24) ctx.fillRect(x + wx, y + wy, 5, 9);
      }
    }
  }
  ctx.restore();
}

export function drawSpiderWebs(ctx, lm, width, height, active, now) {
  ctx.save(); ctx.strokeStyle = '#eef8ff'; ctx.lineWidth = 2;
  ctx.shadowBlur = 4; ctx.shadowColor = '#a9caff';
  for (const [side, index, anchor] of [['left', 15, width * 0.9], ['right', 16, width * 0.1]]) {
    if (!active[side] || !lm[index] || lm[index].visibility < 0.65) continue;
    const hand = lm[index];
    for (let strand = -1; strand <= 1; strand++) {
      ctx.beginPath(); ctx.moveTo(hand.x + strand * 2, hand.y);
      ctx.quadraticCurveTo((hand.x + anchor) / 2 + Math.sin(now * 0.006) * (active.swing ? 25 : 5), hand.y * 0.3, anchor + strand * 6, 0);
      ctx.stroke();
    }
  }
  if (active.screen) {
    const cx = width / 2, cy = height * 0.46, radius = Math.hypot(width, height) * 0.65;
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(240,250,255,0.88)'; ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI / 8;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); ctx.stroke();
    }
    for (let ring = 1; ring <= 8; ring++) {
      const r = ring * radius / 8;
      ctx.beginPath(); ctx.moveTo(cx + r, cy);
      for (let i = 1; i <= 16; i++) {
        const a = i * Math.PI / 8, mid = a - Math.PI / 16;
        ctx.quadraticCurveTo(cx + Math.cos(mid) * r * 0.91, cy + Math.sin(mid) * r * 0.91, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawPowerShockwave(ctx, center, size, width, height, now, earthquake = false) {
  ctx.save();
  const phase = (now % 1400) / 1400;
  ctx.strokeStyle = earthquake ? '#ffd89a' : '#b8efff'; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 18;
  for (let i = 0; i < 3; i++) {
    const p = (phase + i / 3) % 1, r = size * 0.2 + p * width * 0.9;
    ctx.globalAlpha = 1 - p; ctx.lineWidth = 7 * (1 - p) + 1;
    ctx.beginPath(); ctx.ellipse(center.x, center.y, r, earthquake ? r * 0.22 : r, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (earthquake) {
    ctx.globalAlpha = 0.85; ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath(); ctx.moveTo(center.x, center.y);
      const x = width * i / 8;
      ctx.lineTo((center.x + x) / 2 + 15, center.y + 25);
      ctx.lineTo((center.x + x) / 2 - 12, center.y + 45);
      ctx.lineTo(x, height); ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawDownwardRepulsors(ctx, lm, size, height, now) {
  ctx.save();
  for (const i of [15, 16]) {
    if (!lm[i] || lm[i].visibility < 0.65) continue;
    const { x, y } = lm[i], radius = size * (0.07 + Math.sin(now * 0.03) * 0.01);
    const glow = ctx.createLinearGradient(x, y, x, height);
    glow.addColorStop(0, '#efffff'); glow.addColorStop(0.25, '#6ceaff'); glow.addColorStop(1, 'rgba(0,160,255,0)');
    ctx.fillStyle = glow; ctx.shadowColor = '#53dfff'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(x - radius, y); ctx.lineTo(x - radius * 3, height);
    ctx.lineTo(x + radius * 3, height); ctx.lineTo(x + radius, y); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  }
  ctx.restore();
}
