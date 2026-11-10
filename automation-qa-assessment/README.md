# Automation & QA Take-Home – Darshan

| Part | Location | Status |
|---|---|---|
| Task 1 – QA report (PDF) | [`task1-qa/Task1_QA_Report_Darshan.pdf`](task1-qa/Task1_QA_Report_Darshan.pdf) | **Done.** 10 real bugs found by executing tests; screenshots included |
| Task 2 – n8n GitHub monitor | [`task2-n8n/`](task2-n8n/) (`Task2_Workflow_Darshan.json`, `README.md`) | Built, imports into n8n 2.35.7, logic tested against a local mock. **Live run needs your credentials** |
| Bonus – uptime monitor | [`bonus-uptime/`](bonus-uptime/) | Same status as Task 2 |
| Loom script | [`docs/loom-script.md`](docs/loom-script.md) | Ready |

## Structure
```
task1-qa/       Task1_QA_Report_Darshan.pdf, screenshots/ (44 images), test-scripts/ (Playwright), SETUP.md, build/ (report generator)
task2-n8n/      Task2_Workflow_Darshan.json, README.md, screenshots/workflow_canvas.png, test/ (mock server + results)
bonus-uptime/   Bonus_UptimeMonitor_Darshan.json, README.md, screenshots/workflow_canvas.png
docs/           loom-script.md
```

## Honest status
- **Task 1 site:** `demo.realworld.io` was unreachable from the test environment, so a public RealWorld implementation (TonyMckes/conduit-realworld-example-app) was run locally and tested. This is stated at the top of the PDF. Bugs apply to that implementation.
- **Task 2 / Bonus:** verified = JSON imports, workflow canvas loads, filtering/IF/error routing work against a mock GitHub + Telegram. **Not verified** = real GitHub API calls, real Telegram delivery, any real execution. There are no execution screenshots yet; they must come from your own run.
- No secrets are stored anywhere in this repo.
