# Budgetron 3000 — Local budgeting app

A plain HTML/CSS/JavaScript classroom app with browser-saved or server-saved user accounts, income, expenses, goals, two spending/income charts, a calendar and optional Gemini chat.

## Start the app

For the presentation, extract the complete ZIP and double-click **index.html**. No installation, Node.js, API key or internet connection is needed for budgeting. Sign in with the demo credentials below or create a browser-only profile. Keep all folders beside index.html.

For optional AI chat, run **Start Budgetron.bat** (Node.js 22 or newer required), then use the local website it opens, normally http://127.0.0.1:3000. Keep the batch window open. Add a Gemini key to the private .env file to enable AI replies.

Browser-file mode and server mode use separate account stores. They do not automatically transfer profiles, transactions or settings between modes. The presentation account is available in both.

## Presentation account

- Email: **demo@budgetron.local**
- Password: **BudgetronDemo3000!**
- Name: **Jordan Demo**

On the sign-in page, **Use demo credentials** fills the form; click **Sign in**. The account is created automatically and starts with $3,000 income, $1,490 expenses, $1,510 remaining, two goals and planned calendar bills. **Reset profile** refreshes this dummy data for the current month. New users can create an account and start with an empty budget. See [the presentation walkthrough](docs/PRESENTATION.md).

## Features

Navigation is **Home, Goals, Pie Chart, Transactions, Calendar**. Pie Chart combines monthly income/expense summaries, interactive charts, and both all-time entry histories. **Add Deposit**, **Add Expense**, and **Create Category** open separate dialogs; deposits include salary and other money received. Old Income/Expenses bookmarks forward to the matching history. Recorded-entry counters have been removed. Entries still support editing and deletion. Raleway is bundled locally for offline use. Planned expenses do not count toward totals. Goals follow total recorded income minus recorded expenses, clamped to zero. Goals share that available amount and do not reserve money. Home includes a **View Goals** link. Charts show income and expenses separately; Transactions shows the full history across dates.

See [FEATURES.md](docs/FEATURES.md) for details. The calendar remains available alongside the income/expense ledgers.

## Folder layout

Each page owns its HTML, JavaScript and CSS together. Only the entry page stays at the root:

```text
index.html
pages/
  Sign In Page/  auth.html, auth.js, auth.css
  Home Page/  home.html, home.js, home.css
  Goals Page/  goals.html, goals.js, goals.css
  Income Page/  income.html, income.js, income.css
  Expenses Page/  expenses.html, expenses.js, expenses.css
  Pie Chart Page/  spending-chart.html, spending-chart.js, spending-chart.css
  Transactions Page/  transactions.html, transactions.js, transactions.css
  Calendar Page/  calendar.html, calendar.js, calendar.css
global javascript files/ shared scripts used by multiple pages
global css files/        shared theme, layout and chat styles
server/           local APIs, authentication, preferences and AI policy
tests/            automated checks
docs/             features, tests, presentation, version notes and design references
```

See [VERSION.md](VERSION.md) for the current version and [CHANGELOG.md](docs/CHANGELOG.md) for what changed.

## Where the code lives

| Folder/file | Purpose |
| --- | --- |
| `pages/` | Each app page has its own HTML/CSS/JS; `Sign In Page/` contains sign-in/signup. |
| `global javascript files/budget-core.js` | Pure calculations, sample data and validation shared with Node unit tests. |
| `global javascript files/state.js`, `session.js`, `ui.js` | In-memory browser state, authenticated server persistence and shared controls. |
| `global javascript files/transactions.js`, `goals.js`, `charts.js` | Reusable entry editing, net-income goal UI and interactive SVG charts. |
| `global css files/` | Shared themes, layout, simple entry motion and draggable chat styling. |
| `global javascript files/browser-accounts.js` | Browser-only sign-in, salted password hashes and per-profile local storage; server requests pass through in HTTP mode. |
| `global javascript files/preferences.js` | Settings validation shared by browser and server stores. |
| `server/auth.mjs` | Password hashing, session management and per-user budget storage. |
| `server/server.mjs` | Local HTTP server, protected routes and Gemini proxy. |
| `server/chat-policy.mjs` | Local quota-saving filter and trusted model scope rules. |
| `tests/` | Unit, AI policy and authenticated HTTP integration checks. |

