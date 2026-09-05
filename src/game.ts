import {
  ROUND_TIME,
  COIN_VALUE,
  POWERUP_MULTI,
  TILE,
  ROUNDS,
  DIR_D,
  C,
  TABLE_STAKES,
  COMBO_BONUS_EVERY,
  COMBO_CHIP_BONUS,
} from './constants.js';
import type { Direction } from './types.js';
import { state } from './state.js';
import { buildGrid, gridToWorld, flashTile, removeCoin, removePickup } from './grid.js';
import { playSlotCollect, playMineExplosion, playJackpot, playDeal } from './audio.js';
import {
  updateHUD,
  updateTimerHUD,
  updateBadges,
  showToast,
  showEndOverlay,
  type EndStats,
} from './hud.js';
import { $ } from './dom.js';
import { resetFollowCamera, useFollowCamera } from './camera.js';
import {
  spawnChipBurst,
  spawnConfetti,
  spawnMineExplosion,
  flashVignette,
  pulseTableRim,
  triggerScreenShake,
  showBoomFlash,
} from './fx.js';
import { ADJACENT, inBounds, formatMoney, pickRandom } from './helpers.js';

const SILLY_MINE_LINES = [
  '💥 QUACKPLOSION!',
  '🦆 DUCK DOWN!',
  'FEATHERS EVERYWHERE!',
  'RUBBER DUCK MEETS TRAP!',
  '🎰 HOUSE WINS (LOUDLY)',
  'THAT’S A BAD BEAT!',
] as const;

function chipPayout(): number {
  return Math.round(COIN_VALUE * state.multiplier * TABLE_STAKES[state.tableRisk].payoutMult);
}

function distToCage(col: number, row: number): number {
  return Math.abs(col - state.exitCol) + Math.abs(row - state.exitRow);
}

function canAct(): boolean {
  return (
    state.gameState === 'playing' &&
    !state.duckMoving &&
    !state.deathAnim &&
    !state.mineKaboom &&
    !state.cashingOut &&
    !!state.duck
  );
}

export function canCashOut(): boolean {
  return canAct();
}

function endStats(reason: EndStats['reason']): EndStats {
  return {
    coins: state.coins,
    round: state.roundIdx + 1,
    multiplier: state.multiplier,
    lives: state.lives,
    reason,
  };
}

function showBusted(reason: EndStats['reason'], delayMs: number): void {
  state.gameState = 'dead';
  setTimeout(() => showEndOverlay('💀 BUSTED', endStats(reason), 'Rebuy'), delayMs);
}

function resetHandPowerUps(): void {
  state.shieldActive = false;
  state.magnetActive = false;
  state.magnetTimer = 0;
  state.scanActive = false;
  state.scanTimer = 0;
  state.purchasedItems.clear();
  updateBadges();
}

function resetHandFlags(): void {
  state.queuedDirection = null;
  state.duckMoving = false;
  state.bouncing = false;
  state.bounceT = 0;
  state.deathAnim = false;
  state.deathT = 0;
  state.duckFacing = 0;
  state.coffeeTriggered = false;
  state.lastTickWall = 0;
  state.tickInterval = 2.0;
  state.lastBigCount = -1;
  state.coinStreak = 0;
  state.nearCageShown = false;
  state.mineKaboom = false;
  state.mineKaboomT = 0;
  state.cashingOut = false;
}

function placeDuckAt(col: number, row: number): void {
  if (!state.duck) return;
  const wp = gridToWorld(col, row);
  state.duckPos = { col, row };
  state.duck.position.set(wp.x, 0, wp.z);
  state.duck.rotation.set(0, 0, 0);
  state.duck.scale.setScalar(state.duckBaseScale);
  state.duckCurrentWorld.copy(state.duck.position);
  state.duckTargetWorld.copy(state.duck.position);
  if (useFollowCamera()) resetFollowCamera(wp.x, wp.z);
}

function triggerMineKaboom(col: number, row: number, lethal: boolean): void {
  const wp = gridToWorld(col, row);
  spawnMineExplosion(state.scene, wp.x, wp.z, lethal);
  playMineExplosion(lethal);
  flashVignette('mine');
  triggerScreenShake(lethal ? 0.55 : 0.3, lethal ? 0.5 : 0.35);
  showBoomFlash();
  state.mineKaboom = true;
  state.mineKaboomT = 0;
  state.bouncing = false;
}

