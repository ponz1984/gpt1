/**
 * Baseball themed slot machine demo.
 * Provides game logic, RNG utilities, and browser interactions.
 * @module baseballSlot
 */

export const SYMBOLS = [
  { key: 'ball', label: 'ボール', src: 'assets/ball.svg', multiplier: 5 },
  { key: 'bat', label: 'バット', src: 'assets/bat.svg', multiplier: 8 },
  { key: 'glove', label: 'グローブ', src: 'assets/glove.svg', multiplier: 12 },
  { key: 'cap', label: 'キャップ', src: 'assets/cap.svg', multiplier: 20 },
  { key: 'trophy', label: 'トロフィー', src: 'assets/trophy.svg', multiplier: 50 }
];

export const START_BALANCE = 1000;
export const MIN_BET = 5;
export const MAX_BET = 50;
export const BET_STEP = 5;
export const DEFAULT_BET = 10;

/**
 * Returns a random integer between 0 (inclusive) and max (exclusive).
 * Prefers crypto.getRandomValues when available.
 * @param {number} max
 * @param {() => number} [fallbackRandom=Math.random] - Function returning a float in [0,1).
 * @returns {number}
 */
export function getRandomInt(max, fallbackRandom = Math.random) {
  if (max <= 0) {
    throw new Error('max must be positive');
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(fallbackRandom() * max);
}

/**
 * Generates a random symbol key.
 * @param {() => number} [fallbackRandom=Math.random]
 * @returns {string}
 */
export function getRandomSymbol(fallbackRandom = Math.random) {
  const index = getRandomInt(SYMBOLS.length, fallbackRandom);
  return SYMBOLS[index].key;
}

/**
 * Produces an array of random symbol keys representing a spin result.
 * @param {() => number} [fallbackRandom=Math.random]
 * @returns {string[]}
 */
export function spinReels(fallbackRandom = Math.random) {
  return [
    getRandomSymbol(fallbackRandom),
    getRandomSymbol(fallbackRandom),
    getRandomSymbol(fallbackRandom)
  ];
}

/**
 * Calculates payout for a given spin result and bet size.
 * @param {string[]} symbols - Array of three symbol keys.
 * @param {number} bet - Current bet amount.
 * @returns {{ payout: number, multiplier: number }}
 */
export function calculatePayout(symbols, bet) {
  if (!Array.isArray(symbols) || symbols.length !== 3) {
    throw new Error('symbols must contain three entries');
  }
  if (bet <= 0) {
    return { payout: 0, multiplier: 0 };
  }
  const [a, b, c] = symbols;
  if (a === b && b === c) {
    const symbol = SYMBOLS.find((s) => s.key === a);
    const multiplier = symbol ? symbol.multiplier : 0;
    return { payout: bet * multiplier, multiplier };
  }
  if (a === b || a === c || b === c) {
    return { payout: bet, multiplier: 1 };
  }
  return { payout: 0, multiplier: 0 };
}

/**
 * Formats numbers with comma separators.
 * @param {number} value
 * @returns {string}
 */
export function formatCredits(value) {
  return new Intl.NumberFormat('ja-JP').format(Math.floor(value));
}

/**
 * Clamps bet values to the allowed range.
 * @param {number} value
 * @returns {number}
 */
export function normalizeBet(value) {
  const clamped = Math.min(Math.max(value, MIN_BET), MAX_BET);
  const remainder = clamped % BET_STEP;
  return clamped - remainder + (remainder >= BET_STEP / 2 ? BET_STEP : 0);
}

function safeLocalStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch (error) {
    console.warn('localStorage unavailable', error);
  }
  return null;
}

/**
 * Initializes browser interactions when DOM is available.
 */
