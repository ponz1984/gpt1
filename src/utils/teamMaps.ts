export type TeamInfo = {
  name: string;
  primary: string;
  secondary: string;
};

const TEAMS: Record<string, TeamInfo> = {
  ATL: { name: 'Atlanta Braves', primary: '#ce1141', secondary: '#13274f' },
  AZ: { name: 'Arizona Diamondbacks', primary: '#a71930', secondary: '#000000' },
  BAL: { name: 'Baltimore Orioles', primary: '#df4601', secondary: '#000000' },
  BOS: { name: 'Boston Red Sox', primary: '#bd3039', secondary: '#0d2b56' },
  CHC: { name: 'Chicago Cubs', primary: '#0e3386', secondary: '#cc3433' },
  CWS: { name: 'Chicago White Sox', primary: '#27251f', secondary: '#c4ced4' },
  CIN: { name: 'Cincinnati Reds', primary: '#c6011f', secondary: '#000000' },
  CLE: { name: 'Cleveland Guardians', primary: '#e31937', secondary: '#001742' },
  COL: { name: 'Colorado Rockies', primary: '#33006f', secondary: '#c4ced4' },
  DET: { name: 'Detroit Tigers', primary: '#0c2340', secondary: '#fa4616' },
  HOU: { name: 'Houston Astros', primary: '#002d62', secondary: '#eb6e1f' },
  KC: { name: 'Kansas City Royals', primary: '#174885', secondary: '#c09a5b' },
  LAA: { name: 'Los Angeles Angels', primary: '#ba0021', secondary: '#003263' },
  LAD: { name: 'Los Angeles Dodgers', primary: '#005a9c', secondary: '#a5acaf' },
  MIA: { name: 'Miami Marlins', primary: '#00a3e0', secondary: '#000000' },
  MIL: { name: 'Milwaukee Brewers', primary: '#12284b', secondary: '#ffc52f' },
  MIN: { name: 'Minnesota Twins', primary: '#002b5c', secondary: '#d31145' },
  NYM: { name: 'New York Mets', primary: '#002d72', secondary: '#ff5910' },
  NYY: { name: 'New York Yankees', primary: '#0c2340', secondary: '#c4ced4' },
  OAK: { name: 'Oakland Athletics', primary: '#003831', secondary: '#efb21e' },
  PHI: { name: 'Philadelphia Phillies', primary: '#e81828', secondary: '#002d72' },
  PIT: { name: 'Pittsburgh Pirates', primary: '#27251f', secondary: '#fdb827' },
  SD: { name: 'San Diego Padres', primary: '#2f241d', secondary: '#ffc425' },
  SEA: { name: 'Seattle Mariners', primary: '#0c2c56', secondary: '#005c5c' },
  SF: { name: 'San Francisco Giants', primary: '#fd5a1e', secondary: '#27251f' },
  STL: { name: 'St. Louis Cardinals', primary: '#c41e3a', secondary: '#0a2252' },
  TB: { name: 'Tampa Bay Rays', primary: '#092c5c', secondary: '#8fbce6' },
  TEX: { name: 'Texas Rangers', primary: '#003278', secondary: '#c0111f' },
  TOR: { name: 'Toronto Blue Jays', primary: '#134a8e', secondary: '#1d2d5c' },
  WSH: { name: 'Washington Nationals', primary: '#ab0003', secondary: '#14225a' },
};

export function getTeamInfo(code: string): TeamInfo {
  return TEAMS[code as keyof typeof TEAMS] ?? {
    name: code,
    primary: '#1f2937',
    secondary: '#4b5563',
  };
}
