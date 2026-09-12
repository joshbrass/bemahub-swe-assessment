# BemaHub Software Engineer Assessment

**Starter package v1.0** — BemaHub Software Engineer Assessment Starter v1.0

**Bema Integrated Services Ltd**
**Role:** Frontend-strong Full Stack Software Engineer
**Time:** a 180-minute coding session, plus 10–20 minutes setup (setup is not
part of the 180)
**Window:** 48 hours from receipt — choose your own working session

---

## What this is

You will work in a small, self-contained application called **Bema Learn** — a
fictional course platform where instructors publish courses, learners enrol, and
instructors withdraw their earnings.

**Bema Learn is not one of our products, and it is not BemaHub.** It is a
training scenario written for this assessment and nothing else — none of this
code runs anywhere in our business. But the *shapes* of the problems are real:
a documented API contract, an authenticated route, a form that moves money, a
database with a subtle constraint bug, and a deployment that appears to succeed
while serving old code.

**You will not be given access to BemaHub source code, repositories or systems.**
Everything you need is in this package. You will build in **your own repository**
and submit that.

## What we are actually assessing

We are not testing recall. We are answering one question:

> *If this person joins, can we trust them to change something in a live system
> and know that it worked?*

| We weight heavily | We weight lightly |
|---|---|
| Did you **run** it and check the result? | Did you finish every task? |
| Do you handle the **failure** paths? | Is the styling polished? |
| Can you say what you **did not** verify? | Did you match our file layout? |
| Do you notice when something is **wrong in our brief**? | Raw speed |

**Incomplete work is expected and fine.** Three tasks done properly, with
evidence and honest notes, score better than seven rushed. If you run out of
time, say so and describe your approach.

---

## AI Tool Usage

**AI tools are allowed.** We use them daily. Using them is not cheating and will
not count against you.

However, you **must document** in `SOLUTION.md`:

- **where** AI was used;
- **which suggestions you accepted or rejected**, and why;
- **what you personally verified**, and how;
- **what assumptions you made**.

**Your submission must demonstrate that you understand the solution and can
explain your decisions.** We are evaluating engineering judgment, not whether
you typed every character yourself.

A candidate who submits AI-generated code they cannot explain will not progress.
Shortlisted candidates are asked to walk through their own code (see
**Technical Walkthrough** below) — if AI produced something you do not
understand, either understand it or remove it.

Most marks come from **runtime evidence** — real responses, real query output,
real screenshots. Those only exist if you actually ran the thing.

---

## Setup

**Expected setup time: 10–20 minutes.**

> **If setup exceeds 20 minutes because of environment or Docker issues, stop
> and contact us.** We will help or adjust. We are assessing engineering, not
> your operating system — losing your session to an installation problem would
> not tell us anything useful about you.

**You need:**

- **Node** — version **22 or newer, below 25** (`node -v`). This is the range
  the frontend is built and locked against.
- **Docker Desktop** for Windows/macOS, **or Docker Engine + Compose v2** for
  Linux.
- **Python 3.12+** for Task 7 (`python --version`).
- **Git.**

**You do not need:** a WordPress install, a database server, PHP, or any BemaHub
access.

```bash
# 1. Create your own PUBLIC repository, then:
git clone <your-empty-repo> bemahub-assessment
cd bemahub-assessment

# 2. Copy this package in, and commit it UNCHANGED as your first commit:
git add -A
git commit -m "Assessment starter package, unmodified"
git push

# 3. Backend (WordPress + MySQL + seeded data)
cd wordpress-plugin
docker compose up -d          # first run pulls images: 3-5 min
docker compose logs -f wordpress   # wait for "Bema Learn ready"

# 4. Frontend
cd ../frontend
npm ci                        # installs exactly the locked versions
npm run dev                   # http://localhost:3000
```

> **Use `npm ci`, not `npm install`.** The package ships a `package-lock.json`
> so that everyone — you and us — runs byte-identical dependencies. `npm ci`
> installs exactly that lockfile and fails loudly if it disagrees with
> `package.json`.

**Verify before starting your session:**

```bash
curl -i http://localhost:8080/wp-json/bemalearn/v1/courses
```

Expect `200 OK` and a JSON array.

Full detail and troubleshooting: `docs/SETUP.md`.

**That first commit matters.** It is the baseline that shows which work is
yours. Please do not squash it away.

---

## The tasks

