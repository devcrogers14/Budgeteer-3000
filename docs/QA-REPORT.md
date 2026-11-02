# Verification

## Page-folder reorganization — November 2, 2026

All 49 automated tests passed after the move. A fresh browser smoke check verified sign-in, all seven navigation tabs, Home-only chat visibility and sign-out with no page errors or failed resources. Tests cover each page's linked assets, old bookmark redirects and sign-in protection. The browser check used an isolated in-memory demo account and no live Gemini calls.

## Whole-site verification — November 1, 2026

Result: **47 automated tests passed**, plus **11 whole-site browser scenarios** against a disposable disk-backed test database. Real user records and API keys were not used or modified.

| Scenario | Result |
| --- | --- |
| Outstanding writes finish before a clicked page link navigates | Passed, including deliberately delayed saves. |
| Income/expense/planned records and custom categories | Passed; duplicate categories rejected. |
| Home → View Goals, create/select/delete/cancel/deadlines and net-income progress | Passed; planned payments excluded. |
| Complete-history totals, filtering, editing and delete/cancel across months | Passed. |
| Calendar month navigation, Today/All, add/edit-type/delete and ledger synchronization | Passed. |
| Independent clickable charts, monthly Home totals, four palettes and Dark Mode | Passed. |
| Chat dragging/Home-only/sharing/history and second-user isolation | Passed. |
| Server restart + fresh-browser login restores ledger, categories, goals and settings/history | Passed. |
| New Chat stays cleared; local refusal uses no provider calls; simulated quota failure retries | Passed. |
| Every app page fits at 320px and 390px phone widths; icons/sign-out/reduced motion and Back after logout | Passed. |
| Reset profile clears ordinary-user data while preserving settings and restores dummy data for the demo | Passed. |

The audit used Chromium/Brave automation and an isolated profile file under Codex Work. Mock Gemini responses checked the app's connection, refusal and error paths without using API quota. **Live Gemini availability/answers, public deployment, email verification and password recovery were not tested.** This remains a local classroom app.

See [TESTING.md](TESTING.md) for the automated suite. Local and CS100 sharing copies are compared file-by-file using SHA-256 during export; the matching ZIP is checked against those same bytes. This verifies the published snapshot, not continuous future sync.
