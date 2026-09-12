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
