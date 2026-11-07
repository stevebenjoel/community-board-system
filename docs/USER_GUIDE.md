# CBS — User Documentation

Reviewed 2026-11-04. Generated from src/content/help.ts. Edit the shared source, then run pnpm help:sync.

## Start here: how CBS works

Audience: Everyone

CBS connects a resident’s concern to a responsible community workflow, with records that show who acted, what evidence exists, and what still needs review.

1. Browse public boards, projects, meeting notices, and published resolutions without an account.

2. On Overview, scan the summary cards or select a board by its name and icon. On a narrow screen, use the navigation menu to open Community boards.

3. Use Dark mode in the top bar to switch between dark and light. Your choice is saved in this browser.

4. Sign in, select your community, and request residency verification. Your community helps determine which officers and boards can act on your records.

5. Submit a private issue, follow its history, monitor source-backed projects, and review approved board decisions.

6. Authorized officers investigate, document findings, and obtain independent approvals. Acknowledgement alone never means an issue is fixed.

Current boundary: The app is a development pilot. A complete production rollout still requires live Appwrite validation, adopted governance policies, official datasets, and operational assurance.

Open in CBS: /

## Accounts, sign-in & security

Audience: Residents & officers

Appwrite manages production identity. CBS applies your permissions after sign-in; creating an account never appoints you to a board.

1. For the local preview, use Explore as in the pilot bar. Start with Ada Okafor, the synthetic resident. These profiles are unavailable in production.

2. On the hosted website, select Sign in to join a community to open Join your community. Create an account with your full name, email and a password of at least eight characters, then confirm the password. Existing members choose Already registered? Sign in. During the temporary testing period, continue directly to community membership.

3. When email verification is required, open the verification link and continue to your community. If the link opens in a different browser, sign in there. Use Resend verification email if needed. Community choices are retained in the current tab while you register.

4. Follow the verification email to verify your contact. Use Edit profile to change your CBS display name.

5. For privileged accounts, set up an authenticator and verify your MFA session. A valid scoped grant and, for board officers, an effective appointment are also required.

6. Sign out when finished. Check sessions & MFA shows the session count and MFA status; it does not provide a complete session-management console.

Current boundary: Live Appwrite account, verification, recovery, and MFA flows are implemented integration boundaries but remain unverified against a supplied project. No credentials are embedded in the app.

Open in CBS: /profile

## Find & verify your community

Audience: Residents & coordinators

A service community follows State/FCT → LGA → ward → community. Verified residency is distinct from citizenship documents or electoral registration.

1. Open My community. Select a state/FCT to reveal its LGA dropdown. Select an LGA or area council, then scroll the Ward list to see all its wards. Selecting a ward closes the list and keeps the chosen ward visible. Choose Change ward to reopen the list. Changing a selection clears the choices below it.

2. In the preview, choose SYNTHETIC Pilot State, SYNTHETIC Unity LGA, SYNTHETIC Ward 01, and SYNTHETIC Greenfield Community.

3. Request community verification, choose a permitted method, and provide a residency statement or attestation reference. Do not enter NIN, biometrics, or unnecessary personal information.

4. A different, scoped coordinator opens Administration and records the residency decision with reasons. The applicant cannot approve their own residency.

5. Check Verification history for the result. If a new residency is verified, the previous verified residency becomes historical. Request a jurisdiction change through the privacy-request form when appropriate.

Current boundary: Residency document uploads and institutional verification integrations are not operational; the current form stores a statement or reference.

Open in CBS: /community

## The seven boards & their establishment

Audience: Everyone & coordinators

EDU: Education. HLT: Health. SEC: Security and Intelligence Gathering. INF: Infrastructure. TRD: Trade, Investment and Tourism. YTH: Skills and Youth Development. CUL: Culture and Moral Values.

1. Open Community boards to read each mandate. A board definition is different from an established, approved local board instance.

2. An authorized coordinator creates an LGA- or ward-scoped board with its authority reference. A duplicate non-archived instance of the same type and jurisdiction is rejected.

3. Record an adopted charter: its version, authority, membership capacity, term length, quorum percentage, and voting threshold.

