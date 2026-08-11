import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvZustandStorage } from '@/src/lib/mmkvStorage';
import { unregisterPushToken } from '@/src/services/pushToken';
import type { CustomerProfile, MerchantProfile, User, UserRole } from '@/src/types';

type AppUser = User & Partial<CustomerProfile & MerchantProfile>;

interface AuthState {
  user: AppUser | null;
  selectedRole: UserRole | null;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      selectedRole: null,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          selectedRole: user ? (user.roles[0] ?? 'customer') : null,
          isLoading: false,
        }),
      setRole: (role) => set({ selectedRole: role }),
      switchRole: (role) => set({ selectedRole: role }),
      logout: () => {
        const userId = get().user?.id;
        if (userId) {
          unregisterPushToken(userId).catch(() => {});
        }
        set({ user: null, selectedRole: null, isLoading: false });
      },
      isAuthenticated: () => !!get().user,
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: 'maithing-auth',
      storage: createJSONStorage(() => mmkvZustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
