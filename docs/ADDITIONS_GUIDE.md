# Guided walkthroughs, private evidence, deadlines and reminders

All three selected additions are implemented in the web app. Appwrite remains the production backend and Coolify the hosting target. No credentials or domain details have been requested.

## Walkthroughs

Open `/walkthrough`. Resident and officer journeys navigate actual screens with a guidance panel. Start, continue, back, pause, restart and finish save account-specific progress. The server checks officer eligibility; the walkthrough itself changes no cases, appointments or votes. One journey is active at a time. Completion is an acknowledgement of guidance, not certification.

## Evidence vault

Private vaults appear inside case details and authorized project details. PNG, JPEG and PDF uploads are limited to **4 MiB**, with bounded JSON/base64 input, extension/MIME/signature validation, immutable SHA-256 digests, and retry-safe request IDs. A public project does not grant access to its private files. Auditors may read authorized project evidence but cannot upload project content.

Synthetic mode stores bytes in SQLite `evidence_blobs` and metadata in the repository. Production stores bytes in Appwrite Storage's `cbs_evidence` bucket, with empty client permissions, file security, encryption and antivirus enabled. `pnpm db:migrate` creates the bucket; an existing bucket must also satisfy the checks before an upload is accepted. The application gateway is the only file-access path.

The gateway additionally streams the original bytes to an actual ClamAV daemon using INSTREAM. Configure `CBS_CLAMAV_HOST` and optionally `CBS_CLAMAV_PORT` (3310). Without a scanner, on timeout or an unrecognized response, files remain **QUARANTINED**. No synthetic clean verdict is used. A detected threat becomes **REJECTED**. Retry scan can recheck stored quarantine after infrastructure is configured; it cannot release a rejected file.

Only clean, stored files receive an account-bound, 60-second gateway download token. Every download rechecks current parent-record access, scan/digest status and actual bytes. Responses are private attachments with no-store and sandbox headers; raw storage keys or permanent public file URLs are never returned. There is no inline viewer or public evidence publication workflow.

The HTTP upload endpoint accepts a base64 JSON body (up to approximately 5.6 MiB encoded plus metadata). Set the reverse-proxy request-body limit to at least 6 MiB while retaining the server's independent 4 MiB decoded limit. Limit worker concurrency and upload rates according to measured staging capacity.

## Coolify scanner preparation

`compose.yaml` includes the official `clamav/clamav:stable` service with persistent signatures and no published clamd port. For a Dockerfile-only Coolify application, connect a separate internal ClamAV service and configure the host variable. Do not expose port 3310 publicly. Pin a reviewed image digest for a production release, keep signatures fresh and monitor readiness/failures. ClamAV may need time and memory to load signatures; uploads remain quarantined during that period.

This container setup and the live Appwrite integration have not been run here because Docker/service credentials are unavailable. Staging acceptance must include a harmless file, the standard authorized malware-test fixture, unavailable/timeout behavior, direct storage permission denial, revoked-access download denial and backup recovery of both database metadata and Storage bytes.

## Deadlines and reminders

Authorized independent handlers set future deadlines on assigned, open case actions. Authorized board officers reschedule open board tasks. Each change needs a reason; case events and audit snapshots preserve provenance. Input controls use device-local time, the server stores UTC, and displays explicitly label Africa/Lagos time.

`/actions` shows only authorized open work, sorted by deadline. Due soon means within 48 hours; overdue means the deadline has passed. Closed, rejected and duplicate cases are excluded. Tasks in REVIEW_PENDING are excluded from owner reminders.

The API runs a reminder sweep on startup and every 15 minutes by default. `CBS_REMINDER_INTERVAL_MS` can change this (minimum one minute). Notifications are generic private in-app messages, deduplicated by owner, record, exact deadline and phase within the repository transaction. Marking a notice read does not create another reminder. Rescheduling can create a new deadline identity. Expired/revoked grants and conflicts are rechecked.

`pnpm reminders:run` executes a one-off transactional sweep for an operator or job runner. When scheduling it externally, use the same configured backend as the API. In-process sweeps are sufficient for the pilot but require uptime monitoring. No email/SMS, push or emergency escalation integration is claimed. The web app refreshes signed-in data every minute only while visible.

## Living help and next ideas

The FAQ and handbook are generated together from `src/content/help.ts`. The current feature ideas include a board review inbox, formal meeting and resolution amendments, and verified agency referrals.

References: [Appwrite Storage API](https://appwrite.io/docs/references/cloud/server-rest/storage), [ClamAV containers](https://docs.clamav.net/manual/Installing/Docker.html), [ClamD INSTREAM protocol](https://docs.clamav.net/manual/Usage/ClamdProtocol.html).

Manual acceptance completed: resident tour start/next/pause and persistence were observed in the live browser; a synthetic PDF upload was stored as QUARANTINED with Download disabled; a coordinator deadline appeared in the assigned monitor queue. Running the reminder command twice created one notice, then zero duplicates. Narrow and 1280-pixel desktop action layouts showed no horizontal overflow. The desktop screenshot is saved locally in .data/additions-actions-preview.png. A real clean/infected ClamAV verdict and live Appwrite Storage remain unverified.
