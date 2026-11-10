# Task 2 – GitHub Repository Monitor (n8n)

Every hour, find the most-starred GitHub repositories, take the top 5, fetch each one's details, and send a Telegram message for every repo with more than 1,000 stars.

## Flow

```
Every Hour -> Config -> Fetch Popular Repos -> Filter & Pick Top 5 -> Fetch Repo Details -> Stars > 1000? -+-> true:  Send Telegram Alert
                              |                       |                      |                          +-> false: Skip (NoOp)
                              +-----------------------+----------------------+--> (error output) --> Log Error (fallback)
                                                                Send Telegram Alert --(error output)--> Log Error (fallback)
```

| Node | Purpose |
|---|---|
| Every Hour | Schedule Trigger, interval = 1 hour (timezone Asia/Kolkata) |
| Config | Holds non-secret settings: Telegram chat ID, star threshold |
| Fetch Popular Repos | HTTP GET `https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=20` |
| Filter & Pick Top 5 | Code node: drops archived/disabled repos, sorts by stars, keeps 5, outputs one item per repo |
| Fetch Repo Details | HTTP GET `https://api.github.com/repos/{owner}/{name}` (runs once per repo) |
| Stars > 1000? | IF node on `stargazers_count > 1000` using the fresh detail data |
| Send Telegram Alert | Sends name, stars, forks, language, description, link |
| Log Error (fallback) | Code node that logs failures (see below) |

## APIs used
- **GitHub Search API** (`GET /search/repositories`) – list of popular repos.
- **GitHub Repos API** (`GET /repos/{owner}/{repo}`) – current details for one repo.
- **Telegram Bot API** (`sendMessage`, via n8n's Telegram node).

## Transformations
1. Search response `{ items: [...] }` -> Code node reads `items`, filters, sorts, slices to 5.
2. Each repo becomes `{ owner, name, full_name }` so the next HTTP node can build its URL.
3. Detail response -> IF checks `stargazers_count`.
4. Message text is built with an expression; `& < >` are escaped because the message uses Telegram HTML mode (Markdown mode breaks on `_` and `*` in repo names/descriptions).

## Error handling
- Every HTTP node, the Code node and the Telegram node use **On Error -> Continue (using error output)**, so one failure never crashes the whole run.
- All error outputs go to **Log Error (fallback)**, which writes a structured entry (time, workflow, execution ID, error) to the console, to the node output (visible in the Executions tab), and to a rolling list of the last 50 errors in workflow static data.
- The Code node throws a clear error if GitHub's response has no `items` array or if nothing is left after filtering.
- HTTP requests have a 15 s timeout.

## Secure credentials
No secret is stored in the JSON. Only credential *references* are exported.
- **GitHub**: credential type *GitHub API* with a personal access token. A fine-grained token with **no extra permissions** is enough for public data and raises the rate limit from 60 to 5,000 requests/hour.
- **Telegram**: credential type *Telegram API* with the bot token from @BotFather.
- The Telegram **chat ID** is not a secret and lives in the `Config` node.

## Setup (manual steps)
1. Import `Task2_Workflow_Darshan.json` (Workflows -> Import from file).
2. Create the **GitHub API** credential and select it on both GitHub HTTP nodes.
3. Create a bot with @BotFather, send it any message, then get your chat ID (open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and read `chat.id`).
4. Create the **Telegram API** credential and select it on "Send Telegram Alert".
5. In the `Config` node replace `REPLACE_WITH_YOUR_TELEGRAM_CHAT_ID`.
6. Click **Execute workflow**, check the Telegram messages, take the screenshots, then toggle the workflow **Active**.

## Testing status
- JSON imports into n8n 2.35.7 via CLI: **verified**.
- Logic and error paths executed against a local mock of GitHub/Telegram: **verified** (see `test/MOCK_TEST_RESULTS.md`).
- Live run against the real GitHub and Telegram APIs: **not yet done** – requires your credentials. Do this before submitting and add screenshots to `screenshots/`.