4. Move the board through Draft → Submitted → Under review → Approved → Active. Establishment approval must be independent of the submitter.

5. Suspend an active board before adopting a replacement charter. The preview’s charter is synthetic and does not establish legal powers.

6. In the synthetic preview, open Projects and look for titles beginning with Demo. Each board has a scenario that explains the issue, the next action and the evidence needed to confirm completion. Open Meetings to see the matching review agenda.

7. Open Community boards and select a board to see its public projects and meeting notices. Select a title to open the full record.

Current boundary: CBS records an authority reference; it cannot independently determine whether a legal instrument is valid.

Open in CBS: /boards

## Nominations, appointments & conflicts

Audience: Candidates & reviewers

Board membership follows candidate acceptance, eligibility screening, independent final approval, and an effective-dated appointment.

1. From a board profile, nominate a candidate and choose the position and stakeholder category. Verified community membership or scoped officer authority is required to nominate.

2. The candidate signs in and accepts the nomination in Membership & conflicts.

3. An authorized reviewer checks eligibility and residency and records the screening outcome. Candidates cannot screen themselves.

4. A different appointing coordinator records the final decision and appointment reference. The candidate and screening officer cannot give final approval.

5. An approved appointment activates only its scoped, effective-dated role. Revocation or expiry removes privileges on subsequent requests.

6. Disclose a project, case, meeting, or motion conflict by its record ID. An independent ethics reviewer decides whether participation must be restricted.

Current boundary: Appointment evidence is currently a textual document reference. Signed binary documents, full committees, removal appeals, and advanced delegation need further implementation.

Open in CBS: /members

## Report, track & appeal an issue

Audience: Residents

A case is a confidential, traceable record. The resident sees its status and citizen-visible updates, while internal investigation notes remain restricted.

1. Sign in and choose Report an issue. Select a board and describe what happened. Choose Speak to fill the form where your browser supports dictation, or record a voice report of up to 90 seconds. Dictation continues through short pauses. Select Stop dictation when finished and review the text.

2. While connected, choose a community for offline use. Select your state/FCT, LGA, ward and community, then choose Prepare this device for offline reporting. Bookmark the reporting page and reopen it on the same browser when offline.

3. Choose the community and optionally add a landmark. While offline, the form uses the community saved on this device. Select urgency, then send or save the report for later.

4. Reopen the reporting page with a connection and the same account to send queued reports. If a transfer stops, choose Retry sending. Received by CBS confirms the case was recorded. A recording can still be pending as a separate attachment.

5. Use Open detailed or confidential safety reporting for the full online form. Its Save draft action retains an ordinary report in the current browser tab. Safety reports require the online form and cannot be saved as browser drafts.

6. Open Cases & reports and select the record to follow its history. Add information through the case detail page when you have further facts.

7. When a case is closed, rejected with reasons, or linked as a duplicate, the reporter can request an appeal from the detail page. Reopening requires an authorized review.

Current boundary: Use a trusted device. The browser retains queued reports and recordings locally until they are sent or deleted. CBS stores and scans audio using the private evidence workflow. Offline reporting requires a supported browser and a prepared page. Highly restricted safety reports require an online connection. Use local emergency services for immediate danger.

Open in CBS: /cases

## Kaduna South community reporting desk

Audience: Residents and authorized facilitators

An authorized facilitator can help a resident submit an ordinary written or voice report with the resident’s permission.

1. A resident with verified membership in a Kaduna South community signs in and opens Community reporting desk.

2. The resident selects their community, authorizes one report, and separately chooses whether to permit a private voice attachment. They create a one-time code and share it only with the facilitator. It expires after 30 minutes.

3. The facilitator signs in using their own account with an active Kaduna South desk grant, enters the code, and types or records the report. Read the details back to the resident before sending.

4. Give the case reference to the resident after CBS accepts the report. The resident can follow the case under Cases & reports. If the voice upload fails, keep the desk page open and retry the attachment using the receipt.

Current boundary: The pilot is limited to Kaduna South and ordinary reports. Use the restricted channels for safety or conduct concerns. Audio uses the existing private evidence scanner. Hosted audio upload still requires storage verification.

