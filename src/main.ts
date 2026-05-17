import * as THREE from 'three';
import { COLS, ROWS, STEP, TILE, C, TABLE_STAKES } from './constants.js';
import type { Direction } from './types.js';
import { isDirection, $ } from './dom.js';
import { state } from './state.js';
import { loadDuck, updateDuck } from './duck.js';
import { tryMove, startRound, landOn, cashOut, canCashOut } from './game.js';
import {
  updateHUD,
  hideOverlay,
  showTitleOverlay,
  initTableStakes,
  setGameplayControlsVisible,
} from './hud.js';
import { startAmbient } from './audio.js';
import { updateFx, applyScreenShake } from './fx.js';
import { updateActiveCamera, updateCamera, clearFollowCamera } from './camera.js';
import { initCoffeeUI } from './coffee.js';
import { updateTimer } from './timer.js';

const { scene } = state;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);
state.renderer = renderer;

scene.background = new THREE.Color(C.bg);
scene.fog = new THREE.FogExp2(C.bg, 0.055);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
state.camera = camera;

updateCamera(camera);
showTitleOverlay();

scene.add(new THREE.AmbientLight(0x4444aa, 2.8));
const keyLight = new THREE.DirectionalLight(0xffeeaa, 3.5);
keyLight.position.set(4, 12, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x8888ff, 1.2);
fillLight.position.set(-4, 6, -4);
scene.add(fillLight);
const tealLight = new THREE.PointLight(C.teal, 10, 18);
const purpLight = new THREE.PointLight(C.purple, 10, 18);
tealLight.position.set(-2, 3, -2);
purpLight.position.set(COLS * STEP + 1, 3, ROWS * STEP + 1);
scene.add(tealLight, purpLight);
const goldLight = new THREE.PointLight(C.gold, 4, 14);
goldLight.position.set((COLS * STEP) / 2, -1, (ROWS * STEP) / 2);
scene.add(goldLight);
state.keyLight = keyLight;
state.tealLight = tealLight;
state.purpLight = purpLight;
state.goldLight = goldLight;

const tableSpot = new THREE.SpotLight(0xffeecc, 14, 24, Math.PI / 4.5, 0.35, 1);
tableSpot.position.set(((COLS - 1) * STEP) / 2, 16, ((ROWS - 1) * STEP) / 2 + 4);
tableSpot.castShadow = true;
scene.add(tableSpot);
scene.add(tableSpot.target);
state.tableSpot = tableSpot;

const KEY_MAP: Record<string, Direction | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

window.addEventListener('keydown', (e) => {
  if (state.gameState !== 'playing') return;
  if (e.code === 'KeyC' && !e.repeat) {
    e.preventDefault();
    cashOut();
    return;
  }
  const dir = KEY_MAP[e.code];
  if (dir) {
    e.preventDefault();
    tryMove(dir);
  }
});

document.querySelectorAll('.dpad-btn').forEach((btn) => {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const dir = (btn as HTMLElement).dataset.dir;
    if (isDirection(dir)) tryMove(dir);
  });
});

$('play-btn').addEventListener('click', () => {
  hideOverlay();
  if (state.gameState === 'dead' || state.gameState === 'win') {
    state.lives = 3;
    state.multiplier = 1;
    state.roundIdx = 0;
    state.coins = TABLE_STAKES[state.tableRisk].ante * 3;
    updateHUD();
  } else if (state.gameState === 'idle') {
    state.coins = TABLE_STAKES[state.tableRisk].ante * 3;
    updateHUD();
  }
  startAmbient();
  state.lastBigCount = -1;
  state.gameState = 'playing';
  clearFollowCamera();
  if (state.duck) startRound();
  setGameplayControlsVisible(true);
  $('legend').style.opacity = '1';
});

function bindCashOut(el: HTMLElement): void {
  el.addEventListener('click', () => cashOut());
}
bindCashOut($('cashout-btn'));
bindCashOut($('hud-cashout'));

function updateCashOutButton(): void {
  const can = canCashOut();
  ($('cashout-btn') as HTMLButtonElement).disabled = !can;
  ($('hud-cashout') as HTMLButtonElement).disabled = !can;
}

initCoffeeUI();
initTableStakes();
loadDuck();

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  state.tealLight!.intensity = 6 + Math.sin(t * 1.4) * 2;
  state.purpLight!.intensity = 6 + Math.sin(t * 1.1 + 1) * 2;
  if (state.exitGlow) state.exitGlow.intensity = 6 + Math.sin(t * 3) * 2.5;
  if (state.exitMesh?.material instanceof THREE.MeshBasicMaterial) {
    state.exitMesh.material.opacity = 0.7 + Math.sin(t * 3) * 0.2;
  }
  if (state.tableRim?.material instanceof THREE.LineBasicMaterial) {
    state.tableRim.material.opacity =
      0.55 + Math.sin(t * 2.2) * 0.2 + (state.multiplier > 1 ? 0.15 : 0);
  }
  if (state.tableSpot && state.duck && state.gameState === 'playing') {
    const p = state.duck.position;
    state.tableSpot.position.set(p.x + 1.5, 15, p.z + 4);
    state.tableSpot.target.position.set(p.x, 0, p.z);
  }

  updateFx(dt, scene);

  state.coinObjects.forEach((o, i) => {
    const spin = (o.mesh.userData.spin as number | undefined) ?? 2.2;
    o.mesh.rotation.y += dt * spin;
    o.mesh.position.y = Math.sin(t * 2.2 + i * 0.7) * 0.04;
    if (o.glow?.material instanceof THREE.MeshBasicMaterial) {
      o.glow.material.opacity = 0.15 + Math.sin(t * 2.5 + i) * 0.1;
    }
  });
  state.pickupObjects.forEach((o, i) => {
    o.mesh.rotation.y += dt * 1.4;
    if (o.type === TILE.POWERUP) o.mesh.rotation.x += dt * 0.8;
    o.mesh.position.y = 0.38 + Math.sin(t * 1.8 + i * 1.1) * 0.09;
    if (o.glow?.material instanceof THREE.MeshBasicMaterial) {
      o.glow.material.opacity = 0.15 + Math.sin(t * 2 + i * 0.8) * 0.1;
    }
  });

  updateTimer(dt, t);

  if (!state.duck) {
    renderer.render(scene, camera);
    return;
  }

  const landed = updateDuck(dt, t);
  if (landed) landOn(state.duckPos.col, state.duckPos.row);
  updateCashOutButton();

  const duckX = state.duck.position.x;
  const duckZ = state.duck.position.z;
  updateActiveCamera(camera, duckX, duckZ, dt, state.gameState === 'playing');
  applyScreenShake(camera, dt);

  renderer.render(scene, camera);
}
animate();

function onViewportChange(): void {
  renderer.setSize(innerWidth, innerHeight);
  const playing = state.gameState === 'playing';
  const duck = state.duck;
  updateActiveCamera(
    camera,
    duck?.position.x,
    duck?.position.z,
    0,
    playing
  );
}

window.addEventListener('resize', onViewportChange);
window.visualViewport?.addEventListener('resize', onViewportChange);
