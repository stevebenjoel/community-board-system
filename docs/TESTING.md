# Test report

## Reproduce

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm db:migrate
pnpm db:seed
pnpm api:generate
pnpm build
```

Executed locally using the corresponding installed Node CLIs because sandboxed pnpm could not register its external package store. Type checking, source policies, SQLite migration/seed, OpenAPI generation, Vite production compilation, and the initial 30 unit/workflow/store/HTTP-handler tests passed.

The domain suite covers all seven definitions, geography boundaries, idempotency, mass assignment, unverified contacts, role escalation denial, MFA, expired grants, restricted cases, cross-board access, case resolution/appeal, internal-note redaction, ethics routing, board establishment, appointments, separation of duties, expiry/revocation, conflicts, money precision, finance verification, project redaction, milestone versioning, quorum, duplicate ballots, minutes locking, resolutions and audit chaining.

Repository tests verify migrations, rollback, serialized writes and audit update/delete rejection. API-handler tests verify private/public projections, cookie flags, origin/header restrictions, committed retry-safe case creation, structured authentication errors, schema rejection, redacted exports and logout.

## Browser acceptance — authored, not executed here

```powershell
pnpm exec playwright install chromium webkit
pnpm test:e2e
```

Six discovered tests cover desktop and mobile-web citizen reporting/reload, technical administrator redaction/public projects and dialog keyboard dismissal. `playwright.config.ts` uses a separate synthetic fixture database. The local preview and browser approval checks timed out in this session, so no screenshot, visual, responsive or independent WCAG verification is claimed. Do not treat test discovery as passing execution.

## Further required verification

Appwrite staging: migrations/index readiness, seed idempotency, account registration/contact verification/recovery/MFA, server identity validation, direct database permission denial, private payload encryption/decryption, concurrent transaction conflicts, full workflows and redaction.

Operations: Docker build/run, reverse proxy/CSP/TLS, production-mode fail-closed configuration, dependency scan, independent security/accessibility review, performance/load tests and Appwrite backup/restore exercise. Native: install compatible Expo packages, typecheck, component/integration tests and physical Android/iOS tests. None has been claimed complete.

Final verification: 30 tests passed, including exact large-currency rendering, private audit-snapshot redaction, project-stage transition provenance and an actual synthetic SQLite backup/restore. Both development processes started successfully in the sandbox. Browser preview retry returned a connection timeout, so browser execution remains unverified.

Help delivery verification: all 33 unit/workflow/store/API/help tests passed, with strict unused-code checks, source policy, FAQ/manual parity and Vite production build passing. Manual browser checks verified FAQ search, answer expansion, handbook anchor navigation, and all-three feature selection/request preparation. New browser acceptance scenarios are authored in tests/e2e/help.spec.ts; the full Playwright suite was not rerun for this delivery.

Three selected additions: all 55 automated tests passed, including walkthrough persistence/role checks, private upload validation, retry safety, malware/quarantine boundaries, account-bound token expiry, revoked-access denial, byte tampering, deadline permissions and reminder deduplication. Strict TypeScript, source policy, help parity and production build passed. Manual browser acceptance verified saved tour navigation, a synthetic PDF committed to quarantine with disabled download, coordinator deadline assignment, and the monitor queue. Reminder sweeps created one notice then zero duplicates. Real Appwrite/ClamAV and Docker execution remain pending; test scanners are injected only in automated tests.
