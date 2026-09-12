# Evidence

Put your screenshots and terminal output here.

Suggested names:

- task-1-ui.png, task-1-network.png
- task-2-signedout.png, task-2-signedin.png, task-2-network.png
- task-3-validation.png, task-3-server-error.png, task-3-success.png, task-3-network.png
- task-4-curl.txt
- task-5-queries.txt
- task-7-output.txt

---

## Before you commit anything here

**Redact bearer tokens.** Where a screenshot shows the `Authorization` header,
the header itself must stay readable — that is the evidence — but the token
value must be blacked out or blurred:

```
Authorization: Bearer ███████████ (redacted)
```

The same applies to terminal output pasted into `task-4-curl.txt`: keep the
request and response, replace the token with `<redacted>`.

The seeded test logins (`assessment123` and the local database credentials) are
**not** secrets — they are published in this package on purpose and are local to
your machine. A live session token is different: redact it.
