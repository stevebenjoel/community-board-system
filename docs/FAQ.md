# CBS — Frequently Asked Questions

Reviewed 2026-11-04. Generated from src/content/help.ts. Edit the shared source, then run pnpm help:sync.

## Start here: how CBS works

### Can I test before email and two-factor authentication are configured?

Yes. While testing mode is active, creating an account continues directly to community membership without a verification email or a two-factor prompt. Existing accounts can sign in with email and password. Community requests still need coordinator approval, and officer permissions still require an assigned role.

### How do I find a board from Overview?

Choose its labeled card in the board directory. Each board has a distinct icon and color, and the board name identifies it.

### Where can I change the appearance?

Select Dark mode in the top bar. Select it again to return to light mode. On first use, the app follows your device preference.

### What is the Community Board System?

CBS is a participatory governance and accountability platform. It organizes community membership, seven thematic boards, confidential cases, public project oversight, meetings, and resolutions.

### Is CBS a government agency or an emergency service?

The software does not create government powers or imply endorsement. Boards act within adopted charters and agreements. CBS is not an emergency dispatch service; contact your local authorized emergency service directly in immediate danger.

### Why does the preview say Synthetic pilot?

The local pilot contains fictional people, places, case records, and funding. Selecting a test profile changes the server-side access permissions for that synthetic actor. None of these figures represents real government performance.

Full workflow: /documentation#guide-start

## Accounts, sign-in & security

### How do I sign in to the local preview?

Select Sign in to continue as the demo resident. In My community, your current selection stays in place so you can request verification. Use Explore as in the pilot bar to switch to another demo role.

### What if account creation succeeds but the email does not arrive?

Check your spam folder and use Resend verification email on the membership page. If your account already exists, sign in or use Forgot password. Verification delivery depends on the deployment’s email service.

### What should I do if registration reported an expired session after creating my account?

Choose Already registered? Sign in and use the same email and password. After signing in, use Resend verification email if needed, then continue to your community. Account creation may already have succeeded before the earlier error.

### Can I register myself as a chair or administrator?

No. Registration creates an identity without privileged grants. Appointments and scoped grants follow authorized approval workflows. The server rejects self-promotion even if a request is manually changed.

### Why is an officer action denied after I sign in?

Possible reasons include an unverified contact, an incomplete MFA session, a missing or expired grant, an inactive appointment or board, a different jurisdiction, a conflict restriction, or a required independent reviewer.

### How do I recover an Appwrite account?

Use Recover account from the signed-out profile page and follow the provider’s emailed recovery link. Local synthetic profiles do not use a password-recovery flow.

Full workflow: /documentation#guide-identity

## Find & verify your community

### Where do the LGA, ward and community options come from?

The picker uses INEC reference records for 774 LGAs and FCT area councils and 8,809 electoral wards. When you select a ward, CBS loads GRID3 settlement names matched to that ward and any separately imported community records. GRID3 matches are source references for selecting a location. Residency verification is a separate step.

### Why is my community missing?

GRID3 coverage varies and some settlement records could not be linked to a unique INEC ward. Where no matched or separately imported records exist, the picker displays an empty community list.

### Does registration immediately make me a verified community member?

Select your community and submit a residency statement or attestation reference. A different authorized coordinator reviews the request. Verification history shows the pending, verified or rejected decision and its reason. Email verification is required when temporary testing mode is off.

### Must I supply a national identity number or voter details?

No. The current workflow uses residency statements or attestation references. Do not submit NIN or biometrics. A CBS community association is not proof of voter registration.

### Can an unverified resident browse public information or raise a concern?

Public information remains accessible. Case submission requires a signed-in identity with verified contact and a registered community; it does not require completed residency approval. Nomination eligibility and officer access have stronger checks.

Full workflow: /documentation#guide-community

## The seven boards & their establishment

### Where can I explore examples for all seven boards?

The synthetic Greenfield pilot includes a public demo project and review meeting for each board. The Security example uses a public awareness scenario about confidential reporting. Real boards require local establishment and approval.

### Which records appear on a board page?

The board page shows published projects of that board type and public meeting notices for its established instances.

### What does Governance configuration required mean?

A dependent action needs an approved charter or effective rules that have not been configured. The app must not invent quorum, tenure, appointment authority, or formal voting powers.

Full workflow: /documentation#guide-boards

## Nominations, appointments & conflicts

### Does a nomination give someone officer access?

No. Candidate acceptance, screening, independent approval, board status, valid tenure, and the active scoped grant must all satisfy the applicable checks.

### Why can the screening coordinator not approve the appointment?

