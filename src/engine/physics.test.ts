import { describe, expect, it } from 'vitest';
import { sampleTrajectory, timeToPlate } from './physics';
import { PitchRow } from './statcast.types';

describe('timeToPlate', () => {
  it('computes closed form solution for downward trajectory', () => {
    const y0 = 55;
    const vy0 = -140;
    const ay = 32;
    const t = timeToPlate(y0, vy0, ay);
    const y = y0 + vy0 * t + 0.5 * ay * t * t;
    expect(Math.abs(y)).toBeLessThan(1e-6);
    expect(t).toBeGreaterThan(0);
  });

  it('falls back to linear solution when ay is tiny', () => {
    const t = timeToPlate(55, -140, 0.00000001);
    expect(t).toBeCloseTo(55 / 140, 3);
  });
});

describe('sampleTrajectory', () => {
  const row: PitchRow = {
    game_date: '2024-04-01',
    game_pk: 1,
    at_bat_number: 1,
    pitch_number: 1,
    pitch_type: 'FF',
    release_speed: 95,
    release_pos_x: -1,
    release_pos_y: 55,
    release_pos_z: 6,
    vx0: 5,
    vy0: -140,
    vz0: 2,
    ax: -10,
    ay: 32,
    az: -25,
    plate_x: 0,
    plate_z: 3,
    sz_top: 3.5,
    sz_bot: 1.6,
    balls: 0,
    strikes: 0,
    outs_when_up: 0,
    inning: 1,
    inning_topbot: 'Top',
    home_team: 'HOM',
    away_team: 'AWY',
    home_score: 0,
    away_score: 0,
    type: 'S',
    description: 'called_strike',
    player_name: 'Pitcher',
    batter: 123,
    pitcher: 456
  };

  it('generates trajectory samples until plate', () => {
    const samples = sampleTrajectory(row);
    expect(samples.length).toBeGreaterThan(10);
    const last = samples[samples.length - 1];
    expect(Math.abs(last.y)).toBeLessThan(0.05);
  });
});
