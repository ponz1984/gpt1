import Papa from 'papaparse';
import { PitchRow } from './statcast.types';

export const REQUIRED_COLUMNS: (keyof PitchRow)[] = [
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
  'pitcher'
];

function ensureColumns(fields: string[] | undefined) {
  if (!fields) {
    throw new Error('CSVのヘッダーが読み取れませんでした。');
  }
  const missing = REQUIRED_COLUMNS.filter((col) => !fields.includes(col));
  if (missing.length) {
    throw new Error(`必須列が不足しています: ${missing.join(', ')}`);
  }
}

function coerceRow(row: Record<string, unknown>): PitchRow {
  const inningTopBot = String(row.inning_topbot ?? '').trim();
  const topbot = inningTopBot === 'Top' || inningTopBot === 'Bot' ? inningTopBot : 'Top';
  const toNumber = (value: unknown): number => {
    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) {
      throw new Error('数値の変換に失敗しました。');
    }
    return num;
  };
  const toString = (value: unknown): string => String(value ?? '').trim();

  return {
    game_date: toString(row.game_date),
    game_pk: toNumber(row.game_pk),
    at_bat_number: toNumber(row.at_bat_number),
    pitch_number: toNumber(row.pitch_number),
    pitch_type: toString(row.pitch_type),
    pitch_name: row.pitch_name ? toString(row.pitch_name) : undefined,
    release_speed: toNumber(row.release_speed),
    release_pos_x: toNumber(row.release_pos_x),
    release_pos_y: toNumber(row.release_pos_y),
    release_pos_z: toNumber(row.release_pos_z),
    vx0: toNumber(row.vx0),
    vy0: toNumber(row.vy0),
    vz0: toNumber(row.vz0),
    ax: toNumber(row.ax),
    ay: toNumber(row.ay),
    az: toNumber(row.az),
    plate_x: toNumber(row.plate_x),
    plate_z: toNumber(row.plate_z),
    sz_top: toNumber(row.sz_top),
    sz_bot: toNumber(row.sz_bot),
    balls: toNumber(row.balls),
    strikes: toNumber(row.strikes),
    outs_when_up: toNumber(row.outs_when_up),
    inning: toNumber(row.inning),
    inning_topbot: topbot,
    home_team: toString(row.home_team),
    away_team: toString(row.away_team),
    home_score: toNumber(row.home_score),
    away_score: toNumber(row.away_score),
    post_home_score: row.post_home_score != null ? toNumber(row.post_home_score) : undefined,
    post_away_score: row.post_away_score != null ? toNumber(row.post_away_score) : undefined,
    type: toString(row.type) as PitchRow['type'],
    description: toString(row.description),
    events: row.events ? toString(row.events) : undefined,
    player_name: toString(row.player_name),
    batter: toNumber(row.batter),
    pitcher: toNumber(row.pitcher)
  };
}

export async function parseCsvFile(file: File): Promise<PitchRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete(results) {
        try {
          ensureColumns(results.meta.fields);
          const rows = results.data
            .filter((row) => Object.keys(row).length > 0)
            .map((row) => coerceRow(row));
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      },
      error(err) {
        reject(err);
      }
    });
  });
}

export function sortPitches(rows: PitchRow[]): PitchRow[] {
  return [...rows].sort((a, b) => {
    const dateDiff = a.game_date.localeCompare(b.game_date);
    if (dateDiff !== 0) return dateDiff;
    if (a.game_pk !== b.game_pk) return a.game_pk - b.game_pk;
    if (a.at_bat_number !== b.at_bat_number) return a.at_bat_number - b.at_bat_number;
    return a.pitch_number - b.pitch_number;
  });
}
