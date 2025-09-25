import { create } from 'zustand';
import type { ViewerState, PitchWithDerived, AtBatGroup } from '../engine/statcast.types';

type Actions = {
  setData: (payload: { pitches: PitchWithDerived[]; atBats: AtBatGroup[] }) => void;
  setError: (error?: string) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: ViewerState['playbackSpeed']) => void;
  setCurrentPitch: (index: number) => void;
  nextPitch: () => void;
  prevPitch: () => void;
  setCameraView: (view: ViewerState['cameraView']) => void;
  toggleTrail: () => void;
  toggleRelease: () => void;
  toggleZone: () => void;
};

type Store = ViewerState & Actions;

const initialState: ViewerState = {
  pitches: [],
  atBats: [],
  currentPitchIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  cameraView: 'catcher',
  showTrails: true,
  showRelease: true,
  showZone: true,
  error: undefined,
};

export const useViewerStore = create<Store>((set, get) => ({
  ...initialState,
  setData: ({ pitches, atBats }) =>
    set({ pitches, atBats, currentPitchIndex: 0, isPlaying: true, error: undefined }),
  setError: (error) => set({ error, pitches: [], atBats: [], isPlaying: false }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setCurrentPitch: (index) => {
    const clamped = Math.min(Math.max(index, 0), Math.max(0, get().pitches.length - 1));
    set({ currentPitchIndex: clamped });
  },
  nextPitch: () => {
    const { currentPitchIndex, pitches } = get();
    if (currentPitchIndex < pitches.length - 1) {
      set({ currentPitchIndex: currentPitchIndex + 1 });
    } else {
      set({ isPlaying: false });
    }
  },
  prevPitch: () => {
    const { currentPitchIndex } = get();
    if (currentPitchIndex > 0) {
      set({ currentPitchIndex: currentPitchIndex - 1 });
    }
  },
  setCameraView: (view) => set({ cameraView: view }),
  toggleTrail: () => set({ showTrails: !get().showTrails }),
  toggleRelease: () => set({ showRelease: !get().showRelease }),
  toggleZone: () => set({ showZone: !get().showZone }),
}));
