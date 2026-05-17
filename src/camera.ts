import * as THREE from 'three';
import type { PerspectiveCamera } from 'three';
import { COLS, ROWS, STEP, FOLLOW_TILES_W, FOLLOW_CAM_SMOOTH } from './constants.js';
import { state } from './state.js';

const camLookCurrent = new THREE.Vector3();
let followCamInitialized = false;

const mobileMq = matchMedia('(max-width: 720px), (max-height: 720px)');

/** True on phone-sized viewports — use duck follow cam while playing. */
export function useFollowCamera(): boolean {
  return mobileMq.matches;
}

function gridExtents(): { w: number; h: number } {
  return { w: (COLS - 1) * STEP, h: (ROWS - 1) * STEP };
}

/** Portrait gets extra vertical tiles from aspect; never more than the board. */
export function followVisibleTilesH(aspect: number): number {
  if (aspect >= 1) return FOLLOW_TILES_W;
  return Math.min(ROWS, Math.max(FOLLOW_TILES_W, FOLLOW_TILES_W / aspect));
}

function clampLookAt(
  x: number,
  z: number,
  halfW: number,
  halfH: number,
  gw: number,
  gh: number
): { x: number; z: number } {
  const minX = halfW;
  const maxX = gw - halfW;
  const minZ = halfH;
  const maxZ = gh - halfH;
  if (minX <= maxX) x = Math.max(minX, Math.min(maxX, x));
  else x = gw * 0.5;
  if (minZ <= maxZ) z = Math.max(minZ, Math.min(maxZ, z));
  else z = gh * 0.5;
  return { x, z };
}

/** Snap follow target (e.g. new round). */
export function resetFollowCamera(duckX: number, duckZ: number): void {
  camLookCurrent.set(duckX, 0, duckZ);
  followCamInitialized = true;
}

export function clearFollowCamera(): void {
  followCamInitialized = false;
}

/** Fit the full 9×9 grid in view (title, coffee, desktop). */
export function updateCamera(camera: PerspectiveCamera): void {
  const aspect = innerWidth / Math.max(innerHeight, 1);
  const { w, h } = gridExtents();

  state.CAM_TARGET.set(w * 0.5, 0, h * 0.5);

  const portrait = aspect < 1;
  const narrow = aspect < 0.72;

  camera.fov = portrait ? (narrow ? 54 : 50) : 40;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  const height = portrait ? (narrow ? 18.5 : 17) : 15;
  const back = portrait ? (narrow ? 11.5 : 10.5) : 10.5;
  camera.position.set(w * 0.5, height, h * 0.5 + back);
  camera.lookAt(state.CAM_TARGET);
}

/** Track duck on mobile; ~7 tiles wide, taller window in portrait. */
export function updateFollowCamera(
  camera: PerspectiveCamera,
  duckX: number,
  duckZ: number,
  dt: number
): void {
  const aspect = innerWidth / Math.max(innerHeight, 1);
  const { w: gw, h: gh } = gridExtents();

  const tilesH = followVisibleTilesH(aspect);
  const halfW = (FOLLOW_TILES_W * STEP) / 2;
  const halfH = (tilesH * STEP) / 2;

  const { x: tx, z: tz } = clampLookAt(duckX, duckZ, halfW, halfH, gw, gh);

  if (!followCamInitialized) {
    camLookCurrent.set(tx, 0, tz);
    followCamInitialized = true;
  } else {
    const t = 1 - Math.exp(-FOLLOW_CAM_SMOOTH * dt);
    camLookCurrent.lerp(new THREE.Vector3(tx, 0, tz), t);
  }

  state.CAM_TARGET.copy(camLookCurrent);

  const portrait = aspect < 1;
  const height = portrait ? 15.5 : 15;
  const back = portrait ? 9.5 : 10.5;

  camera.position.set(camLookCurrent.x, height, camLookCurrent.z + back);

  const slant = Math.hypot(height, back);
  const hFovRad = 2 * Math.atan(halfW / slant);
  const vFovRad = 2 * Math.atan(Math.tan(hFovRad / 2) / aspect);
  camera.fov = THREE.MathUtils.radToDeg(vFovRad);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  camera.lookAt(state.CAM_TARGET);
}

export function updateActiveCamera(
  camera: PerspectiveCamera,
  duckX: number | undefined,
  duckZ: number | undefined,
  dt: number,
  playing: boolean
): void {
  if (playing && useFollowCamera() && duckX !== undefined && duckZ !== undefined) {
    updateFollowCamera(camera, duckX, duckZ, dt);
  } else {
    updateCamera(camera);
  }
}
