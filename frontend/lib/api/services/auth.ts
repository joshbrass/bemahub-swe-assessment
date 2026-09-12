/**
 * Auth API service.
 *
 * `login` is the only way a token should ever be obtained. The axios request
 * interceptor (lib/api/client.ts) attaches it to every subsequent request -
 * nothing here or in components should set `Authorization` by hand.
 */
import { api } from "@/lib/api/client";
import type { LoginResponse } from "@/lib/types/api";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  return data;
}
