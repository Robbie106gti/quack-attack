# Quack Attack — Cursor Handoff Report
> Vegas Infinite Game Jam submission · Built with Three.js · Vite

---

## Project Overview

**Quack Attack** is a browser-based 3D casino original built in Three.js for the Vegas Infinite Game Jam. The player controls the VI Ducky mascot on a 9×9 neon-lit casino floor, collecting coins, avoiding hidden landmines, and racing to the golden exit tile before time runs out. At the 30-second mark a "Coffee Break" pause menu lets the player spend coins on power-ups.

**Current deliverable:** TypeScript in `src/`, bundled with **Vite** into `dist/`, plus `index.html`, `styles/`, and `public/duck.glb` (~848KB).

---

## Tech Stack

| Layer | Choice |
|---|---|
| 3D engine | Three.js `r0.162.0` (npm, bundled by Vite) |
| Model loader | `GLTFLoader` (Three.js addon) |
| Audio | Web Audio API (procedural, no audio files) |
| Build / dev | **Vite 6** |
| Deployment | Vercel (`dist/` output) |
| Duck model | `public/duck.glb` → `/duck.glb` |
| Language | TypeScript (strict), `tsc --noEmit` for typecheck |
| Linting | ESLint 9 + typescript-eslint |

---

## File Structure

```
quack-attack/
├── index.html              # Vite entry HTML
├── vite.config.ts
├── styles/                 # Modular CSS (imported from index.html)
├── public/
│   └── duck.glb
├── src/
│   ├── main.ts             # Entry — scene loop, wires modules
│   ├── state.ts, types.ts, dom.ts, helpers.ts
│   ├── grid.ts, duck.ts, game.ts, timer.ts, coffee.ts
│   ├── audio.ts, hud.ts, fx.ts, camera.ts, input.ts
│   └── scene-setup.ts
├── dist/                   # Vite production build (gitignored)
└── quack_attack_monolith.html  # Legacy single-file backup (not used at runtime)
```

---

## Local Development

**Use Vite only** — do not run `npx serve` on the repo root (that serves raw `.ts` without bundling).

```bash
npm install
npm run dev        # or: npm start — http://localhost:3456
npm run build      # production bundle → dist/
npm run preview    # serve dist/ via Vite (http://localhost:3456)
```

Other scripts: `npm run lint`, `npm run lint:fix`, `npm run typecheck`.

---

## Vercel Deployment

`vercel.json` runs `npm run build` and publishes **`dist/`** (not the repo root).

`public/duck.glb` is copied into `dist/duck.glb` at build time. The game loads it from `/duck.glb`.

---

## Core Constants

See `src/constants.ts` for `COLS`, `ROWS`, `TILE`, `ROUNDS`, `C`, timing values.

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
