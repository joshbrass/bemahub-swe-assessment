# Task 4 — WordPress / PHP defects (35 min)

**Plugin:** `wordpress-plugin/`
**Contract:** `docs/API-CONTRACT.md` — where code and contract disagree, **the
contract is right**.

## The situation

The Bema Learn API is running and returns data. It also contains **four
defects**. They are the kinds that do not announce themselves: nothing crashes,
no error is logged, and a casual test passes.

## Your job

1. **Find all four.** They are in the controllers and the schema.
2. **Fix them**, minimally. Do not rewrite files.
3. **Prove each fix with a real HTTP response.**

## Categories — one of each

| # | Category | Hint |
|---|---|---|
| 1 | **Permission** | A route checks that you are signed in, but not *who* you are |
| 2 | **Schema mismatch** | Code reads a column the migration never created, and a contract-required field quietly loses its value |
| 3 | **API contract** | One route returns rows the contract says it must never return |
| 4 | **Validation** | One documented business rule on a money endpoint is never enforced |

**Exactly four.** Not three, not five. Each has one narrow, minimal fix.

> Both accounts in `API-CONTRACT.md` are seeded and usable. **Comparing what
> two different roles get back from the same endpoint is a productive way to
> spend your first five minutes.**

## How to work

```bash
# call the API
curl -i http://localhost:8080/wp-json/bemalearn/v1/courses

# after editing PHP, the change is live immediately (the plugin is mounted)
# check the log if something breaks:
docker compose -f wordpress-plugin/docker-compose.yml exec wordpress \
  tail -50 /var/www/html/wp-content/debug.log

# reset the data if you need a clean slate:
docker compose -f wordpress-plugin/docker-compose.yml exec wordpress \
  wp bemalearn reset --allow-root
```

## Evidence required

`evidence/task-4-curl.txt` — for **each** defect, the `curl -i` output **before
and after** your fix. Full headers and body.

> A response containing a database-generated id or timestamp is the strongest
> evidence, because it can only come from actually running the request.

## In `SOLUTION.md`

For each defect: **what it was, why it is wrong, what you changed, how you
proved it.**

> **The permission defect is the serious one.** If you find only one, find that
> one. Missing it entirely — or "fixing" it without noticing what it exposed —
> is treated as a fail regardless of the rest of your score.

## A note on scope

Fix the four defects. **Do not "fix" things the contract does not ask for** —
inventing a column, adding a field, or hardening something nobody asked about
is not credit, and we read it as a signal about how you would treat a spec.
`docs/API-CONTRACT.md` is the authority.
