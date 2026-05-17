import {
  COLS,
  ROWS,
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

const SILLY_MINE_LINES = [
  '💥 QUACKPLOSION!',
  '🦆 DUCK DOWN!',
  'FEATHERS EVERYWHERE!',
  'RUBBER DUCK MEETS TRAP!',
  '🎰 HOUSE WINS (LOUDLY)',
  'THAT’S A BAD BEAT!',
] as const;

function triggerMineKaboom(col: number, row: number, lethal: boolean): void {
  const wp = gridToWorld(col, row);
  spawnMineExplosion(state.scene, wp.x, wp.z, lethal);
  playMineExplosion(lethal);
  flashVignette('mine');
  triggerScreenShake(lethal ? 0.55 : 0.3, lethal ? 0.5 : 0.35);
  showBoomFlash(wp.x, wp.z);
  state.mineKaboom = true;
  state.mineKaboomT = 0;
  state.bouncing = false;
}

function chipPayout(): number {
  return Math.round(COIN_VALUE * state.multiplier * TABLE_STAKES[state.tableRisk].payoutMult);
}

function distToCage(col: number, row: number): number {
  return Math.abs(col - state.exitCol) + Math.abs(row - state.exitRow);
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
  showToast('+$' + amount.toLocaleString(), C.gold);
  if (state.coinStreak > 0 && state.coinStreak % COMBO_BONUS_EVERY === 0) {
    state.coins += COMBO_CHIP_BONUS * state.multiplier;
    updateHUD();
    showToast('🔥 ON A ROLL! +$' + (COMBO_CHIP_BONUS * state.multiplier), C.teal);
    pulseTableRim();
  }
}

export function startRound(): void {
  if (!state.duck) return;
  state.duckMoving = false;
  state.bouncing = false;
  state.bounceT = 0;
  state.deathAnim = false;
  state.deathT = 0;
  state.duckFacing = 0;
  state.timeLeft = ROUND_TIME;
  state.coffeeTriggered = false;
  state.lastTickWall = 0;
  state.tickInterval = 2.0;
  state.lastBigCount = -1;
  state.shieldActive = false;
  state.magnetActive = false;
  state.magnetTimer = 0;
  state.scanActive = false;
  state.scanTimer = 0;
  state.purchasedItems.clear();
  state.coinStreak = 0;
  state.nearCageShown = false;
  state.mineKaboom = false;
  state.mineKaboomT = 0;
  state.cashingOut = false;
  updateBadges();

  const stakes = TABLE_STAKES[state.tableRisk];
  const ante = stakes.ante;
  state.coins = Math.max(0, state.coins - ante);
  updateHUD();

  state.duckPos = { col: 0, row: 0 };
  buildGrid();
  const wp = gridToWorld(0, 0);
  state.duck.position.set(wp.x, 0, wp.z);
  state.duck.rotation.set(0, 0, 0);
  state.duck.scale.setScalar(state.duckBaseScale);
  state.duckCurrentWorld.copy(state.duck.position);
  state.duckTargetWorld.copy(state.duck.position);
  if (useFollowCamera()) resetFollowCamera(wp.x, wp.z);
  updateHUD();
  updateTimerHUD();
  $('hud-round')!.textContent = String(state.roundIdx + 1);

  const hand = state.roundIdx + 1;
  playDeal();
  showToast('🎴 Hand ' + hand + ' — ante $' + ante, C.gold);

  if (state.roundIdx === 0) {
    setTimeout(
      () =>
        showToast('📡 Surveillance: traps are hidden — watch for red flashes!', C.teal),
      900
    );
  }
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
  showEndOverlay('⏰ TABLE CLOSED', endStats('timeout'), 'Rebuy');
}

export function canCashOut(): boolean {
  return (
    state.gameState === 'playing' &&
    !state.duckMoving &&
    !state.deathAnim &&
    !state.cashingOut &&
    !!state.duck
  );
}

export function performCashOut(fromCol: number, fromRow: number): void {
  if (state.gameState !== 'playing' || state.cashingOut) return;
  state.cashingOut = true;
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
      ? '🏛 CASHED OUT! +$' + bonus.toLocaleString()
      : '🏛 EARLY CASH OUT +$' + bonus.toLocaleString() + ' (65% clock bonus)',
    C.gold
  );
  setTimeout(() => {
    state.cashingOut = false;
    nextRound();
  }, 900);
}

