import * as THREE from 'three';
import {
  COLS,
  ROWS,
  TILE_SIZE,
  STEP,
  TILE,
  ROUNDS,
  TABLE_STAKES,
  C,
  type TileId,
} from './constants.js';
import { state } from './state.js';
import type { TileMesh, TileUserData } from './types.js';
import { setScanOverlay } from './fx.js';

export function gridToWorld(c: number, r: number): THREE.Vector3 {
  return new THREE.Vector3(c * STEP, 0, r * STEP);
}

function makeGlow(x: number, z: number, color: number, r = 0.35, o = 0.22): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.003, z);
  state.scene.add(m);
  return m;
}

export function placeItems(count: number, type: TileId): void {
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < 500) {
    attempts++;
    const c = Math.floor(Math.random() * COLS);
    const r = Math.floor(Math.random() * ROWS);
    if (state.grid[r][c] !== TILE.EMPTY) continue;
    if (c <= 1 && r <= 1) continue;
    if (c >= COLS - 2 && r >= ROWS - 2) continue;
    state.grid[r][c] = type;
    placed++;
  }
}

export function spawnExit(): void {
  const wp = gridToWorld(state.exitCol, state.exitRow);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.48, 40),
    new THREE.MeshBasicMaterial({ color: 0xffe066, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(wp.x, 0.005, wp.z);
  state.scene.add(ring);
  state.exitMesh = ring;
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 40),
    new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.18, depthWrite: false })
  );
  fill.rotation.x = -Math.PI / 2;
  fill.position.set(wp.x, 0.004, wp.z);
  state.scene.add(fill);
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 1.5, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffe066,
      emissive: 0xffe066,
      emissiveIntensity: 1.0,
      roughness: 0.1,
    })
  );
  pillar.position.set(wp.x, 0.75, wp.z);
  state.scene.add(pillar);
  state.exitPillar = pillar;
  const gl = new THREE.PointLight(0xffe066, 8, 4);
  gl.position.set(wp.x, 1.6, wp.z);
  state.scene.add(gl);
  state.exitGlow = gl;
  const tm = state.tileObjects[state.exitRow * COLS + state.exitCol];
  if (tm) {
    (tm.userData as TileUserData).baseColor = 0x2a2200;
    tm.material.color.setHex(0x2a2200);
  }
}

const coinRimMat = new THREE.MeshStandardMaterial({
  color: 0xb8860b,
  roughness: 0.28,
  metalness: 1,
  emissive: 0x5a4808,
  emissiveIntensity: 0.12,
});
const coinFaceMat = new THREE.MeshStandardMaterial({
  color: C.gold,
  roughness: 0.06,
  metalness: 1,
  emissive: C.gold,
  emissiveIntensity: 0.5,
});
const coinDetailMat = new THREE.MeshStandardMaterial({
  color: 0xffe97a,
  roughness: 0.05,
  metalness: 1,
  emissive: 0xffe566,
  emissiveIntensity: 0.35,
});

/** Stacked casino coin — rim, faces, embossed center. */
function makeCoin(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const R = 0.33;
  const H = 0.075;
  const yBase = 0.2;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 40), coinRimMat);
  body.position.y = yBase + H / 2;
  body.castShadow = true;
  g.add(body);

  const bevelTop = new THREE.Mesh(
    new THREE.TorusGeometry(R - 0.01, 0.028, 10, 40),
    coinRimMat
  );
  bevelTop.rotation.x = Math.PI / 2;
  bevelTop.position.y = yBase + H - 0.01;
  g.add(bevelTop);

  const bevelBot = bevelTop.clone();
  bevelBot.position.y = yBase + 0.01;
  g.add(bevelBot);

  const faceTop = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.82, R * 0.82, 0.012, 40),
    coinFaceMat
  );
  faceTop.position.y = yBase + H - 0.004;
  g.add(faceTop);

  const faceBot = faceTop.clone();
  faceBot.position.y = yBase + 0.004;
  g.add(faceBot);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(R * 0.55, 0.014, 8, 32),
    coinDetailMat
  );
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = yBase + H - 0.002;
  g.add(innerRing);

  const center = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.22, R * 0.22, 0.018, 6),
    coinDetailMat
  );
  center.position.y = yBase + H + 0.002;
  g.add(center);

  const star = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.12, R * 0.12, 0.02, 5),
    coinFaceMat
  );
  star.position.y = yBase + H + 0.004;
  g.add(star);

  g.position.set(x, 0, z);
  g.userData.spin = 0.8 + Math.random() * 0.6;
  return g;
}

