import { create, type GetState, type SetState } from 'zustand';
import { preparePitches } from '../engine/playback';
import { PitchRow, PitchWithDerived } from '../engine/statcast.types';

export type ViewMode = 'catcher' | 'umpire' | 'center';
export type AdvanceMode = 'manual' | 'auto';

export type OverlayState = {
  showTrajectory: boolean;
  showRelease: boolean;
  showZone: boolean;
};

type StoreState = {
  pitches: PitchWithDerived[];
  currentPitchIndex: number;
  pitchTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  view: ViewMode;
  overlays: OverlayState;
  error?: string;
  advanceMode: AdvanceMode;
  interPitchDelay: number;
  isAwaitingAdvance: boolean;
  loadFromRows: (rows: PitchRow[]) => void;
  setError: (message?: string) => void;
  setCurrentPitch: (index: number) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPitchTime: (time: number) => void;
  nextPitch: () => void;
  prevPitch: () => void;
  triggerNextPitch: () => void;
  handlePitchComplete: () => void;
  setView: (view: ViewMode) => void;
  toggleOverlay: (key: keyof OverlayState) => void;
  setAdvanceMode: (mode: AdvanceMode) => void;
};

let autoAdvanceTimer: ReturnType<typeof setTimeout> | undefined;

const clearAutoAdvance = () => {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = undefined;
  }
};

const scheduleAutoAdvance = (get: GetState<StoreState>, set: SetState<StoreState>) => {
  clearAutoAdvance();
  const state = get();
  const hasNext = state.currentPitchIndex < state.pitches.length - 1;
  if (!hasNext) {
    set({ isAwaitingAdvance: false });
    return;
  }
  autoAdvanceTimer = setTimeout(() => {
    const { currentPitchIndex, pitches } = get();
    if (currentPitchIndex < pitches.length - 1) {
      set({
        currentPitchIndex: currentPitchIndex + 1,
        pitchTime: 0,
        isPlaying: true,
        isAwaitingAdvance: false
      });
    } else {
      set({ isPlaying: false, isAwaitingAdvance: false });
    }
  }, state.interPitchDelay);
};

export const useStore = create<StoreState>((set, get) => ({
  pitches: [],
  currentPitchIndex: 0,
  pitchTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  view: 'catcher',
  overlays: {
    showTrajectory: true,
    showRelease: true,
    showZone: true
  },
  error: undefined,
  advanceMode: 'manual',
  interPitchDelay: 2200,
  isAwaitingAdvance: false,
  loadFromRows(rows) {
    try {
      clearAutoAdvance();
      const prepared = preparePitches(rows);
      set({
        pitches: prepared,
        currentPitchIndex: 0,
        pitchTime: 0,
        isPlaying: false,
        isAwaitingAdvance: false,
        error: undefined
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '解析中にエラーが発生しました。' });
    }
  },
  setError(message) {
    set({ error: message });
  },
  setCurrentPitch(index) {
    const { pitches } = get();
    const clamped = Math.max(0, Math.min(index, pitches.length - 1));
    clearAutoAdvance();
    set({ currentPitchIndex: clamped, pitchTime: 0, isPlaying: false, isAwaitingAdvance: false });
  },
  setIsPlaying(value) {
    if (!value) {
      clearAutoAdvance();
      set({ isPlaying: false });
      return;
    }
    set((state) => {
      const pitch = state.pitches[state.currentPitchIndex];
      const resetTime = pitch && state.pitchTime >= (pitch.duration ?? 0) ? 0 : state.pitchTime;
      return {
        isPlaying: true,
        pitchTime: resetTime,
        isAwaitingAdvance: false
      };
    });
  },
  setPlaybackSpeed(speed) {
    set({ playbackSpeed: speed });
  },
  setPitchTime(time) {
    set({ pitchTime: time });
  },
  nextPitch() {
    clearAutoAdvance();
    const { currentPitchIndex, pitches } = get();
    if (currentPitchIndex < pitches.length - 1) {
      set({
        currentPitchIndex: currentPitchIndex + 1,
        pitchTime: 0,
        isPlaying: true,
        isAwaitingAdvance: false
      });
    } else {
      set({ isPlaying: false, isAwaitingAdvance: false, pitchTime: 0 });
    }
  },
  triggerNextPitch() {
    const { currentPitchIndex, pitches } = get();
    clearAutoAdvance();
    if (currentPitchIndex < pitches.length - 1) {
      set({
        currentPitchIndex: currentPitchIndex + 1,
        pitchTime: 0,
        isPlaying: true,
        isAwaitingAdvance: false
      });
    } else {
      set({ isPlaying: false, isAwaitingAdvance: false });
    }
  },
  prevPitch() {
    const { currentPitchIndex } = get();
    const nextIndex = Math.max(0, currentPitchIndex - 1);
    clearAutoAdvance();
    set({ currentPitchIndex: nextIndex, pitchTime: 0, isPlaying: false, isAwaitingAdvance: false });
  },
  handlePitchComplete() {
    const { pitches, currentPitchIndex, advanceMode } = get();
    const currentPitch = pitches[currentPitchIndex];
    const hasNext = currentPitchIndex < pitches.length - 1;
    clearAutoAdvance();
    set({
      pitchTime: currentPitch?.duration ?? 0,
      isPlaying: false,
      isAwaitingAdvance: hasNext
    });
    if (hasNext && advanceMode === 'auto') {
      scheduleAutoAdvance(get, set);
    }
  },
  setView(view) {
    set({ view });
  },
  toggleOverlay(key) {
    const { overlays } = get();
    set({ overlays: { ...overlays, [key]: !overlays[key] } });
  },
  setAdvanceMode(mode) {
    const prevMode = get().advanceMode;
    set({ advanceMode: mode });
    if (mode === 'auto' && prevMode !== 'auto') {
      const state = get();
      if (state.isAwaitingAdvance) {
        scheduleAutoAdvance(get, set);
      }
    } else if (mode === 'manual') {
      clearAutoAdvance();
    }
  }
}));
