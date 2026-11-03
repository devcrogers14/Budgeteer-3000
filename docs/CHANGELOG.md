# Version changes

Labels describe saved snapshots; F/W prototype labels are not original release numbers. Older code/ZIP files are preserved, with notes beside each school archive.

## UI polish, mobile layout and shared folders — November 2, 2026

- Use subtle gradient/shadow feedback for buttons, retain keyboard outlines, and keep underlines for ordinary text links.
- Add 8px between ledger/category fields and their submit buttons.
- Match the HTML loading background to the theme, preview only the current tab's visual settings, and start the server session read earlier without adding a second request. Clear the preview on sign-out.
- Improve mobile navigation, touch targets, input readability, summary cards, dialogs, calendar and chat controls; keep the current navigation item visible.
- Rename shared folders to global css files and global javascript files; lowercase pages and update every reference. Preserve earlier server page bookmarks.
- Pass 56 automated tests plus desktop, 390px/320px, all-palette light/dark, keyboard, CRUD, delayed-loading, reduced-motion, and touch portrait/landscape browser checks. No live AI quota used.

## Enable browser-only budgeting with optional AI — November 2, 2026

- Open index.html directly for budgeting, demo accounts, sign-up/sign-in/out, charts, goals, transactions and calendar without installation or an API key.
- Save each browser profile's data and settings locally, hash passwords with salted PBKDF2 and reject invalid/stale saves.
- Retain existing server profiles and optional server-only AI. Explain that browser-file/server stores are separate.
- Share preference validation between both modes and use project-relative sign-in redirects.
- Pass 56 automated tests and browser checks for file mode (zero HTTP requests) and server mode (simulated AI).

## File Reorganization — November 2, 2026

- Rename the page root to Pages, with Sign In Page, Home Page, Goals Page, Income Page, Expenses Page, Pie Chart Page, Transactions Page and Calendar Page folders.
- Keep each page's HTML, CSS and JavaScript together; JavaScript retains the standard .js extension.
- Update navigation, entry/sign-in/sign-out redirects, the server file allowlist and Home-only chat detection for folder names containing spaces.
- Preserve old bookmarks through redirects. Keep the six public root files unchanged and the private .env excluded from Git.
- Pass all 49 automated checks and a browser smoke check covering sign-in, every navigation tab, Home-only chat and sign-out.

## File Reorganization — November 1, 2026

- Save user settings with each profile rather than browser-wide: theme, palette, chat position, Home-only visibility, sharing choice and last 14 messages.
- Restore data/settings on fresh sign-in after server restart. Keep users isolated and migrate legacy settings once.
- Protect outstanding writes during navigation/sign-out; validate partial settings separately from budget revisions and roll back failed disk saves.
- Verify all seven app pages and sign-in, desktop/mobile, ledger/category/goal CRUD, charts, calendar, chat privacy/quota/retry, reset/history behavior and account persistence.
- Fix narrow-phone action rows and summary-card spacing; verify both ordinary-user and presentation resets.
- Increase the suite from 39 to 47 checks; document the organized eight-page source structure.
- Include the sign-in spacing cleanup and restored SVG navigation icons.

## User-profile version — November 1, 2026

Baseline committed work includes `c4261cf` (Added separate accounts that are saved locally) and `d78dcbc` (Update).

- Add local sign-up/sign-in/sign-out, salted password hashes, session cookies and per-user saved budgets.
- Seed Jordan Demo with dummy income, expenses, two goals and calendar payments.
- Replace Accounts with Income/Expenses, add custom categories, split charts, full transaction history, net-income goals and View Goals.
- Add isolated budgeting/authentication unit tests and authenticated HTTP checks (39 checks at that stage).

## API-usage update — October 30, 2026

Commit `88ee5d1`, Updated AI Guidelines for API Usage.

- Reject obvious unrelated questions locally before calling Gemini.
- Preserve uncertain follow-ups and budget-related/mixed requests for model scope checking.
- Test that local refusals spend no provider calls and preserve the model-request allowance.

## Transition/UI version — October 23, 2026

Commit `b6049b6`, FInalized transitions and page animations.

- Lightweight page entry and sliding selected-tab area; no sidebar hover underline.
- Draggable chat, remembered position, Home-only option and theme-aware UI. Later profile work moves those saved preferences into each account.

## Archived website prototypes

- **W3 (October 19 school ZIP):** organized page-specific files, Home/Transactions labels, goal deletion and app-scoped Gemini chat. Its original filename says Current Website; it is historical now.
- **W2:** earlier Budgetron with root-level HTML/shared app.js, Overview/Spending Info labels, themes, interactive expense charts, multiple goals and simulated account transfers. No Gemini chat or goal deletion.
- **W1:** earlier Budgeteer website with CSV import and percentage-based income splitting. Those prototype-specific features are not assumed to exist in the latest Budgetron.

## Archived Flutter prototypes

- **F1:** basic single-file Pocket Budget experiment with expenses, limits, activity and one sample goal; changes reset on restart.
- **F2:** expanded Pocket Budget with separate UI/model, recurring bills, multiple goals/accounts, allocations and simulated transfers. Its browser preview ZIP is a package of the same prototype, not another version.

The previous CS100 Current Budgetron folder/ZIP is archived before publishing this working snapshot. Its own notes identify which earlier features it contains. Design and research materials remain separate from runnable app versions.
