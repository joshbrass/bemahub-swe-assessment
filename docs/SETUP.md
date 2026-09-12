# Setup — BemaHub Software Engineer Assessment

**Expected setup time: 10–20 minutes.**

> **If setup exceeds 20 minutes because of environment or Docker issues, stop
> and contact us.** Reply to the assessment email thread. We will help or adjust
> the timing. We are assessing your engineering, not your operating system — a
> lost hour on an installation problem tells us nothing useful about you, and it
> is our packaging problem to solve, not yours.

Setup time is **not** part of your 180-minute coding session.

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node | **>=22 and <25** | `node -v` |
| Docker | **Docker Desktop** (Windows/macOS) **or Docker Engine + Compose v2** (Linux) | `docker --version` and `docker compose version` |
| Python | **3.12+** (Task 7) | `python --version` or `py -3 --version` |
| Git | any | `git --version` |

Nothing else. **No WordPress install, no MySQL install, no PHP install.**

> **Node must be in the range `>=22 <25`.** That is what the frontend is built
> and locked against, and `npm ci` enforces it. Node 25+ and Node 20 are both
> outside the supported range. `nvm install 22` (or `nvm-windows`) is the
> quickest fix.

## 1. Your repository

Create a **public** GitHub repository, then:

```bash
git clone <your-repo-url> bemahub-assessment
cd bemahub-assessment
# copy the contents of this package in
git add -A
git commit -m "Starter package, unmodified"
git push
```

**Commit the starter unchanged first.** That baseline is how we can tell your
work from ours.

Two rules for that repository:

- It must be **public and reachable without requesting permission.** We will not
  ask for access; a repository we cannot open counts as not submitted.
- **Do not commit real credentials** — passwords, API keys, tokens or `.env`
  secrets. The local test logins shipped in this package (`assessment123`, the
  `bemalearn` MySQL user) are deliberately public and are fine to commit.

Full submission steps are in `README.md` under **GitHub Submission**.

## 2. Backend

```bash
cd wordpress-plugin
docker compose up -d
docker compose logs -f wordpress    # wait for "Bema Learn ready"
```

First run pulls images — **3–5 minutes**. After that it is seconds.

**Verify:**
```bash
curl -i http://localhost:8080/wp-json/bemalearn/v1/courses
```
Expect `200 OK` and JSON.

## 3. Frontend

```bash
cd ../frontend
npm ci          # NOT npm install - installs exactly the locked versions
npm run dev
```

Open http://localhost:3000.

**Check the build toolchain works before your session starts:**

```bash
npm run typecheck
npm run build
```

Both should pass on the unmodified starter. If either fails before you have
changed anything, that is our packaging problem — email us.

## Useful commands

```bash
# reset all assessment data
docker compose -f wordpress-plugin/docker-compose.yml exec wordpress \
  wp bemalearn reset --allow-root

# PHP error log
docker compose -f wordpress-plugin/docker-compose.yml exec wordpress \
  tail -50 /var/www/html/wp-content/debug.log

# database
mysql -h 127.0.0.1 -P 3307 -u bemalearn -passessment bemalearn

# stop everything
docker compose -f wordpress-plugin/docker-compose.yml down
```

PHP edits are live immediately — the plugin folder is mounted, no rebuild.

## If something will not start

| Symptom | Likely cause |
|---|---|
| Port 8080 in use | Change the left side of `"8080:80"` |
| Port 3307 in use | Change the left side of `"3307:3306"` |
| `docker compose` not found | Older Docker — try `docker-compose` |
| WordPress 500s on first load | MySQL still starting; wait 30s and reload |
| `npm ci` engine error | Node outside `>=22 <25` |
| `npm ci` says lockfile out of sync | You edited `package.json`; run `npm install` once, and commit the updated lockfile |

> **If setup exceeds 20 minutes, stop and email us.** That is our packaging
> problem, not your assessment. Tell us what you saw — the command, the output
> and your OS — and carry on with the tasks that do not need the container
> (Task 6 needs nothing running at all).

---

## What you do not need

You will **not** be given access to BemaHub source code, repositories, servers
or any internal system. Everything required is inside this package. Bema Learn
is a self-contained fictional application built for this assessment only.
