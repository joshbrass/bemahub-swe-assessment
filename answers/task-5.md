# Task 5 — Database

> Paste the **terminal output** of every query, not just the SQL. For this task
> the output is the answer.

## 5.1 Investigate — NULL vs 0

```sql
-- your query
```

```
-- output
```

**Which rows are genuinely 0, and which are NULL?**

**Why does this matter to a user?** (two sentences)

## 5.2 The constraint

**Proof — two inserts with the same instructor_id and payout_reference:**

```sql
-- your inserts
```

```
-- output
```

**Did the unique key prevent the duplicate? If not, exactly why?**

### The fix — `database/migrations/002_fix_withdrawal_reference.sql`

**Why a new migration rather than editing `001_initial.sql`:** (one line)

**Applying it:**

```
-- output of applying the migration
```

**`SHOW CREATE TABLE wp_bl_withdrawals;` afterwards:**

```
-- output
```

**The duplicate insert, re-run and now rejected:**

```
-- output
```

## 5.3 The join

```sql
-- your query
```

```
-- output
```

**Which join type did you use, and what would break with the other one?**
