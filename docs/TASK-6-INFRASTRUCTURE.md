# Task 6 — Infrastructure incidents (15 min)

Written answers in `answers/task-6.md`. **No execution needed.**

We are testing how you *diagnose*, not whether you can recall commands. For
each: **what you check, in what order, and what each check rules in or out.**

## Incident 1 — the invisible deploy (6 min)

> A fix is pushed. The build succeeds. The deployment shows green. The change
> is **not visible in the browser**. No errors anywhere. A colleague says
> "it works for me".

What do you check, in order, and why?

## Incident 2 — 502 after deploy (6 min)

> The app works locally. After deploying, every API call returns **502 Bad
> Gateway**. The container shows as running. It worked yesterday, and the only
> change was a new feature that reads a configuration value.

What are the most likely causes, and how would you confirm or eliminate each?

## Incident 3 — the vanishing change (6 min)

> A colleague installed a tool inside a running container on a test
> environment to debug something. It worked. After the next deploy the tool is
> gone, with no error, and their fix stopped working.

Explain what happened and how the change should have been made instead.

> There is no single right answer. We are reading your **ordering** and your
> reasoning. A candidate who checks the cheapest, most likely thing first
> scores better than one who lists twenty possibilities.
