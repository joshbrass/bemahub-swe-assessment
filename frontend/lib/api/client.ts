/**
 * Shared axios instance.
 *
 * The request interceptor is wired for you: it attaches the stored bearer
 * token. You should not need to set the Authorization header by hand anywhere
 * else in the app.
 *
 * The RESPONSE interceptor is deliberately incomplete - see TASK-2.
 */
import axios from "axios";
import { getStoredToken, useAuthStore } from "@/lib/auth/authStore";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/wp-json/bemalearn/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response) {
      // No `response` means the request never got a business-level answer at
      // all (network down, CORS, DNS, timeout, server unreachable). That is a
      // TRANSPORT failure, not a refusal - auth state is not implicated, so
      // it is left untouched. Reject as-is so callers can tell the two apart.
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      // The server has explicitly said this token is no longer valid (never
      // issued, expired, or revoked). Keeping it around would just cause the
      // same 401 on every subsequent request, so clear it here - once, in
      // the one place every request passes through - rather than expecting
      // every caller to remember to do it.
      useAuthStore.getState().signOut();
    }

    return Promise.reject(error);
  }
);

export default api;
