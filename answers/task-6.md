# Task 6 — Infrastructure

## Incident 1 — the invisible deploy

Check cheapest first:

1. Am I on the same URL/environment as the colleague? Staging vs production, or a preview URL vs the live host, explains "it works for me" without any failed pipeline.
2. Hard refresh / incognito. Browser or CDN cache often keeps the old JS bundle after a green deploy.
3. What commit/SHA is actually running? Compare the deployed image digest or build banner to the commit we pushed. A green pipeline can still publish an old artefact.
4. Did frontend and API both roll out? A UI change that needs a new field looks "missing" if only one side shipped.

I would not start by rewriting the feature. First prove the browser is loading the new artefact.

## Incident 2 — 502 after deploy

502 means the proxy could not get a valid response from the app. "Container running" only means the process has not exited.

Most likely, given a new feature that reads config:

1. Missing or empty env var — app starts, then fails on the first request. Confirm in container logs on that request, not only `docker ps`.
2. App listening on a different port than the proxy expects after a config change.
3. Process not ready yet — replica marked live before it is listening.
4. Bad config value that only exists locally (DB URL, DNS). Compare env inside the container with local `.env`.

Eliminate "the code is broken everywhere" first: it works locally, so the difference is env, port, or startup.

## Incident 3 — the vanishing change

The colleague changed the **running container**, not the **image**. A deploy creates a new container from the image. Anything installed with `apt`/`npm` inside the old container is discarded, with no error.

The change should go in the Dockerfile (or repo config) and be rebuilt and redeployed. Debug tools that must persist belong in the image or a sidecar, not `docker exec` + install.