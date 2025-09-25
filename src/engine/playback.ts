import type { PitchWithDerived } from './statcast.types';

export function getPitchDuration(pitch: PitchWithDerived): number {
  if (!pitch.samples.length) return 1.5;
  const totalTime = pitch.samples[pitch.samples.length - 1].t;
  return Math.max(1.2, Math.min(totalTime + 0.8, 4));
}

export function getPlaybackInterval(duration: number, speed: number): number {
  return (duration / speed) * 1000;
}
