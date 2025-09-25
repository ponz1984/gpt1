import { describe, expect, it } from 'vitest';
import { sampleTrajectory, timeToPlate } from '../physics';

const EPS = 0.01; // 1cm ≈ 0.0328ft, use tolerance

describe('timeToPlate', () => {
  it('solves quadratic root for normal parameters', () => {
    const y0 = 6;
    const vy0 = -140;
    const ay = 32;
    const t = timeToPlate(y0, vy0, ay);
    const y = y0 + vy0 * t + 0.5 * ay * t * t;
    expect(Math.abs(y)).toBeLessThan(EPS);
    expect(t).toBeGreaterThan(0);
  });

  it('handles near-linear path', () => {
    const t = timeToPlate(5, -130, 0.01);
    expect(t).toBeGreaterThan(0);
  });
});

describe('sampleTrajectory', () => {
  it('samples positions until plate crossing', () => {
    const samples = sampleTrajectory({
      game_date: '2024-01-01',
      game_pk: 1,
      at_bat_number: 1,
      pitch_number: 1,
      pitch_type: 'FF',
      release_speed: 95,
      release_pos_x: -2,
      release_pos_y: 6,
      release_pos_z: 55,
      vx0: -5,
      vy0: -140,
      vz0: -5,
      ax: 8,
      ay: 32,
      az: 5,
      plate_x: 0,
      plate_z: 2.5,
      sz_top: 3.5,
      sz_bot: 1.5,
      balls: 0,
      strikes: 0,
      outs_when_up: 0,
      inning: 1,
      inning_topbot: 'Top',
      home_team: 'HOU',
      away_team: 'SEA',
      home_score: 0,
      away_score: 0,
      type: 'S',
      description: 'called_strike',
      player_name: 'Test Pitcher',
      batter: 1,
      pitcher: 2,
      pitch_name: 'Four-Seam Fastball',
      events: undefined,
      post_home_score: 0,
      post_away_score: 0,
      stand: 'R',
      p_throws: 'R',
    });
    expect(samples.length).toBeGreaterThan(10);
    const last = samples[samples.length - 1];
    expect(last.y).toBeLessThanOrEqual(EPS);
  });
});
