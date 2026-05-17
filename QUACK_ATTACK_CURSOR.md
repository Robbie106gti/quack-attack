# Quack Attack — Cursor Handoff Report
> Vegas Infinite Game Jam submission · Built with Three.js · Modular static site

---

## Project Overview

**Quack Attack** is a browser-based 3D casino original built in Three.js for the Vegas Infinite Game Jam. The player controls the VI Ducky mascot on a 9×9 neon-lit casino floor, collecting coins, avoiding hidden landmines, and racing to the golden exit tile before time runs out. At the 30-second mark a "Coffee Break" pause menu lets the player spend coins on power-ups.

**Current deliverable:** TypeScript sources in `src/`, compiled to `dist/` via `tsc`, plus `index.html` shell and `public/duck.glb` (~848KB). Serve the repo root with any static host (Vercel recommended).

---

## Tech Stack

| Layer | Choice |
|---|---|
| 3D engine | Three.js `r0.162.0` via CDN importmap |
| Model loader | `GLTFLoader` (Three.js addon) |
| Audio | Web Audio API (procedural, no audio files) |
| Deployment target | Vercel (static HTML) |
| Duck model | `public/duck.glb` |
| Language | TypeScript (strict), compiled with `tsc` |
| Linting | ESLint 9 + typescript-eslint |
| Framework | Vanilla ES modules, no bundler |

---

## File Structure

```
quack-attack/
├── index.html              # Shell — HUD, modals, importmap
├── public/
│   └── duck.glb            # Rubber duck GLB (extracted from monolith)
├── src/                    # TypeScript sources
│   ├── main.ts             # Scene setup, renderer, camera, lights, animate loop
│   ├── state.ts            # Shared mutable game/scene state
│   ├── types.ts            # GameState, Direction, ShopItem, etc.
│   ├── dom.ts              # Typed DOM helpers
│   ├── grid.ts, duck.ts, game.ts, timer.ts, coffee.ts
│   ├── audio.ts, hud.ts, constants.ts
├── dist/                   # tsc output (gitignored)
├── quack_attack_monolith.html  # Original 1.1MB single-file backup
└── QUACK_ATTACK_CURSOR.md  # This file
```

---

## Local Development

```bash
npm install
npm run build      # compile src/ → dist/
npm run watch      # recompile on save (optional, second terminal)
npx serve .        # open http://localhost:3000
```

Other scripts: `npm run lint`, `npm run lint:fix`, `npm run typecheck`.

ES modules require a static server (not `file://`). `index.html` loads `dist/main.js`.

---

## Vercel Deployment

Push to GitHub and connect to Vercel. The `public/` folder is served at `/` automatically, so `duck.glb` loads from `/duck.glb` via `import.meta.url` in `src/duck.js`.

---

## Core Constants

See `src/constants.js` for `COLS`, `ROWS`, `TILE`, `ROUNDS`, `C`, timing values.

---

## What's NOT Done Yet — Priority Build List

### Must-haves for submission

- [ ] **VI Branding pass** — official hex values, VI wordmark, brand fonts
- [ ] **Start screen polish** — VI-styled title card
- [ ] **Mobile layout** — responsive camera FOV, d-pad repositioning
- [ ] **Game Over / Win screen** — score breakdown card

### Nice-to-haves

- [ ] Mine hint numbers (minesweeper-style)
- [ ] Sound design upgrade (`.mp3` clips)
- [ ] Intro animation, high scores, mine particles, round transitions, duck accessories

---

## Known Issues

| Issue | Status |
|---|---|
| Grid slightly off-centre on ultra-wide screens | Minor |
| Web Audio requires user gesture | Handled on first input |
| Coffee break can fire mid-move | Low impact |

---

## Brand Alignment Checklist

- [x] Vegas Infinite Ducky as player character
- [x] Dark navy background (`#07071A`)
- [x] Gold / Teal / Purple accent colors
- [ ] Official VI logo
- [ ] VI wordmark font
- [ ] Confirm exact brand hex values
