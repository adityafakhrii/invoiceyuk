import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user';

interface AuthUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  pekerjaan?: string;
  tujuan_penggunaan?: string;
  role: AppRole;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch profile from pin_users
        const { data: profile } = await supabase
          .from('pin_users')
          .select('name, username, email, pekerjaan, tujuan_penggunaan')
          .eq('id', session.user.id)
          .maybeSingle() as unknown as { data: { name: string; username: string; email: string | null; pekerjaan: string | null; tujuan_penggunaan: string | null } | null; error: unknown };

        // Fetch role from user_roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle() as unknown as { data: { role: AppRole } | null; error: unknown };

        set({
          user: {
            id: session.user.id,
            name: profile?.name || session.user.user_metadata?.name || '',
            username: profile?.username || session.user.user_metadata?.username || '',
            email: profile?.email || session.user.email || '',
            pekerjaan: profile?.pekerjaan || '',
            tujuan_penggunaan: profile?.tujuan_penggunaan || '',
            role: (roleData?.role as AppRole) || 'user',
          },
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  logout: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });
  }
}));
