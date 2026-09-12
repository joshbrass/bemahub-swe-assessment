# Task 5 — Database

> Paste the **terminal output** of every query, not just the SQL. For this task
> the output is the answer.

All queries below were run against the running assessment database via:

```bash
docker compose -f wordpress-plugin/docker-compose.yml exec -T db \
  mysql -u bemalearn -passessment bemalearn -e "<query>"
```

(equivalent to connecting with `mysql -h 127.0.0.1 -P 3307 -u bemalearn -passessment bemalearn`).

## 5.1 Investigate — NULL vs 0

```sql
SELECT
  id,
  title,
  enrolment_count,
  enrolment_count IS NULL AS enrolment_count_is_null,
  average_rating,
  average_rating IS NULL AS average_rating_is_null
FROM wp_bl_courses
ORDER BY id;
```

```
id      title                           enrolment_count enrolment_count_is_null average_rating  average_rating_is_null
1       Introduction to Bread Baking    128             0                       4.60            0
2       Sourdough Starters              64              0                       4.20            0
3       Pastry Fundamentals             NULL            1                       NULL            1
4       Cake Decorating Basics          9               0                       0.00            0
5       Advanced Laminated Dough        0               0                       NULL            1
```

**Which rows are genuinely 0, and which are NULL?**

- Course 4 ("Cake Decorating Basics") has a genuine `average_rating` of **0.00**
  — it has been rated, and the rating is a real, measured zero.
- Course 5 ("Advanced Laminated Dough") has `enrolment_count = 0` — a real,
  measured zero enrolments — but `average_rating = NULL`, because with no
  enrolments there is nothing to average yet.
- Course 3 ("Pastry Fundamentals") has **both** `enrolment_count` and
  `average_rating` as `NULL` — nobody has counted enrolments for it yet at
  all, which is different from "counted and found zero".
- Courses 1 and 2 have real, non-null counts and ratings for both columns.

