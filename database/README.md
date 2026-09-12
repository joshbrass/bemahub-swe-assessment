# Database task environment

The MySQL container from `wordpress-plugin/docker-compose.yml` is exposed on
**port 3307**, so you can query it directly.

```bash
mysql -h 127.0.0.1 -P 3307 -u bemalearn -passessment bemalearn
```

Or, if you would rather not install a client:

```bash
docker compose -f wordpress-plugin/docker-compose.yml exec db \
  mysql -u bemalearn -passessment bemalearn -e "SHOW TABLES;"
```

Tables: `wp_bl_courses`, `wp_bl_enrolments`, `wp_bl_earnings_ledger`,
`wp_bl_withdrawals`.

## Migrations

```
database/migrations/
  001_initial.sql    <- ALREADY APPLIED. Do not edit.
```

`001_initial.sql` records the schema this database booted with. It **has already
run**, so editing it changes nothing on your database and rewrites history for
anyone who has not run it yet.

**Task 5.2 asks you to add a new one:**

```
database/migrations/002_fix_withdrawal_reference.sql
```

Write it, **apply it**, and capture the terminal output proving it worked.
Forward-only: schema changes are new numbered files, never edits to applied ones.

Apply a migration file with:

```bash
docker compose -f wordpress-plugin/docker-compose.yml exec -T db \
  mysql -u bemalearn -passessment bemalearn \
  < database/migrations/002_fix_withdrawal_reference.sql
```

**Capture your terminal output.** For this task the output *is* the answer.
