import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { $ } from './dom.js';
import { state } from './state.js';

const DUCK_URL = new URL('../public/duck.glb', import.meta.url).href;

export function loadDuck(onReady?: () => void): void {
  const loader = new GLTFLoader();
  loader.load(
    DUCK_URL,
    (gltf) => {
      state.duck = gltf.scene;
      const box = new THREE.Box3().setFromObject(state.duck);
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const scale = 1.05 / Math.max(size.x, size.y, size.z);
      state.duckBaseScale = scale;
      state.duck.scale.setScalar(scale);
      state.duck.position.sub(centre.multiplyScalar(scale));
      const box2 = new THREE.Box3().setFromObject(state.duck);
      state.duck.position.y -= box2.min.y;
      state.duck.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.castShadow = true;
        const mat = child.material;
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;
        if (mat.name === 'Rubber_Duck_Orange') mat.color.setHex(0xe07820);
        if (mat.name === 'Rubber_Duck_Yellow') mat.roughness = 0.28;
      });
      state.scene.add(state.duck);
      $('loading').classList.add('hidden');
      onReady?.();
    },
    (p) => {
      if (p.total) {
        $('load-bar').style.width = (p.loaded / p.total) * 100 + '%';
      }
    },
    (e) => console.error(e)
  );
}

/** @returns true when the duck finished moving to a new tile */
export function updateDuck(dt: number, t: number): boolean {
  if (!state.duck) return false;

  if (state.duckMoving) {
    state.duckCurrentWorld.lerp(state.duckTargetWorld, Math.min(1, dt * 48));
    state.duck.position.x = state.duckCurrentWorld.x;
    state.duck.position.z = state.duckCurrentWorld.z;
    if (state.duckCurrentWorld.distanceTo(state.duckTargetWorld) < 0.02) {
      state.duck.position.x = state.duckTargetWorld.x;
      state.duck.position.z = state.duckTargetWorld.z;
      state.duckCurrentWorld.copy(state.duckTargetWorld);
      state.duckMoving = false;
      return true;
    }
  }

  let diff = state.duckFacing - state.duck.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  state.duck.rotation.y += diff * Math.min(1, dt * 14);

  const bob = Math.sin(t * 2.2) * 0.025;
  let by = 0;
  let sy = 1;
  let sxz = 1;
  if (state.bouncing) {
    state.bounceT += dt / 0.22;
    if (state.bounceT >= 1) {
      state.bounceT = 1;
      state.bouncing = false;
    }
    const arc = Math.sin(state.bounceT * Math.PI);
    by = arc * 0.45;
    if (state.bounceT < 0.35) {
      sy = 1 + (state.bounceT / 0.35) * 0.15;
      sxz = 1 - (state.bounceT / 0.35) * 0.07;
    } else if (state.bounceT > 0.75) {
      const q = (state.bounceT - 0.75) / 0.25;
      sy = 1 - q * 0.15;
      sxz = 1 + q * 0.08;
    }
  }
  if (state.mineKaboom) {
    state.mineKaboomT += dt;
    const u = Math.min(state.mineKaboomT / 0.65, 1);
    const launch = Math.sin(u * Math.PI);
    state.duck.position.y = launch * 2.4 + bob;
    state.duck.rotation.x = state.mineKaboomT * 16;
    state.duck.rotation.y += dt * 22;
    const wobble = 1 + Math.sin(state.mineKaboomT * 38) * 0.22;
    state.duck.scale.set(
      state.duckBaseScale * wobble,
      state.duckBaseScale * (2 - wobble),
      state.duckBaseScale * wobble
    );
    if (state.mineKaboomT >= 0.65) {
      state.mineKaboom = false;
      state.mineKaboomT = 0;
      state.duck.rotation.x = 0;
    }
    return false;
  }

  if (state.deathAnim) {
    state.deathT += dt;
    state.duck.rotation.y += dt * 12;
    state.duck.rotation.z = Math.sin(state.deathT * 14) * 0.45;
    state.duck.rotation.x = Math.sin(state.deathT * 8) * 0.25;
    state.duck.position.y = bob + Math.max(0, 0.6 - state.deathT) * 0.5;
    if (state.deathT > 0.9) state.duck.rotation.z = 0;
  } else {
    state.duck.rotation.z = 0;
    state.duck.rotation.x = 0;
  }
  state.duck.position.y = bob + by;
  state.duck.scale.set(state.duckBaseScale * sxz, state.duckBaseScale * sy, state.duckBaseScale * sxz);
  return false;
}
