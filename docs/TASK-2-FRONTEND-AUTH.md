# Task 2 — Authentication (24 min)

**Routes:** `/login`, `/earnings`
**Contract:** `POST /auth/login`, `GET /me/earnings`

## What to build

1. A sign-in form posting to `/auth/login`.
2. On success, store the token via `useAuthStore` (already written).
3. `/earnings` shows the instructor's balance from `GET /me/earnings`.

## Requirements

1. **The axios interceptor already attaches the token.** Do not set the
   `Authorization` header manually anywhere.
2. **Signed out, `/earnings` must not look like an empty success.** A 401 is not
   "you have no earnings". Show something that tells the truth.
3. **Complete the response interceptor** in `lib/api/client.ts`. There is a
   `TODO` marking where.
4. **Distinguish a transport failure from a business refusal.** If the API is
   unreachable, `error.response` is `undefined` — a message like "you are not
   permitted" would then be a lie. Handle both.
5. Sign out clears stored auth.

## Test accounts

| Email | Password | Role |
|---|---|---|
| `instructor@example.test` | `assessment123` | instructor |
| `learner@example.test` | `assessment123` | learner |

## Evidence required

- `evidence/task-2-signedout.png` — `/earnings` while signed out
- `evidence/task-2-signedin.png` — `/earnings` with the balance showing
- `evidence/task-2-network.png` — a request showing the `Authorization` header,
  **with the token value redacted**

> **Redact the token.** The `Authorization` header must be **visible** — we need
> to see that you sent it, and that it says `Bearer` — but **black out or blur
> the token value itself** before you commit the screenshot. Show:
>
> ```
> Authorization: Bearer ███████████ (redacted)
> ```
>
> A screenshot with a live token in it is a credential in your public
> repository. Redacting it is part of what we are assessing.


> **Try the learner account on `/earnings`.** The contract says a learner must
> get **403**, not an empty result. Note what actually happens.
