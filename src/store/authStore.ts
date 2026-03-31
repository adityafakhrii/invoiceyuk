import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppRole = 'admin' | 'user';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: AppRole;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      expiresAt: null,
      login: (user) => set({ 
        user, 
        isAuthenticated: true, 
        expiresAt: Date.now() + SESSION_TTL_MS 
      }),
      logout: () => set({ user: null, isAuthenticated: false, expiresAt: null }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      isSessionValid: () => {
        const state = get();
        if (!state.isAuthenticated || !state.expiresAt) return false;
        if (Date.now() > state.expiresAt) {
          set({ user: null, isAuthenticated: false, expiresAt: null });
          return false;
        }
        return true;
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state && state.expiresAt && Date.now() > state.expiresAt) {
          state.logout();
        }
      },
    }
  )
);