function setupBrowserGame() {
  const balanceEl = document.getElementById('balance');
  const betEl = document.getElementById('bet');
  const lastWinEl = document.getElementById('last-win');
  const highScoreEl = document.getElementById('high-score');
  const spinBtn = document.getElementById('spin');
  const betDecreaseBtn = document.getElementById('bet-decrease');
  const betIncreaseBtn = document.getElementById('bet-increase');
  const soundToggle = document.getElementById('sound-toggle');
  const payoutToggle = document.getElementById('payout-toggle');
  const payoutDialog = document.getElementById('payout-dialog');
  const payoutClose = document.getElementById('payout-close');
  const reels = [0, 1, 2].map((index) => document.getElementById(`reel-${index}`));
  const reelContainers = Array.from(document.querySelectorAll('.reel'));

  let balance = START_BALANCE;
  let bet = DEFAULT_BET;
  let lastWin = 0;
  let highScore = START_BALANCE;
  let spinning = false;
  let soundEnabled = false;

  const storage = safeLocalStorage();
  if (storage) {
    const storedScore = storage.getItem('baseball-slot-high-score');
    if (storedScore) {
      const parsed = Number(storedScore);
      if (!Number.isNaN(parsed) && parsed > highScore) {
        highScore = parsed;
      }
    }
  }

  /**
   * Plays a short beep when sound is enabled.
   */
  function playSound() {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    oscillator.addEventListener('ended', () => context.close());
  }

  function updateStatus() {
    balanceEl.textContent = formatCredits(balance);
    betEl.textContent = formatCredits(bet);
    lastWinEl.textContent = formatCredits(lastWin);
    highScoreEl.textContent = formatCredits(highScore);
  }

  function refreshReels(symbols) {
    symbols.forEach((symbolKey, index) => {
      const meta = SYMBOLS.find((item) => item.key === symbolKey);
      const reelImg = reels[index];
      if (meta && reelImg) {
        reelImg.src = meta.src;
        reelImg.alt = meta.label;
        reelImg.setAttribute('aria-label', meta.label);
      }
    });
  }

  function startSpinAnimation() {
    reelContainers.forEach((el) => {
      el.classList.remove('stopping');
      el.classList.add('spinning');
    });
  }

  function stopSpinAnimation() {
    reelContainers.forEach((el) => {
      el.classList.remove('spinning');
      el.classList.add('stopping');
      window.setTimeout(() => el.classList.remove('stopping'), 400);
    });
  }

  function updateHighScore() {
    if (balance > highScore) {
      highScore = balance;
      if (storage) {
        storage.setItem('baseball-slot-high-score', String(highScore));
      }
    }
  }

  function applyBetChange(delta) {
    bet = normalizeBet(bet + delta);
    updateStatus();
  }

  function handleSpin() {
    if (spinning) return;
    if (balance < bet) {
      lastWin = 0;
      updateStatus();
      spinBtn.classList.add('shake');
      window.setTimeout(() => spinBtn.classList.remove('shake'), 500);
      return;
    }
    spinning = true;
    spinBtn.disabled = true;
    startSpinAnimation();
    balance -= bet;
    updateStatus();

    const result = spinReels();
    const { payout } = calculatePayout(result, bet);

    window.setTimeout(() => {
      refreshReels(result);
      stopSpinAnimation();
      lastWin = payout;
      balance += payout;
      updateHighScore();
      if (payout > 0) {
        playSound();
      }
      updateStatus();
      spinning = false;
      spinBtn.disabled = false;
    }, 700);
  }

  spinBtn.addEventListener('click', handleSpin);
  betDecreaseBtn.addEventListener('click', () => applyBetChange(-BET_STEP));
  betIncreaseBtn.addEventListener('click', () => applyBetChange(BET_STEP));

  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? 'サウンド ON' : 'サウンド OFF';
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.setAttribute('aria-label', soundEnabled ? 'サウンドをオフにする' : 'サウンドをオンにする');
  });

  payoutToggle.addEventListener('click', () => {
    payoutToggle.setAttribute('aria-expanded', 'true');
    if (typeof payoutDialog.showModal === 'function') {
      payoutDialog.showModal();
    }
  });

  payoutClose.addEventListener('click', () => {
    payoutToggle.setAttribute('aria-expanded', 'false');
    payoutDialog.close();
  });

  payoutDialog.addEventListener('cancel', () => {
    payoutToggle.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      handleSpin();
    } else if (event.code === 'ArrowUp') {
      event.preventDefault();
      applyBetChange(BET_STEP);
    } else if (event.code === 'ArrowDown') {
      event.preventDefault();
      applyBetChange(-BET_STEP);
    }
  });

  updateStatus();
  refreshReels(['ball', 'bat', 'glove']);
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setupBrowserGame, { once: true });
}

export default {
  SYMBOLS,
  START_BALANCE,
  MIN_BET,
  MAX_BET,
  BET_STEP,
  DEFAULT_BET,
  getRandomInt,
  getRandomSymbol,
  spinReels,
  calculatePayout,
  formatCredits,
  normalizeBet
};
