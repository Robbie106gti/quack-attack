import * as THREE from 'three';
import type {
  CoinObject,
  GameState,
  PickupObject,
  ShopId,
  TableRisk,
  TileMesh,
} from './types.js';

export const state = {
  scene: new THREE.Scene(),
  CAM_TARGET: new THREE.Vector3(),
  camera: null as THREE.PerspectiveCamera | null,
  renderer: null as THREE.WebGLRenderer | null,
  keyLight: null as THREE.DirectionalLight | null,
  tealLight: null as THREE.PointLight | null,
  purpLight: null as THREE.PointLight | null,
  goldLight: null as THREE.PointLight | null,

  grid: [] as number[][],
  tileObjects: [] as TileMesh[],
  coinObjects: [] as CoinObject[],
  pickupObjects: [] as PickupObject[],

  duck: null as THREE.Group | null,
  duckBaseScale: 1,
  duckPos: { col: 0, row: 0 },
  duckTargetWorld: new THREE.Vector3(),
  duckCurrentWorld: new THREE.Vector3(),
  duckMoving: false,
  duckFacing: 0,
  bouncing: false,
  bounceT: 0,
  deathAnim: false,
  deathT: 0,
  mineKaboom: false,
  mineKaboomT: 0,
  cashingOut: false,

  lives: 3,
  coins: 0,
  multiplier: 1,
  roundIdx: 0,
  gameState: 'idle' as GameState,

  timeLeft: 60,
  coffeeTriggered: false,
  lastTickWall: 0,
  tickInterval: 2.0,
  lastBigCount: -1,

  shieldActive: false,
  magnetActive: false,
  magnetTimer: 0,
  scanActive: false,
  scanTimer: 0,

  exitCol: 8,
  exitRow: 8,
  exitMesh: null as THREE.Mesh | null,
  exitGlow: null as THREE.PointLight | null,
  exitPillar: null as THREE.Mesh | null,

  purchasedItems: new Set<ShopId>(),

  tableRisk: 'standard' as TableRisk,
  coinStreak: 0,
  nearCageShown: false,
  tableRim: null as THREE.Line | null,
  tableSpot: null as THREE.SpotLight | null,
};
