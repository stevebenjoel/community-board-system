# Implementation status — 3 November 2026

On 6 November 2026, the public website health and configuration endpoints confirmed Appwrite mode, and the authentication endpoint allowed the communityboardsystem.org browser origin. The registration page now covers account creation, sign-in, recovery, email verification and resend, and the handoff to community membership. Email delivery and a real resident-to-coordinator approval journey still require hosted acceptance testing.

The board review inbox uses server-calculated eligibility. Formal minutes and resolution amendments preserve the source text and require a separate approver. Scoped agency referrals support independent coordinator verification and in-app acknowledgement by the designated recipient.

The local synthetic preview includes a public demo project, milestone and matching review agenda for every board. Existing synthetic pilot databases receive these records additively on startup.

This is an executable five-module development pilot, not completion of the entire national production specification. The Appwrite/Coolify requirement overrides the documents' suggested backend stack. See ASSUMPTIONS.md for reconciliation and KNOWN_ISSUES.md for the full outstanding list.

## Living help and owner-selected feature ideas

All three first-round selections have now been implemented: account-persisted resident/officer walkthroughs; a private case/project evidence vault with bounded uploads, quarantine, real ClamAV adapter and account-bound expiring downloads; and action deadlines with an authorized work queue and deduplicated in-app reminders. FAQ/Documentation now contain 47 answers and 15 chapters. See ADDITIONS_GUIDE.md for service configuration and verification limits. No live Appwrite/ClamAV or Docker success is claimed.

Added public FAQ (37 answers), Documentation (12 workflow chapters), and a chat-style Feature ideas chooser with one/several/all selection and explicit copy-to-chat handoff. Both help pages use one reviewed source; build-time manual generation, workflow coverage tests and AGENTS.md rules require simultaneous maintenance. Browser interaction checks verified FAQ search, answer expansion, documentation linking and select-all request preparation. See HELP_MAINTENANCE.md for exact limits; the chooser does not send messages or start implementation automatically.

| Area | Status | Evidence |
| --- | --- | --- |
| Existing workspace/Git remote | Configured locally | origin points to supplied repository; no push/deployment |
| Responsive citizen, public, officer/admin web | Implemented; build/typechecked, browser unverified | src/pages, theme, authorized API client |
| Identity | Local synthetic tested; Appwrite integration unverified | Profile/session sync, SDK registration/login/recovery/verification/MFA |
| Geography/residency | Local workflow tested; official dataset missing | Maintained reference, cascading selector, import tool and review |
| Seven boards/appointments | Core workflow implemented/tested | Independent establishment/screening/appointment, effective grants, conflicts |
| Citizen case management | Core workflow implemented/tested | Retry-safe intake, status machine, assignment, notes, outcomes, appeals |
| Project/funding oversight | Core workflow implemented/tested; extended approvals partial | Exact amounts, source verification, milestone versions, inspections, redaction |
| Meetings/resolutions | Core electronic workflow implemented/tested; advanced governance partial | Eligibility/quorum, unique votes, result, locked minutes, resolution/tasks |
| In-app notifications/reports | Implemented and handler-tested | Atomic notifications, authorized projection/export and definitions |
| Audit | Implemented and local-tested; external integrity pending | Chained hashes/entity digest, SQLite append-only triggers |
| Appwrite persistence/schema | Implemented but not live-tested | Encrypted server-only aggregate rows, transaction guard, migration/seed |
| Coolify deployment | Prepared but not container-tested | Node 24 unprivileged Dockerfile, Compose, health check and deployment guide |
| Native citizen app | Source implementation, uninstalled/untested | mobile/App.tsx and official Expo setup script |
| Locale architecture | Partial | English source/translation-review manifests, UI still mostly English literals |
| Security/production assurance | Partial | 30 automated tests; independent reviews and launch integrations pending |

## Validation performed

- Dependency installation completed for zod, tsx, Node types and Playwright. Larger optional icon/lint installs encountered registry timeouts and were abandoned; no unused dependencies from them were retained.
- TypeScript strict and unused-code checks passed.
- Source policy check passed (not an ESLint/security scanner).
- SQLite migration and seed executed twice without resetting records.
- 30 unit, workflow, repository and HTTP-handler tests passed. The HTTP tests invoke actual request handlers in process; they are not network/browser tests.
- Production Vite build passed.
- OpenAPI generated from runtime validation schemas.
- Playwright listed six desktop/mobile-web scenarios; browser execution remains unverified.
- Live preview approval checks timed out; Docker and Appwrite live tests were not performed.

Exact commands and next required checks are in README.md and TESTING.md. Credentials/domain details are intentionally deferred until the user wants deployment.

Final local checks: 30 tests passed. The web and API processes started successfully in the sandbox; the browser retry could not reach the preview (connection timeout). This does not establish a verified browser view.

Selected-addition acceptance: manual browser checks passed for saved tours, PDF quarantine, deadline assignment and the monitor queue. A real reminder sweep created one notice and the immediate repeat created zero. Narrow and desktop queue layouts were inspected. Live Appwrite/ClamAV/container and the complete automated browser suite remain pending.

Final selected-addition checks: 55 automated tests passed; strict typing, source policy, synchronized help coverage and production build passed. The supplied production service credentials were not needed or requested. See TESTING.md and ADDITIONS_GUIDE.md for precise evidence and remaining external verification.

Independent task completion review is implemented in the board action tracker. Scoped coordinators, chairs and secretaries can approve evidence or reopen the task for corrections. The owner receives a private decision notice. Submission history and revision checks protect against evidence replacement and stale decisions. All 57 automated tests and the production build passed.
