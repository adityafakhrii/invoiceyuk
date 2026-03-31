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

interface PersistedAuthState {
  user: AuthUser | null;
  _isAuthenticated: boolean;
  expiresAt: number | null;
}

interface AuthState extends PersistedAuthState {
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      _isAuthenticated: false,
      expiresAt: null,
      get isAuthenticated() {
        const state = get();
        if (!state._isAuthenticated) return false;
        if (state.expiresAt && Date.now() > state.expiresAt) {
          // Session expired — clear it asynchronously
          setTimeout(() => set({ user: null, _isAuthenticated: false, expiresAt: null }), 0);
          return false;
        }
        return true;
      },
      login: (user) => set({ 
        user, 
        _isAuthenticated: true, 
        expiresAt: Date.now() + SESSION_TTL_MS 
      }),
      logout: () => set({ user: null, _isAuthenticated: false, expiresAt: null }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        _isAuthenticated: state._isAuthenticated,
        expiresAt: state.expiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.expiresAt && Date.now() > state.expiresAt) {
          state.logout();
        }
      },
    }
  )
);
