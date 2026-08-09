import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PriceRange = 'budget' | 'mid' | 'premium' | 'luxury' | 'any';
export type DiscoveryStyle = 'mystery' | 'fixed' | 'both';

interface PersonalityState {
  onboardingCompleted: boolean;
  dietaryPreferences: string[];
  preferredCategories: string[];
  priceRange: PriceRange | null;
  discoveryStyle: DiscoveryStyle | null;
  setOnboardingCompleted: (v: boolean) => void;
  setDietaryPreferences: (v: string[]) => void;
  setPreferredCategories: (v: string[]) => void;
  setPriceRange: (v: PriceRange) => void;
  setDiscoveryStyle: (v: DiscoveryStyle) => void;
  resetPersonality: () => void;
}

export const usePersonalityStore = create<PersonalityState>()(
  persist(
    (set) => ({
      onboardingCompleted: false,
      dietaryPreferences: [],
      preferredCategories: [],
      priceRange: null,
      discoveryStyle: null,
      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),
      setDietaryPreferences: (v) => set({ dietaryPreferences: v }),
      setPreferredCategories: (v) => set({ preferredCategories: v }),
      setPriceRange: (v) => set({ priceRange: v }),
      setDiscoveryStyle: (v) => set({ discoveryStyle: v }),
      resetPersonality: () =>
        set({
          onboardingCompleted: false,
          dietaryPreferences: [],
          preferredCategories: [],
          priceRange: null,
          discoveryStyle: null,
        }),
    }),
    {
      name: 'maithing-personality-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