Open in CBS: /desk

## Triage, investigation & outcome review

Audience: Authorized handlers & reviewers

Ordinary reports move through explicit server-controlled states. A proposed outcome, an independent verification, and final closure are separate actions.

1. A scoped coordinator reviews a new case: Submitted → Intake review → Accepted. The reviewer can instead request information, reject with reasons, or link an accessible duplicate.

2. For an ordinary accepted case, assign a matching active board and qualified officer in the correct jurisdiction, then begin investigation.

3. Record citizen-visible updates and separate internal notes. A referral state records workflow progress; it does not prove that an external institution received an electronic referral.

4. The investigator proposes an outcome with an evidence reference. A different authorized reviewer verifies that outcome with review evidence.

5. Close only after independent verification. The resident’s appeal remains in the history and can lead to a reopened case.

6. Complaints against boards route to scoped ethics review. Safety reports require explicitly authorized restricted handlers rather than ordinary board access.

Current boundary: Highly restricted-case assignment/review operations require additional live-service and operational validation before handling real safety reports.

Open in CBS: /cases

## Public project media and the global honors board

Audience: Citizens, diaspora viewers and authorized officers

Anyone can view approved project photos and videos and follow verified achievements and overdue milestones.

1. Open a published project and look for Public progress gallery. Use the video controls to play or seek within an approved MP4 clip.

2. To share a progress update, upload a photo or short MP4 to the project evidence vault. A different authorized officer reviews the clean file, confirms it is approved for public release, and uses Publish to gallery with a public caption. Officers can withdraw published media.

3. Open Global honors board to see verified public completions. A coordinator other than the completion reviewer can record the official’s name, role and public attribution source on a qualifying project.

4. Open a flagged project to compare its latest milestone due dates and reported and verified percentages. A past-due milestone with both values at zero is shown as No progress recorded.

Current boundary: Media uploads are limited to 4 MiB per file. Use a short compressed MP4 clip for progress videos. Appwrite storage and live scanning require deployment verification.

Open in CBS: /honors

## Projects, funding & inspections

Audience: Residents, monitors & auditors

Project records connect scope, sources, funding events, milestone versions, inspections, and completion review. Financial event types retain their different meanings.

1. Residents open Projects & funding and select a published project to read its public information. Officers can register projects with a source reference, authority, jurisdiction, board, and fiscal year.

2. Create a milestone baseline with weights totaling 100%. Baseline amendments create a new version and preserve the earlier one.

3. Record financial events with an exact two-decimal amount, currency, period, source, and evidence reference. A different authorized reviewer verifies the evidence.

4. Agency and board acknowledgements are independent. A pending acknowledgement must remain pending until an authorized participant records it.

5. An authorized monitor records either a physical site visit or a document review with findings and evidence references. Those methods are distinct.

6. An independent reviewer verifies milestone progress. Completion requires technical-verification status, fully verified milestones, independent site evidence, and separate official/community positions.

Current boundary: The pilot supports core project and funding workflows. Full publication approvals, financial reversals, public feedback, technical certification integration, and wider agency affiliation controls remain incomplete.

Open in CBS: /projects

## Meetings, quorum, votes & minutes

Audience: Secretaries, chairs & members

Formal decisions require the meeting’s approved charter, eligible active members, confirmed attendance, conflict checks, valid quorum, and a recorded result.

1. A scoped secretary, chair, or coordinator schedules a future meeting with a board, agenda, date/time, timezone, venue/participation details, and visibility.

2. The meeting stores a charter snapshot. At the meeting, an authorized officer confirms attendance for members eligible on its date.

3. After the meeting starts, an authorized member proposes a motion. The server checks active appointment and board status, recusals, attendance, and charter quorum before accepting a vote.

4. Each present eligible member casts Yes, No, or Abstain once. An authorized officer closes voting only after all present eligible members have participated.

5. The server records the counts, required threshold, adopted/not-adopted decision, and charter version. The secretary submits a minutes version.

