# Current working version — November 1, 2026

**Budgetron 3000: user profiles and verified persistence**

Baseline Git commit: `c4261cf` (Added separate accounts that are saved locally). This update is prepared under the commit message **File Reorganization** and includes the persistence and documentation changes below. Use Git history for the final commit hash; this date label identifies the saved snapshot.

- Sign-up/sign-in/sign-out and a seeded presentation profile.
- Income and Expenses replace Accounts; complete ledger and separate graphs.
- Goals follow income remaining after recorded expenses; Home links to Goals.
- Custom categories, restored SVG icons and cleaned-up sign-in spacing.
- Per-user persisted theme/palette, chat position/visibility/sharing and recent chat history.
- Pending-save protection for navigation/sign-out, separate preference updates, validation and stale-tab protection.
- 47 automated checks and a 11-scenario whole-site browser audit.
- Eight page folders with matching HTML/JS/CSS; root index.html and designated shared script/style folders.

The local working project, the CS100 Current Budgetron folder, and Current Budgetron.zip are verified against the same export manifest when published. Private .env credentials, the user database, Git/editor metadata and QA scratch data are excluded from the sharing copy.

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for earlier versions and [docs/QA-REPORT.md](docs/QA-REPORT.md) for verification limits.