function collectChip(col: number, row: number, amount: number): void {
  state.coins += amount;
  state.coinStreak++;
  updateHUD();
  removeCoin(col, row);
  flashTile(col, row, C.gold);
  const wp = gridToWorld(col, row);
  spawnChipBurst(state.scene, wp.x, wp.z);
  playSlotCollect(state.coinStreak);
  showToast('+' + formatMoney(amount), C.gold);
  if (state.coinStreak > 0 && state.coinStreak % COMBO_BONUS_EVERY === 0) {
    state.coins += COMBO_CHIP_BONUS * state.multiplier;
    updateHUD();
    showToast('🔥 ON A ROLL! +' + formatMoney(COMBO_CHIP_BONUS * state.multiplier), C.teal);
    pulseTableRim();
  }
}

function collectMagnetAdjacent(col: number, row: number, payout: number): void {
  for (const [dc, dr] of ADJACENT) {
    const nc = col + dc;
    const nr = row + dr;
    if (inBounds(nc, nr) && state.grid[nr][nc] === TILE.COIN) {
      state.grid[nr][nc] = TILE.EMPTY;
      collectChip(nc, nr, payout);
    }
  }
}

function handleMine(col: number, row: number): void {
  state.coinStreak = 0;
  state.grid[row][col] = TILE.REVEALED_MINE;
  if (state.shieldActive) {
    state.shieldActive = false;
    updateBadges();
    triggerMineKaboom(col, row, false);
    flashTile(col, row, C.purple, 900);
    showToast('🛡 INSURANCE TOOK THE BLAST!', C.purple);
    return;
  }
  triggerMineKaboom(col, row, true);
  flashTile(col, row, C.red, 1000);
  showToast(pickRandom(SILLY_MINE_LINES), C.red);
  loseBuyIn();
}

function handlePowerUp(col: number, row: number): void {
  state.grid[row][col] = TILE.EMPTY;
  state.multiplier = Math.min(state.multiplier * POWERUP_MULTI, 8);
  updateHUD();
  removePickup(col, row);
  flashTile(col, row, C.purple, 500);
  showToast('🔥 HOT STREAK ×' + state.multiplier + '!', C.purple);
  playSlotCollect(0);
  pulseTableRim();
}

function handleWildCard(col: number, row: number, payout: number): void {
  state.grid[row][col] = TILE.EMPTY;
  removePickup(col, row);
  if (Math.random() < 0.5) {
    state.coins += payout * 3;
    state.coinStreak++;
    updateHUD();
    flashTile(col, row, C.teal, 600);
    showToast('🃏 LUCKY DRAW! +' + formatMoney(payout * 3), C.teal);
    playSlotCollect(state.coinStreak);
    return;
  }
  state.coinStreak = 0;
  flashTile(col, row, C.red, 600);
  showToast('🃏 BUST CARD — −1 buy-in', C.red);
  triggerMineKaboom(col, row, false);
  loseBuyIn(false);
}

export function startRound(): void {
  if (!state.duck) return;
  resetHandFlags();
  resetHandPowerUps();
  state.timeLeft = ROUND_TIME;

  const ante = TABLE_STAKES[state.tableRisk].ante;
  state.coins = Math.max(0, state.coins - ante);

  buildGrid();
  placeDuckAt(0, 0);
  updateHUD();
  updateTimerHUD();
  $('hud-round').textContent = String(state.roundIdx + 1);

  const hand = state.roundIdx + 1;
  playDeal();
  showToast('🎴 Hand ' + hand + ' — ante ' + formatMoney(ante), C.gold);

  if (state.roundIdx === 0) {
    setTimeout(
      () => { if (state.gameState === 'playing' && !state.cashingOut) showToast('📡 Surveillance online', C.teal); },
      900
    );
  }
}

export function nextRound(): void {
  state.roundIdx++;
  if (state.roundIdx >= ROUNDS.length) {
    state.gameState = 'win';
    playJackpot();
    flashVignette('jackpot');
    const wp = gridToWorld(state.exitCol, state.exitRow);
    spawnConfetti(state.scene, wp.x, wp.z);
    showEndOverlay('🎰 CASHED OUT!', endStats('win'), 'Play Again');
    return;
  }
  showToast('🃏 Dealing hand ' + (state.roundIdx + 1) + '…', C.gold);
  document.body.classList.add('deal-flash');
  setTimeout(() => document.body.classList.remove('deal-flash'), 400);
  setTimeout(startRound, 1200);
}

