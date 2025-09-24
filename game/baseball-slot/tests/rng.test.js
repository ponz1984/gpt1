import test from 'node:test';
import assert from 'node:assert/strict';
import { spinReels, SYMBOLS } from '../main.js';

test('symbol distribution stays within tolerance', () => {
  const spins = 10_000;
  const counts = new Map(SYMBOLS.map((symbol) => [symbol.key, 0]));

  for (let i = 0; i < spins; i += 1) {
    const results = spinReels();
    results.forEach((symbol) => {
      counts.set(symbol, counts.get(symbol) + 1);
    });
  }

  const totalSymbols = spins * 3;
  const expectedRate = 1 / SYMBOLS.length;
  const tolerance = 0.03; // ±3%

  counts.forEach((value) => {
    const rate = value / totalSymbols;
    const diff = Math.abs(rate - expectedRate);
    assert.ok(
      diff <= tolerance,
      `symbol rate ${rate.toFixed(3)} differs from expected ${(expectedRate).toFixed(3)}`
    );
  });
});
