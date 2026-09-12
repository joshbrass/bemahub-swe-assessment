# Task 5 — Database (22 min)

**Connect:** see `database/README.md` (MySQL on port **3307**)

Answer in `answers/task-5.md`, **with the terminal output of every query**.

## 5.1 — Investigate (8 min)

An instructor reports their course shows **"0 enrolments"** although nobody has
enrolled yet, and another shows **"0 rating"** although nobody has rated it.

- Write a query showing, for every course, `enrolment_count` and
  `average_rating` **including their NULL-ness**.
- Which rows are genuinely `0`, and which are `NULL`?
- **Why does this matter to a user?** Two sentences.

## 5.2 — The constraint (10 min) — *the important one*

`wp_bl_withdrawals` carries:

```sql
UNIQUE KEY uq_reference (instructor_id, payout_reference, cancelled_at)
```

It is meant to guarantee that **one instructor cannot create two withdrawals
with the same `payout_reference`** — the protection against a retry paying
twice.

- **Prove whether it actually does that.** Insert two rows with the same
  `instructor_id` and `payout_reference`, both with `cancelled_at` NULL.
- Show the result.
- If both succeeded, **explain exactly why**.

### Then fix it, forward-only

The schema this database booted with is recorded in
`database/migrations/001_initial.sql`. **That migration has already been
applied. Do not edit it** — editing an applied migration changes nothing on your
database and rewrites history for anyone who has not run it yet.

Instead, **create a new file**:

```
database/migrations/002_fix_withdrawal_reference.sql
```

1. Write the corrective migration in that file.
2. **Apply it** to the running database.
3. **Show the runtime SQL evidence** that it worked — paste the terminal output
   of:
   - applying the migration;
   - `SHOW CREATE TABLE wp_bl_withdrawals;` **after** applying it;
   - the duplicate-insert attempt from above **re-run**, now rejected.

State in one line why a new migration rather than an edit to `001`.

> Existing duplicate rows will block a unique index from being created. Deal
> with that — and say what you did.

## 5.3 — A join (7 min)

Return **one row per course**: title, number of **non-refunded** enrolments, and
total non-refunded revenue in minor units.

**Courses with zero enrolments must still appear**, showing 0.

- Provide the query and its output.
- Say which join type you used and what would break with the other one.
