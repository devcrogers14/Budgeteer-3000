# Unit and integration tests

Run all checks from the project folder:

```sh
node --test
```

The suite contains **49 tests**, with no parent-group counting discrepancy:

| File | Count | Purpose |
| --- | --- | --- |
| tests/goal-state.test.mjs | 15 | Pure budgeting unit tests: empty/demo budgets, income/expense sums, planned-payment exclusion, net-income goal progress, zero/100% bounds, shared goal funds, monthly vs complete totals, category creation/duplicates, dates, money validation and record IDs. |
| tests/auth.test.mjs | 8 | Isolated authentication unit tests: salted hashes, password verification, seeded demo data, signup validation, sessions/sign-out, public user data, budget isolation/revisions and disk persistence. |
| tests/chat-policy.test.mjs | 8 | AI scope and local preflight: valid/invalid/off-topic responses, trusted-policy separation, obvious local refusals and permissive follow-ups. |
| tests/preferences.test.mjs | 7 | Defaults, deep partial updates, validation, bounded history, restart/login isolation, and independence from budget saves/reset. |
| tests/server.test.mjs | 11 | Real localhost HTTP integration: pages/assets, redirects, private files, authenticated chat, malformed/cross-site requests, quota-saving local refusals, signup/save/conflicts/isolation/sign-out. |

Run the 30 budget/auth/preferences unit tests:

```sh
node --test tests/goal-state.test.mjs tests/auth.test.mjs tests/preferences.test.mjs
```

Unit tests operate on pure functions, isolated in-memory users or temporary files. Integration tests start an ephemeral local server with an in-memory authentication store and fake Gemini replies. They do not use real API keys or production user data.

A separate browser verification exercised demo sign-in, new signup, sign-out, two isolated user budgets, income/expense/planned entries, custom categories, goal updates, both clickable charts, complete transaction history, editing, calendar compatibility, reload persistence, and mobile sign-out. Live Gemini requests were not tested.

The November 1 whole-site audit also tested sign-out/re-login after a server restart from a new browser with no local storage, delayed writes during navigation, user isolation, all themes, chat privacy/history/New Chat, a local off-topic refusal, simulated provider quota/retry, every page at phone width, and Back after sign-out. See [QA-REPORT.md](QA-REPORT.md). Live Gemini was not called.

The folder reorganization also checks old nested bookmarks and sign-in protection on every renamed page.
