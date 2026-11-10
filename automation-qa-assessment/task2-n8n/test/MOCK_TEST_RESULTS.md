# Mock test results (offline)

**These runs used a local mock of the GitHub and Telegram APIs (`mock_server.py`), executed with `n8n execute` (n8n 2.35.7).**
They prove the workflow *logic* (filtering, IF branching, error routing, message formatting).
They do **not** prove the real GitHub or Telegram integrations work — run the workflow with your real credentials for that (see `../README.md`).

## Task 2 – GitHub Repository Monitor

| Scenario | Mock behaviour | Result observed |
|---|---|---|
| Happy path | Search returns 7 repos (1 archived). Detail call reports `o4/delta` with 900 stars | Code node kept 5 (archived repo dropped). IF: 4 true / 1 false. 4 Telegram messages sent, `delta` skipped |
| GitHub search fails | Search returns HTTP 500 | Error output of "Fetch Popular Repos" -> "Log Error (fallback)". No crash, no Telegram message |
| Telegram fails | `sendMessage` returns HTTP 500 | Error output of "Send Telegram Alert" -> "Log Error (fallback)" (4 entries). Rest of workflow completed |

## Bonus – Uptime Monitor

| Scenario | Result observed |
|---|---|
| Site returns 200 | IF false -> "Site OK (no alert)". No message |
| Site returns 503 | IF true -> alert text with status 503 sent |
| Site unreachable (connection refused) | Error output -> "no response" alert with reason sent |
| 503 **and** Telegram fails | Telegram error output -> "Log Error (fallback)" |

## Bugs found in my own workflow by these tests (fixed)
1. Telegram text contained a literal `\n` instead of a line break.
2. Telegram's default Markdown mode can reject messages when a repo name/description contains `_` or `*`; switched to HTML mode and escape `& < >`.

## Re-run
```bash
python3 mock_server.py 8765          # MOCK_MODE=github_500 or telegram_500 for failure tests
```
Then in n8n point the HTTP nodes at `http://127.0.0.1:8765` and the Telegram credential's Base URL at the same address.
