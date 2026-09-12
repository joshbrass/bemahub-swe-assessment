"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { login } from "@/lib/api/services/auth";
import { useAuthStore } from "@/lib/auth/authStore";
import { StatusMessage } from "@/components/StatusMessage";
import type { ApiError } from "@/lib/types/api";

/** Turn a failed login attempt into a message that tells the truth about
 * WHY it failed - a dead server and a wrong password are not the same
 * problem, and a lie by conflation is still a lie. */
function describeLoginError(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response) {
      // No `response` at all: the request never reached the server (or its
      // answer never came back). This is a TRANSPORT failure, not "wrong
      // credentials".
      return "Could not reach the server. Check your connection and try again.";
    }
    if (error.response.status === 401) {
      return error.response.data?.message ?? "Email or password is incorrect.";
    }
    return error.response.data?.message ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      useAuthStore.getState().signIn(data.token, data.user);
      router.push("/earnings");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-xl font-semibold">Sign in</h1>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={mutation.isPending}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={mutation.isPending}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
        </div>

        {mutation.isError ? (
          <StatusMessage state="error" message={describeLoginError(mutation.error)} />
        ) : null}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {mutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
