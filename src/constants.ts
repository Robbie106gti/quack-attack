import type { Direction, RoundConfig, TableRisk } from './types.js';

export const COLS = 9;
export const ROWS = 9;
export const TILE_SIZE = 1.1;
export const TILE_GAP = 0.08;
export const STEP = TILE_SIZE + TILE_GAP;

/** Mobile follow-cam: visible tile span (height grows in portrait, capped at ROWS). */
export const FOLLOW_TILES_W = 11;
export const FOLLOW_CAM_SMOOTH = 14;

export const ROUND_TIME = 60;
export const COFFEE_TIME = 30;
export const COFFEE_STIPEND = 200;
export const COFFEE_MIN_BUDGET = 100;
export const COIN_VALUE = 100;
export const POWERUP_MULTI = 2;
export const COMBO_BONUS_EVERY = 3;
export const COMBO_CHIP_BONUS = 50;

/** Table stakes — ante per hand + house difficulty tuning. */
export const TABLE_STAKES: Record<
  TableRisk,
  { label: string; tag: string; ante: number; mineDelta: number; coinDelta: number; payoutMult: number }
> = {
  low: { label: 'Penny Table', tag: '$50 ante · softer pit', ante: 50, mineDelta: -1, coinDelta: -2, payoutMult: 1 },
  standard: {
    label: 'Main Floor',
    tag: '$100 ante · standard odds',
    ante: 100,
    mineDelta: 0,
    coinDelta: 0,
    payoutMult: 1,
  },
  high: {
    label: 'High Roller',
    tag: '$200 ante · hotter table',
    ante: 200,
    mineDelta: 1,
    coinDelta: 2,
    payoutMult: 1.25,
  },
};

export const C = {
  bg: 0x07071a,
  felt: 0x0d2818,
  feltAlt: 0x0f3220,
  tile: 0x12221a,
  tileAlt: 0x152a1e,
  tileEdge: 0x2a5a3a,
  tileStart: 0x1a3e28,
  gold: 0xf5c842,
  teal: 0x1ce8c0,
  purple: 0x8b5cf6,
  red: 0xff3347,
  green: 0x22dd88,
  neon: 0xffe066,
} as const;

export const TILE = {
  EMPTY: 0,
  COIN: 1,
  MINE: 2,
  POWERUP: 3,
  WILDCARD: 4,
  REVEALED_MINE: 5,
  EXIT: 6,
} as const;

export type TileId = (typeof TILE)[keyof typeof TILE];

export const ROUNDS: readonly RoundConfig[] = [
  { mines: 3, coins: 12, wildcards: 2, powerups: 1 },
  { mines: 6, coins: 10, wildcards: 3, powerups: 1 },
  { mines: 9, coins: 9, wildcards: 3, powerups: 2 },
  { mines: 12, coins: 8, wildcards: 4, powerups: 2 },
  { mines: 15, coins: 7, wildcards: 4, powerups: 2 },
];

export const DIR_D: Record<Direction, readonly [number, number]> = {
  right: [1, 0],
  left: [-1, 0],
  up: [0, -1],
  down: [0, 1],
};

export const BOUNCE_DUR = 0.22;
