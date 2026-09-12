"use client";

/**
 * Task 3 - withdrawal request form.
 *
 * Rendered only when the caller already has an `Earnings` payload (see
 * app/earnings/page.tsx) - there is no "form with no data" state to handle
 * here, the form simply doesn't exist until earnings have loaded.
 */
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { createWithdrawal } from "@/lib/api/services/earnings";
import { formatMoney } from "@/lib/format";
import { StatusMessage } from "@/components/StatusMessage";
import type { ApiError, Earnings } from "@/lib/types/api";

const EARNINGS_QUERY_KEY = ["earnings"] as const;

type WithdrawalFormValues = { amountMinor: number };

/** Min/max come from the server payload (`minimumWithdrawalMinor`,
 * `availableMinor`) - never hardcoded, since the server can change them. */
function buildSchema(min: number, max: number, currency: string) {
  return z.object({
    amountMinor: z
      .number({ invalid_type_error: "Enter an amount." })
      .int("Amount must be a whole number - no decimals.")
      .positive("Amount must be greater than zero.")
      .min(min, `Amount must be at least ${formatMoney(min, currency)} (the minimum withdrawal).`)
      .max(max, `Amount cannot exceed your available balance of ${formatMoney(max, currency)}.`),
  });
}

function generatePayoutReference(): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `wd_${random}`;
}

/** `below_minimum` / `insufficient_balance` are refusals about the amount the
 * user typed - they belong on the field, not a generic banner. */
function fieldErrorMessage(error: unknown): string | null {
  if (axios.isAxiosError<ApiError>(error) && error.response) {
    const code = error.response.data?.code;
    if (code === "below_minimum" || code === "insufficient_balance") {
      return error.response.data.message;
    }
  }
  return null;
}

/** Everything else - transport, auth, "a withdrawal is already pending" - is
 * not about what the user typed, so it is a banner instead. */
function bannerErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError<ApiError>(error)) {
    return "Something went wrong. Please try again.";
  }
  if (!error.response) {
    // No `response`: the request never reached the server. A transport
    // failure is not "you are not permitted" - say what actually happened.
    return "Could not reach the server. Check your connection and try again.";
  }
  const code = error.response.data?.code;
  if (code === "below_minimum" || code === "insufficient_balance") {
    return null; // shown on the field instead, see fieldErrorMessage
  }
  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (error.response.status === 403) {
    return "This account is not permitted to make withdrawals.";
  }
  return error.response.data?.message ?? "Something went wrong. Please try again.";
}

export function WithdrawalForm({ earnings }: { earnings: Earnings }) {
  const queryClient = useQueryClient();
  const { minimumWithdrawalMinor: min, availableMinor: max, currency } = earnings;

  // The idempotency key for the CURRENT attempt, and the amount it was
  // generated for. Resubmitting with the same amount (e.g. retrying after a
  // network blip) reuses it, so the server sees one attempt; changing the
  // amount is unambiguously a new attempt and gets a new key. A success also
  // clears it, so the next withdrawal - even for an identical amount - is
  // never mistaken for a retry of the one that already went through.
  const payoutReferenceRef = useRef<string | null>(null);
  const referenceAmountRef = useRef<number | null>(null);

  // The schema is rebuilt from the latest min/max/currency on every render
  // (availableMinor shrinks after a successful withdrawal), but useForm only
  // reads `resolver` once. Route validation through a ref so it always uses
  // the current schema without recreating the form.
  const resolverRef = useRef(zodResolver(buildSchema(min, max, currency)));
  resolverRef.current = zodResolver(buildSchema(min, max, currency));

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<WithdrawalFormValues>({
    resolver: (values, context, options) => resolverRef.current(values, context, options),
  });

  const mutation = useMutation({
    mutationFn: (vars: { amountMinor: number; payoutReference: string }) =>
      createWithdrawal(vars.amountMinor, vars.payoutReference),
    onSuccess: () => {
      payoutReferenceRef.current = null;
      referenceAmountRef.current = null;
      reset();
      void queryClient.invalidateQueries({ queryKey: EARNINGS_QUERY_KEY });
    },
    onError: (error) => {
      const message = fieldErrorMessage(error);
      if (message) {
        setError("amountMinor", { type: "server", message });
      }
    },
  });

  function onSubmit(values: WithdrawalFormValues) {
    if (payoutReferenceRef.current === null || referenceAmountRef.current !== values.amountMinor) {
      payoutReferenceRef.current = generatePayoutReference();
      referenceAmountRef.current = values.amountMinor;
    }
    mutation.mutate({ amountMinor: values.amountMinor, payoutReference: payoutReferenceRef.current });
  }

  const banner = mutation.isError ? bannerErrorMessage(mutation.error) : null;

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
      noValidate
    >
      <h2 className="font-semibold text-slate-900">Request a withdrawal</h2>
      <p className="text-xs text-slate-500">
        Minimum {formatMoney(min, currency)} · up to your available balance of{" "}
        {formatMoney(max, currency)}.
      </p>

      <div>
        <label htmlFor="amountMinor" className="block text-sm font-medium text-slate-700">
          Amount ({currency} minor units)
        </label>
        <input
          id="amountMinor"
          type="number"
          step={1}
          min={min}
          max={max}
          disabled={mutation.isPending}
          {...register("amountMinor", { valueAsNumber: true })}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        />
        {errors.amountMinor ? (
          <p className="mt-1 text-sm text-red-600">{errors.amountMinor.message}</p>
        ) : null}
      </div>

      {banner ? <StatusMessage state="error" message={banner} /> : null}
      {mutation.isSuccess ? (
        <StatusMessage state="empty" message="Withdrawal requested." />
      ) : null}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {mutation.isPending ? "Submitting…" : "Request withdrawal"}
      </button>
    </form>
  );
}
