import type { Direction } from './types.js';

export function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

export function isDirection(value: string | undefined): value is Direction {
  return value === 'up' || value === 'down' || value === 'left' || value === 'right';
}
