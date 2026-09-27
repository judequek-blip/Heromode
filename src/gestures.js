// Pose landmarks describe body positions, not detailed finger configurations.
export const GESTURE_HINTS = {
  superman: 'Heat vision: hold your right hand beside your right eye.',
  spiderman: 'Web: extend your right arm sideways at shoulder height.',
  ironman: 'Repulsor: raise your right wrist above your right elbow, beside your shoulder.',
};

export function detectPower(heroId, lm) {
  if (!lm || !GESTURE_HINTS[heroId]) return null;
  const required = heroId === 'superman' ? [11, 12, 16, 5] : [11, 12, 14, 16];
  if (!required.every(i => lm[i] && Number.isFinite(lm[i].x) && Number.isFinite(lm[i].y) && lm[i].visibility >= 0.65)) return null;
  const span = Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y);
  if (span < 0.08) return null;
  const wrist = lm[16], shoulder = lm[12], elbow = lm[14];
  if (heroId === 'superman') {
    return Math.hypot(wrist.x - lm[5].x, wrist.y - lm[5].y) < span * 0.55 ? 'heatVision' : null;
  }
  if (heroId === 'spiderman') {
    const reach = Math.abs(wrist.x - shoulder.x);
    const straight = (elbow.x - shoulder.x) * (wrist.x - elbow.x) > 0;
    return straight && reach > span * 0.9 && Math.abs(wrist.y - shoulder.y) < span * 0.45 ? 'web' : null;
  }
  return wrist.y < elbow.y - span * 0.35 && wrist.y < shoulder.y + span * 0.15 && Math.abs(wrist.x - shoulder.x) < span * 0.85 ? 'repulsor' : null;
}

// Require a stable pose, then emit timed bursts while it remains held.
export function createGestureTrigger() {
  let candidate = null, since = 0, next = 0;
  return (heroId, landmarks, now) => {
    const power = detectPower(heroId, landmarks);
    if (power !== candidate) { candidate = power; since = now; }
    if (!power || now - since < 250 || now < next) return null;
    const duration = { heatVision: 1500, web: 500, repulsor: 1000 }[power];
    next = now + duration + 150;
    return { power, duration };
  };
}
