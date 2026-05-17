import * as THREE from 'three';
import { state } from './state.js';
import { loadDuck, updateDuck } from './duck.js';
import { landOn } from './game.js';
import { showTitleOverlay } from './hud.js';
import { updateFx, applyScreenShake } from './fx.js';
import { updateActiveCamera, updateCamera } from './camera.js';
import { updateTimer } from './timer.js';
import {
  createRenderer,
  createCamera,
  setupScene,
  updateSceneLights,
  animatePickups,
} from './scene-setup.js';
import { bindInput, updateCashOutButtons } from './input.js';

const { scene } = state;
const renderer = createRenderer();
const camera = createCamera();

setupScene();
updateCamera(camera);
showTitleOverlay();
bindInput();
loadDuck();

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  updateSceneLights(t);
  animatePickups(dt, t);
  updateFx(dt, scene);
  updateTimer(dt, t);

  if (!state.duck) {
    renderer.render(scene, camera);
    return;
  }

  const landed = updateDuck(dt, t);
  if (landed) landOn(state.duckPos.col, state.duckPos.row);
  updateCashOutButtons();

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
  updateActiveCamera(camera, duck?.position.x, duck?.position.z, 0, playing);
}

window.addEventListener('resize', onViewportChange);
window.visualViewport?.addEventListener('resize', onViewportChange);
