import * as THREE from 'three';
import type { PerspectiveCamera } from 'three';
import { C } from './constants.js';

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

const particles: Particle[] = [];

let screenShakeT = 0;
let screenShakeMag = 0;

const SILLY_BOOM_WORDS = ['BOOM!', 'QUACK!', 'KABOOM!', 'SPLAT!', 'UH-OH!'];

export function triggerScreenShake(magnitude = 0.4, duration = 0.45): void {
  screenShakeMag = magnitude;
  screenShakeT = duration;
}

/** Apply random offset; call after camera positioning each frame. */
export function applyScreenShake(camera: PerspectiveCamera, dt: number): void {
  if (screenShakeT <= 0) return;
  screenShakeT -= dt;
  const f = screenShakeT / 0.45;
  const m = screenShakeMag * f * f;
  camera.position.x += (Math.random() - 0.5) * m;
  camera.position.y += (Math.random() - 0.5) * m * 0.6;
  camera.position.z += (Math.random() - 0.5) * m;
}

export function showBoomFlash(x: number, z: number): void {
  const el = document.getElementById('mine-boom');
  if (!el) return;
  el.textContent = SILLY_BOOM_WORDS[Math.floor(Math.random() * SILLY_BOOM_WORDS.length)];
  el.classList.add('show');
  document.body.classList.add('mine-shake');
  setTimeout(() => {
    el.classList.remove('show');
    document.body.classList.remove('mine-shake');
  }, 520);
  void x;
  void z;
}

export function spawnChipBurst(scene: THREE.Scene, x: number, z: number, count = 10): void {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.018, 16),
      new THREE.MeshStandardMaterial({
        color: C.gold,
        emissive: C.gold,
        emissiveIntensity: 0.55,
        metalness: 1,
        roughness: 0.1,
      })
    );
    mesh.position.set(x, 0.35 + Math.random() * 0.2, z);
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.z = Math.random() * Math.PI;
    scene.add(mesh);
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 2;
    particles.push({
      mesh,
      vel: new THREE.Vector3(Math.cos(angle) * speed, 2 + Math.random() * 2, Math.sin(angle) * speed),
      life: 0.55 + Math.random() * 0.25,
    });
  }
}

/** Cartoon mine blast — fire, rubble, feathers, shock ring. */
export function spawnMineExplosion(scene: THREE.Scene, x: number, z: number, big = true): void {
  const count = big ? 36 : 18;
  const colors = [0xff4400, 0xff2200, 0xff8800, 0xffcc00, 0xff3347, 0xe07820];

  for (let i = 0; i < count; i++) {
    const isFeather = i % 5 === 0;
    const mesh = isFeather
      ? new THREE.Mesh(
          new THREE.PlaneGeometry(0.18, 0.1),
          new THREE.MeshBasicMaterial({
            color: 0xffee88,
            transparent: true,
            side: THREE.DoubleSide,
          })
        )
      : new THREE.Mesh(
          new THREE.SphereGeometry(0.06 + Math.random() * 0.1, 6, 6),
          new THREE.MeshStandardMaterial({
            color: colors[i % colors.length],
            emissive: colors[i % colors.length],
            emissiveIntensity: 1.2,
            roughness: 0.4,
          })
        );
    mesh.position.set(x, 0.4 + Math.random() * 0.3, z);
    scene.add(mesh);
    const angle = Math.random() * Math.PI * 2;
    const speed = (big ? 3 : 2) + Math.random() * (big ? 5 : 3);
    particles.push({
      mesh,
      vel: new THREE.Vector3(
        Math.cos(angle) * speed,
        (big ? 5 : 3) + Math.random() * (big ? 4 : 2),
        Math.sin(angle) * speed
      ),
      life: 0.5 + Math.random() * (big ? 0.55 : 0.35),
    });
  }

  for (let i = 0; i < (big ? 8 : 4); i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.9 })
    );
    mesh.position.set(x, 0.2, z);
    scene.add(mesh);
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      mesh,
      vel: new THREE.Vector3(
        Math.cos(angle) * (2 + Math.random() * 3),
        4 + Math.random() * 3,
        Math.sin(angle) * (2 + Math.random() * 3)
      ),
      life: 0.7 + Math.random() * 0.4,
    });
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.2, big ? 1.1 : 0.7, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.08, z);
  scene.add(ring);
  particles.push({
    mesh: ring,
    vel: new THREE.Vector3(0, 0.5, 0),
    life: big ? 0.35 : 0.25,
  });

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(big ? 0.9 : 0.55, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: big ? 0.85 : 0.6,
    })
  );
  flash.position.set(x, 0.5, z);
  scene.add(flash);
  particles.push({
    mesh: flash,
    vel: new THREE.Vector3(0, 0, 0),
    life: 0.12,
  });
}

export function spawnConfetti(scene: THREE.Scene, x: number, z: number): void {
  const colors = [C.gold, C.teal, C.purple, 0xffffff];
  for (let i = 0; i < 28; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.08),
      new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        side: THREE.DoubleSide,
      })
    );
    mesh.position.set(x, 1.2 + Math.random(), z);
    scene.add(mesh);
    particles.push({
      mesh,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        3 + Math.random() * 3,
        (Math.random() - 0.5) * 4
      ),
      life: 1.2 + Math.random() * 0.6,
    });
  }
}

export function updateFx(dt: number, scene: THREE.Scene): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.vel.y -= 9 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.rotation.z += dt * 6;
    p.mesh.rotation.x += dt * 4;
    let scale = Math.max(0, p.life);
    if (p.mesh.geometry instanceof THREE.RingGeometry) {
      const grow = 1 + (1 - p.life) * 4;
      scale = grow * Math.max(0, p.life * 3);
    }
    if (p.mesh.geometry instanceof THREE.SphereGeometry && p.mesh.material instanceof THREE.MeshBasicMaterial) {
      scale = Math.max(0, p.life * 5);
      p.mesh.material.opacity = Math.max(0, p.life * 8);
    }
    p.mesh.scale.setScalar(scale);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      if (p.mesh.material instanceof THREE.Material) p.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }
}

export function flashVignette(kind: 'mine' | 'win' | 'jackpot'): void {
  const el = document.getElementById('vignette');
  if (!el) return;
  el.className = 'show ' + kind;
  setTimeout(() => {
    el.className = '';
  }, kind === 'mine' ? 650 : 700);
}

export function setScanOverlay(on: boolean): void {
  document.body.classList.toggle('scan-active', on);
}

export function pulseTableRim(): void {
  document.body.classList.add('rim-pulse');
  setTimeout(() => document.body.classList.remove('rim-pulse'), 600);
}
