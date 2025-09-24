import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePayout, SYMBOLS } from '../main.js';

const bet = 10;

const symbolLookup = Object.fromEntries(SYMBOLS.map((s) => [s.key, s]));

test('three of a kind pays correct multiplier', () => {
  SYMBOLS.forEach((symbol) => {
    const { payout, multiplier } = calculatePayout([symbol.key, symbol.key, symbol.key], bet);
    assert.equal(multiplier, symbol.multiplier);
    assert.equal(payout, bet * symbol.multiplier);
  });
});

test('two of a kind returns bet', () => {
  const { payout, multiplier } = calculatePayout(['ball', 'ball', 'bat'], bet);
  assert.equal(multiplier, 1);
  assert.equal(payout, bet);
});

test('mixed symbols pay zero', () => {
  const { payout, multiplier } = calculatePayout(['ball', 'bat', 'glove'], bet);
  assert.equal(multiplier, 0);
  assert.equal(payout, 0);
});

test('invalid symbol array throws', () => {
  assert.throws(() => calculatePayout(['ball'], bet));
});

test('non-positive bet yields zero payout', () => {
  const { payout, multiplier } = calculatePayout(['ball', 'ball', 'ball'], 0);
  assert.equal(payout, 0);
  assert.equal(multiplier, 0);
});

test('lookup contains all multipliers', () => {
  Object.values(symbolLookup).forEach((symbol) => {
    assert.ok(symbol.multiplier >= 1);
  });
});
