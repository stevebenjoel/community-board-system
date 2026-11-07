# Coolify deployment

Deployed on Coolify (Diplomat server) as a Docker Compose application at https://communityboardsystem.org and https://www.communityboardsystem.org, from branch `codex/setup-workspace`.

## Application resource

Use the Git repository and branch containing this code, Dockerfile build pack, root `/Dockerfile`, port **8080**, and health path **/health**. Docker builds React assets and runs the Node policy gateway under an unprivileged user. The gateway serves both the UI and `/api/v1`; it is not a static-only Nginx image. Appwrite is a separate backend, cloud or self-hosted.

## Runtime environment

| Variable | Production value/purpose |
| --- | --- |
| NODE_ENV | production |
| CBS_MODE | appwrite (synthetic is rejected) |
| HOST | 0.0.0.0 |
| PORT | 8080 |
| APP_ORIGIN | Actual HTTPS CBS origin, no trailing slash |
| APPWRITE_ENDPOINT | Actual HTTPS API endpoint ending in /v1 |
| APPWRITE_PROJECT_ID | Public Appwrite project ID |
| APPWRITE_DATABASE_ID | cbs, or chosen database ID |
| APPWRITE_API_KEY | Separate runtime key with rows.read, rows.write, files.read, files.write |
| APPWRITE_DATA_KEY | Secret base64-encoded 32-byte AES key |
| APPWRITE_EVIDENCE_BUCKET_ID | cbs_evidence, or chosen bucket ID |
| CBS_CLAMAV_HOST | clamav (the compose service) |
| CBS_CLAMAV_PORT | 3310 |
| CBS_REMINDER_INTERVAL_MS | 900000 (minimum 60000) |

Every name in `.env.local` also exists in Coolify with its production value. `compose.yaml` fixes NODE_ENV, CBS_MODE, HOST, PORT and CBS_CLAMAV_PORT, so their Coolify copies are a record only. Dev-only exceptions, not set in Coolify: CBS_DB_PATH (synthetic mode only). APPWRITE_PROVISIONING_KEY is supplied only in the operator shell for migrations and seeds, never in Coolify or `.env.local`.

Configuration is read at runtime. Endpoint/project ID are returned by `/api/v1/config`; secrets never are. A changed data key cannot decrypt old records. Use a staged key-rotation migration, never replace it casually.

## Appwrite preparation

1. Create a separate staging project and register the CBS web hostname as a platform. Register native identifiers when native builds are adopted.
2. Set the runtime variables through Coolify secrets. Use a migration key with database/table/column/index/row and transaction permissions. After schema setup, use a least-privilege runtime key for the necessary row and transaction services; key-scope names must be checked against the chosen Appwrite version. Keep the operator bootstrap Users-read capability separate from the ordinary runtime key.
3. Run `node --import tsx scripts/database.ts migrate` in a configured one-off container. Wait for all Appwrite columns/indexes to become available. Run `node --import tsx scripts/database.ts seed` once to add maintained geography references. No users, grants or synthetic operational records are seeded in Appwrite mode.
4. Register a real test account, verify contact and set up MFA. Sign into CBS to synchronize the profile. After formal authority is recorded, bootstrap a limited officer with:

```text
pnpm admin:grant <Appwrite-user-id> <imported-jurisdiction-uuid> LGA_COORDINATOR <approved-authority-reference> <ISO-expiry>
```

5. Import reviewed, versioned geography before pilot onboarding. Adopt actual board charters and use independent establishment/appointment approvers.
6. Complete live Appwrite authentication, transaction/conflict, encryption, schema and redaction tests in staging. The adapter has not been live-tested in this session.
7. Configure the actual domain, HTTPS, HSTS, proxy/body/rate limits and operational monitoring when the domain is provided. No domain assumption is embedded in application source.

## Checks before public launch

The development pilot is not a production certification. Resolve `docs/KNOWN_ISSUES.md`; perform browser/native acceptance, independent accessibility/security assessment, dependency scanning, performance/concurrency testing, backup restoration and adopted legal/operator/privacy arrangements. Evidence binaries, malware scanning and external notifications must be completed before promising those services.

## Rollback

Record the deployment commit and Appwrite schema version. Keep an immutable image of the previous release and snapshots/backups with the matching data key. Roll back the application image only when its schema remains compatible. Prefer additive forward schema fixes. For a data recovery incident, restore to a new Appwrite project, validate record counts, relationships, audit hashes and decryption, then update endpoints in a controlled cutover.

Reference: [Coolify Dockerfile applications](https://coolify.io/docs/applications/builds/dockerfile), [Appwrite transactions](https://appwrite.io/docs/products/databases/tablesdb/transactions).

Selected-addition deployment: see ADDITIONS_GUIDE.md. Add Appwrite Storage bucket/file permissions to appropriately separated migration/runtime keys, configure APPWRITE_EVIDENCE_BUCKET_ID and an internal CBS_CLAMAV_HOST:3310 service, and allow at least 6 MiB proxy request bodies while retaining the gateway's 4 MiB decoded limit. The API's default 15-minute reminder cycle requires uptime monitoring. The Compose template includes ClamAV but has not been executed here.

Voice reporting requires HTTPS on the hosted site and an Appwrite evidence bucket that permits M4A and WebM. Apply the updated database migration with the provisioning key before deploying the browser workflow. The runtime key must also be able to read the evidence bucket metadata for the existing private-storage policy check. Verify a real recording upload and malware scan on the hosted site. For local offline testing, use the built app served by CBS on loopback so the service worker can cache the compiled files.

## Connected Appwrite project

Temporary password-only testing is controlled by CBS_TESTING_MODE. The Compose file defaults it to true for the owner's requested testing period. New registration skips verification email delivery, member actions accept unverified contact, and scoped officer actions accept single-factor sessions. Appwrite's recorded contact verification and session factors remain accurate. Set CBS_TESTING_MODE=false in Coolify and redeploy to restore the app's email and MFA requirements. Appwrite account-level MFA enrollment remains a separate setting.

The endpoint is https://appwrite.diplomat-server.base44-ng.online/v1 and the project ID is 6aec6c54003e61828de5. Provisioning was verified against server version 1.8.1 on 5 November 2026. Database cbs contains the private cbs_records, cbs_control and cbs_board_types tables. The kind and ordinal indexes are available. The private cbs_evidence bucket accepts PNG, JPEG, PDF and MP4 attachments up to 4 MiB.

Supply APPWRITE_PROVISIONING_KEY only to the database migration and seed commands. Those commands select this credential explicitly. The running API requires APPWRITE_API_KEY. The provisioning credential was loaded from the owner's supplied file into the provisioning process and was not saved into the project environment file.

Create a separate runtime key when deploying, with rows.read, rows.write, files.read and files.write. Authentication uses the user's Appwrite session and JWT. Schema, bucket administration and user administration scopes belong to operator credentials. Verify the separate runtime key with a database write and file upload before public launch.

The local .env.local contains the project settings, an encryption key and an empty APPWRITE_API_KEY placeholder. Keep APPWRITE_DATA_KEY backed up securely because existing encrypted records require the same key. Keep CBS_MODE=synthetic for the demo until a runtime key is available. Register the web platform origin in Appwrite and validate SMTP delivery, registration, verification, recovery and MFA before switching real members onto the deployment.