export function endTimeout(): void {
  state.gameState = 'dead';
  state.queuedDirection = null;
  showEndOverlay('⏰ TABLE CLOSED', endStats('timeout'), 'Rebuy');
}

export function performCashOut(fromCol: number, fromRow: number): void {
  if (state.gameState !== 'playing' || state.cashingOut) return;
  state.cashingOut = true;
  state.queuedDirection = null;
  state.duckMoving = false;

  const atCage = fromCol === state.exitCol && fromRow === state.exitRow;
  const bonus = Math.round(state.timeLeft * 50 * state.multiplier * (atCage ? 1 : 0.65));
  state.coins += bonus;
  updateHUD();
  flashTile(fromCol, fromRow, C.gold, 600);
  if (!atCage) flashTile(state.exitCol, state.exitRow, C.gold, 400);
  playJackpot();
  flashVignette('win');
  const wp = gridToWorld(fromCol, fromRow);
  spawnConfetti(state.scene, wp.x, wp.z);
  showToast(
    atCage
      ? '🏛 CASHED OUT! +' + formatMoney(bonus)
      : '🏛 EARLY CASH OUT +' + formatMoney(bonus) + ' (65% clock bonus)',
    C.gold
  );
  setTimeout(() => {
    nextRound();
  }, 900);
}

export function cashOut(): void {
  if (!canCashOut() || !state.duck) return;
  performCashOut(state.duckPos.col, state.duckPos.row);
}

export function tryMove(dir: Direction): void {
  const duck = state.duck;
  if (state.gameState !== 'playing' || state.deathAnim || state.cashingOut || state.mineKaboom) return;
  if (state.duckMoving) {
    state.queuedDirection = dir;
    return;
  }
  if (!canAct() || !duck) return;
  const [dc, dr] = DIR_D[dir];
  const nc = state.duckPos.col + dc;
  const nr = state.duckPos.row + dr;
  if (!inBounds(nc, nr)) return;
  state.duckFacing = Math.atan2(dc, dr);
  state.duckPos.col = nc;
  state.duckPos.row = nr;
  const wp = gridToWorld(nc, nr);
  state.duckTargetWorld.set(wp.x, duck.position.y, wp.z);
  state.duckMoving = true;
  state.bouncing = true;
  state.bounceT = 0;
}

export function landOn(col: number, row: number): void {
  const tile = state.grid[row][col];
  const payout = chipPayout();

  if (!state.nearCageShown && distToCage(col, row) <= 2 && tile !== TILE.EXIT) {
    state.nearCageShown = true;
    showToast('🏛 VIP cage is close — cash out!', C.neon);
  }

  if (state.magnetActive) collectMagnetAdjacent(col, row, payout);

  switch (tile) {
    case TILE.COIN:
      state.grid[row][col] = TILE.EMPTY;
      collectChip(col, row, payout);
      break;
    case TILE.MINE:
      handleMine(col, row);
      break;
    case TILE.POWERUP:
      handlePowerUp(col, row);
      break;
    case TILE.WILDCARD:
      handleWildCard(col, row, payout);
      break;
    case TILE.EXIT:
      performCashOut(col, row);
      break;
    default:
      break;
  }
}

/** Lose one buy-in; optional instant bust without duck death animation. */
export function loseBuyIn(withDeathAnim = true): void {
  state.queuedDirection = null;
  state.lives = Math.max(0, state.lives - 1);
  state.coinStreak = 0;
  updateHUD();

  if (state.lives <= 0) {
    if (withDeathAnim) {
      state.deathAnim = true;
      state.deathT = 0;
      showBusted('mines', 1200);
    } else {
      showBusted('mines', 600);
    }
    return;
  }

  if (!withDeathAnim) return;

  state.deathAnim = true;
  state.deathT = 0;
  state.multiplier = 1;
  updateHUD();
  showToast('Buy-in remaining — back to seat', C.teal);
  setTimeout(() => {
    if (!state.duck) return;
    placeDuckAt(0, 0);
    state.deathAnim = false;
  }, 900);
}

/** @deprecated Use loseBuyIn() */
export function triggerDeath(): void {
  loseBuyIn(true);
}

/** @deprecated Use loseBuyIn(false) */
export function loseLife(): void {
  loseBuyIn(false);
}
