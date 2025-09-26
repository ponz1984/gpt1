import { describe, expect, it } from 'vitest';
import { getPositionAtTime, sampleTrajectory, timeToPlate } from './physics';
import type { PitchRow } from './statcast.types';

const baseRow: PitchRow = {
  game_date: '2024-01-01',
  game_pk: 1,
  at_bat_number: 1,
  pitch_number: 1,
  pitch_type: 'FF',
  pitch_name: 'Four-Seam',
  release_speed: 95,
  release_pos_x: -1,
  release_pos_y: 54,
  release_pos_z: 6,
  vx0: -5,
  vy0: -130,
  vz0: 5,
  ax: 10,
  ay: 25,
  az: -30,
  plate_x: 0,
  plate_z: 2.5,
  sz_top: 3.5,
  sz_bot: 1.5,
  balls: 0,
  strikes: 0,
  outs_when_up: 0,
  inning: 1,
  inning_topbot: 'Top',
  home_team: 'H',
  away_team: 'A',
  home_score: 0,
  away_score: 0,
  type: 'S',
  description: 'called_strike',
  player_name: 'Test Pitcher',
  batter: 1,
  pitcher: 2,
};

describe('timeToPlate', () => {
  it('solves quadratic for realistic inputs', () => {
    const t = timeToPlate(baseRow.release_pos_y, baseRow.vy0, baseRow.ay);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(1);
  });

  it('handles zero acceleration', () => {
    const t = timeToPlate(54, -130, 0);
    expect(t).toBeCloseTo(54 / 130, 3);
  });
});

describe('sampleTrajectory', () => {
  it('samples positions including plate crossing', () => {
    const samples = sampleTrajectory(baseRow, 1 / 120);
    expect(samples.length).toBeGreaterThan(10);
    const last = samples[samples.length - 1];
    expect(last.y).toBeLessThan(0.01);
  });

  it('interpolates positions at a given time', () => {
    const samples = sampleTrajectory(baseRow, 1 / 120);
    const t = samples[Math.floor(samples.length / 2)].t;
    const interp = getPositionAtTime(samples, t);
    expect(interp.t).toBeCloseTo(t, 6);
  });
});
