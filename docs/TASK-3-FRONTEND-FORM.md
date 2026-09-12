# Task 3 — Withdrawal form (24 min)

**Route:** `/earnings`
**Contract:** `POST /me/withdrawals`

## What to build

A form letting an instructor request a withdrawal.

## Requirements

1. **react-hook-form + zod.** `@hookform/resolvers` is installed.
2. **The minimum comes from the API** (`minimumWithdrawalMinor`). Do not
   hardcode it — it can change server-side.
3. Client-side validation: a positive integer, at least the minimum, no more
   than `availableMinor`.
4. **Server refusals must attach to the field, not a generic banner.**
   `below_minimum` and `insufficient_balance` are about the amount.
5. **No double submit.** Disable while in flight.
6. **Send `payoutReference`** in the body **and** as the `Idempotency-Key`
   header. Generate it once per attempt.
7. On success, the balance must refresh — think about cache invalidation.

## Evidence required

- `evidence/task-3-validation.png` — a client-side rejection
- `evidence/task-3-server-error.png` — a server refusal shown on the field
- `evidence/task-3-success.png` — a successful withdrawal
- `evidence/task-3-network.png` — the POST showing the `Idempotency-Key` header.
  If the `Authorization` header is in shot, **redact the token value** — keep the
  header visible, blank the token.

## In `SOLUTION.md`

> Why does `payoutReference` have to be generated **once per attempt** rather
> than regenerated on each retry? What would break if it were regenerated?

*(Two or three sentences. This is about money moving twice.)*
