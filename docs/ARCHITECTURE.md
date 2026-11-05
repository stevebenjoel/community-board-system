# Architecture

```text
React/Vite web (citizen, officer, public, administration)
        | authenticated JWT or loopback-only synthetic session
Node TypeScript gateway /api/v1
        | strict Zod command schemas -> policy checks -> domain state transitions
Repository transaction (audit + state + private in-app notifications)
        |-- Appwrite TablesDB (production)
        `-- SQLite (synthetic development/tests only)
Appwrite Account SDK (identity, verification, recovery, MFA)
```

`shared/model.ts` defines domain contracts. `server/policy.ts` enforces effective grants, jurisdiction ancestry, active appointments and case sensitivity. `server/domain.ts` implements all commands. `server/store.ts` provides repositories. `server/index.ts` validates HTTP requests and serves static production assets. `src/pages/` groups working interfaces by module. `mobile/App.tsx` is a separate staged Expo citizen client.

State is organized as per-entity aggregates. Each case has an append-only event array; each project preserves milestone baseline versions; each meeting stores votes, calculated decisions and locked approved minutes. Every successful mutation appends a SHA-256 chained audit with the changed entity digest. In-app notifications are stored in the same transaction; no external delivery is claimed.

Appwrite rows have no client permissions and encrypted JSON payloads using AES-256-GCM. The API validates the caller via Appwrite Account with a per-request JWT. The server key is used only inside the gateway after policy evaluation. Technical administration has no blanket confidential-case role. Grant assignment is an audited operator command with authority and expiry.

Appwrite transactions stage a common revision-row increment before loading records, then stage changed aggregates and commit. This deliberately serializes pilot writes. SQLite uses `BEGIN IMMEDIATE` with an application queue. All command writes, audit and notifications commit together. Database conflicts abort the command and require a refreshed retry.

Scaling limit: the pilot repository loads the working dataset per operation and uses a global write guard. National scale requires indexed scoped repositories, partitioned transaction guards, measured concurrency/load limits, audit anchoring, and aggregate-size limits. No millions-of-users capacity is claimed.

Selected additions: walkthrough progress is stored on each user record. `server/evidence.ts` coordinates authorized metadata reservations, private blob storage, real ClamAV scanning, quarantine and expiring gateway downloads. Synthetic byte storage uses SQLite, while production bytes use server-only Appwrite Storage; metadata and auditable transitions remain in TablesDB. `server/reminders.ts` derives authorized action queues and transactionally deduplicates generic private deadline notices. See ADDITIONS_GUIDE.md for limits and configuration.