6. For approved minutes or a recorded resolution, choose Propose amendment. Enter the correction and its reason. Compare the original and proposed text in Formal amendments. A different authorized chair or coordinator records an approval or rejection.

7. A different authorized chair/coordinator approves the minutes. Approved versions are locked against silent rewriting.

Current boundary: The current electronic workflow has one round. Advanced revotes, in-person vote aggregation, unanimous consent, recordings, and complete notice rules are not implemented.

Open in CBS: /meetings

## Agency referrals and receipt

Audience: Coordinators, case handlers and agency recipients

A referral records a scoped handoff. The designated agency account acknowledges receipt within CBS.

1. In Agency referrals, a coordinator registers the organization with its local scope, authority reference and the account ID of an existing verified agency officer.

2. A different coordinator checks the authority reference and verifies the agency. A coordinator can revoke the registration to remove recipient access.

3. An authorized handler selects an eligible case and verified agency. Enter only the information authorized for sharing. The recipient can see the summary and does not get the full case file through the referral.

4. The designated recipient signs in with MFA, opens Agency referrals and records a receipt reference. CBS records the account and time and notifies the handler.

5. After acknowledgement, the designated recipient can add a response. An authorized case handler can mark each response Reviewed or Follow-up required and record an internal note.

Current boundary: The workflow uses in-app notifications and account acknowledgement. External delivery and institutional identity checks depend on the deployment and its authorized coordinators.

Open in CBS: /referrals

## Resolutions & follow-up actions

Audience: Boards & public readers

A resolution must be traceable to an adopted motion and approved minutes. Follow-up tasks identify responsible active board members.

1. After a motion is adopted and minutes are independently approved, an authorized chair/coordinator records the resolution title and approved text.

2. Review the source meeting, vote result, and resolution reference. Publish only the information approved for public release.

3. An authorized officer assigns a resolution action to an active board member with a title and due date.

4. The owner submits evidence of completion. Its status becomes Review pending; that submission is distinct from an independently confirmed completion.

5. A different authorized coordinator, chair or secretary opens Board review inbox, filters by board or submission age, then opens Review completion, checks the submitted evidence and records a reason with the decision.

6. After three days awaiting review, CBS sends one in-app reminder per submission to each eligible coordinator in scope. Open the notification to reach the review inbox.

7. Approval marks the task Completed. A correction request reopens the task so its owner can read the reason and submit revised evidence. Completion history preserves each submission and decision.

Current boundary: Completion decisions and evidence are visible within the authorized board action tracker. Published resolutions show approved corrections alongside the original text.

Open in CBS: /resolutions

## Privacy, notifications & reports

Audience: Everyone & reviewers

The server filters records for the current actor. Notifications are private in-app updates, and report counts reflect the records visible to that account.

1. Open the bell to read in-app updates. Mark a notification read or open its related workflow. Notifications do not include confidential case narratives.

2. Use Reports & insights to review case status distribution and metric definitions. Export authorized project/resolution records as JSON.

3. From My profile & security, request access, correction, deletion review, restriction, or jurisdiction reassignment.

4. An authorized platform administrator records a response to a privacy request. This is a documented request process, not an automatic data-erasure operation.

5. A scoped auditor can inspect audit metadata. Technical administration does not automatically grant case plaintext or confidential audit snapshots.

Current boundary: The legal operator, support contact, retention policy, production privacy notice, external notification providers, and independent assurance must be established before public launch.

Open in CBS: /profile

## Help pages & choosing new features

Audience: Everyone & project owner

FAQ gives quick answers; Documentation provides the detailed workflows. Both are generated from the same reviewed content. Feature ideas are proposals awaiting the owner’s selection.

1. Search FAQ by question or keyword, or choose a topic to narrow the answers. Follow the linked documentation topic for the full workflow.

2. Use Documentation’s topic navigation to follow the steps for your role and open the related part of the app.

3. Open Feature ideas to compare at least three proposed additions. Select one, several, or all of them.

4. Copy the prepared selection into this development chat. Selection alone does not change governance records or start implementation.

5. Whenever a feature changes, update the shared help topic and regenerate the manuals in the same change. New backend commands must have help coverage or validation fails.

