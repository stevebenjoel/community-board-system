# Roles and permissions

Server policy is authoritative; hiding buttons is only interface convenience. Every privileged action requires verified contact and a session that completed two or more Appwrite authentication factors.

| Actor | Access |
| --- | --- |
| Public visitor | Public boards, approved project projections, public notices/resolutions |
| Resident | Own confidential cases, nominations, residency and privacy requests |
| Board member | Assigned ordinary cases; scoped inspections, meeting participation |
| Secretary/chair | Scoped board cases, project workflows and meeting preparation |
| LGA coordinator | Explicit jurisdiction subtree, establishment/review and assignment |
| Ethics reviewer | Conduct cases and independent conflict reviews in scope |
| Security handler | Explicitly assigned highly restricted cases only |
| Auditor | Explicitly scoped audit metadata and financial verification |
| Platform administrator | Privacy administration; no default private-case access |
| Agency officer | Scoped acknowledgement boundary; full agency affiliation model pending |

Board grants additionally require an active appointment and board, valid start/end dates, and the correct board ID. Revocation and expiry are evaluated on every request. Jurisdiction follows actual ancestry, never a client-provided role or presumed national clearance.

Candidates cannot screen or approve themselves; screening officer cannot approve the same nomination. Establishment approval must be independent of submission. Financial and case-outcome reviewers must be independent of their authors. Conflicted participants cannot vote or act on restricted records.

There is no unrestricted superadmin UI. Initial non-board grants use `pnpm admin:grant` after recorded operator authority. Real agency/organization affiliation, higher national/zonal/state delegation, facilitator intake and break-glass access remain unimplemented and disabled.
