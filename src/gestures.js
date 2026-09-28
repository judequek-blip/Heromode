// Pose landmarks describe body positions, not detailed finger configurations.
export const GESTURE_HINTS = {
  superman: 'Flight: left hand above your head. Shockwave: right hand above your head. Heat vision: right hand beside your right eye.',
  thor: 'Summon hammer: extend your right arm sideways. Raise it overhead for lightning, then lower it below your chest for an earthquake.',
  spiderman: 'Extend either arm sideways to shoot. Hold for 2 seconds to swing through the city. Both arms web the screen.',
  ironman: 'Flight: both hands down beside your hips. Chest beam: hold both hands above your chest. Repulsor: raise your right wrist above your right elbow, beside your shoulder.',
};

export function detectPower(heroId, lm) {
  if (!lm || !GESTURE_HINTS[heroId]) return null;
  const visible = i => lm[i] && Number.isFinite(lm[i].x) && Number.isFinite(lm[i].y) && lm[i].visibility >= 0.65;
  if ([11, 12].every(visible)) {
    const width = Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y);
    if (width >= 0.08 && heroId === 'superman' && visible(0)) {
      if (visible(16) && lm[16].y < lm[0].y - width * 0.65) return 'superShockwave';
      if (visible(15) && lm[15].y < lm[0].y - width * 0.65) return 'flight';
    }
    if (width >= 0.08 && heroId === 'ironman' && [15, 16, 23, 24].every(visible)) {
      const atSide = (wrist, hip, shoulder) => lm[wrist].y > lm[shoulder].y + width * 0.65 &&
        lm[wrist].y > lm[hip].y - width * 0.25 && Math.abs(lm[wrist].x - lm[hip].x) < width * 0.65;
      if (atSide(15, 23, 11) && atSide(16, 24, 12)) return 'ironFlight';
    }
  }
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
    const duration = { heatVision: 1500, web: 500, repulsor: 1000, chestBeam: 1800, flight: 4000, hammer: 4000, superShockwave: 1400, ironFlight: 3000 }[power];
    next = now + duration + 150;
    return { power, duration };
  };
}

// Track each arm independently: switching hands cannot inherit a swing hold.
export function createSpiderGestureTracker() {
  const started = { left: null, right: null };
  return (lm, now) => {
    const visible = i => lm?.[i] && Number.isFinite(lm[i].x) && Number.isFinite(lm[i].y) && lm[i].visibility >= 0.65;
    const span = visible(11) && visible(12) ? Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y) : 0;
    const result = { left: false, right: false, swing: false, screen: false };
    for (const [side, shoulder, elbow, wrist] of [['left', 11, 13, 15], ['right', 12, 14, 16]]) {
      const held = span >= 0.08 && [shoulder, elbow, wrist].every(visible) &&
        Math.abs(lm[wrist].x - lm[shoulder].x) > span * 0.9 &&
        Math.abs(lm[wrist].y - lm[shoulder].y) < span * 0.45 &&
        (lm[elbow].x - lm[shoulder].x) * (lm[wrist].x - lm[elbow].x) > 0;
      if (!held) started[side] = null;
      else if (started[side] === null) started[side] = now;
      result[side] = held && now - started[side] >= 250;
      if (held && now - started[side] >= 2000) result.swing = true;
    }
    result.screen = result.left && result.right;
    return result;
  };
}

// Arm only after a stable lightning pose; one lowering produces one quake.
export function createThorSequence() {
  let raisedSince = null, armed = false, loweredSince = null;
  return (lm, now) => {
    const visible = i => lm?.[i] && Number.isFinite(lm[i].x) && Number.isFinite(lm[i].y) && lm[i].visibility >= 0.65;
    if (![0, 11, 12, 16].every(visible)) { raisedSince = loweredSince = null; armed = false; return false; }
    const width = Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y);
    if (width < 0.08) { raisedSince = loweredSince = null; armed = false; return false; }
    if (lm[16].y < lm[0].y - 0.2) {
      raisedSince ??= now;
      if (now - raisedSince >= 250) armed = true;
      loweredSince = null;
    } else {
      raisedSince = null;
      const chest = (lm[11].y + lm[12].y) / 2 + width * 0.3;
      if (armed && lm[16].y > chest + width * 0.15) {
        loweredSince ??= now;
        if (now - loweredSince >= 150) { armed = false; loweredSince = null; return true; }
      } else loweredSince = null;
    }
    return false;
  };
}