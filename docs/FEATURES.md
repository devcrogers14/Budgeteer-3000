# Budgetron 3000 — Current Features

## Sign-up, sign-in and sign-out

Double-click **index.html** for browser-only budgeting, or run **Start Budgetron.bat** for the optional AI/server mode. New users create an account using a name, email and password of 8–128 characters. Existing users sign in and can sign out from every page, including mobile. Each user has a separate saved budget. New profiles start empty.

The presentation user is **Jordan Demo**, email **demo@budgetron.local**, password **BudgetronDemo3000!**. **Use demo credentials** fills the login form without bypassing sign-in. Initial dummy data includes $3,000 income, $1,490 expenses, $1,510 remaining, two goals, and planned calendar payments. Reset profile restores this sample for the demo user; it clears other profiles after confirmation.

## Pages

| Page | Current behavior |
| --- | --- |
| Home | Monthly income, expenses and remaining money; expense chart; goal widget with **View Goals**; recent income and expense records. |
| Goals | Add/select/edit/delete goals with optional deadlines. Progress follows **all recorded income minus all recorded expenses**, clamped to zero. Multiple goals share the same available amount; they do not reserve money. |
| Income | Record income sources; edit/delete entries; view income history; create income categories and choose chart colors. |
| Expenses | Record expenses or planned payments; edit/delete entries; view expense history; create expense categories and choose chart colors. |
| Pie Chart | Separate monthly income and expense donuts, each with its own selection, labels, percentages, category buttons and transaction details. |
| Transactions | Complete overview across all dates: total income, total expenses, net remaining, and filterable income/expense/planned-payment history. |
| Calendar | Existing monthly payment/transaction calendar retained. Shared entries and custom categories stay compatible with the ledgers; planned payments remain outside totals. |

The Accounts tab has been removed. Old Accounts URLs redirect to Income.

## Money rules

Amounts are stored as integer cents and validated before saving in either mode. Only recorded income and expenses affect totals and goals. Planned payments do not count until changed to an expense. Dates and transaction types can be edited; changing an income entry to an expense updates both totals and goal progress. Category names must be unique within income or expense, case-insensitively; the same name can be used once in each type.

Goal progress uses the complete ledger, while Home and both pie charts summarize the current month. Transactions deliberately shows all dates. Editing/deleting goals never changes the ledger.

## Storage and privacy

In browser-file mode, profiles, budgets and settings stay in browser local storage. Passwords use salted PBKDF2 hashes; a session-storage marker signs the user in. These local classroom profiles are inspectable by someone using browser developer tools. No Node.js or API key is required. Clearing browser data removes these profiles; use the same regular browser and extracted project folder.

In server mode, user budgets and salted password hashes are stored locally outside the project in `Codex/Work/Budgetron Data/users.json`, under the current Windows user. API responses never expose password hashes. Session cookies are HttpOnly and SameSite=Strict. Sign-out invalidates the session. Server restarts retain profiles but require sign-in again. Stale revisions and saves from tabs belonging to a different signed-in user are rejected.

This is a localhost classroom prototype with no email verification, password-reset flow, real banking or public production deployment. Existing browser-only demo data is not silently imported into a new profile. Browser-file and server profiles remain separate; no automatic data transfer occurs between them. The CS100 sharing copy and ZIP are snapshots.

## Interface and chat

Cream, Sage, Ocean and Rose palettes, Dark Mode, simple page-entry motion and the lightweight sliding sidebar selection remain. Reduced motion is respected. Sidebar links do not underline on hover/focus. Ask Budgetron stays on top, can be dragged or moved with Alt+arrow keys, and can be hidden outside Home.

AI chat requires running **Start Budgetron.bat**, using the website it opens, and adding a private API key to `.env`. File mode shows these launch instructions while the budgeting pages stay usable. Obvious unrelated questions are refused locally without Gemini quota. Uncertain requests reach Gemini and then pass through the structured-response scope filter. Included budget context is built from the authenticated profile's saved data, rather than trusting a submitted snapshot. The model cannot edit records or move money. Live Gemini answers were not used for verification.

See [TESTING.md](TESTING.md) for the 56 automated checks and [PRESENTATION.md](PRESENTATION.md) for the demo walkthrough.

## Persistence verified November 1, 2026

Budgets, categories, goals, theme/palette, chat position, Home-only visibility, budget-sharing choice and the last 14 chat messages persist per account. A fresh-browser sign-in after a server restart restores them. New users do not inherit another profile's settings. New Chat clears saved history; resetting budget data does not reset settings.

Navigation/sign-out wait for real pending writes, and the browser warns before closing/reloading unsaved changes. Preferences are validated and updated separately from ledger revisions, so a theme change cannot replace budget data. Ordinary page changes keep normal navigation and the lightweight animations.

All eight page folders contain their own matching HTML/JS/CSS; index.html remains at the project root. See [QA-REPORT.md](QA-REPORT.md) for the site audit and [CHANGELOG.md](CHANGELOG.md) for version differences.

## Mobile and interaction polish — November 2, 2026

Mobile navigation uses a swipeable row that reveals the selected page. Phone forms use 16px inputs, touch controls have generous heights, and narrow summaries stack without horizontal page overflow. Dialogs and chat stay within the viewport, with bottom space for the launcher and device safe areas. Buttons show subtle color/shadow hover feedback and visible keyboard outlines. Ledger/category submit buttons have an 8px gap from their final field.

Page loading immediately uses the theme background and a tab-local visual preview; the server session read starts while deferred scripts are loading. Profile content stays hidden until authenticated data is ready. Only visual settings are cached for this preview.

Shared styles live in `global css files/`, shared scripts in `global javascript files/`, and page-specific trios in lowercase `pages/`.
