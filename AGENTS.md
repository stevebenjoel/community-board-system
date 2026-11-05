# COMMUNITY BOARD SYSTEM — ENGINEERING RULES

The five release modules are identity/jurisdiction, boards/membership, cases, project/funding oversight, and meetings/resolutions. Preserve EDU, HLT, SEC, INF, TRD, YTH, CUL.

- Inspect existing code and preserve user data. Use strict TypeScript.
- The user's Appwrite backend and Coolify hosting requirements override the uploaded documents' suggested NestJS/PostgreSQL stack.
- Enforce permissions, jurisdiction, effective appointments, conflicts, and transitions on the server.
- No self-appointed officers, self-approved appointments, fictional official geography, or fabricated government acknowledgements.
- Local synthetic mode must be visibly labeled, loopback-only, and unavailable in production.
- Do not claim production readiness or live Appwrite verification without the corresponding evidence.
- Keep private cases and evidence out of public views, notifications, and exports.
- Keep authoritative records on the backend, never browser local storage.
- Update implementation status and run meaningful tests with changes.

## Living help and feature suggestions

- Every added, changed, or removed user-facing feature must update its FAQ answers and step-by-step documentation in the SAME change, before reporting the feature complete.
- Edit the single shared source `src/content/help.ts`; the `/faq` and `/documentation` pages use it directly. Run `pnpm help:sync` to regenerate BOTH `docs/FAQ.md` and `docs/USER_GUIDE.md`, then `pnpm help:check`. Never maintain two independent explanations.
- New/removed backend commands must update topic coverage. Changes to existing behavior still require a semantic content review; automated checks cannot infer correct explanations from code.
- Explain prerequisites, roles, steps, results, errors, privacy, and integration limits. Do not describe planned features as live.
- At the end of a feature delivery, suggest at least THREE relevant optional next additions in this development chat. Briefly explain each benefit and allow the owner to select one, several, or all. Suggestions alone do not authorize implementation.
- Keep `featureIdeas` current with at least three useful, not-yet-implemented options. The in-app `/feature-ideas` chooser prepares a message for the owner to copy into this chat; never pretend that clipboard copy sends a request or starts work.
- Do not create scheduled polling or send chat messages autonomously to maintain help. Update it as part of the actual feature change.
