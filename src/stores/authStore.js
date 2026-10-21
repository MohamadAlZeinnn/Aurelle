import { create } from 'zustand';
import { authService } from '../services/index.js';
import { demoSession } from '../services/api/session.js';
import { IS_DEMO } from '../config/env.js';
import { onUnauthorized } from '../services/api/client.js';

// Holds the signed-in user (never credentials). In live mode the session itself lives in an
// httpOnly cookie; in demo mode a random demo token is kept in localStorage.
export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'idle', // idle | loading | authenticated | anonymous

  async bootstrap() {
    if (get().status !== 'idle') return;
    if (IS_DEMO && !demoSession.get()) return set({ status: 'anonymous' });
    set({ status: 'loading' });
    try {
      const user = await authService.me();
      set({ user, status: 'authenticated' });
    } catch {
      demoSession.set(null);
      set({ user: null, status: 'anonymous' });
    }
  },

  async login(credentials) {
    const { token, user } = await authService.login(credentials);
    if (IS_DEMO) demoSession.set(token);
    set({ user, status: 'authenticated' });
    return user;
  },

  async register(payload) {
    const { token, user } = await authService.register(payload);
    if (IS_DEMO) demoSession.set(token);
    set({ user, status: 'authenticated' });
    return user;
  },

  async logout() {
    try {
      await authService.logout();
    } finally {
      demoSession.set(null);
      set({ user: null, status: 'anonymous' });
    }
  },

  setUser: (user) => set({ user }),
}));

onUnauthorized(() => {
  const { status } = useAuthStore.getState();
  if (status === 'authenticated') {
    demoSession.set(null);
    useAuthStore.setState({ user: null, status: 'anonymous' });
  }
});
