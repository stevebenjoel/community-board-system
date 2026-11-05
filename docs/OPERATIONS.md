# Operations runbook

## Local pilot

Use `pnpm dev`. Web: http://127.0.0.1:5173; API: http://127.0.0.1:3001. Select a SYNTHETIC profile from the top bar. The SQLite adapter contains fictional records only. The development server must stay on loopback.

Test actors: Ada (resident), Chidi (coordinator), Fatima (independent approver), Amara (chair), Tunde (secretary), Zainab (monitor), Emeka (ethics), Amina (auditor), technical administrator (privacy administration). All names/accounts are synthetic. Switching profiles changes server permissions rather than a frontend-only role toggle.

Case exercise: Ada submits → Chidi accepts/assigns → Zainab investigates/proposes outcome → Fatima independently reviews/closes → Ada appeals if needed. Appointment exercise: nominate Ada → Ada accepts → Chidi screens → Fatima approves. Meeting exercise: Tunde confirms eligible attendance, Amara proposes, present members vote, Tunde calculates/submits minutes, Amara approves/adopts a resolution. Each write is audited.

## Monitoring

`/health` is liveness only; it does not certify Appwrite availability or data integrity. Monitor process uptime, error/request IDs, Appwrite latency/errors, transaction conflicts, row payload size, authentication/MFA failures, proxy rate limits and encrypted backup success. Never log JWTs, keys, case narratives or residency statements. The structured console error currently contains a request ID and error class only.

External notification delivery is not implemented; in-app notifications are committed transactionally. The API now checks case/task deadlines at startup and every 15 minutes by default, deduplicating owner notices per deadline and due/overdue phase. `pnpm reminders:run` is available for an operator/job runner. No email/SMS provider is claimed to be active. Appointment expiry is checked synchronously on every action rather than relying on a background job.

## Backup and restoration

Appwrite: back up database rows, control records and definitions using the installed version's supported backup facilities. Separately protect the AES data key, project configuration and deployed image/commit. Restore into an isolated staging project, verify decryption, source record counts, foreign references, audit chain and a complete case/vote workflow. Required production RPO/RTO are targets awaiting an operational backup plan and recovery rehearsal.

Local synthetic SQLite: stop the API before copying `.data/cbs.sqlite` and its journal artifacts, or use SQLite's backup API. A real fixture backup/restore test is included in automated tests. Never copy production personal data into development.

## Incident response

1. Record detection time, affected environment and request IDs without copying sensitive narratives.
2. Restrict affected application traffic; preserve logs and database snapshots. Use Appwrite to revoke compromised sessions and keys through the authorized operator process.
3. Determine whether the application server or payload encryption key is compromised. Key exposure requires a new key and controlled re-encryption, not only an image redeploy.
4. Restore or roll forward in isolation and verify authorization, audit integrity and decryption before reopening.
5. The responsible operator determines required communications, privacy response and notification duties under its adopted policy. No incident notification contact has been invented.
