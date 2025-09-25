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
  inning_topbot: 'Top' | 'Bot';
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  post_home_score?: number;
  post_away_score?: number;
  type: 'B' | 'S' | 'X';
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

export type PitchWithDerived = PitchRow & {
  samples: TrajectorySample[];
  duration: number;
  countAfter: CountState;
  countBefore: CountState;
  outsBefore: number;
  outsAfter: number;
  isAtBatEnd: boolean;
  resultText: string;
  homeScoreAfter: number;
  awayScoreAfter: number;
  displayDescription: string;
};
