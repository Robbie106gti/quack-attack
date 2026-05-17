import { ROUND_TIME, COFFEE_TIME, C } from './constants.js';
import { $ } from './dom.js';
import { state } from './state.js';
import { playTick, playCount } from './audio.js';
import { updateTimerHUD, updateBadges, showToast } from './hud.js';
import { revealMines } from './grid.js';
import { openCoffee } from './coffee.js';
import { endTimeout } from './game.js';

let lastWall = 0;

export function updateTimer(dt: number, t: number): void {
  if (state.gameState !== 'playing') return;

  state.timeLeft -= dt;
  updateTimerHUD();

  if (!state.coffeeTriggered && state.timeLeft <= COFFEE_TIME) {
    state.coffeeTriggered = true;
    showToast('☕ Pit boss — lounge break!', C.gold);
    setTimeout(openCoffee, 300);
  }

  if (state.magnetActive) {
    state.magnetTimer -= dt;
    if (state.magnetTimer <= 0) {
      state.magnetActive = false;
      updateBadges();
      showToast('🧲 Chip rake off', 0x1ce8c0);
    }
  }

  if (state.scanActive) {
    state.scanTimer -= dt;
    if (state.scanTimer <= 0) {
      state.scanActive = false;
      updateBadges();
      revealMines(false);
    }
  }

  const urgency = Math.max(0, 1 - state.timeLeft / ROUND_TIME);
  state.tickInterval = state.timeLeft > 10 ? 2.0 : state.timeLeft > 5 ? 0.5 : 0.25;
  if (t - lastWall >= state.tickInterval) {
    lastWall = t;
    playTick(urgency);
  }

  const secs = Math.ceil(state.timeLeft);
  if (state.timeLeft > 0 && secs <= 5 && secs !== state.lastBigCount) {
    state.lastBigCount = secs;
    const el = $('big-count');
    el.textContent = String(secs);
    el.classList.add('show');
    playCount(secs);
    setTimeout(() => el.classList.remove('show'), 700);
  }

  if (state.timeLeft <= 0 && state.gameState === 'playing') {
    state.timeLeft = 0;
    endTimeout();
  }
}
