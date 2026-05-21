# FitPlan Pro — PWA Setup Guide

## Your Files
- `index.html` — the full app
- `manifest.json` — makes it installable
- `sw.js` — enables offline use
- `icon-192.png` — app icon (Android / PWA)
- `icon-512.png` — app icon (large)
- `apple-touch-icon.png` — app icon (iPhone home screen)

---

## How to Deploy (Free — 5 minutes)

### Option A: Netlify Drop (Easiest — no account needed)
1. Go to **https://app.netlify.com/drop**
2. Drag and drop the entire folder onto the page
3. Netlify gives you a live URL instantly (e.g. `https://abc123.netlify.app`)
4. Open that URL in Safari on your iPhone

### Option B: GitHub Pages (Free, permanent)
1. Create a free account at **https://github.com**
2. Create a new repository (e.g. `fitplan-pro`)
3. Upload all 6 files to the repo
4. Go to **Settings → Pages → Source → main branch → Save**
5. Your URL will be `https://yourusername.github.io/fitplan-pro`

---

## How to Add to iPhone Home Screen

1. Open the URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (box with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it **FitPlan Pro** → tap **Add**
5. It now appears on your home screen like a real app ✓

The app opens full screen with no browser bar, works offline,
and your settings are saved between sessions.

---

## Notes
- Must use **Safari** on iPhone for "Add to Home Screen"
- Requires HTTPS to work as a PWA (both Netlify and GitHub Pages provide this free)
- All data stays on your device — nothing is sent to any server
