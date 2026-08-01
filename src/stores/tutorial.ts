import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TUTORIAL_TOTAL_STEPS = 8;

interface TutorialState {
  hasSeenTutorial: boolean;
  isActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  nextStep: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      hasSeenTutorial: false,
      isActive: false,
      currentStep: 0,
      startTutorial: () => set({ isActive: true, currentStep: 0 }),
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep >= TUTORIAL_TOTAL_STEPS - 1) {
          set({ isActive: false, hasSeenTutorial: true, currentStep: 0 });
        } else {
          set({ currentStep: currentStep + 1 });
        }
      },
      skipTutorial: () => set({ isActive: false, hasSeenTutorial: true, currentStep: 0 }),
      resetTutorial: () => set({ hasSeenTutorial: false, isActive: false, currentStep: 0 }),
    }),
    {
      name: 'maithing-tutorial',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