function buildTableRim(): void {
  if (state.tableRim) state.scene.remove(state.tableRim);
  const hw = ((COLS - 1) * STEP) / 2 + STEP * 0.55;
  const hh = ((ROWS - 1) * STEP) / 2 + STEP * 0.55;
  const cx = ((COLS - 1) * STEP) / 2;
  const cz = ((ROWS - 1) * STEP) / 2;
  const y = 0.02;
  const pts = [
    new THREE.Vector3(cx - hw, y, cz - hh),
    new THREE.Vector3(cx + hw, y, cz - hh),
    new THREE.Vector3(cx + hw, y, cz + hh),
    new THREE.Vector3(cx - hw, y, cz + hh),
    new THREE.Vector3(cx - hw, y, cz - hh),
  ];
  state.tableRim = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: C.neon, transparent: true, opacity: 0.85 })
  );
  state.scene.add(state.tableRim);
}

export function spawnPickups(): void {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = state.grid[r][c];
      const wp = gridToWorld(c, r);
      if (t === TILE.COIN) {
        const mesh = makeCoin(wp.x, wp.z);
        state.scene.add(mesh);
        const glow = makeGlow(wp.x, wp.z, C.gold, 0.45, 0.35);
        state.coinObjects.push({ mesh, glow, col: c, row: r });
      }
      if (t === TILE.POWERUP) {
        const mesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.32),
          new THREE.MeshStandardMaterial({
            color: C.purple,
            roughness: 0.1,
            metalness: 0.4,
            emissive: C.purple,
            emissiveIntensity: 0.9,
          })
        );
        mesh.position.set(wp.x, 0.38, wp.z);
        state.scene.add(mesh);
        const glow = makeGlow(wp.x, wp.z, C.purple, 0.42, 0.22);
        state.pickupObjects.push({ mesh, glow, col: c, row: r, type: TILE.POWERUP });
      }
      if (t === TILE.WILDCARD) {
        const mesh = new THREE.Mesh(
          new THREE.TorusGeometry(0.26, 0.09, 12, 32),
          new THREE.MeshStandardMaterial({
            color: C.teal,
            roughness: 0.1,
            metalness: 0.4,
            emissive: C.teal,
            emissiveIntensity: 0.85,
          })
        );
        mesh.position.set(wp.x, 0.38, wp.z);
        mesh.rotation.x = Math.PI / 2;
        state.scene.add(mesh);
        const glow = makeGlow(wp.x, wp.z, C.teal, 0.42, 0.2);
        state.pickupObjects.push({ mesh, glow, col: c, row: r, type: TILE.WILDCARD });
      }
    }
  }
}

