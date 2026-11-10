# Bonus – Website Uptime Monitor (n8n)

Every 5 minutes, request the site and send a Telegram alert when the HTTP status is not 200 or the site cannot be reached at all.

```
Every 5 Minutes -> Config -> Check Website -> Status is not 200? -+-> true:  Format Alert (bad status) -> Send Telegram Alert
                                  |                                +-> false: Site OK (no alert)
                                  +-(error output)-> Format Alert (no response) -> Send Telegram Alert
                                                                  Send Telegram Alert --(error output)--> Log Error (fallback)
```

- **Check Website** uses *Never Error* + *Full Response*, so 4xx/5xx responses are returned as data (`statusCode`) instead of failing; real network failures (timeout, DNS, refused) go to the error output. Timeout 10 s, up to 5 redirects followed.
- **Config** holds `site_url` (default `https://demo.realworld.io/`) and the Telegram chat ID.
- A failed Telegram send goes to **Log Error (fallback)** (console + rolling log in workflow static data).
- Credentials: same Telegram API credential as Task 2. Nothing secret is in the JSON.

## Setup
Import the JSON, select your Telegram credential, set `telegram_chat_id` (and `site_url` if you tested a different RealWorld site), execute once, then activate.

## Testing status
Verified against a local mock only (200, 503, connection refused, 503 + Telegram failure) – see `../task2-n8n/test/MOCK_TEST_RESULTS.md`. A live run with real Telegram is still to be done by you. The assessment site itself was not reachable from my environment, so I did not check its real status.