Current boundary: The in-app chooser cannot directly control or send messages to this Codex chat. Copying and pasting your selection is the explicit handoff.

Open in CBS: /feature-ideas

## Guided resident & officer walkthroughs

Audience: Signed-in residents & officers

Restartable walkthroughs explain the actual screens and save progress to your account. They guide participation without submitting or approving any operational record.

1. Open Guided walkthroughs from Learn & grow. Sign in with your own account, or choose a synthetic profile in the local pilot.

2. Choose Your community journey for the resident introduction. Authorized officers can choose The accountable officer workflow; the server still checks their effective scoped access and MFA.

3. The guide appears above the current screen. Use its screen-opening action to visit the relevant area, then Next step or Back to continue at your pace.

4. Pause for now saves a dismissed state. Return to Guided walkthroughs and Continue to resume. Restart returns to the first step.

5. Finish on the final step to mark the tour completed. Starting a different tour pauses the previous one. Each account’s progress is separate.

Current boundary: Completing a walkthrough records that you navigated its guidance, not certification, eligibility, completed casework or a governance approval.

Open in CBS: /walkthrough

## Private evidence uploads & safe downloads

Audience: Case participants & authorized project officers

Binary attachments inherit access from their case or project. A private upload remains quarantined until the configured malware scanner returns a clean result for its exact SHA-256 digest.

1. Open a case you may read, or a project for which you have authorized evidence access. Public project visibility alone does not grant access to its private attachments.

2. After submitting an issue, the app opens the case so you can attach media in Private evidence vault.

3. Choose a PNG, JPEG, MP4 or PDF file up to 4 MiB. The server validates size, base64 encoding, extension, declared MIME and file signature. Avoid unnecessary personal data in the file and filename.

4. Upload private evidence. The same selected file retains its request ID for a safe retry. Changing content or target under an existing request ID is rejected.

5. Read the resulting status: Uploading, Stored, Failed, Quarantined, Clean or Rejected. Stored does not mean clean. An unavailable scanner leaves the file quarantined; Retry scan can check it after the scanner is configured.

6. Download is enabled only for stored, clean evidence. The server issues a token valid for 60 seconds, bound to your account and file digest, then rechecks access and integrity before returning an attachment.

7. If malware is detected, the record is rejected and cannot be released by repeatedly requesting a scan. Technical administrators do not gain case attachment access merely through their platform role.

Current boundary: Appwrite stores files in a server-only bucket with encryption, file-level security and antivirus enabled. The gateway additionally uses a real ClamAV INSTREAM adapter. Service credentials and scanner configuration are deferred; live integration, retention/erasure policies and scanner operational assurance remain required.

Open in CBS: /cases

## Action deadlines & private reminders

Audience: Assigned handlers, members & supervisors

My actions & deadlines groups authorized open case actions and board tasks into upcoming, due within 48 hours, and overdue. In-app reminders are generated without exposing case narratives.

1. A case must have an assigned responsible officer before an independent authorized handler can set its action deadline. Open the case, use Set deadline, and record a future time and reason.

2. An authorized secretary, chair or coordinator can reschedule an open board task using Change deadline on the action register. Enter times in your device timezone; stored times are UTC and displayed with Lagos timezone labels.

3. Open My actions & deadlines. Search or filter by Upcoming, Due soon or Overdue. The queue contains only work the server authorizes you to see.

4. The API checks deadlines at startup and every 15 minutes by default. It creates one due-soon and one overdue in-app notice per assigned owner and deadline; repeated checks and multiple processes do not duplicate a committed notice.

5. Rescheduling creates a new reminder identity. Closed/rejected/duplicate cases and tasks already submitted for completion review are excluded. Expired/revoked appointments and access restrictions are rechecked.

6. Use the bell to open the related record. Signed-in screens refresh in the foreground about once a minute; you can also reload to see the latest notices.

Current boundary: Reminder delivery requires the API process or the documented reminder command to be running. The default scheduler is in-process and must be monitored in Coolify. Infrastructure downtime can delay delivery.

Open in CBS: /actions
