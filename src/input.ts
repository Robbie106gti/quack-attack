import { TABLE_STAKES } from './constants.js';
import type { Direction } from './types.js';
import { isDirection, $ } from './dom.js';
import { state } from './state.js';
import { tryMove, startRound, cashOut, canCashOut } from './game.js';
import {
  updateHUD,
  hideOverlay,
  initTableStakes,
  setGameplayControlsVisible,
  setCashOutEnabled,
} from './hud.js';
import { startAmbient } from './audio.js';
import { clearFollowCamera } from './camera.js';
import { initCoffeeUI } from './coffee.js';

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

export function updateCashOutButtons(): void {
  setCashOutEnabled(canCashOut());
}

function bindCashOutButtons(): void {
  $('cashout-btn').addEventListener('click', () => cashOut());
  $('hud-cashout').addEventListener('click', () => cashOut());
}

function onPlay(): void {
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
}

export function bindInput(): void {
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

  $('play-btn').addEventListener('click', onPlay);
  bindCashOutButtons();
  initCoffeeUI();
  initTableStakes();
}
