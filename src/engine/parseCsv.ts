import Papa from 'papaparse';
import { deriveOutsAfter, derivePostCount } from './count';
import { sampleTrajectory } from './physics';
import type {
  AtBat,
  BaseOccupancy,
  GameMeta,
  ParsedGame,
  Pitch,
  PitchRow,
} from './statcast.types';
import { formatEvents } from '../utils/formatters';

const REQUIRED_COLUMNS = [
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
  'pitcher',
];

function ensureRequiredColumns(columns: string[]): void {
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length > 0) {
    throw new Error(`必須列が不足しています: ${missing.join(', ')}`);
  }
}

function toPitchRow(raw: Papa.ParseResult<unknown>['data'][number]): PitchRow {
  const row = raw as Record<string, string>;
  const parseRunnerId = (value: string | undefined): number | undefined => {
    if (!value || value.trim() === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const normalizeHalf = (value: string | undefined): PitchRow['inning_topbot'] => {
    const upper = (value ?? '').trim().toLowerCase();
    if (upper === 'bot' || upper === 'bottom' || upper === 'b') return 'Bot';
    return 'Top';
  };
  const rawBatter = (row.batter ?? '').trim();
  const batter = /^\d+$/.test(rawBatter) ? Number(rawBatter) : rawBatter;
  return {
    game_date: row.game_date,
    game_pk: Number(row.game_pk),
    at_bat_number: Number(row.at_bat_number),
    pitch_number: Number(row.pitch_number),
    pitch_type: row.pitch_type,
    pitch_name: row.pitch_name,
    release_speed: Number(row.release_speed),
    release_pos_x: Number(row.release_pos_x),
    release_pos_y: Number(row.release_pos_y),
    release_pos_z: Number(row.release_pos_z),
    vx0: Number(row.vx0),
    vy0: Number(row.vy0),
    vz0: Number(row.vz0),
    ax: Number(row.ax),
    ay: Number(row.ay),
    az: Number(row.az),
    plate_x: Number(row.plate_x),
    plate_z: Number(row.plate_z),
    sz_top: Number(row.sz_top),
    sz_bot: Number(row.sz_bot),
    balls: Number(row.balls),
    strikes: Number(row.strikes),
    outs_when_up: Number(row.outs_when_up),
    inning: Number(row.inning),
    inning_topbot: normalizeHalf(row.inning_topbot),
    home_team: row.home_team,
    away_team: row.away_team,
    home_score: Number(row.home_score),
    away_score: Number(row.away_score),
    post_home_score: row.post_home_score ? Number(row.post_home_score) : undefined,
    post_away_score: row.post_away_score ? Number(row.post_away_score) : undefined,
    on_1b: parseRunnerId(row.on_1b),
    on_2b: parseRunnerId(row.on_2b),
    on_3b: parseRunnerId(row.on_3b),
    type: row.type as PitchRow['type'],
    description: row.description,
    events: row.events || undefined,
    player_name: row.player_name,
    batter,
    pitcher: Number(row.pitcher),
  };
}

function sortRows(rows: PitchRow[]): PitchRow[] {
  return rows.sort((a, b) => {
    if (a.game_date !== b.game_date) return a.game_date.localeCompare(b.game_date);
    if (a.game_pk !== b.game_pk) return a.game_pk - b.game_pk;
    if (a.at_bat_number !== b.at_bat_number) return a.at_bat_number - b.at_bat_number;
    return a.pitch_number - b.pitch_number;
  });
}

function buildMeta(rows: PitchRow[], pitcherNames: Map<number, string>): GameMeta {
  const first = rows[0];
  return {
    gameDate: first.game_date,
    gamePk: first.game_pk,
    homeTeam: first.home_team,
    awayTeam: first.away_team,
    pitcherName: first.player_name,
    pitcherNames: Object.fromEntries(pitcherNames.entries()),
  };
}

function resolvePitcherLabel(row: PitchRow, pitcherNames: Map<number, string>): string {
  if (row.player_name) return row.player_name;
  const mapped = pitcherNames.get(row.pitcher);
  if (mapped) return mapped;
  return `投手 ${row.pitcher}`;
}

function resolveBases(
  baseSource: PitchRow | undefined,
  fallback: PitchRow
): BaseOccupancy {
  const source = baseSource ?? fallback;
  return {
    first: Number.isFinite(source.on_1b) ? source.on_1b : undefined,
    second: Number.isFinite(source.on_2b) ? source.on_2b : undefined,
    third: Number.isFinite(source.on_3b) ? source.on_3b : undefined,
  };
}

function createPitch(
  row: PitchRow,
  order: number,
  atBatIndex: number,
  indexInAtBat: number,
  outsAfter: number,
  pitcherNames: Map<number, string>,
  nextInAtBat?: PitchRow,
  nextAtBatFirst?: PitchRow,
): Pitch {
  const countResult = derivePostCount(row, nextInAtBat);
  const samples = sampleTrajectory(row);
  const duration = samples[samples.length - 1]?.t ?? 0.6;

  const scoreAfter = {
    home: row.post_home_score ?? nextAtBatFirst?.home_score ?? row.home_score,
    away: row.post_away_score ?? nextAtBatFirst?.away_score ?? row.away_score,
  };

  const displayResult = formatEvents(row.events, row.description);
  const baseState = resolveBases(nextInAtBat ?? nextAtBatFirst, row);

  return {
    ...row,
    id: `${row.game_pk}-${row.at_bat_number}-${row.pitch_number}`,
    order,
    atBatIndex,
    indexInAtBat,
    samples,
    duration,
    postCount: { balls: countResult.balls, strikes: countResult.strikes },
    outsAfter,
    scoreAfter,
    isAtBatEnd: countResult.isAtBatEnd || !nextInAtBat,
    displayResult,
    highlightResult: !nextInAtBat,
    speedLabel: `${row.release_speed.toFixed(1)} mph`,
    pitchLabel: row.pitch_name || row.pitch_type,
    pitcherLabel: resolvePitcherLabel(row, pitcherNames),
    bases: baseState,
  };
}

function groupAtBats(rows: PitchRow[], pitcherNames: Map<number, string>): AtBat[] {
  const groups: PitchRow[][] = [];
  let currentGroup: PitchRow[] = [];
  let currentKey = '';

  rows.forEach((row) => {
    const key = `${row.game_pk}-${row.at_bat_number}`;
    if (key !== currentKey) {
      if (currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = [];
      currentKey = key;
    }
    currentGroup.push(row);
  });
  if (currentGroup.length > 0) groups.push(currentGroup);

  const atBats: AtBat[] = [];
  let order = 0;

  groups.forEach((group, groupIndex) => {
    const first = group[0];
    const nextGroup = groups[groupIndex + 1];
    const trimmedBatterName =
      typeof first.batter === 'string' ? first.batter.trim() : undefined;
    const batterLabel =
      trimmedBatterName && trimmedBatterName.length > 0
        ? trimmedBatterName
        : `打者 ${first.batter}`;
    const batterId =
      typeof first.batter === 'number' && Number.isFinite(first.batter)
        ? first.batter
        : undefined;
    const atBat: AtBat = {
      id: `${first.game_pk}-${first.at_bat_number}`,
      batterId,
      batterLabel,
      inning: first.inning,
      half: first.inning_topbot,
      pitches: [],
    };

    // アウト推移トラッカー：打席開始時の outs_when_up からスタート
    let outsTracker = first.outs_when_up;

    group.forEach((row, indexInAtBat) => {
      const nextInAtBat = group[indexInAtBat + 1];
      const nextAtBatFirst = nextGroup ? nextGroup[0] : undefined;
      const isLastPitch = !nextInAtBat;

      const outsAfter = deriveOutsAfter(row, outsTracker, {
        isLastPitchOfAtBat: isLastPitch,
        nextAtBatFirst,
      });

      const pitch = createPitch(
        row,
        order,
        groupIndex,
        indexInAtBat,
        outsAfter,
        pitcherNames,
        nextInAtBat,
        nextAtBatFirst,
      );
      atBat.pitches.push(pitch);
      order += 1;

      // 打席が終わったらトラッカーを更新（3アウト到達なら 0 にリセットして次回へ）
      if (isLastPitch) {
        outsTracker = outsAfter >= 3 ? 0 : outsAfter;
      }
    });

    atBats.push(atBat);
  });

  return atBats;
}

export function parseCsv(text: string): ParsedGame {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors.map((e) => e.message).join('\n'));
  }
  const fields = result.meta.fields;
  if (!fields) {
    throw new Error('ヘッダー行が見つかりませんでした。');
  }
  ensureRequiredColumns(fields);

  const rows = (result.data as Record<string, string>[])
    .map(toPitchRow)
    .filter((row) => Number.isFinite(row.game_pk) && !Number.isNaN(row.pitch_number));

  if (rows.length === 0) {
    throw new Error('投球データが空です。');
  }

  const sortedRows = sortRows(rows);

  // 投手ID→名前の辞書を構築（HUD更新に利用）
  const pitcherNames = new Map<number, string>();
  sortedRows.forEach((row) => {
    if (row.player_name) pitcherNames.set(row.pitcher, row.player_name);
  });

  const atBats = groupAtBats(sortedRows, pitcherNames);
  const pitches = atBats.flatMap((ab) => ab.pitches);
  const meta = buildMeta(sortedRows, pitcherNames);

  return { atBats, pitches, meta };
}

