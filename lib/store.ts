import { create } from 'zustand';
import { Gender, RevealData, AnimationType } from './types';

interface RevealStore {
  formData: Partial<RevealData>;
  setFormData: (data: Partial<RevealData>) => void;
  updateField: <K extends keyof RevealData>(
    key: K,
    value: RevealData[K]
  ) => void;
  resetForm: () => void;
}

const initialState: Partial<RevealData> = {
  motherName: '',
  fatherName: '',
  babyName: '',
  gender: 'boy' as Gender,
  message: '',
  animationType: 'confetti' as AnimationType,
  countdownTime: 5,
};

export const useRevealStore = create<RevealStore>((set) => ({
  formData: initialState,
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  updateField: (key, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        [key]: value,
      },
    })),
  resetForm: () => set({ formData: initialState }),
}));