# Become a Superhero

Choose Superman, Spider-Man, Thor, Iron Man, or Wonder Woman and activate camera effects with body poses or buttons. React, Vite, Tailwind, MediaPipe Pose, and a Canvas renderer run entirely in your browser. No API key or backend is needed.

## Quick start

Use Node.js 22.12 or newer:

```sh
npm ci
npm run dev
```

Open the localhost address and allow camera access. In PowerShell, use `npm.cmd` if execution policy blocks `npm`. Stand far enough back to show your head, shoulders, elbows, wrists, and hips. Use good lighting. Right and left mean **your own** right and left; the preview is mirrored.

## Gestures and effects

| Hero | Action detected | Visible effect | Button alternative |
| --- | --- | --- | --- |
| Superman | Raise your right hand high above your head for at least 0.25 seconds | Moving sky, clouds, and speed streaks behind your silhouette for 4 seconds | FLIGHT |
| Superman | Hold your right hand beside your right eye for at least 0.25 seconds | Red heat-vision beams from both eyes, lasting 1.5 seconds | HEAT VISION |
| Spider-Man | Extend either arm sideways at shoulder height for 0.25 seconds | Web strands from the matching wrist to an overhead anchor while held | THWIP (right) / LEFT WEB (0.5 seconds) |
| Spider-Man | Keep either arm in the shooting pose continuously for 2 seconds | Animated city with moving buildings and a bobbing horizon behind your silhouette, simulating swinging | SWING (4 seconds) |
| Spider-Man | Extend both arms in the shooting pose | Webs from both wrists plus a web covering the screen | WEB SCREEN (1.8 seconds) |
| Spider-Man | Button only | Toggle a rounded red webbed mask with white lenses, aligned to your eyes | MASK ON / MASK OFF |
| Thor | Extend your right arm sideways at shoulder height for at least 0.25 seconds | Summon a metallic hammer that follows your right wrist for 4 seconds | SUMMON HAMMER |
| Thor | Raise your right wrist well above your nose (more than 20% of image height) | Lightning at the hammer/right hand, lasting 1 second and repeating while held | THUNDER (2 seconds) |
| Iron Man | Hold both hands above chest level for at least 0.25 seconds | White/cyan beam from the central arc reactor toward the bottom of the screen for 1.8 seconds; repeats while held and takes priority over the repulsor gesture | CHEST BEAM |
| Iron Man | Raise your right wrist beside your shoulder, keeping your elbow below it; hold for at least 0.25 seconds | Cyan glow and upward repulsor beam from your right wrist, lasting 1 second | REPULSOR |
| Iron Man | Button only | Toggle gold faceplate and glowing eyes | CLOSE HUD / OPEN HUD |
| Wonder Woman | Bring wrists close together for 0.3-0.8 seconds | Bracelet deflection | BRACELETS |
| Wonder Woman | Keep wrists together for more than 2 seconds | Amazonian power, lasting 6 seconds | AMAZONIAN POWER (5 seconds) |
| Wonder Woman | Separate wrists after holding together for 0.8 to under 2 seconds | Shockwave, lasting 0.7 seconds | Gesture only |
| Wonder Woman | Bring right wrist close to right hip | Lasso spin | LASSO triggers a lasso throw |
| Wonder Woman | Raise left wrist above and near left shoulder | Shield defense while pose is held | SHIELD toggles persistent shield |

Spider-Man webs remain active while held; swinging begins after a continuous two-second hold on either arm. Lower both arms or lose tracking to clear the gesture effects. Both hands can web the screen while swinging. The Superman, Thor, and Iron Man timed gestures repeat while held, with a short pause between bursts. Lower your arm to stop repeating. Buttons remain available. Wonder Woman's implementation and Thor's existing lightning detection are unchanged. Flight is a visual camera effect, with your silhouette composited over an animated sky. Thor also displays the hammer during lightning.

These are **body-pose gestures**, not finger recognition: the app does not recognize Spider-Man's finger sign, an open palm, eye movements, or a clenched fist. Iron Man flight, super strength, agility, spider-sense, and god mode on hero cards are descriptive abilities without separate implemented controls. Costumes, capes, and armor appear automatically. Thor summons his hammer with the gesture or button. The download button saves the composited camera view as a PNG; Back releases the camera.

## Why the other gestures did not work

The original app only connected automatic detection to Thor and Wonder Woman. Superman's heat vision, Spider-Man's web, and Iron Man's repulsor were button-triggered effects with no corresponding detection branches. `src/gestures.js` now supplies those missing triggers. Thresholds scale with shoulder width, require visible landmarks, and require a 250 ms hold. Tracking loss resets the hold. Existing effect rendering is reused.

## GitHub Pages

The included `.github/workflows/pages.yml` builds, tests, and deploys `dist` on pushes to `main`, or through a manual workflow run. Relative asset paths in `vite.config.js` allow the site to run under `/Heromode/`.

1. Commit and push these project changes to `judequek-blip/Heromode` on `main`.
2. In the repository, open **Settings > Pages > Build and deployment**, and choose **GitHub Actions** as the source.
3. Open **Actions > Deploy GitHub Pages** and run the workflow if needed. Wait for a successful deployment.
4. Visit https://judequek-blip.github.io/Heromode/ and allow camera access.

This address is the expected deployment URL, not confirmation that deployment has already occurred. GitHub Pages supplies HTTPS, which is required for camera access outside localhost. Do not select branch-based publishing of the unbuilt source.

Deployment references: [Vite static deployment](https://vite.dev/guide/static-deploy/) and [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The existing `render.yaml` also supports Render: build with `npm ci && npm run build` and publish `dist`.

## Troubleshooting and privacy

- **No camera:** allow permission, close applications using the camera, and use HTTPS or localhost.
- **Costume visible but no power:** use the gesture for the selected hero; keep the right arm and shoulders in view. Try the power button to distinguish gesture recognition from rendering.
- **Gesture unreliable:** improve lighting, face the camera, avoid covering joints, and hold the pose briefly. These heuristics need real-camera testing across body sizes and camera angles.
- **Tracking download fails:** check your internet connection and whether jsDelivr is blocked. MediaPipe's pinned script, models, and WASM are downloaded from that CDN.
- **Blank deployed site:** check the Pages workflow result and verify that it published `dist`.

The app processes camera frames locally and does not upload them. Downloaded photos are saved only when requested. Model downloads still contact the CDN.

## Development and verification

`src/App.jsx` contains selection, camera lifecycle, the renderer, and original Thor/Wonder Woman gestures. `src/gestures.js` contains the new gesture detection. `src/heroEffects.js` draws the flight sky, summoned hammer, and Spider-Man mask. `become_a_superhero.tsx` remains the original reference artifact and is not the running app.

```sh
npm run build
npx playwright install chromium
npm test
npm run preview
```

Tests use a simulated camera and deterministic landmarks, so they verify software behavior rather than real tracking accuracy. Before sharing, test every gesture with a real webcam, test button fallbacks, capture a photo, and confirm Back turns off the camera indicator.

A browser-friendly gesture guide is included at '/Heromode/guide.html' and linked from hero selection.
