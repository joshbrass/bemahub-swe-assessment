"use client";

/**
 * Instructor earnings + withdrawal request.
 *
 * Four top-level states, and they must not be confused with one another:
 *   - not hydrated yet   -> loading (we don't know if there's a session yet)
 *   - no token           -> "you're signed out", never an empty wallet
 *   - request failed     -> the SPECIFIC reason (401 / 403 / transport)
 *   - request succeeded  -> the numbers, plus the withdrawal form (Task 3) -
 *     the form only ever exists here, so "no earnings payload" already means
 *     "no form".
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { fetchEarnings } from "@/lib/api/services/earnings";
import { useAuthStore } from "@/lib/auth/authStore";
import { StatusMessage } from "@/components/StatusMessage";
import { WithdrawalForm } from "@/components/WithdrawalForm";
import { formatMoney } from "@/lib/format";
import type { ApiError } from "@/lib/types/api";

const EARNINGS_QUERY_KEY = ["earnings"] as const;

/** Distinguish WHY the request failed - a 403 is not a 401, and neither is a
 * dropped connection. Collapsing them into "forbidden" would misinform. */
function describeEarningsError(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response) {
      return "Could not reach the server. Check your connection and try again.";
    }
    if (error.response.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (error.response.status === 403) {
      return "This account is signed in, but it is not an instructor account. Earnings are instructor-only.";
    }
    return error.response.data?.message ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function EarningsPage() {
  const [hydrated, setHydrated] = useState(false);
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    useAuthStore.getState().hydrate();
    setHydrated(true);
  }, []);

  const { data, isPending, isError, error } = useQuery({
    queryKey: EARNINGS_QUERY_KEY,
    queryFn: fetchEarnings,
    enabled: hydrated && token !== null,
    // A dropped connection is worth one retry; a 401/403 business refusal
    // will fail identically every time, so don't waste a retry (and a delay
    // before the message appears) on it.
    retry: (failureCount, err) => axios.isAxiosError(err) && !err.response && failureCount < 1,
  });

  function handleSignOut() {
    useAuthStore.getState().signOut();
    queryClient.removeQueries({ queryKey: EARNINGS_QUERY_KEY });
  }

  if (!hydrated) {
    return <StatusMessage state="loading" />;
  }

  // Checked before the "no token" branch: a 401 clears the token via the
  // response interceptor, but the query still remembers WHY it failed. That
  // is a more honest message than falling back to the generic signed-out
  // copy below, which is reserved for "never signed in" / a deliberate sign
  // out.
  if (isError) {
    return (
      <div className="space-y-4">
        <StatusMessage state="error" message={describeEarningsError(error)} />
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-blue-600 underline">
            Sign in
          </Link>
          {token ? (
            <button onClick={handleSignOut} className="text-slate-500 underline">
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <StatusMessage state="error" message="You're signed out. Sign in to view your earnings." />
        <Link href="/login" className="text-blue-600 underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (isPending) {
    return <StatusMessage state="loading" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Earnings</h1>
        <button onClick={handleSignOut} className="text-sm text-slate-500 underline">
          Sign out
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <dt className="text-sm text-slate-500">Available</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {formatMoney(data.availableMinor, data.currency)}
          </dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <dt className="text-sm text-slate-500">Pending</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {formatMoney(data.pendingMinor, data.currency)}
          </dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <dt className="text-sm text-slate-500">Minimum withdrawal</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {formatMoney(data.minimumWithdrawalMinor, data.currency)}
          </dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <dt className="text-sm text-slate-500">Last withdrawal</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {/* null = never withdrawn - not the same thing as a date, so it
                does not get run through a date formatter. */}
            {data.lastWithdrawalAt === null
              ? "—"
              : new Date(data.lastWithdrawalAt).toLocaleString()}
          </dd>
        </div>
      </dl>

      <WithdrawalForm earnings={data} />
    </div>
  );
}
