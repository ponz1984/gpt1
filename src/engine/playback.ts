import { computePostCount, estimateOutsAdded } from './count';
import { sampleTrajectory } from './physics';
import { PitchRow, PitchWithDerived } from './statcast.types';
import { sortPitches } from './parseCsv';

function groupAtBats(rows: PitchRow[]): PitchRow[][] {
  const groups: PitchRow[][] = [];
  let current: PitchRow[] = [];
  let lastKey = '';
  rows.forEach((row) => {
    const key = `${row.game_pk}-${row.at_bat_number}`;
    if (!current.length || key === lastKey) {
      current.push(row);
      lastKey = key;
    } else {
      groups.push(current);
      current = [row];
      lastKey = key;
    }
  });
  if (current.length) {
    groups.push(current);
  }
  return groups;
}

export function preparePitches(rows: PitchRow[]): PitchWithDerived[] {
  const sorted = sortPitches(rows);
  const groups = groupAtBats(sorted);
  const derived: PitchWithDerived[] = [];

  groups.forEach((group, groupIndex) => {
    const baseOuts = group[0].outs_when_up;
    const nextGroup = groups[groupIndex + 1];
    const lastRow = group[group.length - 1];
    const estimatedOuts = nextGroup
      ? nextGroup[0].outs_when_up
      : baseOuts + estimateOutsAdded(lastRow.events);
    const outsAfterAtBat = Math.min(3, Math.max(baseOuts, estimatedOuts));

    let previousOuts = baseOuts;

    group.forEach((row, pitchIndex) => {
      const { count: computedCount, isAtBatEnd } = computePostCount(row);
      const nextPitchSameAtBat = group[pitchIndex + 1];
      const countAfter = nextPitchSameAtBat
        ? { balls: nextPitchSameAtBat.balls, strikes: nextPitchSameAtBat.strikes }
        : computedCount;
      const samples = sampleTrajectory(row);
      const duration = samples[samples.length - 1]?.t ?? 0;
      const isLastPitch = !nextPitchSameAtBat;
      const outsAfter = isLastPitch ? outsAfterAtBat ?? previousOuts : previousOuts;
      const displayDescription = isLastPitch && row.events ? row.events : row.description;

      derived.push({
        ...row,
        samples,
        duration,
        countBefore: { balls: row.balls, strikes: row.strikes },
        countAfter,
        outsBefore: previousOuts,
        outsAfter,
        isAtBatEnd: isLastPitch || isAtBatEnd,
        resultText: row.events ?? row.description,
        homeScoreAfter: row.home_score,
        awayScoreAfter: row.away_score,
        displayDescription
      });

      previousOuts = outsAfter;
    });
  });

  for (let i = 0; i < derived.length; i += 1) {
    const current = derived[i];
    const next = derived[i + 1];
    const homeAfter =
      current.post_home_score ??
      (next && next.game_pk === current.game_pk ? next.home_score : current.home_score);
    const awayAfter =
      current.post_away_score ??
      (next && next.game_pk === current.game_pk ? next.away_score : current.away_score);
    derived[i] = {
      ...current,
      homeScoreAfter: homeAfter,
      awayScoreAfter: awayAfter
    };
  }

  return derived;
}