export function buildGrid(): void {
  state.tileObjects.forEach((m) => state.scene.remove(m));
  state.tileObjects = [];
  state.coinObjects.forEach((o) => {
    state.scene.remove(o.mesh);
    if (o.glow) state.scene.remove(o.glow);
  });
  state.coinObjects = [];
  state.pickupObjects.forEach((o) => {
    state.scene.remove(o.mesh);
    if (o.glow) state.scene.remove(o.glow);
  });
  state.pickupObjects = [];
  if (state.exitMesh) state.scene.remove(state.exitMesh);
  if (state.exitGlow) state.scene.remove(state.exitGlow);
  if (state.exitPillar) state.scene.remove(state.exitPillar);
  state.exitMesh = state.exitGlow = state.exitPillar = null;
  if (state.tableRim) {
    state.scene.remove(state.tableRim);
    state.tableRim = null;
  }
  state.scene.children
    .filter((c) => (c.userData as TileUserData).isBg)
    .forEach((c) => state.scene.remove(c));

  state.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(TILE.EMPTY));
  const cfg = ROUNDS[Math.min(state.roundIdx, ROUNDS.length - 1)];
  const stakes = TABLE_STAKES[state.tableRisk];
  const mineCount = Math.max(1, cfg.mines + stakes.mineDelta);
  const coinCount = Math.max(4, cfg.coins + stakes.coinDelta);

  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(COLS * STEP + 4, ROWS * STEP + 4),
    new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 1 })
  );
  bg.rotation.x = -Math.PI / 2;
  bg.position.set(((COLS - 1) * STEP) / 2, -0.16, ((ROWS - 1) * STEP) / 2);
  bg.receiveShadow = true;
  (bg.userData as TileUserData).isBg = true;
  state.scene.add(bg);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const wp = gridToWorld(c, r);
      const isStart = c <= 1 && r <= 1;
      const checker = (c + r) % 2 === 0;
      const baseColor = isStart ? C.tileStart : checker ? C.tile : C.tileAlt;
      const geo = new THREE.BoxGeometry(TILE_SIZE, 0.14, TILE_SIZE);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.88,
        metalness: 0.05,
        emissive: isStart ? new THREE.Color(0x1a4a30) : new THREE.Color(0x000000),
        emissiveIntensity: isStart ? 0.35 : 0,
      });
      const mesh: TileMesh = new THREE.Mesh(geo, mat);
      mesh.position.set(wp.x, -0.07, wp.z);
      mesh.receiveShadow = true;
      mesh.userData = { col: c, row: r, baseColor } satisfies TileUserData;
      state.scene.add(mesh);
      state.tileObjects.push(mesh);
      const pts = [
        new THREE.Vector3(-TILE_SIZE / 2 + 0.03, 0.001, -TILE_SIZE / 2 + 0.03),
        new THREE.Vector3(TILE_SIZE / 2 - 0.03, 0.001, -TILE_SIZE / 2 + 0.03),
        new THREE.Vector3(TILE_SIZE / 2 - 0.03, 0.001, TILE_SIZE / 2 - 0.03),
        new THREE.Vector3(-TILE_SIZE / 2 + 0.03, 0.001, TILE_SIZE / 2 - 0.03),
        new THREE.Vector3(-TILE_SIZE / 2 + 0.03, 0.001, -TILE_SIZE / 2 + 0.03),
      ];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: isStart ? 0x44ff88 : C.tileEdge,
          transparent: true,
          opacity: isStart ? 0.6 : 0.4,
        })
      );
      line.position.set(wp.x, 0, wp.z);
      state.scene.add(line);
      if (c === 0 && r === 0) {
        const d = new THREE.Mesh(
          new THREE.CircleGeometry(0.18, 16),
          new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.5 })
        );
        d.rotation.x = -Math.PI / 2;
        d.position.set(wp.x, 0.002, wp.z);
        state.scene.add(d);
      }
    }
  }

  placeItems(mineCount, TILE.MINE);
  placeItems(coinCount, TILE.COIN);
  placeItems(cfg.wildcards, TILE.WILDCARD);
  placeItems(cfg.powerups, TILE.POWERUP);
  buildTableRim();

  state.exitCol = COLS - 1;
  state.exitRow = ROWS - 1;
  for (let dc = -1; dc <= 0; dc++)
    for (let dr = -1; dr <= 0; dr++) {
      const ec = state.exitCol + dc;
      const er = state.exitRow + dr;
      if (ec >= 0 && er >= 0) state.grid[er][ec] = TILE.EMPTY;
    }
  state.grid[state.exitRow][state.exitCol] = TILE.EXIT;
  spawnExit();
  spawnPickups();
}

export function flashTile(c: number, r: number, color: number, dur = 400): void {
  const m = state.tileObjects[r * COLS + c];
  if (!m) return;
  const orig = (m.userData as TileUserData).baseColor || C.tile;
  m.material.color.setHex(color);
  m.material.emissive = new THREE.Color(color);
  m.material.emissiveIntensity = 0.45;
  setTimeout(() => {
    m.material.color.setHex(orig);
    m.material.emissiveIntensity = 0;
  }, dur);
}

export function removeCoin(c: number, r: number): void {
  const i = state.coinObjects.findIndex((o) => o.col === c && o.row === r);
  if (i < 0) return;
  state.scene.remove(state.coinObjects[i].mesh);
  if (state.coinObjects[i].glow) state.scene.remove(state.coinObjects[i].glow);
  state.coinObjects.splice(i, 1);
}

export function removePickup(c: number, r: number): void {
  const i = state.pickupObjects.findIndex((o) => o.col === c && o.row === r);
  if (i < 0) return;
  state.scene.remove(state.pickupObjects[i].mesh);
  if (state.pickupObjects[i].glow) state.scene.remove(state.pickupObjects[i].glow);
  state.pickupObjects.splice(i, 1);
}

export function revealMines(show: boolean): void {
  setScanOverlay(show);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (state.grid[r][c] === TILE.MINE) {
        const m = state.tileObjects[r * COLS + c];
        if (m) {
          const ud = m.userData as TileUserData;
          m.material.color.setHex(show ? 0x3a0808 : ud.baseColor || C.tile);
          m.material.emissiveIntensity = show ? 0.4 : 0;
          if (show) m.material.emissive = new THREE.Color(C.red);
        }
      }
    }
}

export function clearMines(count: number): void {
  const mines: { c: number; r: number }[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (state.grid[r][c] === TILE.MINE) mines.push({ c, r });
  mines
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .forEach(({ c, r }) => {
      state.grid[r][c] = TILE.EMPTY;
      flashTile(c, r, C.green, 600);
    });
}
