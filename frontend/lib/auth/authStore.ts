/**
 * Auth state.
 *
 * Zustand, persisted to localStorage so a refresh keeps you signed in.
 * `getStoredToken` is used by the axios interceptor.
 */
import { create } from "zustand";
import type { AuthUser } from "@/lib/types/api";

const TOKEN_KEY = "bl_token";
const USER_KEY = "bl_user";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  signIn: (token, user) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* storage unavailable - keep in memory only */
    }
    set({ token, user });
  },

  signOut: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    set({ token: null, user: null });
  },

  hydrate: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);
      if (token && raw) set({ token, user: JSON.parse(raw) as AuthUser });
    } catch {
      /* ignore */
    }
  },
}));
