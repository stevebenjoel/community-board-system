# FAQ, Documentation and feature ideas

User-facing pages:

- `/faq`: 48 searchable, topic-filtered answers with expandable details and contextual handbook links.
- `/documentation`: 15 role-aware workflow chapters with prerequisites, sequential steps, limits and links into CBS.
- `/feature-ideas`: three curated proposals; choose one, several or all, then copy a prepared development-chat request. It does not submit, approve or implement an addition.

## Update both pages with every feature

1. Read the actual changed workflow and its permissions, prerequisites and failure states.
2. Edit `src/content/help.ts`. Each topic contains both its FAQ questions/answers and its detailed steps, plus current integration boundaries. Both web pages consume this source immediately.
3. Map every new backend command to a primary topic; remove obsolete mappings when a command is removed. Changes to existing behavior require editorial review even when command names remain unchanged.
4. Run `pnpm help:sync`. It generates `docs/FAQ.md` and `docs/USER_GUIDE.md` simultaneously. The production build also regenerates both.
5. Run `pnpm help:check` and relevant tests. Coverage checks fail for missing or unknown workflow commands, incomplete topics, stale generated manuals or fewer than three feature proposals.
6. Update `featureIdeas` so shipped additions are replaced by useful pending proposals. At each feature delivery, present at least three optional additions in the development chat, allowing the owner to select one, several or all. Never interpret a suggestion as authorization to implement it.

These checks prevent structural drift; they cannot infer the meaning of changed code or guarantee an accurate explanation without editorial review. No background scheduler, paid AI service or external message sender is installed for this workflow.

## Validation for this delivery

Strict TypeScript checks, three focused help-content tests and the production build passed. Manual browser checks verified a narrowed FAQ search, expanded answer, linked meetings chapter and the all-three selection/prepared request. Native browser viewport was narrow; complete desktop breakpoint coverage is not claimed. Automated browser acceptance scenarios are included under `tests/e2e/help.spec.ts` for CI.