## Browser-only data

When opened as a file, Budgetron stores profiles, budgets, categories, goals, settings and recent chat history in this browser's local storage under `budgetron-browser-profiles-v1`. Passwords are salted PBKDF2-SHA-256 hashes (210,000 iterations), never raw passwords. A 24-hour sign-in marker lives in session storage; closing the browser may require signing in again. Saved profiles remain until browser data is cleared. Browser file storage behavior can vary; use the same browser and extracted folder, a regular window, and allow storage. File-mode behavior was verified in Brave.

These are classroom profiles on a device you control, not secure multi-user authentication: someone with access to browser storage can inspect or change records. Browser profiles do not sync to another browser/computer or to the server. Existing server profiles are preserved.

## Server data and authentication limits

Profiles are stored in `C:\Users\<your-user>\Codex\Work\Budgetron Data\users.json` by default, outside the repository. `BUDGETRON_DATA_DIR` can override the directory through the process environment. Passwords use salted scrypt hashes; session cookies are HttpOnly and SameSite=Strict. Sessions expire after 24 hours and do not survive server restarts, but users, budgets, settings and recent chat do. Budget revisions reject stale-tab saves instead of overwriting newer data. The server binds to localhost.

This is local classroom authentication, not a deployed identity service. It has no email verification, password reset, or real banking integration. The presentation credentials are deliberately public dummy credentials. Keep real data out of the demo and exclude user databases and `.env` from shared packages.

## Optional AI chat

Copy `.env.example` to `.env` if needed and add your private Gemini key. Do not replace an existing key or commit `.env`. Sign in first. The local server rejects obvious off-topic questions before calling Gemini; uncertain/app-budget requests still use provider quota. The existing structured-response scope filter remains. Budget context comes from the signed-in user's saved records; turning off **Include my sample budget** omits it. AI cannot edit data or move money.

Ask Budgetron remains draggable with mouse/touch and Alt+arrow keys. **Position & visibility** offers Home-only visibility and position reset. Theme and Dark Mode remain available.

## Tests

Run `node --test` for all **56 checks**. Run `node --test tests/goal-state.test.mjs tests/auth.test.mjs tests/preferences.test.mjs` for the **30 budgeting/auth/preferences unit checks**. Tests use fake Gemini responses and never spend provider quota. See [TESTING.md](docs/TESTING.md).

## Saved settings

Theme, palette, chat position, Home-only visibility, sharing choice and the last 14 chat messages are saved per user in the active mode's storage. Browser-file profiles survive reload and sign-out in the same browser; server profiles also survive a server restart and sign-in from a fresh browser on that local server. **New Chat** clears saved chat history; **Reset profile** resets budget data but keeps settings. Older browser-only preferences are migrated once to an existing profile without making new users inherit them.

Page links and sign-out wait for outstanding data/settings writes. Small writes use keepalive, and closing/reloading with unsaved work shows the browser's warning. Failed or stale saves show an error rather than overwriting another tab's newer data. Restart the Node server after installing this update so the preferences API is loaded.

## Phone layout and interaction feedback

On phones, swipe the navigation row to reach every page. Inputs use readable text, controls have larger tap areas, summaries stack and dialogs/chat fit the viewport. Buttons use subtle color/shadow feedback rather than hover underlines; keyboard focus remains visible. Page loading paints the current theme background immediately and begins server account loading earlier. See the QA report for the latest inspection.

On desktop with a mouse, the page navigation rests as compact icon circles and expands into labeled pills on hover or keyboard focus. Touch devices keep labeled navigation. Goal cards include percentages and progress tracks. These Figma-inspired details respect reduced motion and do not add a navigation delay.

Unfinished forms stay in the current tab as account-scoped drafts when navigating between pages. They clear after successful saving, cancellation, profile reset or sign-out. Saving a previous entry does not erase a newer draft. Save feedback remains visible without scrolling, calendar entries start on the selected day, and a new category is selected automatically. Totals distinguish monthly and all-time amounts.
