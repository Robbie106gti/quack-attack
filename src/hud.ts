import { ROUND_TIME, TABLE_STAKES, TILE } from './constants.js';
import type { TableRisk } from './types.js';
import { $ } from './dom.js';
import { state } from './state.js';
import { formatMoney, ADJACENT, inBounds } from './helpers.js';

function personalBest(score = 0): number {
  try {
    const key = 'quack-attack:best:' + state.tableRisk;
    const saved = Number(localStorage.getItem(key));
    const best = Math.max(Number.isSafeInteger(saved) && saved >= 0 ? saved : 0, score);
    if (score > 0) localStorage.setItem(key, String(best));
    return best;
  } catch {
    return score;
  }
}

export function updateRadar(): void {
  if (!state.grid.length || state.duckMoving) return;
  const { col, row } = state.duckPos;
  const count = ADJACENT.filter(([dc, dr]) =>
    inBounds(col + dc, row + dr) && state.grid[row + dr][col + dc] === TILE.MINE
  ).length;
  const radar = $('trap-radar');
  const label = 'Adjacent traps: ' + count;
  if (radar.textContent !== label) radar.textContent = label;
  radar.classList.toggle('danger', count > 0);
}

const CASHOUT_IDS = ['cashout-btn', 'hud-cashout'] as const;

export interface EndStats {
  coins: number;
  round: number;
  multiplier: number;
  lives: number;
  reason: 'timeout' | 'mines' | 'win';
}

function renderStatRows(stats: EndStats): string {
  const rows: [string, string][] = [
    ['Cash out', formatMoney(stats.coins)],
    ['Hands played', String(stats.round)],
    ['Final hot streak', '×' + stats.multiplier],
    ['Buy-ins left', String(stats.lives)],
    ['Personal best · ' + TABLE_STAKES[state.tableRisk].label, formatMoney(personalBest(stats.coins))],
  ];
  return rows
    .map(
      ([label, val]) =>
        `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-val">${val}</span></div>`
    )
    .join('');
}

export function initTableStakes(): void {
  const wrap = $('table-stakes');
  wrap.querySelectorAll<HTMLButtonElement>('.stake-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const risk = btn.dataset.risk as TableRisk | undefined;
      if (!risk || !(risk in TABLE_STAKES)) return;
      state.tableRisk = risk;
      wrap.querySelectorAll('.stake-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tag = $('stakes-tag');
      if (tag) tag.textContent = TABLE_STAKES[risk].tag;
    });
  });
}

export function setCashOutEnabled(enabled: boolean): void {
  for (const id of CASHOUT_IDS) {
    ($(id) as HTMLButtonElement).disabled = !enabled;
  }
}

export function updateHUD(): void {
  $('hud-coins').textContent = formatMoney(state.coins);
  const multiEl = $('hud-multi');
  multiEl.textContent = '×' + state.multiplier;
  multiEl.classList.toggle('hot', state.multiplier > 1);
  const chips = '🟡'.repeat(state.lives) + '⚫'.repeat(Math.max(0, 3 - state.lives));
  $('hearts').textContent = chips;
}

export function updateTimerHUD(): void {
  const s = Math.max(0, Math.ceil(state.timeLeft));
  const pct = state.timeLeft / ROUND_TIME;
  const el = $('timer-val');
  const bar = $('timer-bar');
  const wrap = $('timer-wrap');
  el.textContent = String(s);
  bar.style.width = pct * 100 + '%';
  document.body.classList.toggle('timer-urgent', pct <= 0.15 && state.gameState === 'playing');
  if (pct > 0.5) {
    el.style.color = '#fff';
    bar.style.background = '#fff';
    wrap.classList.remove('warn', 'danger');
  } else if (pct > 0.25) {
    el.style.color = '#F5C842';
    bar.style.background = '#F5C842';
    wrap.classList.add('warn');
    wrap.classList.remove('danger');
  } else if (pct > 0.1) {
    el.style.color = '#FF8800';
    bar.style.background = '#FF8800';
    wrap.classList.add('warn', 'danger');
  } else {
    el.style.color = '#FF3347';
    bar.style.background = '#FF3347';
    wrap.classList.add('danger');
  }
}

export function updateBadges(): void {
  $('badge-shield').classList.toggle('active', state.shieldActive);
  $('badge-magnet').classList.toggle('active', state.magnetActive);
  $('badge-scan').classList.toggle('active', state.scanActive);
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(msg: string, color = 0xffffff): void {
  const el = $('toast');
  el.textContent = msg;
  el.style.color = '#' + color.toString(16).padStart(6, '0');
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

export function setGameplayControlsVisible(visible: boolean): void {
  document.body.classList.toggle('game-playing', visible);
  $('controls-dock').classList.toggle('visible', visible);
}

export function showTitleOverlay(): void {
  $('overlay-title').textContent = 'QUACK ATTACK';
  $('overlay-desc').innerHTML =
    'Rake chips on the <strong style="color:#F5C842">felt</strong>, dodge <strong style="color:#FF3347">house traps</strong>, <strong style="color:#FFE066">cash out</strong> at the VIP cage.<br>At 30s the pit boss calls a <strong style="color:#1CE8C0">High Roller Lounge</strong> break.';
  $('overlay-hint').textContent =
    'WASD / arrows to move · C or 🏛 Cash Out to end the hand · d-pad on mobile';
  $('overlay-hint').classList.remove('hidden');
  setGameplayControlsVisible(false);
  $('overlay-stats').classList.add('hidden');
  $('play-btn').textContent = '▶ TAKE A SEAT';
  $('overlay').classList.remove('hidden');
  document.getElementById('table-stakes')?.classList.remove('hidden');
}

export function showEndOverlay(title: string, stats: EndStats, btn: string): void {
  setGameplayControlsVisible(false);
  $('overlay-title').textContent = title;
  const reasonLine =
    stats.reason === 'win'
      ? 'You cleared the floor — cage is paying out!'
      : stats.reason === 'timeout'
        ? 'Table closed — clock ran out.'
        : 'Busted — no buy-ins left.';
  $('overlay-desc').textContent = reasonLine;
  $('overlay-stats').innerHTML = renderStatRows(stats);
  $('overlay-stats').classList.remove('hidden');
  $('overlay-hint').classList.add('hidden');
  $('play-btn').textContent = '▶ ' + btn.toUpperCase();
  $('overlay').classList.remove('hidden');
  document.getElementById('table-stakes')?.classList.add('hidden');
}

export function hideOverlay(): void {
  $('overlay').classList.add('hidden');
}