| # | Task | Time | Brief |
|---|---|---|---|
| 1 | Frontend — course list from a contract | 32 min | `docs/TASK-1-FRONTEND-LIST.md` |
| 2 | Frontend — authentication and a protected route | 24 min | `docs/TASK-2-FRONTEND-AUTH.md` |
| 3 | Frontend — withdrawal form with validation | 24 min | `docs/TASK-3-FRONTEND-FORM.md` |
| 4 | WordPress/PHP — fix defects in a running plugin | 35 min | `docs/TASK-4-PHP.md` |
| 5 | Database — investigate and fix | 22 min | `docs/TASK-5-DATABASE.md` |
| 6 | Infrastructure — three incidents | 15 min | `docs/TASK-6-INFRASTRUCTURE.md` |
| 7 | Python — fix an operational script | 10 min | `docs/TASK-7-PYTHON.md` |
| 8 | `SOLUTION.md` — decisions, evidence, AI disclosure | 18 min | `docs/SUBMISSION-TEMPLATE.md` |

**Total: exactly 180 minutes (3 hours) of working time.** Setup is separate and
is not counted. Any order. If short on time, **Tasks 1 and 4 carry the most
marks.**

---

## Evidence — this is how marks are earned

Put evidence in `evidence/` at your repository root.

**We need to see that you ran it, not that you reasoned about it.**

| Task | Minimum evidence |
|---|---|
| 1–3 (frontend) | Screenshot of the working UI **and** a DevTools Network screenshot showing request, status and response body |
| 4 (PHP) | `curl -i` output for each fix — full headers and body, before and after |
| 5 (database) | Terminal output of your queries **and** their results |
| 6 (infrastructure) | Written answers; no execution required |
| 7 (Python) | Terminal output of a successful run **and** a deliberately failed run |

---

## How you are scored

| Area | Weight |
|---|---|
| **Frontend** (Tasks 1–3) | **40%** |
| **WordPress / PHP** (Task 4) | **20%** |
| **Database** (Task 5) | **15%** |
| **Infrastructure** (Task 6) | **10%** |
| **Engineering process & documentation** | **10%** |
| **Python** (Task 7) | **5%** |

Within every area we assess not only the code produced, but:

- your ability to **run and verify** your own changes;
- your **debugging approach** when something does not work;
- your **reasoning** — why this solution, not another;
- your understanding of **trade-offs**;
- your ability to **explain what you do not know** or did not test.

### Automatic fail, regardless of score

- **Committing a real credential** — an API key, access token, password or
  `.env` secret, whether it is ours, a third party's, or one you added
  yourself.
- Leaving an **endpoint that serves one user's private data to another** — and
  not noticing.
- **Undisclosed AI use** where it is evident.
- Claiming something works when the evidence shows it was never run.

### What we notice and value

- Commit history showing incremental work.
- **Asking us a clarifying question during the window.** That is a positive.
- "I did not finish X; here is how I would approach it."
- **Reporting any ambiguity you actually encounter in our brief.** If something
  is unclear or contradictory, tell us what you hit and what you assumed.

---

## Technical Walkthrough (20 minutes)

Shortlisted candidates are invited to a short technical conversation. You may be
asked to explain:

- your **implementation decisions**;
- **what you changed**, and why;
- **how you verified** your work;
- **what you did not test**;
- **what risks remain** in what you built;
- how you would **improve the solution for production**.

**You may also be asked to make, or to describe, a small change to the solution
you submitted** — for example extending something you built, or saying exactly
what you would edit and how you would verify it. Have your repository open and
runnable.

This is part of assessing engineering maturity. It is a conversation, not an
examination — "I did not check that, and here is how I would" is a good answer.

---

## GitHub Submission

1. Create a **public** GitHub repository for your completed assessment.
2. **Commit the starter package unchanged as your first commit.**
3. Complete the assessment and push your final work.
4. Submit the **public repository URL** by replying to the assessment email.
5. The repository must be **accessible without requesting permission**.
6. **Do not commit passwords, API keys, tokens, `.env` secrets, or other
   sensitive credentials.**

When you reply, include:

- the public repository URL;
- roughly how long you actually spent;
- confirmation that `SOLUTION.md` includes your AI disclosure.

### About the credentials in this package

This starter ships local-only test logins — `assessment123`, the MySQL user
`bemalearn`, the WordPress admin account. **These are published deliberately,
are local to your machine, and are not secrets.** Committing them is expected
and is not a finding against you.

The rule in point 6 is about **real** credentials: anything that authenticates
to a live system, ours or anyone else's, and anything you add yourself.

Questions during the window: reply to the same email thread. We answer
clarifications, not solutions.

Good luck.
