# Community Board System

An Appwrite-oriented community governance development pilot, prepared for Coolify. Built from all three supplied CBS documents, with the user's Appwrite backend requirement taking precedence over their alternative technology recommendations.

The responsive web application includes citizen, board officer, public and administration workflows. The five core areas are identity/jurisdiction, boards/membership, confidential cases, projects/funding, and meetings/resolutions. The seven principal board definitions are preserved.

## Start locally — no credentials or domain needed

Use Node.js 24 and pnpm 11.25.0.

```powershell
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://127.0.0.1:5173. The API uses http://127.0.0.1:3001. Select a synthetic profile in the top pilot bar; Ada is a resident, Chidi a coordinator, Fatima an independent approver, Amara the chair, Tunde the secretary, and Zainab a monitor. Every fixture is fictional. No real Appwrite account is needed for this local mode.

Optional: copy `.env.example` to `.env.local` to override local defaults. Keep local servers on loopback. Stop with Ctrl+C.

## Verify

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm api:generate
pnpm build
```

Browser tests are provided separately:

```powershell
pnpm exec playwright install chromium webkit
pnpm test:e2e
```

The strict checks, source-policy check, local migration/seed, workflow/API-handler/repository tests and production build have run successfully. Browser tests were discovered but not executed: automatic preview/browser approval checks timed out. Appwrite live tests and Docker execution remain pending. See `docs/TESTING.md` for precise evidence and limits.

## Backend and deployment

Local development uses SQLite only for synthetic testing. Production requires Appwrite Account and TablesDB behind the Node authorization gateway. Appwrite aggregate payloads are encrypted, with no browser database permissions or server key exposure. `CBS_MODE=synthetic` is rejected in production.

The Coolify Dockerfile serves both the compiled interface and API on port 8080 as an unprivileged Node process. Appwrite runtime variables and the eventual HTTPS origin are configured when hosting details are supplied. No production account, domain or deployment has been connected.

Read `docs/DEPLOYMENT.md` before deployment. `compose.yaml` is an optional deployment template and intentionally requires actual runtime configuration. It does not provision Appwrite itself.

## Learn how CBS works

Open `/faq` for quick searchable answers, `/documentation` for step-by-step role guides, and `/feature-ideas` to choose proposed next additions. The two help pages share `src/content/help.ts`; `pnpm help:sync` regenerates both manuals together, and `pnpm help:check` verifies coverage and parity. See `docs/HELP_MAINTENANCE.md` for the required feature-delivery workflow.

## Project layout

- `src/pages/` — citizen, public, board and administration interfaces
- `shared/` — typed domain contracts and the seven board definitions
- `server/` — request validation, authorization, workflows and transactional repositories
- `scripts/` — development launcher, Appwrite/local migrations, seed, geography import and authorized role bootstrap
- `tests/` — workflow, repository, HTTP-handler and browser acceptance tests
- `mobile/` — staged Expo citizen source and setup instructions; not device-verified
- `docs/` — source specifications, architecture, API, security, operations and implementation status

## Scope and remaining work

This is an executable pilot, not a claim that the complete national production specification has been finished. The tested core workflows are implemented. Live Appwrite/scanner verification, full agency/organization workflows, advanced governance amendments, native builds, official datasets, external notifications, national-scale query architecture and independent launch assurance remain outstanding. See `docs/IMPLEMENTATION_STATUS.md` and `docs/KNOWN_ISSUES.md`.

Boards are participatory and advisory within adopted charters. No government endorsement, legal powers, emergency dispatch, or verified national performance figures are invented.

## Selected additions

Guided walkthroughs are at /walkthrough; private case/project attachments are inside record details; action deadlines and reminders are at /actions. The vault blocks downloads until a real scanner returns a clean verdict. See docs/ADDITIONS_GUIDE.md for configuration and limits. FAQ and Documentation were updated together.
