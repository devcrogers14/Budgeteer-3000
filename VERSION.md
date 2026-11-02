# Current working version — November 2, 2026

**Budgetron 3000: double-click presentation mode and optional AI**

Baseline Git commit: `0f3b0ab` (File Reorganization). This update is prepared under the commit message **Enable browser-only budgeting with optional AI** and includes the persistence and documentation changes below. Use Git history for the final commit hash; this date label identifies the saved snapshot.

- Double-click index.html for browser-only budgeting without Node.js or an API key.
- Sign-up/sign-in/sign-out and a seeded presentation profile in either mode; browser and server profiles are separate.
- Income and Expenses replace Accounts; complete ledger and separate graphs.
- Goals follow income remaining after recorded expenses; Home links to Goals.
- Custom categories, restored SVG icons and cleaned-up sign-in spacing.
- Per-user persisted theme/palette, chat position/visibility/sharing and recent chat history.
- Pending-save protection for navigation/sign-out, separate preference updates, validation and stale-tab protection.
- 56 automated checks plus browser-only and server-mode browser checks. The earlier 11-scenario whole-site audit is recorded in the QA report.
- Eight named page folders under `Pages/` with matching HTML/JS/CSS; root index.html and designated shared script/style folders.

The local working project, the CS100 Current Budgetron folder, and Current Budgetron.zip are verified against the same export manifest when published. Private .env credentials, the user database, Git/editor metadata and QA scratch data are excluded from the sharing copy.

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for earlier versions and [docs/QA-REPORT.md](docs/QA-REPORT.md) for verification limits.
