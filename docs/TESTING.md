# Unit and integration tests

Run all checks from the project folder:

```sh
node --test
```

The suite contains **39 tests**, with no parent-group counting discrepancy:

| File | Count | Purpose |
| --- | --- | --- |
| tests/goal-state.test.mjs | 15 | Pure budgeting unit tests: empty/demo budgets, income/expense sums, planned-payment exclusion, net-income goal progress, zero/100% bounds, shared goal funds, monthly vs complete totals, category creation/duplicates, dates, money validation and record IDs. |
| tests/auth.test.mjs | 8 | Isolated authentication unit tests: salted hashes, password verification, seeded demo data, signup validation, sessions/sign-out, public user data, budget isolation/revisions and disk persistence. |
| tests/chat-policy.test.mjs | 8 | AI scope and local preflight: valid/invalid/off-topic responses, trusted-policy separation, obvious local refusals and permissive follow-ups. |
| tests/server.test.mjs | 8 | Real localhost HTTP integration: pages/assets, redirects, private files, authenticated chat, malformed/cross-site requests, quota-saving local refusals, signup/save/conflicts/isolation/sign-out. |

Run just the 23 budget/auth unit tests:

```sh
node --test tests/goal-state.test.mjs tests/auth.test.mjs
```

Unit tests operate on pure functions, isolated in-memory users or temporary files. Integration tests start an ephemeral local server with an in-memory authentication store and fake Gemini replies. They do not use real API keys or production user data.

A separate browser verification exercised demo sign-in, new signup, sign-out, two isolated user budgets, income/expense/planned entries, custom categories, goal updates, both clickable charts, complete transaction history, editing, calendar compatibility, reload persistence, and mobile sign-out. Live Gemini requests were not tested.
