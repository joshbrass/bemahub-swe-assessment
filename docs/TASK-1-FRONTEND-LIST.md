# Task 1 — Course list (32 min)

**Route:** `/courses`
**Contract:** `docs/API-CONTRACT.md` → `GET /courses`

## What to build

A page listing the published courses. For each: title, instructor, price,
enrolment count and rating.

## Requirements

1. **Fetch with React Query.** Not `useEffect` + `fetch`.
2. **Three distinct states** — loading, error, empty. A failed request and an
   empty list must not look the same. `components/StatusMessage.tsx` shows the
   house style.
3. **`enrolmentCount` and `averageRating` are nullable.** `null` means *not yet
   counted*; `0` is a real measurement. **They must not render the same way.**
   The seed data contains both cases — find them.
4. **Money is in minor units.** Use `lib/format.ts`. Never divide by 100 inline.
5. **Respect `previewExpiresInSeconds`** — after that, the data is stale. Decide
   what to do and say why in `SOLUTION.md`.
6. **TypeScript.** Types are in `lib/types/api.ts`. Do not use `any`.

## Evidence required

- `evidence/task-1-ui.png` — the rendered list
- `evidence/task-1-network.png` — DevTools Network showing the request URL,
  status, and the response body

> One course in the seed data is **unpublished**. The contract says it must
> never appear in this list. If you see it, that is not a frontend bug — note
> it, and see Task 4.