**Why does this matter to a user?** `NULL` ("not yet counted / no ratings
exist yet") and `0` ("counted, and the answer is zero") describe two different
real-world situations, and collapsing them into the same displayed "0" tells
the instructor a falsehood either way: showing `0` for course 3's
`enrolment_count` would claim the count has been run and nobody enrolled, when
in fact it simply hasn't been computed yet — the instructor in the prompt
("0 enrolments" / "0 rating") is reading exactly that false signal, because
somewhere between here and the screen the `NULL` was already turned into `0`.

## 5.2 The constraint

**Proof — two inserts with the same instructor_id and payout_reference:**

```sql
INSERT INTO wp_bl_withdrawals (instructor_id, amount_minor, status, payout_reference, cancelled_at, created_at)
VALUES (999999, 1000, 'pending', 'wd_dup_test_1', NULL, UTC_TIMESTAMP());

INSERT INTO wp_bl_withdrawals (instructor_id, amount_minor, status, payout_reference, cancelled_at, created_at)
VALUES (999999, 1000, 'pending', 'wd_dup_test_1', NULL, UTC_TIMESTAMP());

SELECT id, instructor_id, amount_minor, status, payout_reference, cancelled_at, created_at
  FROM wp_bl_withdrawals WHERE instructor_id = 999999;
```

```
id      instructor_id   amount_minor    status  payout_reference       cancelled_at    created_at
2       999999          1000            pending wd_dup_test_1           NULL            2026-09-12 23:02:41
3       999999          1000            pending wd_dup_test_1           NULL            2026-09-12 23:02:41
```

**Did the unique key prevent the duplicate? If not, exactly why?**

No — both inserts succeeded (ids 2 and 3), same `instructor_id`, same
`payout_reference`, no error. `SHOW CREATE TABLE` at this point confirmed the
key as shipped:

```
UNIQUE KEY `uq_reference` (`instructor_id`,`payout_reference`,`cancelled_at`)
```

The key is a 3-column composite, and `cancelled_at` is `NULL` on every normal,
not-yet-cancelled withdrawal. In a MySQL unique index, `NULL` is never
considered equal to another `NULL` (the same rule as `NULL <> NULL` in a
`WHERE` clause) — a unique index only rejects a new row when **every** column
in the key matches an existing row's value, and two `NULL`s never "match" for
this purpose. So `(999999, 'wd_dup_test_1', NULL)` does not collide with
`(999999, 'wd_dup_test_1', NULL)` as far as the index is concerned, even
though every column looks identical. The exact case the key exists to
prevent — a retried request creating a second payout — is precisely the case
where `cancelled_at` is `NULL` on both attempts, so the constraint never fires
when it matters.

### The fix — `database/migrations/002_fix_withdrawal_reference.sql`

**Why a new migration rather than editing `001_initial.sql`:** `001` has
already been applied to this database, so editing it changes nothing here and
would silently diverge from anyone who runs it fresh — schema changes have to
be new, forward-only files so every environment applies the same sequence of
changes and arrives at the same schema.

**Existing duplicate rows found:** the two proof rows inserted above
(`instructor_id = 999999`, both `payout_reference = 'wd_dup_test_1'`,
`cancelled_at` NULL) were test artifacts, not real withdrawal data, and would
have blocked the new 2-column unique index from being created. They were
deleted before applying the migration:

```sql
DELETE FROM wp_bl_withdrawals WHERE instructor_id = 999999;
SELECT ROW_COUNT() AS rows_deleted;
```

```
rows_deleted
2
```

Checked for any other pre-existing duplicate `(instructor_id, payout_reference)`
pairs before proceeding:

```sql
SELECT instructor_id, payout_reference, COUNT(*) AS n
  FROM wp_bl_withdrawals
 GROUP BY instructor_id, payout_reference
 HAVING COUNT(*) > 1;

SELECT 'no duplicates remain' AS status;
```

```
status
no duplicates remain
```

(the `GROUP BY … HAVING` query itself printed no rows/header at all — MySQL's
non-interactive `-e` mode prints nothing for an empty result set — so the
`SELECT 'no duplicates remain'` line was added just to get a visible
confirmation that the check ran and found none.)

No other pre-existing rows shared an `(instructor_id, payout_reference)` pair,
so no other deduplication was needed.

**The migration file** (`database/migrations/002_fix_withdrawal_reference.sql`):

```sql
ALTER TABLE wp_bl_withdrawals
  DROP INDEX uq_reference,
  ADD UNIQUE KEY uq_reference (instructor_id, payout_reference);
```

`cancelled_at` is dropped from the key entirely rather than kept alongside it:
`payout_reference` is the idempotency key for an instructor's withdrawal
attempt and the API requires it on every request, so it must be unique per
instructor regardless of whether that withdrawal was later cancelled — the
cancellation state was never actually meant to be part of "is this the same
attempt".

**Applying it:**

```bash
docker compose -f wordpress-plugin/docker-compose.yml exec -T db \
  mysql -u bemalearn -passessment bemalearn \
  < database/migrations/002_fix_withdrawal_reference.sql
```

```
(no output - the ALTER TABLE ran and exited with status 0)
```

**`SHOW CREATE TABLE wp_bl_withdrawals;` afterwards:**

```sql
SHOW CREATE TABLE wp_bl_withdrawals;
```

```
CREATE TABLE `wp_bl_withdrawals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `instructor_id` bigint unsigned NOT NULL,
  `amount_minor` int unsigned NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'pending',
  `payout_reference` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reference` (`instructor_id`,`payout_reference`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
```

**The duplicate insert, re-run and now rejected:**

```sql
INSERT INTO wp_bl_withdrawals (instructor_id, amount_minor, status, payout_reference, cancelled_at, created_at)
VALUES (999999, 1000, 'pending', 'wd_dup_test_1', NULL, UTC_TIMESTAMP());
```
```
(succeeds - no matching row existed after the cleanup above)
```

```sql
INSERT INTO wp_bl_withdrawals (instructor_id, amount_minor, status, payout_reference, cancelled_at, created_at)
VALUES (999999, 1000, 'pending', 'wd_dup_test_1', NULL, UTC_TIMESTAMP());
```
```
ERROR 1062 (23000) at line 2: Duplicate entry '999999-wd_dup_test_1' for key 'wp_bl_withdrawals.uq_reference'
```

The second, identical insert is now rejected by the database itself. The test
row was deleted afterwards (`DELETE FROM wp_bl_withdrawals WHERE
instructor_id = 999999;`, `rows_deleted: 1`) so only the real seeded
withdrawal (`id = 1`, instructor 2) remains in the table.

## 5.3 The join

```sql
SELECT
  c.id,
  c.title,
  COUNT(e.id) AS enrolment_count,
  COALESCE(SUM(e.amount_paid_minor), 0) AS revenue_minor
FROM wp_bl_courses c
LEFT JOIN wp_bl_enrolments e
  ON e.course_id = c.id
 AND e.refunded_at IS NULL
GROUP BY c.id, c.title
ORDER BY c.id;
```

```
id      title                           enrolment_count revenue_minor
1       Introduction to Bread Baking    2               9000
2       Sourdough Starters              0               0
3       Pastry Fundamentals             0               0
4       Cake Decorating Basics          0               0
5       Advanced Laminated Dough        0               0
```

Underlying `wp_bl_enrolments` data, for reference:

```
id  course_id  learner_id  amount_paid_minor  rating  refunded_at
1   1          3           4500               5       NULL
2   1          3           4500               NULL    NULL
3   2          3           6000               4       2026-09-12 14:14:07
```

Course 1 has two non-refunded enrolments (4500 + 4500 = 9000). Course 2's only
enrolment was refunded, so it correctly shows 0/0 rather than counting it.
Courses 3, 4 and 5 have no enrolments at all, and still appear with 0/0.

**Which join type did you use, and what would break with the other one?**

`LEFT JOIN`, with the `refunded_at IS NULL` condition in the **`ON`** clause,
not a `WHERE` clause. Filtering inside `ON` decides which enrolment rows are
allowed to match while still keeping every course row via the left join, even
when nothing matches; filtering the identical condition in `WHERE` instead
runs *after* the join and behaves differently depending on what the join
actually found:

```sql
-- same condition, moved from ON to WHERE
SELECT c.id, c.title, COUNT(e.id) AS enrolment_count,
       COALESCE(SUM(e.amount_paid_minor), 0) AS revenue_minor
FROM wp_bl_courses c
LEFT JOIN wp_bl_enrolments e ON e.course_id = c.id
WHERE e.refunded_at IS NULL
GROUP BY c.id, c.title
ORDER BY c.id;
```

```
id      title                           enrolment_count revenue_minor
1       Introduction to Bread Baking    2               9000
3       Pastry Fundamentals             0               0
4       Cake Decorating Basics          0               0
5       Advanced Laminated Dough        0               0
```

Course 2 ("Sourdough Starters") vanishes entirely. Courses 3/4/5 have no
enrolment rows at all, so the left join's own "no match" row already carries
`e.refunded_at = NULL`, and `WHERE e.refunded_at IS NULL` happens to still be
true for that — they survive by accident. But course 2's one enrolment *did*
match the join (`e.course_id = c.id` succeeded), so its `e.refunded_at` is a
real, non-null timestamp; `WHERE e.refunded_at IS NULL` then discards that row
outright, and with no remaining row to group on, course 2 disappears from the
output instead of showing `0` — a course with only refunded enrolments is
silently indistinguishable from one that was never in the result set at all.
Putting the condition in `ON` avoids this: the join always keeps one row per
course, refunded or not, and only decides afterward whether an enrolment
counts.

A plain `INNER JOIN` breaks more obviously — it drops every course that has
no *matching* row at all, refunded or not:

```sql
SELECT
  c.id,
  c.title,
  COUNT(e.id) AS enrolment_count,
  COALESCE(SUM(e.amount_paid_minor), 0) AS revenue_minor
FROM wp_bl_courses c
INNER JOIN wp_bl_enrolments e
  ON e.course_id = c.id
 AND e.refunded_at IS NULL
GROUP BY c.id, c.title
ORDER BY c.id;
```

```
id      title                           enrolment_count revenue_minor
1       Introduction to Bread Baking    2               9000
```

With `INNER JOIN`, courses 2, 3, 4 and 5 vanish from the result entirely
instead of appearing as 0 — exactly the requirement the task calls out
("Courses with zero enrolments must still appear as 0").





Microsoft Windows [Version 10.0.19045.6466]
(c) Microsoft Corporation. All rights reserved.

C:\Users\HP>docker exec -it wordpress-plugin-db-1 mysql -ubemalearn -passessment bemalearn
mysql: [Warning] Using a password on the command line interface can be insecure.
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 2131
Server version: 8.4.11 MySQL Community Server - GPL

Copyright (c) 2000, 2026, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> SELECT id, title, enrolment_count, average_rating FROM wp_bl_courses ORDER BY id;
+----+------------------------------+-----------------+----------------+
| id | title                        | enrolment_count | average_rating |
+----+------------------------------+-----------------+----------------+
|  1 | Introduction to Bread Baking |             128 |           4.60 |
|  2 | Sourdough Starters           |              64 |           4.20 |
|  3 | Pastry Fundamentals          |            NULL |           NULL |
|  4 | Cake Decorating Basics       |               9 |           0.00 |
|  5 | Advanced Laminated Dough     |               0 |           NULL |
+----+------------------------------+-----------------+----------------+
5 rows in set (0.04 sec)

mysql> INSERT INTO wp_bl_withdrawals (instructor_id, amount_minor, status, payout_reference, cancelled_at) VALUES (2, 1000, 'pending', 'wd_dup_test', NULL);
Query OK, 1 row affected (0.06 sec)

mysql> INSERT INTO wp_bl_withdrawals (instructor_id, amount_minor, status, payout_reference, cancelled_at) VALUES (2, 1000, 'pending', 'wd_dup_test', NULL);
ERROR 1062 (23000): Duplicate entry '2-wd_dup_test' for key 'wp_bl_withdrawals.uq_reference'
mysql> SHOW CREATE TABLE wp_bl_withdrawals\G
*************************** 1. row ***************************
       Table: wp_bl_withdrawals
Create Table: CREATE TABLE `wp_bl_withdrawals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `instructor_id` bigint unsigned NOT NULL,
  `amount_minor` int unsigned NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'pending',
  `payout_reference` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reference` (`instructor_id`,`payout_reference`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
1 row in set (0.00 sec)

mysql> SELECT c.title,
    ->        COUNT(e.id) AS non_refunded_enrolments,
    ->        COALESCE(SUM(e.amount_paid_minor), 0) AS revenue_minor
    -> FROM wp_bl_courses c
    -> LEFT JOIN wp_bl_enrolments e
    ->   ON e.course_id = c.id
    ->  AND e.refunded_at IS NULL
    -> GROUP BY c.id, c.title
    -> ORDER BY c.id;
+------------------------------+-------------------------+---------------+
| title                        | non_refunded_enrolments | revenue_minor |
+------------------------------+-------------------------+---------------+
| Introduction to Bread Baking |                       2 |          9000 |
| Sourdough Starters           |                       0 |             0 |
| Pastry Fundamentals          |                       0 |             0 |
| Cake Decorating Basics       |                       0 |             0 |
| Advanced Laminated Dough     |                       0 |             0 |
+------------------------------+-------------------------+---------------+
5 rows in set (0.03 sec)

mysql>


