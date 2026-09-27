# Become a Superhero

A React + Vite app migrated from the supplied Gemini TSX artifact. Tailwind preserves the original styling. Everything runs in the browser; no Gemini key, database, or backend is required. The original `become_a_superhero.tsx` is kept unchanged for reference; the running app is `src/App.jsx` (the source used JavaScript without TypeScript types).

## Run locally

Use Node.js 22.12 or newer (Node 22 recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:5173 and allow camera access. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm`.

```sh
npm run build
npm run preview
```

## Features retained

- Five heroes: Superman, Spider-Man, Thor, Iron Man, and Wonder Woman.
- Mirrored live camera, MediaPipe pose tracking and person segmentation, procedural costume textures, depth sorting, lighting, capes, armor, and effects.
- Superman heat vision; Spider-Man webs and mask toggle; Thor lightning and hammer; Iron Man repulsors, helmet toggle, and HUD.
- Wonder Woman transformation banner, lasso, bracelets, shield, Amazonian power, and shockwave.
- Thor: raise the right wrist above the head to activate lightning.
- Wonder Woman: bring wrists together for bracelets, hold over two seconds for Amazonian power, or separate after 0.8–2 seconds for shockwave. Bring the right wrist toward the hip for lasso spin; raise the left wrist near the shoulder for shield defense.
- Download the composited camera image as a PNG; return to hero selection and release the camera.

Some powers on the original hero cards (such as flight, strength, agility, and spider-sense) were descriptive labels, not implemented controls. This migration retains that behavior.

Camera frames are processed locally and are not uploaded by this app. The pinned MediaPipe script, model, and WASM files download from jsDelivr, so tracking needs internet access. Camera access requires HTTPS (provided by Render) or localhost. Stand far enough back to show your shoulders, hips, and wrists. Tracking quality depends on lighting, framing, and device performance.

## Publish to GitHub

1. Sign in at https://github.com/new and create an empty repository named `become-a-superhero`. Choose your preferred visibility; do not initialize it with a README, license, or gitignore.
2. From this project folder, run these commands if not already done:

```sh
git init -b main
git add .
git commit -m "Build standalone superhero AR app"
git remote add origin https://github.com/YOUR_USERNAME/become-a-superhero.git
git push -u origin main
```

Git may open your browser for authentication. Never put a GitHub token in source files. If `origin` already exists, inspect it with `git remote -v` before changing it. If Git asks for identity, configure your name and GitHub email before committing.

## Deploy on Render

1. Sign in at https://dashboard.render.com and choose **New → Static Site**.
2. Connect GitHub and select your repository.
3. Select branch `main`, leave Root Directory empty, and enter:

| Setting | Value |
| --- | --- |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |

4. Click **Create Static Site**. Open the assigned HTTPS `onrender.com` URL and allow the camera.

Alternatively, choose **New → Blueprint** and connect the repository to use the included `render.yaml`, including its response headers. No environment secrets are needed. Later pushes to the connected branch can automatically redeploy the site.

References: https://vite.dev/guide/static-deploy/ and https://render.com/docs/static-sites.

## Verification

```sh
npx playwright install chromium
npm test
```

Browser tests use a simulated camera and a deterministic tracking fixture to exercise all five hero flows, controls, capture, denied camera access, cleanup, and tracking failures. They do not measure real camera tracking accuracy. Before sharing the deployed site, test each hero with a real webcam, verify gestures, download a photo, and return to selection to check that the camera indicator turns off.