The system separates duties. Use another authorized coordinator for final approval so the same person does not both screen and appoint a candidate.

### What happens when someone has a conflict of interest?

A disclosure enters review. A recorded restriction prevents participation in affected actions or votes. The member cannot approve their own restriction decision.

Full workflow: /documentation#guide-membership

## Report, track & appeal an issue

### Can other residents see my complaint?

No. Current case narratives are not public. Your own records and authorized handlers’ records are filtered on the server. Internal notes are omitted from the reporter’s view.

### What if my connection drops during submission?

Retry the same open submission. A stable request ID prevents duplicate creation if the first attempt already committed. Do not assume a report was received until the app confirms success.

### Where is my saved browser draft?

Reopen Report an issue in the same tab and synthetic/account profile. Drafts are tab-scoped, are not official records, and are removed after confirmed submission. Closing the tab or clearing session storage can remove them.

### Can I attach photos or videos to a report?

Yes. Open a submitted case or an authorized project and use Private evidence vault for PNG, JPEG, MP4 or PDF files up to 4 MiB. The server validates file type, stores a private attachment, and checks scanning status. If the scanner is unconfigured or unavailable, the file remains quarantined and cannot be downloaded. Live Appwrite Storage and ClamAV verification is still required before production use.

### How do I select a community in the report form?

Choose the state or FCT, LGA or area council, and ward inside the form. The Community / Settlement list loads the records for that ward. Your verified community is preselected when available. Changing an earlier selection clears the choices below it.

Full workflow: /documentation#guide-cases

## Triage, investigation & outcome review

### Does “In progress” mean the problem has been fixed?

No. It means an authorized investigation or action workflow has started. Outcome proposed means an officer reports a result; verification and closure are later steps.

### Can a board close its own conduct complaint?

A conduct complaint uses the ethics-review route. Ordinary chair/coordinator access does not automatically include that record. The accused board does not gain control simply because it is a board.

### Does Referred mean a government agency acknowledged the case?

No. The current status does not establish electronic delivery or agency acknowledgement. Verified institutional referral integration remains incomplete.

Full workflow: /documentation#guide-investigation

## Public project media and the global honors board

### Can viewers see report attachments?

Case attachments are private. The gallery shows only explicitly published, clean project photos and videos.

### How does a project earn recognition or get flagged?

Recognition requires recorded verified completion on a public project. A follow-up flag identifies an overdue milestone with less than 100% verified progress on the current baseline. Flags reflect the available records, and a project needs a dated milestone to be assessed.

Full workflow: /documentation#guide-honors

## Projects, funding & inspections

### Why are approved, released, paid, and spent funding shown separately?

They represent different financial events. Approval is not proof that money was received; a payment is not automatically final expenditure. The app does not add them into a misleading single total.

### What is the difference between reported and verified progress?

Open a project and read its milestone timeline in due date order. Reported progress is the stated progress. Verified progress is independently reviewed progress with evidence. The two bars can differ, and a milestone is marked verified complete only at 100% verified.

### Who can see unverified funding and inspection records?

Authorized scoped officers can review internal records. Public projections exclude unverified finance and remove internal inspections, evidence references, and identifying author fields.

### Does a variance or overdue milestone prove wrongdoing?

No. A review flag identifies missing evidence, delay, or inconsistency for human review. It does not establish fraud or criminal conduct.

Full workflow: /documentation#guide-projects

## Meetings, quorum, votes & minutes

### Why can a meeting not accept my vote?

Check whether the meeting has started, the board and appointment are active, you were eligible on the meeting date, your attendance is confirmed, quorum is met, you are not recused, and you have not already voted in the closed/current round.

### How is the voting threshold calculated?

The pilot takes the stored charter’s quorum percentage over eligible non-recused members, and its Yes threshold over present eligible members. Each present member must vote or abstain before calculation. Different formal voting procedures require further implementation.

### Can approved minutes be edited?

Approved minutes stay locked. Formal amendments appear alongside the original, with the decision recorded separately. Pending and rejected amendments stay within the board.

Full workflow: /documentation#guide-meetings

## Agency referrals and receipt

### Who can see an agency response?

The designated recipient and authorized case handlers can see the response. Handler follow-up notes remain internal. The reporter and public cannot see the referral history.

### Who can acknowledge a referral?

Only the designated recipient with a current agency officer grant in scope can acknowledge. The acknowledgement confirms receipt within CBS.

### Can I try a referral locally?

Yes. In the synthetic preview, use a coordinator to refer the water point case to the Synthetic Community Works Desk. Switch to Synthetic agency officer to acknowledge it.

Full workflow: /documentation#guide-referrals

