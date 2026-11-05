# Database and migrations

Run `pnpm db:migrate`, then `pnpm db:seed`. The scripts select the backend using `CBS_MODE`. Seeds preserve existing records and are idempotent.

Synthetic SQLite has a migration ledger and `records(id PRIMARY KEY, kind, payload, ordinal)`, a kind index and triggers rejecting audit updates/deletion. `.data/` is ignored by Git. No real data belongs in this adapter.

Appwrite migration creates:

| Table | Fields | Access |
| --- | --- | --- |
| cbs_records | kind, payload (encrypted), ordinal | Server only |
| cbs_control | revision | Server only transaction guard |
| cbs_board_types | code, name, description | Server only; public through API |

Rows store typed aggregates for users, geography, residencies, boards, nominations, appointments, conflicts, cases, projects, financial events, meetings, resolutions, tasks, privacy requests, notifications and audits. Record relationships and uniqueness are checked in serialized domain transactions. This is an Appwrite aggregate schema, not a claim that all normalized SQL tables in the original documents were created. Index readiness must be confirmed before serving traffic. Appwrite schema migration is implemented but not exercised against a live service.

Financial amounts are fixed two-decimal strings and validated as integer minor units using BigInt. The interface formats them only for presentation; arithmetic never uses floating-point totals. Independent event types and currencies are retained.

The name reference seeds six zones, 36 states and FCT. Import verified LGA/ward/community data with `pnpm geo:import <file.json>`. Required format:

```json
{"institution":"Source institution","version":"dataset-version","reference":"https://official-source.example/dataset","approvedBy":"Approved reviewer reference","records":[{"id":"internal-uuid","name":"Verified name","type":"LGA","parentId":"existing-state-uuid"}]}
```

Records must arrive parent-first. The pipeline rejects unknown parents, wrong geographic types and silent changes to existing identifiers. Names, source URLs, reviewer references and versions are preserved. Source trust is an operator review responsibility; the script does not certify a dataset as official.

Forward recovery: preserve rows and encryption keys; apply additive schema changes first. Do not delete production tables to retry migration. Restore into a separate Appwrite project to verify backups before any cutover.

Migration 2 adds the synthetic evidence_blobs(id,content) table. Metadata uses the evidence aggregate collection and is private to authorized parent-record participants. Appwrite migration creates the server-only cbs_evidence Storage bucket. Back up database metadata, Storage bytes and encryption keys as a consistent recovery set. Walkthrough progress is stored per user; deadlines are fields on cases/tasks; reminder deduplication keys are retained on notifications.
