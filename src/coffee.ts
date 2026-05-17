import { ROUND_TIME, COFFEE_STIPEND, COFFEE_MIN_BUDGET, C } from './constants.js';
import type { ShopItem } from './types.js';
import { $ } from './dom.js';
import { state } from './state.js';
import { revealMines, clearMines } from './grid.js';
import { playJingle } from './audio.js';
import { updateHUD, updateTimerHUD, updateBadges, showToast } from './hud.js';
import { formatMoney } from './helpers.js';

export const SHOP: readonly ShopItem[] = [
  {
    id: 'scan',
    icon: '📡',
    name: 'Pit Scan',
    desc: 'Surveillance reveals traps for 8s',
    cost: 300,
  },
  {
    id: 'shield',
    icon: '🛡',
    name: 'Insurance',
    desc: 'Next trap hit — no buy-in lost',
    cost: 400,
  },
  {
    id: 'magnet',
    icon: '🧲',
    name: 'Chip Rake',
    desc: 'Vacuums adjacent chips for 10s',
    cost: 200,
  },
  { id: 'time', icon: '⏱', name: '+15 on Clock', desc: 'Table grants 15 extra seconds', cost: 350 },
  { id: 'clear', icon: '💣', name: 'Trap Removal', desc: 'House clears 2 random traps', cost: 500 },
  {
    id: 'double',
    icon: '🎲',
    name: 'Double Down',
    desc: '50/50 — double stack or lose half',
    cost: 0,
    free: true,
  },
];

type ShopHandler = (item: ShopItem) => void;

const SHOP_HANDLERS: Record<ShopItem['id'], ShopHandler> = {
  scan: () => {
    state.scanActive = true;
    state.scanTimer = 8;
    revealMines(true);
    updateBadges();
    showToast('📡 Pit scan live!', 0xff8800);
  },
  shield: () => {
    state.shieldActive = true;
    updateBadges();
    showToast('🛡 Insurance armed!', C.purple);
  },
  magnet: () => {
    state.magnetActive = true;
    state.magnetTimer = 10;
    updateBadges();
    showToast('🧲 Chip rake on!', C.teal);
  },
  time: () => {
    state.timeLeft = Math.min(state.timeLeft + 15, ROUND_TIME);
    updateTimerHUD();
    showToast('⏱ +15 on the clock!', C.gold);
  },
  clear: () => {
    clearMines(2);
    showToast('💣 Traps cleared!', C.green);
  },
  double: () => {
    if (state.coins <= 0) {
      state.timeLeft = Math.min(state.timeLeft + 10, ROUND_TIME);
      updateTimerHUD();
      showToast('🎲 Push — +10 seconds!', C.gold);
      return;
    }
    if (Math.random() < 0.5) {
      state.coins = Math.floor(state.coins * 2);
      showToast('🎲 DOUBLE DOWN! 🤑', C.gold);
    } else {
      state.coins = Math.floor(state.coins * 0.5);
      showToast('🎲 HOUSE WINS HALF', C.red);
    }
    updateHUD();
  },
};

function refreshBudget(): void {
  $('cb-budget').textContent = formatMoney(state.coins);
}

export function openCoffee(): void {
  state.gameState = 'coffee';
  playJingle();
  state.purchasedItems.clear();

  const brokeTip = $('coffee-broke-tip');
  if (state.coins < COFFEE_MIN_BUDGET) {
    state.coins += COFFEE_STIPEND;
    updateHUD();
    brokeTip.textContent =
      '☕ Complimentary ' + formatMoney(COFFEE_STIPEND) + ' house chips — pick a lounge perk!';
    brokeTip.classList.remove('hidden');
    showToast('☕ House chips ' + formatMoney(COFFEE_STIPEND) + '!', C.gold);
  } else {
    brokeTip.classList.add('hidden');
  }

  renderShop();
  refreshBudget();
  $('coffee-wrap').classList.add('show');
}

export function renderShop(): void {
  const g = $('shop-grid');
  g.innerHTML = '';
  SHOP.forEach((item) => {
    const bought = state.purchasedItems.has(item.id);
    const cantAfford = !item.free && state.coins < item.cost;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shop-item' + (bought ? ' purchased' : cantAfford ? ' disabled' : '');
    btn.disabled = bought || cantAfford;
    btn.setAttribute(
      'aria-label',
      item.name + (bought ? ', purchased' : cantAfford ? ', not enough chips' : '')
    );
    btn.innerHTML =
      '<span class="item-icon" aria-hidden="true">' +
      item.icon +
      '</span><span class="item-name">' +
      item.name +
      '</span><span class="item-desc">' +
      item.desc +
      '</span><span class="item-cost' +
      (item.free ? ' free-tag' : '') +
      '">' +
      (bought ? '✓ Claimed' : item.free ? 'FREE' : formatMoney(item.cost)) +
      '</span>';
    if (!bought && !cantAfford) btn.addEventListener('click', () => buyItem(item));
    g.appendChild(btn);
  });
  refreshBudget();
}

export function buyItem(item: ShopItem): void {
  if (state.purchasedItems.has(item.id)) return;
  if (!item.free && state.coins < item.cost) return;
  if (!item.free) {
    state.coins -= item.cost;
    updateHUD();
  }
  state.purchasedItems.add(item.id);
  SHOP_HANDLERS[item.id](item);
  renderShop();
}

export function initCoffeeUI(): void {
  $('coffee-resume').addEventListener('click', () => {
    $('coffee-wrap').classList.remove('show');
    state.gameState = 'playing';
    if (state.scanActive) revealMines(true);
  });
}