## Resolutions & follow-up actions

### Is a published resolution a binding government order?

No. It records a board recommendation within its mandate. It does not prove that government funding was approved or that an institution accepted an assignment.

### Can I assign a task to a government agency?

The current task workflow is restricted to active board members. Full institution-accepted assignments are not operational and must not be represented as accepted agency work.

### Who can approve completion, and what happens if evidence needs correction?

A different authorized coordinator, chair or secretary reviews the submitted evidence and records a reason. Approval marks the task Completed. A correction request reopens it for the owner to resubmit. The tracker retains the submission and decision history.

### When does CBS escalate a pending review?

Eligible coordinators receive an in-app notification after a submission has waited at least three days. A corrected submission starts a new waiting period.

### Why is a submission missing from my Board review inbox?

The inbox shows only pending evidence you are eligible to review. Check the board and age filters, your current appointment and any conflict restrictions. Your own submissions are excluded.

Full workflow: /documentation#guide-resolutions

## Privacy, notifications & reports

### Why do my dashboard numbers differ from another person’s?

Counts are calculated from the current actor’s authorized records. They are neither a national census nor an unrestricted overview. The synthetic pilot’s figures are fictional.

### Are SMS and email case notifications already working?

No. CBS case notifications are currently in-app only. Appwrite account verification/recovery emails are a separate identity-provider function and require a configured project.

### Does a deletion request immediately remove every record?

No. It creates a review request. Adopted retention obligations may require preservation of some case and audit records. Complete fulfilment/deletion jobs and operator policies remain outstanding.

Full workflow: /documentation#guide-privacy

## Help pages & choosing new features

### Will FAQ and Documentation stay synchronized?

Both pages read one content source, so an edited topic updates the FAQ answers and documentation together. The maintenance rules require a simultaneous help review for feature changes, and automated checks reject undocumented workflow commands. This does not automatically invent correct explanations from code.

### Does choosing a feature automatically build it?

No. The chooser prepares your request. Paste it into this chat to authorize the selected addition. Future feature changes should be accompanied by at least three optional suggestions here; none is implemented just because it was suggested.

### Which features still need work before a production launch?

Live Appwrite and scanner validation, complete agency workflows, native verification, advanced governance amendments, national-scale queries, and independent deployment/security/accessibility checks remain outstanding. Private evidence code is implemented but quarantines files when scanning is not configured. Documentation marks these boundaries rather than presenting unverified services as active.

Full workflow: /documentation#guide-help

## Guided resident & officer walkthroughs

### Does the guided tour submit reports, approve members or cast votes?

No. It changes only your personal walkthrough progress. Every operational action still requires its own form, authorization and confirmation.

### Will my walkthrough resume after I sign out?

Progress is stored on the backend for your account. Sign in again and choose Continue. Restart is always available, and a new tour version can begin a fresh journey.

### Why is the officer walkthrough unavailable?

It requires an active scoped officer/reviewer grant, verified contact and MFA. Selecting a tour cannot create permissions or bypass appointment rules.

Full workflow: /documentation#guide-walkthroughs

## Private evidence uploads & safe downloads

### Why is my attachment quarantined?

The scanner has not returned a clean result. In an unconfigured local preview this is expected. The file is private and stored, but downloading remains blocked. Configure and verify the real scanner before handling real production evidence.

### Is the scan in the local preview simulated?

No simulated clean verdict is used. Without a configured ClamAV service the result is Quarantined. Automated tests inject test scanners, which are never exposed as production scanning.

### Can I share the download link with someone else?

The short-lived token is bound to your account. Download still requires a current authenticated session, authorization for the parent record, a clean scan and a matching digest. A public URL does not grant file access.

### Can residents see attachments on a public project?

No. Public project pages do not expose private evidence metadata or bytes. Project attachments require an authorized officer, monitor or auditor role within the project’s scope.

Full workflow: /documentation#guide-evidence

## Action deadlines & private reminders

### How soon does a deadline reminder appear?

The server checks at startup and every 15 minutes by default. Due soon means no more than 48 hours away; overdue means the recorded deadline has passed. The browser refreshes signed-in data about once a minute while visible.

### Will CBS send repeated reminder messages all day?

No. The reminder identity includes owner, record, exact deadline and phase. Each due-soon or overdue phase is recorded once for that deadline, even if its notification is marked read. Rescheduling can legitimately create a new reminder.

### Are these reminders email, SMS or automatic emergency escalations?

No. They are private in-app notices for assigned work. No external delivery provider or emergency-response integration is claimed. A deadline is a recorded work target, not an invented service-level guarantee.

Full workflow: /documentation#guide-deadlines
