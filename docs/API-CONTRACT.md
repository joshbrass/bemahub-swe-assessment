# Bema Learn API Contract

**Base URL:** `http://localhost:8080/wp-json/bemalearn/v1`

This is the document the frontend builds against. **Where the contract and the
implementation disagree, the contract is correct** — that is Task 4.

---

## Conventions

- All responses are JSON.
- Money is in **minor units** (integers). `priceMinor: 4500` = **45.00**.
  Never use floats for money.
- Timestamps are **ISO-8601 with an explicit offset**.
- **`null` and `0` are different.** `null` means *not known* or *not applicable*.
  `0` means *a real, measured zero*. The UI must not display them the same way.

## Errors

```json
{ "code": "insufficient_balance",
  "message": "Your available balance is lower than the requested amount.",
  "data": { "status": 422 } }
```

| Status | Meaning |
|---|---|
| 400 | Malformed request |
| 401 | Missing or invalid token |
| 403 | Authenticated, but not permitted |
| 404 | Not found |
| 422 | Valid shape, refused by a business rule |

---

## `GET /courses`

**Public.** No authentication.

```json
{
  "courses": [
    {
      "id": 1,
      "title": "Introduction to Bread Baking",
      "instructorName": "Ada Okafor",
      "priceMinor": 4500,
      "currency": "NGN",
      "enrolmentCount": 128,
      "averageRating": 4.6,
      "publishedAt": "2026-03-14T09:00:00+01:00",
      "isPublished": true
    }
  ],
  "previewExpiresInSeconds": 300
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | integer | |
| `title` | string | |
| `instructorName` | string | |
| `priceMinor` | integer | Minor units |
| `currency` | string | ISO 4217 |
| **`enrolmentCount`** | **integer \| null** | **`null` = not yet counted. Display as "—", NOT as 0** |
| **`averageRating`** | **number \| null** | **`null` = no ratings yet. `0` would mean rated zero** |
| `publishedAt` | string \| null | `null` if unpublished |
| `isPublished` | boolean | |
| `previewExpiresInSeconds` | integer | Data is stale after this; refetch |

**Only published courses appear here.** An unpublished course must never be
returned by this endpoint.

---

## `POST /auth/login`

**Public.**

```json
// request
{ "email": "instructor@example.test", "password": "assessment123" }

// 200
{ "token": "eyJ…", "user": { "id": 7, "name": "Ada Okafor", "role": "instructor" } }

// 401
{ "code": "invalid_credentials", "message": "Email or password is incorrect.", "data": { "status": 401 } }
```

Send the token on protected routes as:

```
Authorization: Bearer <token>
```

**Test accounts** (seeded):

| Email | Password | Role |
|---|---|---|
| `instructor@example.test` | `assessment123` | instructor |
| `learner@example.test` | `assessment123` | learner |

---

## `GET /me/earnings`

**Requires authentication. Instructors only.**
A learner's token must receive **403**, not an empty result.

```json
{
  "availableMinor": 128500,
  "pendingMinor": 45000,
  "currency": "NGN",
  "minimumWithdrawalMinor": 50000,
  "lastWithdrawalAt": null
}
```

| Field | Type | Notes |
|---|---|---|
| `availableMinor` | integer | Withdrawable now |
| `pendingMinor` | integer | Held, not yet available |
| `minimumWithdrawalMinor` | integer | **Read from the API. Do not hardcode it** |
| `lastWithdrawalAt` | string \| null | `null` = never withdrawn |

---

## `POST /me/withdrawals`

**Requires authentication. Instructors only.**

```json
// request
{ "amountMinor": 60000, "payoutReference": "wd_8f2a1c" }
```

| Field | Required | Notes |
|---|---|---|
| `amountMinor` | yes | Integer. Must be ≥ `minimumWithdrawalMinor` and ≤ `availableMinor` |
| `payoutReference` | yes | Client-generated, unique per attempt. **Idempotency key** |

**`payoutReference` must also be sent as an `Idempotency-Key` header.**

> **Why this matters.** If the network drops after the server has created the
> withdrawal but before you see the response, a retry with the *same* reference
> must return the **original** withdrawal — not create a second payout. Money
> moves once. This is enforced by a unique index in the database.

```json
// 201
{ "id": 42, "amountMinor": 60000, "status": "pending",
  "payoutReference": "wd_8f2a1c", "createdAt": "2026-09-09T14:22:10+01:00" }
```

| Refusal | Status | Code |
|---|---|---|
| Below the minimum | 422 | `below_minimum` |
| More than available | 422 | `insufficient_balance` |
| A withdrawal is already pending | 422 | `withdrawal_in_progress` |
| Duplicate reference | **200** | returns the **original**, not an error |
| Not an instructor | 403 | `forbidden` |
| No token | 401 | `unauthenticated` |

---

## `GET /courses/{id}`

**Public** for a published course. **404** for an unpublished one — a 403 would
confirm the course exists, which is itself a disclosure.

```json
{ "id": 1, "title": "…", "description": "…", "instructorName": "…",
  "priceMinor": 4500, "currency": "NGN", "lessonCount": 12,
  "enrolmentCount": 128, "averageRating": 4.6,
  "publishedAt": "2026-03-14T09:00:00+01:00" }
```
