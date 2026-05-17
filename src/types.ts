import type * as THREE from 'three';
import type { TileId } from './constants.js';

export type GameState = 'idle' | 'playing' | 'coffee' | 'dead' | 'win';
export type TableRisk = 'low' | 'standard' | 'high';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type ShopId = 'scan' | 'shield' | 'magnet' | 'time' | 'clear' | 'double';

export interface GridPos {
  col: number;
  row: number;
}

export interface TileUserData {
  col: number;
  row: number;
  baseColor: number;
  isBg?: boolean;
}

export type TileMesh = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;

export interface CoinObject {
  mesh: THREE.Object3D;
  glow: THREE.Mesh | null;
  col: number;
  row: number;
}

export interface PickupObject {
  mesh: THREE.Mesh;
  glow: THREE.Mesh | null;
  col: number;
  row: number;
  type: TileId;
}

export interface ShopItem {
  id: ShopId;
  icon: string;
  name: string;
  desc: string;
  cost: number;
  free?: boolean;
}

export interface RoundConfig {
  mines: number;
  coins: number;
  wildcards: number;
  powerups: number;
}
