export type HalfInning = 'Top' | 'Bot';

export type PitchType = 'B' | 'S' | 'X';

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
  inning_topbot: HalfInning;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  post_home_score?: number;
  post_away_score?: number;
  type: PitchType;
  description: string;
  events?: string;
  player_name: string;
  batter: number;
  pitcher: number;
  stand: 'L' | 'R';
  p_throws: 'L' | 'R';
};

export type TrajectorySample = {
  t: number;
  x: number;
  y: number;
  z: number;
};

export type PitchWithDerived = PitchRow & {
  id: string;
  samples: TrajectorySample[];
  releaseDirection: 'L' | 'R';
  postCount: {
    balls: number;
    strikes: number;
  };
  outsAfter: number;
  isEndOfAtBat: boolean;
};

export type AtBatGroup = {
  key: string;
  gamePk: number;
  inning: number;
  inningTopbot: HalfInning;
  batterId: number;
  pitcherId: number;
  pitches: PitchWithDerived[];
  summaryEvent?: string;
};

export type ViewerState = {
  pitches: PitchWithDerived[];
  atBats: AtBatGroup[];
  currentPitchIndex: number;
  isPlaying: boolean;
  playbackSpeed: 0.5 | 1 | 2;
  cameraView: 'catcher' | 'umpire' | 'center';
  showTrails: boolean;
  showRelease: boolean;
  showZone: boolean;
  error?: string;
};
