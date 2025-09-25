import type { PitchRow } from './statcast.types';

type Count = { balls: number; strikes: number };

const BALL_DESCRIPTIONS = new Set([
  'ball',
  'blocked_ball',
  'intent_ball',
  'pitchout',
  'automatic_ball',
]);

const STRIKE_DESCRIPTIONS = new Set([
  'called_strike',
  'swinging_strike',
  'swinging_strike_blocked',
  'foul_tip',
  'missed_bunt',
  'bunt_foul_tip',
]);

const FOUL_DESCRIPTION = 'foul';
const IN_PLAY_DESCRIPTIONS = new Set([
  'hit_into_play',
  'hit_into_play_no_out',
  'hit_into_play_score',
]);

const OUT_EVENTS = new Map<string, number>([
  ['strikeout', 1],
  ['strikeout_double_play', 2],
  ['grounded_into_double_play', 2],
  ['triple_play', 3],
]);

function clampCount(count: Count): Count {
  return {
    balls: Math.min(4, Math.max(0, count.balls)),
    strikes: Math.min(3, Math.max(0, count.strikes)),
  };
}

export function computePostCount(row: PitchRow): Count {
  const count: Count = { balls: row.balls, strikes: row.strikes };
  if (row.type === 'B') {
    if (BALL_DESCRIPTIONS.has(row.description) || row.description.includes('ball')) {
      count.balls = Math.min(4, count.balls + 1);
    }
  } else if (row.type === 'S') {
    if (row.description === FOUL_DESCRIPTION) {
      if (count.strikes < 2) {
        count.strikes += 1;
      }
    } else if (STRIKE_DESCRIPTIONS.has(row.description) || row.description.includes('strike')) {
      count.strikes = Math.min(3, count.strikes + 1);
    }
  } else if (row.type === 'X') {
    if (IN_PLAY_DESCRIPTIONS.has(row.description) || row.description.includes('in_play')) {
      // count unchanged, at-bat likely ends
    }
  }

  if (row.description === 'hit_by_pitch') {
    count.balls = 4;
  }

  if (row.description === 'intent_walk') {
    count.balls = 4;
  }

  return clampCount(count);
}

export function computeOutsAfter(row: PitchRow, nextRow?: PitchRow): number {
  const baseOuts = nextRow ? nextRow.outs_when_up : row.outs_when_up;

  if (!nextRow) {
    if (row.events) {
      const delta = OUT_EVENTS.get(row.events) ?? (row.events.includes('out') ? 1 : 0);
      return row.outs_when_up + delta;
    }
  }

  if (nextRow && nextRow.at_bat_number === row.at_bat_number) {
    return nextRow.outs_when_up;
  }

  if (row.events) {
    const delta = OUT_EVENTS.get(row.events) ?? (row.events.includes('out') ? 1 : 0);
    return row.outs_when_up + delta;
  }

  return baseOuts;
}

export function isEndOfAtBat(row: PitchRow, nextRow?: PitchRow): boolean {
  if (!nextRow) {
    return true;
  }
  return nextRow.at_bat_number !== row.at_bat_number;
}
