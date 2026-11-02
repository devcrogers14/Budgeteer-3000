# Budgetron 3000 — Local budgeting app

A plain HTML/CSS/JavaScript classroom app with local user accounts, income, expenses, goals, two spending/income charts, a calendar and optional Gemini chat.

## Start the app

Run **Start Budgetron.bat**, or run `node server/server.mjs` from the project root with Node.js 22 or newer. Open the printed local URL (normally http://127.0.0.1:3000). Keep the server window open. Authentication and saved user profiles require the local server; double-clicking HTML is no longer the sign-in workflow.

## Presentation account

- Email: **demo@budgetron.local**
- Password: **BudgetronDemo3000!**
- Name: **Jordan Demo**

On the sign-in page, **Use demo credentials** fills the form; click **Sign in**. The account is created automatically and starts with $3,000 income, $1,490 expenses, $1,510 remaining, two goals and planned calendar bills. **Reset profile** refreshes this dummy data for the current month. New users can create an account and start with an empty budget. See [the presentation walkthrough](docs/PRESENTATION.md).

## Features

Navigation is **Home, Goals, Income, Expenses, Pie Chart, Transactions, Calendar**. Accounts has been replaced by Income and Expenses. Income/Expenses support adding, editing and deleting entries and creating custom categories. Planned expenses do not count toward totals. Goals follow total recorded income minus recorded expenses, clamped to zero. Goals share that available amount and do not reserve money. Home includes a **View Goals** link. Charts show income and expenses separately; Transactions shows the full history across dates.

See [FEATURES.md](docs/FEATURES.md) for details. The calendar remains available alongside the income/expense ledgers.

## Where the code lives

| Folder/file | Purpose |
| --- | --- |
| `pages/` | Each app page has its own HTML/CSS/JS; `auth/` contains sign-in/signup. |
| `javascript files/budget-core.js` | Pure calculations, sample data and validation shared with Node unit tests. |
| `javascript files/state.js`, `session.js`, `ui.js` | In-memory browser state, authenticated server persistence and shared controls. |
| `javascript files/transactions.js`, `goals.js`, `charts.js` | Reusable entry editing, net-income goal UI and interactive SVG charts. |
| `css files/` | Shared themes, layout, simple entry motion and draggable chat styling. |
| `server/auth.mjs` | Password hashing, session management and per-user budget storage. |
| `server/server.mjs` | Local HTTP server, protected routes and Gemini proxy. |
| `server/chat-policy.mjs` | Local quota-saving filter and trusted model scope rules. |
| `tests/` | Unit, AI policy and authenticated HTTP integration checks. |

## Local data and authentication limits

Profiles are stored in `C:\Users\<your-user>\Codex\Work\Budgetron Data\users.json` by default, outside the repository. `BUDGETRON_DATA_DIR` can override the directory through the process environment. Passwords use salted scrypt hashes; session cookies are HttpOnly and SameSite=Strict. Sessions expire after 24 hours and do not survive server restarts, but users and budgets do. Budget revisions reject stale-tab saves instead of overwriting newer data. The server binds to localhost.

This is local classroom authentication, not a deployed identity service. It has no email verification, password reset, or real banking integration. The presentation credentials are deliberately public dummy credentials. Keep real data out of the demo and exclude user databases and `.env` from shared packages.

## Optional AI chat

Copy `.env.example` to `.env` if needed and add your private Gemini key. Do not replace an existing key or commit `.env`. Sign in first. The local server rejects obvious off-topic questions before calling Gemini; uncertain/app-budget requests still use provider quota. The existing structured-response scope filter remains. Budget context comes from the signed-in user's saved records; turning off **Include my sample budget** omits it. AI cannot edit data or move money.

Ask Budgetron remains draggable with mouse/touch and Alt+arrow keys. **Position & visibility** offers Home-only visibility and position reset. Theme and Dark Mode remain available.

## Tests

Run `node --test` for all **39 checks**. Run `node --test tests/goal-state.test.mjs tests/auth.test.mjs` for the **23 budgeting/auth unit checks**. Tests use fake Gemini responses and never spend provider quota. See [TESTING.md](docs/TESTING.md).
