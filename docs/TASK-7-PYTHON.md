# Task 7 — Operational script (10 min)

**File:** `python/reconcile_earnings.py`
**Data:** `python/payouts.json`
**Requires:** Python **3.12+** (`python --version`)

This is an **operations** script — the kind that runs after a payout batch. We
are not testing Python application development.

## Run it first

```bash
cd python

# macOS / Linux
python3 reconcile_earnings.py payouts.json

# Windows (PowerShell or cmd)
py -3 reconcile_earnings.py payouts.json
```

It fails. **Read the traceback before changing anything.**

> Below, `python3` means `py -3` on Windows. To read an exit code:
> `echo $?` in bash/zsh, `$LASTEXITCODE` in PowerShell, `echo %ERRORLEVEL%` in cmd.

## Fix three things

1. **It crashes on the real data.** Find out why and handle it — the data is
   what it is; the script must cope.
2. **It ignores `status`.** The docstring says only `paid` rows count. Failed
   and pending payouts have not moved money. It totals everything.
3. **A missing file produces a raw traceback instead of the documented exit
   code.** The header documents exit **2** for a file that cannot be read or
   parsed; the script does not return it. Run it against a missing file, record
   what actually happens and what exit code you actually get, then make the
   documented exit codes true.

## Evidence required

`evidence/task-7-output.txt` containing:

- a successful run and its output
- a run against a missing file, **plus the exit code** (`echo $?`, or
  `$LASTEXITCODE` in PowerShell), showing it is now **2**

## In `SOLUTION.md`, one sentence

> A record has `"fee_minor": null`. Should that be treated as a zero fee, or as
> an error? Say which you chose and why.

*(There is a defensible answer either way. We are reading the reasoning.)*
