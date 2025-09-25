import Papa from 'papaparse';
import type { PitchRow, PitchWithDerived, AtBatGroup } from './statcast.types';
import { computePostCount, computeOutsAfter, isEndOfAtBat } from './count';
import { sampleTrajectory } from './physics';

const REQUIRED_COLUMNS: (keyof PitchRow)[] = [
  'game_date',
  'game_pk',
  'at_bat_number',
  'pitch_number',
  'pitch_type',
  'release_speed',
  'release_pos_x',
  'release_pos_y',
  'release_pos_z',
  'vx0',
  'vy0',
  'vz0',
  'ax',
  'ay',
  'az',
  'plate_x',
  'plate_z',
  'sz_top',
  'sz_bot',
  'stand',
  'p_throws',
  'balls',
  'strikes',
  'outs_when_up',
  'inning',
  'inning_topbot',
  'home_team',
  'away_team',
  'home_score',
  'away_score',
  'type',
  'description',
  'player_name',
  'batter',
  'pitcher',
];

type ParseResult = {
  pitches: PitchWithDerived[];
  atBats: AtBatGroup[];
};

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim().length) {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  throw new Error(`数値に変換できません: ${String(value)}`);
}

function castRow(raw: Record<string, unknown>): PitchRow {
  const row: Partial<PitchRow> = {};
  for (const key of REQUIRED_COLUMNS) {
    if (!(key in raw)) {
      throw new Error(`必須列 ${key} が欠けています`);
    }
  }

  for (const [key, value] of Object.entries(raw)) {
    if (key === 'inning_topbot' && typeof value === 'string') {
      (row as any)[key] = value === 'Top' ? 'Top' : 'Bot';
      continue;
    }

    if (key === 'type') {
      (row as any)[key] = value as PitchRow['type'];
      continue;
    }

    if (key === 'stand' || key === 'p_throws') {
      const normalized = String(value ?? '').toUpperCase().startsWith('L') ? 'L' : 'R';
      (row as any)[key] = normalized;
      continue;
    }

    if (
      [
        'game_pk',
        'at_bat_number',
        'pitch_number',
        'batter',
        'pitcher',
        'inning',
      ].includes(key)
    ) {
      (row as any)[key] = parseInt(String(value), 10);
      continue;
    }

    if (
      [
        'release_pos_x',
        'release_pos_y',
        'release_pos_z',
        'vx0',
        'vy0',
        'vz0',
        'ax',
        'ay',
        'az',
        'plate_x',
        'plate_z',
        'sz_top',
        'sz_bot',
        'balls',
        'strikes',
        'outs_when_up',
        'release_speed',
        'home_score',
        'away_score',
        'post_home_score',
        'post_away_score',
      ].includes(key)
    ) {
      if (value === '' || value === null || value === undefined) {
        continue;
      }
      (row as any)[key] = parseNumber(value);
      continue;
    }

    (row as any)[key] = value;
  }

  return row as PitchRow;
}

function sortRows(rows: PitchRow[]): PitchRow[] {
  return [...rows].sort((a, b) => {
    if (a.game_date !== b.game_date) {
      return a.game_date.localeCompare(b.game_date);
    }
    if (a.game_pk !== b.game_pk) {
      return a.game_pk - b.game_pk;
    }
    if (a.at_bat_number !== b.at_bat_number) {
      return a.at_bat_number - b.at_bat_number;
    }
    return a.pitch_number - b.pitch_number;
  });
}

function derivePitches(rows: PitchRow[]): PitchWithDerived[] {
  const pitches: PitchWithDerived[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const nextRow = rows[i + 1];
    const samples = sampleTrajectory(row);
    const postCount = nextRow && nextRow.at_bat_number === row.at_bat_number
      ? { balls: nextRow.balls, strikes: nextRow.strikes }
      : computePostCount(row);
    const outsAfter = computeOutsAfter(row, nextRow);
    const endOfAtBat = isEndOfAtBat(row, nextRow);

    pitches.push({
      ...row,
      id: `${row.game_pk}-${row.at_bat_number}-${row.pitch_number}`,
      samples,
      releaseDirection: row.p_throws === 'L' ? 'L' : 'R',
      postCount,
      outsAfter,
      isEndOfAtBat: endOfAtBat,
    } as PitchWithDerived);
  }
  return pitches;
}

function groupAtBats(pitches: PitchWithDerived[]): AtBatGroup[] {
  const groups: AtBatGroup[] = [];
  let current: AtBatGroup | undefined;

  for (const pitch of pitches) {
    if (!current || current.pitches[0].at_bat_number !== pitch.at_bat_number) {
      current = {
        key: `${pitch.game_pk}-${pitch.at_bat_number}`,
        gamePk: pitch.game_pk,
        inning: pitch.inning,
        inningTopbot: pitch.inning_topbot,
        batterId: pitch.batter,
        pitcherId: pitch.pitcher,
        pitches: [],
      };
      groups.push(current);
    }
    current.pitches.push(pitch);
    if (pitch.isEndOfAtBat) {
      current.summaryEvent = pitch.events ?? pitch.description;
    }
  }

  return groups;
}

export async function parseStatcastCsv(file: File): Promise<ParseResult> {
  const text = await file.text();
  const { data, errors } = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (errors.length) {
    throw new Error(`CSV解析エラー: ${errors[0]?.message ?? '不明なエラー'}`);
  }

  if (!data.length) {
    throw new Error('CSVにデータ行がありません');
  }

  const rows = data.map(castRow);
  const sorted = sortRows(rows);
  const derived = derivePitches(sorted);
  const atBats = groupAtBats(derived);

  return { pitches: derived, atBats };
}

export function getRequiredColumns(): string[] {
  return [...REQUIRED_COLUMNS];
}
