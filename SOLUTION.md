# Solution notes

## Task 1 — Course list

**`previewExpiresInSeconds` → React Query `staleTime`.**

`GET /courses` returns `previewExpiresInSeconds` alongside the list, telling
the client how long that particular response stays fresh. `frontend/app/courses/page.tsx`
passes `staleTime` as a function (supported by TanStack Query v5):

```ts
staleTime: (query) => {
  const seconds = query.state.data?.previewExpiresInSeconds;
  return seconds !== undefined ? seconds * 1000 : 0;
},
```

Why a function instead of a fixed number: the expiry window is server-driven
data, not a constant we can hardcode at query-definition time — the server is
free to change it later without a frontend deploy. Reading it off
`query.state.data` means the cache's own freshness window always matches what
the last response actually said. Before the first successful fetch there is no
cached data yet, so the function falls back to `0`, which simply means "treat
as stale" — harmless, since there is nothing to keep fresh yet. Once data
lands, the list is considered fresh for exactly the server-declared window and
React Query will refetch (on next mount/focus/interval, per its own rules)
once that window has elapsed, rather than serving preview data past its
stated expiry.

## Task 3 — Withdrawal form

**Why `payoutReference` is generated once per attempt, not on every
click/retry.**

`payoutReference` is the idempotency key the server uses to recognize "this
is the same withdrawal I already saw" (`components/WithdrawalForm.tsx`
generates it lazily on first submit, and reuses it for the same amount on any
retry). If it were regenerated on every click, a retry after a network blip —
where the server actually created the withdrawal but the client never saw the
response — would arrive with a brand-new reference. The server would have no
way to recognize it as the same attempt and would create a **second**
withdrawal for the same money. The whole point of sending the same reference
on retry is that the unique index in the database then does the deduplication
for us: same reference twice returns the original withdrawal instead of
creating another one. A fresh reference is only generated after a success (so
the next, unrelated withdrawal is never mistaken for a retry of one that
already went through) or when the user changes the amount (which is a
genuinely different withdrawal, not a retry of the same one).

## Task 4 — WordPress / PHP defects

All four fixes are in `wordpress-plugin/includes/`; nothing else was changed,
and `database/migrations/001_initial.sql` was not touched.

### 1. Permission — `GET /me/earnings` accepted a learner token

**What it was:** the route's `permission_callback` was `check_authenticated`,
which only checks that *some* valid token was presented — it never looks at
the caller's role. **Why it's wrong:** the contract requires this endpoint to
be instructor-only and a learner's token to get 403, not their (nonexistent)
earnings. A learner calling `GET /me/earnings` got a 200 with someone else's
shaped-but-zeroed ledger data — an authenticated user seeing a money endpoint
they have no business seeing. **What changed:** the route now uses
`check_instructor` (`class-bl-earnings-controller.php`), the same check
already used for `POST /me/withdrawals` — no new logic, just the correct
existing check wired to the route. **How proved:** logged in as both seeded
accounts and called the endpoint with each token:

```
learner@example.test  -> 403 {"code":"forbidden","message":"Instructors only.",...}
instructor@example.test -> 200 {"availableMinor":128500,...}
```

### 2. Schema mismatch — `lessonCount` read a column that doesn't exist

**What it was:** `get_course()` read `$row->lessons_total`, but the migration
only ever created `lesson_count`. **Why it's wrong:** the property doesn't
exist on the row object, so `$row->lessons_total ?? 0` silently fell back to
`0` for every course — no PHP warning with `debug.log` at its default level,
no crash, just a contract field (`lessonCount`) that quietly lied. **What
changed:** read `$row->lesson_count` instead (`class-bl-courses-controller.php`)
— the query already does `SELECT c.*`, so no query change was needed, only
the property name. **How proved:** `GET /courses/1` now returns
`"lessonCount":12`, matching `lesson_count` in the `wp_bl_courses` table for
that row (before the fix it returned `0` regardless of the row).

### 3. API contract — `GET /courses` returned unpublished rows

**What it was:** the list query had no `WHERE` clause on `is_published` at
all, so "Advanced Laminated Dough" (seeded `is_published = 0`) appeared in the
public list. **Why it's wrong:** the contract is explicit that only published
courses may appear here — the same rule `GET /courses/{id}` already enforces
(returning 404 for an unpublished course) was simply missing from the list
endpoint's query. **What changed:** added `WHERE c.is_published = 1` to the
list query (`class-bl-courses-controller.php`) — filtered in SQL, not in the
frontend, so it can't be bypassed by talking to the API directly. **How
proved:** `GET /courses` now returns 4 rows, none of them "Advanced Laminated
Dough" / id 5, while `GET /courses/5` still correctly 404s.

### 4. Validation — `minimumWithdrawalMinor` was never enforced

**What it was:** `create_withdrawal()` checked the request against
`availableMinor` (`insufficient_balance`) and against an in-progress
withdrawal, but never against `MINIMUM_WITHDRAWAL_MINOR` — the documented
`below_minimum` refusal did not exist in code. **Why it's wrong:** the
contract lists `below_minimum` as a required 422 refusal on this endpoint; an
instructor could withdraw any positive amount, including amounts the business
rule says are too small to process. **What changed:** added one check —
`if ($amount < self::MINIMUM_WITHDRAWAL_MINOR)` → `422 below_minimum` — before
the balance check and before the insert, using the constant that already
existed on the class (no new constant, no hardcoded value).
**How proved:** `POST /me/withdrawals` with `amountMinor: 100` (below the
seeded minimum of 50000) now returns
`422 {"code":"below_minimum","message":"The requested amount is below the minimum withdrawal.",...}`
instead of creating a pending row.

## Task 7 — `reconcile_earnings.py`

A `fee_minor` of `null` is treated as a zero fee, not an error: by the time
this script runs, the payout has already happened and the money has already
moved, so an ops batch reconciling *what was paid* should not crash and block
the whole report over one record's missing fee — it should total what it can
and let a human chase the missing fee separately, not lose visibility into
every other instructor's numbers in the same run.
