import { describe, expect, it } from 'vitest';
import { deriveOutsAfter, derivePostCount } from './count';
import type { PitchRow } from './statcast.types';

function createRow(overrides: Partial<PitchRow> = {}): PitchRow {
  return {
    game_date: '2023-04-01',
    game_pk: 1,
    at_bat_number: 1,
    pitch_number: 1,
    pitch_type: 'FF',
    pitch_name: 'Four-Seam',
    release_speed: 95,
    release_pos_x: 0,
    release_pos_y: 54,
    release_pos_z: 6,
    vx0: 0,
    vy0: -130,
    vz0: 0,
    ax: 0,
    ay: 32,
    az: 0,
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
    away_team: 'NYY',
    home_score: 0,
    away_score: 0,
    post_home_score: undefined,
    post_away_score: undefined,
    type: 'X',
    description: 'hit_into_play',
    events: undefined,
    player_name: 'Pitcher A',
    batter: 100,
    pitcher: 200,
    ...overrides,
  };
}

describe('derivePostCount', () => {
  it('uses next pitch counts when available', () => {
    const current = createRow({ balls: 2, strikes: 1 });
    const next = createRow({ balls: 3, strikes: 1, pitch_number: 2 });
    const result = derivePostCount(current, next);
    expect(result).toEqual({ balls: 3, strikes: 1, isAtBatEnd: false });
  });

  it('applies foul rule at two strikes', () => {
    const foul = createRow({
      balls: 1,
      strikes: 2,
      type: 'S',
      description: 'foul',
    });
    const result = derivePostCount(foul, undefined);
    expect(result.strikes).toBe(2);
    expect(result.isAtBatEnd).toBe(false);
  });

  it('treats pitch timer violations on the batter as strikes', () => {
    const violation = createRow({
      balls: 1,
      strikes: 1,
      type: 'S',
      description: 'pitch_timer_violation_on_batter',
    });
    const result = derivePostCount(violation, undefined);
    expect(result.strikes).toBe(2);
    expect(result.isAtBatEnd).toBe(false);
  });

  it('marks catcher interference as at-bat ending when no next row is present', () => {
    const interference = createRow({
      balls: 2,
      strikes: 1,
      type: 'B',
      description: 'ball',
      events: 'catcher_interference',
    });
    const result = derivePostCount(interference, undefined);
    expect(result.isAtBatEnd).toBe(true);
  });
});

describe('deriveOutsAfter', () => {
  it('does not change outs mid-plate appearance', () => {
    const row = createRow({ outs_when_up: 1 });
    const result = deriveOutsAfter(row, 1, { isLastPitchOfAtBat: false });
    expect(result).toBe(1);
  });

  it('keeps outs the same on a single', () => {
    const row = createRow({ events: 'single', outs_when_up: 1 });
    const result = deriveOutsAfter(row, 1, { isLastPitchOfAtBat: true });
    expect(result).toBe(1);
  });

  it('adds one out on a strikeout', () => {
    const row = createRow({
      type: 'S',
      description: 'swinging_strike',
      events: 'strikeout',
      outs_when_up: 1,
    });
    const result = deriveOutsAfter(row, 1, { isLastPitchOfAtBat: true });
    expect(result).toBe(2);
  });

  it('adds two outs on a double play and caps at three', () => {
    const row = createRow({ events: 'grounded_into_double_play', outs_when_up: 1 });
    const result = deriveOutsAfter(row, 1, { isLastPitchOfAtBat: true });
    expect(result).toBe(3);
  });

  it('defers to next at-bat outs_when_up when provided', () => {
    const row = createRow({ events: 'strikeout', outs_when_up: 2 });
    const nextAtBat = createRow({ outs_when_up: 0, at_bat_number: 2 });
    const result = deriveOutsAfter(row, 2, {
      isLastPitchOfAtBat: true,
      nextAtBatFirst: nextAtBat,
    });
    expect(result).toBe(0);
  });
});
