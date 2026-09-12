/**
 * Earnings API service.
 */
import { api } from "@/lib/api/client";
import type { Earnings, Withdrawal } from "@/lib/types/api";

export async function fetchEarnings(): Promise<Earnings> {
  const { data } = await api.get<Earnings>("/me/earnings");
  return data;
}

/**
 * `payoutReference` is the idempotency key for this withdrawal attempt - the
 * caller is responsible for generating it once per attempt and reusing it on
 * retry (see components/WithdrawalForm.tsx). It goes in the body AND as the
 * `Idempotency-Key` header, per the contract.
 */
export async function createWithdrawal(
  amountMinor: number,
  payoutReference: string
): Promise<Withdrawal> {
  const { data } = await api.post<Withdrawal>(
    "/me/withdrawals",
    { amountMinor, payoutReference },
    { headers: { "Idempotency-Key": payoutReference } }
  );
  return data;
}
