export type PitchTypeCode = 'B' | 'S' | 'X';

export type InningHalf = 'Top' | 'Bot';

export type PitchRow = {
  game_date: string;
  game_pk: number;
  at_bat_number: number;
  pitch_number: number;
  pitch_type: string;
  pitch_name?: string;
  release_speed: number;
  release_pos_x: number;
  release_pos_y: number;
  release_pos_z: number;
  vx0: number;
  vy0: number;
  vz0: number;
  ax: number;
  ay: number;
  az: number;
  plate_x: number;
  plate_z: number;
  sz_top: number;
  sz_bot: number;
  balls: number;
  strikes: number;
  outs_when_up: number;
  inning: number;
  inning_topbot: InningHalf;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  post_home_score?: number;
  post_away_score?: number;
  type: PitchTypeCode;
  description: string;
  events?: string;
  player_name: string;
  batter: number;
  pitcher: number;
};

export type TrajectorySample = {
  t: number;
  x: number;
  y: number;
  z: number;
};

export type CountState = {
  balls: number;
  strikes: number;
};

export type ScoreState = {
  home: number;
  away: number;
};

export type PitchDerived = {
  id: string;
  order: number;
  atBatIndex: number;
  indexInAtBat: number;
  samples: TrajectorySample[];
  duration: number;
  postCount: CountState;
  outsAfter: number;
  scoreAfter: ScoreState;
  isAtBatEnd: boolean;
  displayResult: string;
  highlightResult: boolean;
  speedLabel: string;
  pitchLabel: string;
  /** 各投球時点の投手表示名（優先: row.player_name → meta.pitcherNames[id] → フォールバック） */
  pitcherLabel: string;
};

export type Pitch = PitchRow & PitchDerived;

export type AtBat = {
  id: string;
  batterId: number;
  batterLabel: string;
  inning: number;
  half: InningHalf;
  pitches: Pitch[];
};

export type GameMeta = {
  gameDate: string;
  gamePk: number;
  homeTeam: string;
  awayTeam: string;
  /** 初期投手名（互換保持） */
  pitcherName: string;
  /** 投手ID→名前の辞書（HUD更新に利用） */
  pitcherNames: Record<number, string>;
};

export type ParsedGame = {
  atBats: AtBat[];
  pitches: Pitch[];
  meta: GameMeta;
};
