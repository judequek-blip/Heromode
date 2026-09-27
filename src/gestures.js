// Pose landmarks describe body positions, not detailed finger configurations.
export const GESTURE_HINTS = {
  superman: 'Flight: raise your right hand high above your head. Heat vision: right hand beside your right eye.',
  thor: 'Summon hammer: extend your right arm sideways. Raise it overhead for lightning.',
  spiderman: 'Web: extend your right arm sideways at shoulder height.',
  ironman: 'Chest beam: hold both hands above your chest. Repulsor: raise your right wrist above your right elbow, beside your shoulder.',
};

export function detectPower(heroId, lm) {
  if (!lm || !GESTURE_HINTS[heroId]) return null;
  // Two raised wrists take priority over the one-handed repulsor pose.
  if (heroId === 'ironman' && [11, 12, 15, 16].every(i =>
    lm[i] && Number.isFinite(lm[i].x) && Number.isFinite(lm[i].y) && lm[i].visibility >= 0.65)) {
    const width = Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y);
    const chestY = (lm[11].y + lm[12].y) / 2 + width * 0.3;
    if (width >= 0.08 && lm[15].y < chestY - width * 0.08 && lm[16].y < chestY - width * 0.08) return 'chestBeam';
  }
  const required = heroId === 'superman' ? [11, 12, 16, 5] : [11, 12, 14, 16];
  if (!required.every(i => lm[i] && Number.isFinite(lm[i].x) && Number.isFinite(lm[i].y) && lm[i].visibility >= 0.65)) return null;
  const span = Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y);
  if (span < 0.08) return null;
  const wrist = lm[16], shoulder = lm[12], elbow = lm[14];
  if (heroId === 'superman') {
    if (wrist.y < lm[5].y - span * 0.65) return 'flight';
    return Math.hypot(wrist.x - lm[5].x, wrist.y - lm[5].y) < span * 0.55 ? 'heatVision' : null;
  }
  if (heroId === 'spiderman' || heroId === 'thor') {
    const reach = Math.abs(wrist.x - shoulder.x);
    const straight = (elbow.x - shoulder.x) * (wrist.x - elbow.x) > 0;
    return straight && reach > span * 0.9 && Math.abs(wrist.y - shoulder.y) < span * 0.45 ? (heroId === 'thor' ? 'hammer' : 'web') : null;
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
    const duration = { heatVision: 1500, web: 500, repulsor: 1000, chestBeam: 1800, flight: 4000, hammer: 4000 }[power];
    next = now + duration + 150;
    return { power, duration };
  };
}
