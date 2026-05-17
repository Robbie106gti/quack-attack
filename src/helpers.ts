import { COLS, ROWS } from './constants.js';

export const ADJACENT = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

export function tileIndex(col: number, row: number): number {
  return row * COLS + col;
}

export function formatMoney(amount: number): string {
  return '$' + amount.toLocaleString();
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