export function cashOut(): void {
  if (!canCashOut()) return;
  performCashOut(state.duckPos.col, state.duckPos.row);
}

export function tryMove(dir: Direction): void {
  if (state.duckMoving || state.gameState !== 'playing' || state.deathAnim || state.cashingOut || !state.duck)
    return;
  const [dc, dr] = DIR_D[dir];
  const nc = state.duckPos.col + dc;
  const nr = state.duckPos.row + dr;
  if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return;
  state.duckFacing = Math.atan2(dc, dr);
  state.duckPos.col = nc;
  state.duckPos.row = nr;
  const wp = gridToWorld(nc, nr);
  state.duckTargetWorld.set(wp.x, state.duck.position.y, wp.z);
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

  if (state.magnetActive) {
    (
      [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const
    ).forEach(([dc, dr]) => {
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && state.grid[nr][nc] === TILE.COIN) {
        state.grid[nr][nc] = TILE.EMPTY;
        collectChip(nc, nr, payout);
      }
    });
  }

  if (tile === TILE.COIN) {
    state.grid[row][col] = TILE.EMPTY;
    collectChip(col, row, payout);
  } else if (tile === TILE.MINE) {
    state.coinStreak = 0;
    state.grid[row][col] = TILE.REVEALED_MINE;
    if (state.shieldActive) {
      state.shieldActive = false;
      updateBadges();
      triggerMineKaboom(col, row, false);
      flashTile(col, row, C.purple, 900);
      showToast('🛡 INSURANCE TOOK THE BLAST!', C.purple);
    } else {
      triggerMineKaboom(col, row, true);
      flashTile(col, row, C.red, 1000);
      showToast(SILLY_MINE_LINES[Math.floor(Math.random() * SILLY_MINE_LINES.length)], C.red);
      triggerDeath();
    }
  } else if (tile === TILE.POWERUP) {
    state.grid[row][col] = TILE.EMPTY;
    state.multiplier = Math.min(state.multiplier * POWERUP_MULTI, 8);
    updateHUD();
    removePickup(col, row);
    flashTile(col, row, C.purple, 500);
    showToast('🔥 HOT STREAK ×' + state.multiplier + '!', C.purple);
    playSlotCollect(0);
    pulseTableRim();
  } else if (tile === TILE.WILDCARD) {
    state.grid[row][col] = TILE.EMPTY;
    removePickup(col, row);
    if (Math.random() < 0.5) {
      state.coins += payout * 3;
      state.coinStreak++;
      updateHUD();
      flashTile(col, row, C.teal, 600);
      showToast('🃏 LUCKY DRAW! +$' + (payout * 3).toLocaleString(), C.teal);
      playSlotCollect(state.coinStreak);
    } else {
      state.coinStreak = 0;
      flashTile(col, row, C.red, 600);
      showToast('🃏 BUST CARD — −1 buy-in', C.red);
      triggerMineKaboom(col, row, false);
      loseLife();
    }
  } else if (tile === TILE.EXIT) {
    performCashOut(col, row);
  }
}

export function triggerDeath(): void {
  state.lives = Math.max(0, state.lives - 1);
  state.coinStreak = 0;
  updateHUD();
  if (state.lives <= 0) {
    state.gameState = 'dead';
    state.deathAnim = true;
    state.deathT = 0;
    setTimeout(
      () => showEndOverlay('💀 BUSTED', endStats('mines'), 'Rebuy'),
      1200
    );
  } else {
    state.deathAnim = true;
    state.deathT = 0;
    state.multiplier = 1;
    updateHUD();
    showToast('Buy-in remaining — back to seat', C.teal);
    setTimeout(() => {
      if (!state.duck) return;
      state.duckPos = { col: 0, row: 0 };
      const wp = gridToWorld(0, 0);
      state.duck.position.set(wp.x, 0, wp.z);
      state.duckCurrentWorld.copy(state.duck.position);
      state.duckTargetWorld.copy(state.duck.position);
      state.deathAnim = false;
    }, 900);
  }
}

export function loseLife(): void {
  state.lives = Math.max(0, state.lives - 1);
  state.coinStreak = 0;
  updateHUD();
  if (state.lives <= 0) {
    state.gameState = 'dead';
    setTimeout(
      () => showEndOverlay('💀 BUSTED', endStats('mines'), 'Rebuy'),
      600
    );
  }
}
