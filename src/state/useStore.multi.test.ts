import { readFileSync } from 'node:fs';
import { describe, expect, beforeEach, afterEach, it } from 'vitest';
import { useStore } from './useStore';
import type { Pitch } from '../engine/statcast.types';

const sampleCsv = readFileSync(new URL('../../fixtures/sample_statcast.csv', import.meta.url), 'utf-8');

function clonePitch(pitch: Pitch, overrides: Partial<Pitch>): Pitch {
  return { ...pitch, ...overrides };
}

describe('multi replay start', () => {
  beforeEach(() => {
    useStore.getState().reset();
    useStore.getState().loadFromCsv(sampleCsv);
  });

  afterEach(() => {
    useStore.getState().reset();
  });

  it('activates multi replay with up to 10 pitches that have samples', () => {
    const state = useStore.getState();
    expect(state.pitches.length).toBeGreaterThan(0);

    state.startMultiReplay();

    const nextState = useStore.getState();
    expect(nextState.multiReplayActive).toBe(true);
    expect(nextState.multiReplayPitches.length).toBeGreaterThan(0);
    expect(nextState.multiReplayPitches.length).toBeLessThanOrEqual(10);
    expect(nextState.multiReplayPitches.every((pitch) => pitch.samples.length > 0)).toBe(true);
    expect(nextState.multiReplayAtBatIndex).toBe(nextState.multiReplayPitches[0]?.atBatIndex);
    expect(nextState.isPlaying).toBe(false);
    expect(nextState.multiReplayTime).toBe(0);
  });

  it('ignores pitches without trajectory samples when starting multi replay', () => {
    const baseState = useStore.getState();
    const originalPitches = baseState.pitches.slice(0, 3);
    const mutated = originalPitches.map((pitch, idx) =>
      idx === 1 ? clonePitch(pitch, { samples: [] }) : pitch
    );

    const mutatedById = new Map(mutated.map((pitch) => [pitch.id, pitch]));
    const patchedAtBats = baseState.atBats.map((atBat) => ({
      ...atBat,
      pitches: atBat.pitches.map((pitch) => mutatedById.get(pitch.id) ?? pitch),
    }));

    useStore.setState({
      pitches: [...mutated, ...baseState.pitches.slice(3)],
      atBats: patchedAtBats,
    });

    useStore.getState().startMultiReplay();
    const nextState = useStore.getState();

    expect(nextState.multiReplayPitches.some((pitch) => pitch.samples.length === 0)).toBe(false);
    const filteredOut = nextState.multiReplayPitches.find((pitch) => pitch.id === mutated[1].id);
    expect(filteredOut).toBeUndefined();
  });

  it('does not activate multi replay when no valid pitches are available', () => {
    const { pitches } = useStore.getState();
    const emptyPitches = pitches.slice(0, 2).map((pitch) => clonePitch(pitch, { samples: [] }));
    const emptyMap = new Map(emptyPitches.map((pitch) => [pitch.id, pitch]));
    useStore.setState((prev) => ({
      ...prev,
      pitches: emptyPitches,
      atBats: prev.atBats.map((atBat) => ({
        ...atBat,
        pitches: atBat.pitches
          .filter((pitch) => emptyMap.has(pitch.id))
          .map((pitch) => emptyMap.get(pitch.id) as Pitch),
      })),
    }));

    useStore.getState().startMultiReplay();
    const nextState = useStore.getState();
    expect(nextState.multiReplayActive).toBe(false);
    expect(nextState.multiReplayPitches.length).toBe(0);
  });
});
