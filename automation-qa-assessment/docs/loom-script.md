# Loom script (about 4–5 minutes)

Task 1 numbers below are the real results from the report. Record the Task 2 execution part only after you have run it with your own credentials. Do not claim anything you did not run.

**0:00 – Intro (20 s)**
"Hi, I'm Darshan. This is my Automation and QA take-home. It has two parts: a manual QA report on the RealWorld demo app, and an n8n workflow that monitors popular GitHub repositories. I also built the bonus uptime monitor."

**0:20 – Task 1: QA (1 min 15 s)**
Show the PDF. "The public demo wasn't reachable from my test machine, so I ran a public RealWorld implementation locally (React, Express, PostgreSQL) and tested it with Playwright for the UI and curl for the API. I covered signup, login, create, edit, delete, logout, comments and settings, plus validation and edge cases. I found 10 real bugs: 1 critical, 3 high, 4 medium, 2 low. The most serious is BUG-01: saving the Settings page overwrites your password with an empty one, so the original password stops working and an empty password logs in. I confirmed it live, then read the code: the condition `password !== undefined || password !== ''` is always true because it should be `&&`. Other findings: duplicate usernames and e-mails are accepted, changing your e-mail breaks the session because the token is tied to the old e-mail, whitespace-only articles create an unreachable empty-slug article, and bad input returns HTTP 500 with raw database messages." (Mention that authorization and XSS escaping passed.)

**1:35 – Task 2: workflow (1 min 45 s)**
Show the canvas. "A Schedule Trigger runs every hour. The first HTTP node calls GitHub's search API for repos with more than 1,000 stars, sorted by stars. A Code node removes archived repos, sorts and keeps the top 5, and outputs one item per repo. The second HTTP node fetches fresh details for each repo. An IF node checks stars greater than 1,000, and matching repos go to Telegram."
Show one execution: "Here's a successful run, and the Telegram message I received."

**3:20 – Technical decisions (1 min)**
- "Credentials are n8n credentials, not hardcoded; the exported JSON only has references."
- "Every HTTP and Telegram node uses 'continue using error output', which routes to a fallback logging node, so one failing call doesn't kill the run."
- "I used Telegram HTML mode with escaping because Markdown breaks on characters like underscores in repo names."
- "I tested the logic and failure paths locally against a mock of GitHub and Telegram, and that testing caught two bugs in my own workflow: a literal \n in the message and the Markdown issue."

**4:20 – Bonus and close (30 s)**
"The uptime monitor checks the site every 5 minutes. It uses 'never error' so 4xx/5xx come back as a status code, and alerts on anything that isn't 200. If the site doesn't respond at all, the error output sends a separate 'unreachable' alert. If I had more time I'd add retries before alerting, alert de-duplication, and a recovery message. Thanks for watching."

## Likely interview questions
- *Why a second HTTP request when search already returns stars?* Search results can be cached or stale and lack some fields; the repo endpoint returns the current data, and the assignment asks for it.
- *What if GitHub rate-limits you?* Authenticated requests allow 5,000/hour; the run uses 6 per hour. A 403/429 goes to the error output and gets logged.
- *Why NoOp on the IF false branch?* It makes the "skipped" path visible in execution history.
