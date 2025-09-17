import { create } from 'zustand';

export const useCubeStore = create((set, get) => ({
  selectedFace: null,
  rotating: false,
  cubeRefs: {},

  setCubeRef: (id, ref) => {
    set((state) => ({
      cubeRefs: { ...state.cubeRefs, [id]: ref },
    }));
  },

  rotateFace: (face) => {
    const { rotating } = get();
    if (rotating) return;
    set({ rotating: true, selectedFace: face });
  },

  clearRotation: () => {
    set({ rotating: false, selectedFace: null });
  },
}));