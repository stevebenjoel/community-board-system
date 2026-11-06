export interface HelpTopic {
  id: string;
  title: string;
  icon: string;
  audience: string;
  route: string;
  summary: string;
  steps: string[];
  questions: { question: string; answer: string }[];
  notes: string[];
  commands: string[];
}

export const helpUpdated = '2026-11-04';
// Both public pages and the generated manuals consume this single editorial source.
// Describe implemented behavior; planned capabilities must remain explicitly marked.
export const helpTopics: HelpTopic[] = [
  {
    id: 'start', title: 'Start here: how CBS works', icon: 'home', audience: 'Everyone', route: '/',
    summary: 'CBS connects a resident’s concern to a responsible community workflow, with records that show who acted, what evidence exists, and what still needs review.',
    steps: [
      'Browse public boards, projects, meeting notices, and published resolutions without an account.',
      'On Overview, scan the summary cards or select a board by its name and icon. On a narrow screen, use the navigation menu to open Community boards.',
      'Use Dark mode in the top bar to switch between dark and light. Your choice is saved in this browser.',
      'Sign in, select your community, and request residency verification. Your community helps determine which officers and boards can act on your records.',
      'Submit a private issue, follow its history, monitor source-backed projects, and review approved board decisions.',
      'Authorized officers investigate, document findings, and obtain independent approvals. Acknowledgement alone never means an issue is fixed.',
    ],
    questions: [
      { question: 'Can I test before email and two-factor authentication are configured?', answer: 'Yes. While testing mode is active, creating an account continues directly to community membership without a verification email or a two-factor prompt. Existing accounts can sign in with email and password. Community requests still need coordinator approval, and officer permissions still require an assigned role.' },
      { question: 'How do I find a board from Overview?', answer: 'Choose its labeled card in the board directory. Each board has a distinct icon and color, and the board name identifies it.' },
      { question: 'Where can I change the appearance?', answer: 'Select Dark mode in the top bar. Select it again to return to light mode. On first use, the app follows your device preference.' },
      { question: 'What is the Community Board System?', answer: 'CBS is a participatory governance and accountability platform. It organizes community membership, seven thematic boards, confidential cases, public project oversight, meetings, and resolutions.' },
      { question: 'Is CBS a government agency or an emergency service?', answer: 'The software does not create government powers or imply endorsement. Boards act within adopted charters and agreements. CBS is not an emergency dispatch service; contact your local authorized emergency service directly in immediate danger.' },
      { question: 'Why does the preview say Synthetic pilot?', answer: 'The local pilot contains fictional people, places, case records, and funding. Selecting a test profile changes the server-side access permissions for that synthetic actor. None of these figures represents real government performance.' },
    ],
    notes: ['The app is a development pilot. A complete production rollout still requires live Appwrite validation, adopted governance policies, official datasets, and operational assurance.'], commands: [],
  },
  {
    id: 'identity', title: 'Accounts, sign-in & security', icon: 'profile', audience: 'Residents & officers', route: '/profile',
    summary: 'Appwrite manages production identity. CBS applies your permissions after sign-in; creating an account never appoints you to a board.',
    steps: [
      'For the local preview, use Explore as in the pilot bar. Start with Ada Okafor, the synthetic resident. These profiles are unavailable in production.',
      'On the hosted website, select Sign in to join a community to open Join your community. Create an account with your full name, email and a password of at least eight characters, then confirm the password. Existing members choose Already registered? Sign in. During the temporary testing period, continue directly to community membership.',
      'When email verification is required, open the verification link and continue to your community. If the link opens in a different browser, sign in there. Use Resend verification email if needed. Community choices are retained in the current tab while you register.',
      'Follow the verification email to verify your contact. Use Edit profile to change your CBS display name.',
      'For privileged accounts, set up an authenticator and verify your MFA session. A valid scoped grant and, for board officers, an effective appointment are also required.',
      'Sign out when finished. Check sessions & MFA shows the session count and MFA status; it does not provide a complete session-management console.',
    ],
    questions: [
      { question: 'How do I sign in to the local preview?', answer: 'Select Sign in to continue as the demo resident. In My community, your current selection stays in place so you can request verification. Use Explore as in the pilot bar to switch to another demo role.' },
      { question: 'What if account creation succeeds but the email does not arrive?', answer: 'Check your spam folder and use Resend verification email on the membership page. If your account already exists, sign in or use Forgot password. Verification delivery depends on the deployment’s email service.' },
      { question: 'What should I do if registration reported an expired session after creating my account?', answer: 'Choose Already registered? Sign in and use the same email and password. After signing in, use Resend verification email if needed, then continue to your community. Account creation may already have succeeded before the earlier error.' },
      { question: 'Can I register myself as a chair or administrator?', answer: 'No. Registration creates an identity without privileged grants. Appointments and scoped grants follow authorized approval workflows. The server rejects self-promotion even if a request is manually changed.' },
      { question: 'Why is an officer action denied after I sign in?', answer: 'Possible reasons include an unverified contact, an incomplete MFA session, a missing or expired grant, an inactive appointment or board, a different jurisdiction, a conflict restriction, or a required independent reviewer.' },
      { question: 'How do I recover an Appwrite account?', answer: 'Use Recover account from the signed-out profile page and follow the provider’s emailed recovery link. Local synthetic profiles do not use a password-recovery flow.' },
    ],
    notes: ['Live Appwrite account, verification, recovery, and MFA flows are implemented integration boundaries but remain unverified against a supplied project. No credentials are embedded in the app.'], commands: ['profile'],
  },
  {
    id: 'community', title: 'Find & verify your community', icon: 'community', audience: 'Residents & coordinators', route: '/community',
    summary: 'A service community follows State/FCT → LGA → ward → community. Verified residency is distinct from citizenship documents or electoral registration.',
    steps: [
      'Open My community. Select a state/FCT to reveal its LGA dropdown. Select an LGA or area council, then scroll the Ward list to see all its wards. Selecting a ward closes the list and keeps the chosen ward visible. Choose Change ward to reopen the list. Changing a selection clears the choices below it.',
      'In the preview, choose SYNTHETIC Pilot State, SYNTHETIC Unity LGA, SYNTHETIC Ward 01, and SYNTHETIC Greenfield Community.',
      'Request community verification, choose a permitted method, and provide a residency statement or attestation reference. Do not enter NIN, biometrics, or unnecessary personal information.',
      'A different, scoped coordinator opens Administration and records the residency decision with reasons. The applicant cannot approve their own residency.',
      'Check Verification history for the result. If a new residency is verified, the previous verified residency becomes historical. Request a jurisdiction change through the privacy-request form when appropriate.',
    ],
    questions: [
      { question: 'Where do the LGA, ward and community options come from?', answer: 'The picker uses INEC reference records for 774 LGAs and FCT area councils and 8,809 electoral wards. When you select a ward, CBS loads GRID3 settlement names matched to that ward and any separately imported community records. GRID3 matches are source references for selecting a location. Residency verification is a separate step.' },
      { question: 'Why is my community missing?', answer: 'GRID3 coverage varies and some settlement records could not be linked to a unique INEC ward. Where no matched or separately imported records exist, the picker displays an empty community list.' },
      { question: 'Does registration immediately make me a verified community member?', answer: 'Select your community and submit a residency statement or attestation reference. A different authorized coordinator reviews the request. Verification history shows the pending, verified or rejected decision and its reason. Email verification is required when temporary testing mode is off.' },
      { question: 'Must I supply a national identity number or voter details?', answer: 'No. The current workflow uses residency statements or attestation references. Do not submit NIN or biometrics. A CBS community association is not proof of voter registration.' },
      { question: 'Can an unverified resident browse public information or raise a concern?', answer: 'Public information remains accessible. Case submission requires a signed-in identity with verified contact and a registered community; it does not require completed residency approval. Nomination eligibility and officer access have stronger checks.' },
    ],
    notes: ['Residency document uploads and institutional verification integrations are not operational; the current form stores a statement or reference.'], commands: ['residency', 'reviewResidency'],
  },
  {
    id: 'boards', title: 'The seven boards & their establishment', icon: 'boards', audience: 'Everyone & coordinators', route: '/boards',
    summary: 'EDU: Education. HLT: Health. SEC: Security and Intelligence Gathering. INF: Infrastructure. TRD: Trade, Investment and Tourism. YTH: Skills and Youth Development. CUL: Culture and Moral Values.',
    steps: [
      'Open Community boards to read each mandate. A board definition is different from an established, approved local board instance.',
      'An authorized coordinator creates an LGA- or ward-scoped board with its authority reference. A duplicate non-archived instance of the same type and jurisdiction is rejected.',
      'Record an adopted charter: its version, authority, membership capacity, term length, quorum percentage, and voting threshold.',
      'Move the board through Draft → Submitted → Under review → Approved → Active. Establishment approval must be independent of the submitter.',
      'Suspend an active board before adopting a replacement charter. The preview’s charter is synthetic and does not establish legal powers.',
      'In the synthetic preview, open Projects and look for titles beginning with Demo. Each board has a scenario that explains the issue, the next action and the evidence needed to confirm completion. Open Meetings to see the matching review agenda.',
      'Open Community boards and select a board to see its public projects and meeting notices. Select a title to open the full record.',
    ],
    questions: [
      { question: 'Where can I explore examples for all seven boards?', answer: 'The synthetic Greenfield pilot includes a public demo project and review meeting for each board. The Security example uses a public awareness scenario about confidential reporting. Real boards require local establishment and approval.' },
      { question: 'Which records appear on a board page?', answer: 'The board page shows published projects of that board type and public meeting notices for its established instances.' },
      { question: 'What does Governance configuration required mean?', answer: 'A dependent action needs an approved charter or effective rules that have not been configured. The app must not invent quorum, tenure, appointment authority, or formal voting powers.' },
    ],
    notes: ['CBS records an authority reference; it cannot independently determine whether a legal instrument is valid.'], commands: ['createBoard', 'boardStatus', 'charter'],
  },
  {
    id: 'membership', title: 'Nominations, appointments & conflicts', icon: 'boards', audience: 'Candidates & reviewers', route: '/members',
    summary: 'Board membership follows candidate acceptance, eligibility screening, independent final approval, and an effective-dated appointment.',
    steps: [
      'From a board profile, nominate a candidate and choose the position and stakeholder category. Verified community membership or scoped officer authority is required to nominate.',
      'The candidate signs in and accepts the nomination in Membership & conflicts.',
      'An authorized reviewer checks eligibility and residency and records the screening outcome. Candidates cannot screen themselves.',
      'A different appointing coordinator records the final decision and appointment reference. The candidate and screening officer cannot give final approval.',
      'An approved appointment activates only its scoped, effective-dated role. Revocation or expiry removes privileges on subsequent requests.',
      'Disclose a project, case, meeting, or motion conflict by its record ID. An independent ethics reviewer decides whether participation must be restricted.',
    ],
    questions: [
      { question: 'Does a nomination give someone officer access?', answer: 'No. Candidate acceptance, screening, independent approval, board status, valid tenure, and the active scoped grant must all satisfy the applicable checks.' },
      { question: 'Why can the screening coordinator not approve the appointment?', answer: 'The system separates duties. Use another authorized coordinator for final approval so the same person does not both screen and appoint a candidate.' },
      { question: 'What happens when someone has a conflict of interest?', answer: 'A disclosure enters review. A recorded restriction prevents participation in affected actions or votes. The member cannot approve their own restriction decision.' },
    ],
    notes: ['Appointment evidence is currently a textual document reference. Signed binary documents, full committees, removal appeals, and advanced delegation need further implementation.'], commands: ['nominate', 'acceptNomination', 'screenNomination', 'approveNomination', 'revokeAppointment', 'conflict', 'reviewConflict'],
  },
  {
    id: 'cases', title: 'Report, track & appeal an issue', icon: 'cases', audience: 'Residents', route: '/cases',
    summary: 'A case is a confidential, traceable record. The resident sees its status and citizen-visible updates, while internal investigation notes remain restricted.',
    steps: [
      'Inside Report a community issue, select a state/FCT, LGA and ward to load Community / Settlement options. Wait for the community list to load before submitting. Saved report drafts retain these location selections.',
      'Choose Report an issue. Select the relevant board/category, add a 5–160 character title and a 20–10,000 character factual description, choose the community, and optionally add a landmark.',
      'Set urgency and submit. The app shows success only after the server commits the report. The case receives a generated reference and a submission event.',
      'For an ordinary report, Save draft retains a per-account draft in this browser tab. A saved draft has not been submitted; safety reports cannot use browser draft storage.',
      'Open Cases & reports and select the record to follow its history. Add information through the case detail page when you have further facts.',
      'When a case is closed, rejected with reasons, or linked as a duplicate, the reporter can request an appeal from the detail page. Reopening requires an authorized review.',
    ],
    questions: [
      { question: 'Can other residents see my complaint?', answer: 'No. Current case narratives are not public. Your own records and authorized handlers’ records are filtered on the server. Internal notes are omitted from the reporter’s view.' },
      { question: 'What if my connection drops during submission?', answer: 'Retry the same open submission. A stable request ID prevents duplicate creation if the first attempt already committed. Do not assume a report was received until the app confirms success.' },
      { question: 'Where is my saved browser draft?', answer: 'Reopen Report an issue in the same tab and synthetic/account profile. Drafts are tab-scoped, are not official records, and are removed after confirmed submission. Closing the tab or clearing session storage can remove them.' },
      { question: 'Can I attach photos or videos to a report?', answer: 'Yes. Open a submitted case or an authorized project and use Private evidence vault for PNG, JPEG, MP4 or PDF files up to 4 MiB. The server validates file type, stores a private attachment, and checks scanning status. If the scanner is unconfigured or unavailable, the file remains quarantined and cannot be downloaded. Live Appwrite Storage and ClamAV verification is still required before production use.' },
      { question: 'How do I select a community in the report form?', answer: 'Choose the state or FCT, LGA or area council, and ward inside the form. The Community / Settlement list loads the records for that ward. Your verified community is preselected when available. Changing an earlier selection clears the choices below it.' },
    ],
    notes: ['Highly restricted safety cases have tighter handler controls. Use only the minimum necessary information, and never rely on CBS for live emergency response.'], commands: ['submitCase', 'caseNote'],
  },
  {
    id: 'investigation', title: 'Triage, investigation & outcome review', icon: 'shield', audience: 'Authorized handlers & reviewers', route: '/cases',
    summary: 'Ordinary reports move through explicit server-controlled states. A proposed outcome, an independent verification, and final closure are separate actions.',
    steps: [
      'A scoped coordinator reviews a new case: Submitted → Intake review → Accepted. The reviewer can instead request information, reject with reasons, or link an accessible duplicate.',
      'For an ordinary accepted case, assign a matching active board and qualified officer in the correct jurisdiction, then begin investigation.',
      'Record citizen-visible updates and separate internal notes. A referral state records workflow progress; it does not prove that an external institution received an electronic referral.',
      'The investigator proposes an outcome with an evidence reference. A different authorized reviewer verifies that outcome with review evidence.',
      'Close only after independent verification. The resident’s appeal remains in the history and can lead to a reopened case.',
      'Complaints against boards route to scoped ethics review. Safety reports require explicitly authorized restricted handlers rather than ordinary board access.',
    ],
    questions: [
      { question: 'Does “In progress” mean the problem has been fixed?', answer: 'No. It means an authorized investigation or action workflow has started. Outcome proposed means an officer reports a result; verification and closure are later steps.' },
      { question: 'Can a board close its own conduct complaint?', answer: 'A conduct complaint uses the ethics-review route. Ordinary chair/coordinator access does not automatically include that record. The accused board does not gain control simply because it is a board.' },
      { question: 'Does Referred mean a government agency acknowledged the case?', answer: 'No. The current status does not establish electronic delivery or agency acknowledgement. Verified institutional referral integration remains incomplete.' },
    ],
    notes: ['Highly restricted-case assignment/review operations require additional live-service and operational validation before handling real safety reports.'], commands: ['caseTransition', 'assignCase'],
  },
  {
    id: 'honors', title: 'Public project media and the global honors board', icon: 'youth', audience: 'Citizens, diaspora viewers and authorized officers', route: '/honors',
    summary: 'Anyone can view approved project photos and videos and follow verified achievements and overdue milestones.',
    steps: [
      'Open a published project and look for Public progress gallery. Use the video controls to play or seek within an approved MP4 clip.',
      'To share a progress update, upload a photo or short MP4 to the project evidence vault. A different authorized officer reviews the clean file, confirms it is approved for public release, and uses Publish to gallery with a public caption. Officers can withdraw published media.',
      'Open Global honors board to see verified public completions. A coordinator other than the completion reviewer can record the official’s name, role and public attribution source on a qualifying project.',
      'Open a flagged project to compare its latest milestone due dates and reported and verified percentages. A past-due milestone with both values at zero is shown as No progress recorded.',
    ],
    questions: [
      { question: 'Can viewers see report attachments?', answer: 'Case attachments are private. The gallery shows only explicitly published, clean project photos and videos.' },
      { question: 'How does a project earn recognition or get flagged?', answer: 'Recognition requires recorded verified completion on a public project. A follow-up flag identifies an overdue milestone with less than 100% verified progress on the current baseline. Flags reflect the available records, and a project needs a dated milestone to be assessed.' },
    ],
    notes: ['Media uploads are limited to 4 MiB per file. Use a short compressed MP4 clip for progress videos. Appwrite storage and live scanning require deployment verification.'],
    commands: ['setProjectMedia','recordDeliveryCredit'],
  },
  {
    id: 'projects', title: 'Projects, funding & inspections', icon: 'projects', audience: 'Residents, monitors & auditors', route: '/projects',
    summary: 'Project records connect scope, sources, funding events, milestone versions, inspections, and completion review. Financial event types retain their different meanings.',
    steps: [
      'Residents open Projects & funding and select a published project to read its public information. Officers can register projects with a source reference, authority, jurisdiction, board, and fiscal year.',
      'Create a milestone baseline with weights totaling 100%. Baseline amendments create a new version and preserve the earlier one.',
      'Record financial events with an exact two-decimal amount, currency, period, source, and evidence reference. A different authorized reviewer verifies the evidence.',
      'Agency and board acknowledgements are independent. A pending acknowledgement must remain pending until an authorized participant records it.',
      'An authorized monitor records either a physical site visit or a document review with findings and evidence references. Those methods are distinct.',
      'An independent reviewer verifies milestone progress. Completion requires technical-verification status, fully verified milestones, independent site evidence, and separate official/community positions.',
    ],
    questions: [
      { question: 'Why are approved, released, paid, and spent funding shown separately?', answer: 'They represent different financial events. Approval is not proof that money was received; a payment is not automatically final expenditure. The app does not add them into a misleading single total.' },
      { question: 'What is the difference between reported and verified progress?', answer: 'Open a project and read its milestone timeline in due date order. Reported progress is the stated progress. Verified progress is independently reviewed progress with evidence. The two bars can differ, and a milestone is marked verified complete only at 100% verified.' },
      { question: 'Who can see unverified funding and inspection records?', answer: 'Authorized scoped officers can review internal records. Public projections exclude unverified finance and remove internal inspections, evidence references, and identifying author fields.' },
      { question: 'Does a variance or overdue milestone prove wrongdoing?', answer: 'No. A review flag identifies missing evidence, delay, or inconsistency for human review. It does not establish fraud or criminal conduct.' },
    ],
    notes: ['The pilot supports core project and funding workflows. Full publication approvals, financial reversals, public feedback, technical certification integration, and wider agency affiliation controls remain incomplete.'], commands: ['createProject', 'publishProject', 'projectStatus', 'finance', 'verifyFinance', 'acknowledgeFinance', 'milestones', 'inspection', 'verifyMilestone', 'completion'],
  },
  {
    id: 'meetings', title: 'Meetings, quorum, votes & minutes', icon: 'meetings', audience: 'Secretaries, chairs & members', route: '/meetings',
    summary: 'Formal decisions require the meeting’s approved charter, eligible active members, confirmed attendance, conflict checks, valid quorum, and a recorded result.',
    steps: [
      'A scoped secretary, chair, or coordinator schedules a future meeting with a board, agenda, date/time, timezone, venue/participation details, and visibility.',
      'The meeting stores a charter snapshot. At the meeting, an authorized officer confirms attendance for members eligible on its date.',
      'After the meeting starts, an authorized member proposes a motion. The server checks active appointment and board status, recusals, attendance, and charter quorum before accepting a vote.',
      'Each present eligible member casts Yes, No, or Abstain once. An authorized officer closes voting only after all present eligible members have participated.',
      'The server records the counts, required threshold, adopted/not-adopted decision, and charter version. The secretary submits a minutes version.',
      'For approved minutes or a recorded resolution, choose Propose amendment. Enter the correction and its reason. Compare the original and proposed text in Formal amendments. A different authorized chair or coordinator records an approval or rejection.',
      'A different authorized chair/coordinator approves the minutes. Approved versions are locked against silent rewriting.',
    ],
    questions: [
      { question: 'Why can a meeting not accept my vote?', answer: 'Check whether the meeting has started, the board and appointment are active, you were eligible on the meeting date, your attendance is confirmed, quorum is met, you are not recused, and you have not already voted in the closed/current round.' },
      { question: 'How is the voting threshold calculated?', answer: 'The pilot takes the stored charter’s quorum percentage over eligible non-recused members, and its Yes threshold over present eligible members. Each present member must vote or abstain before calculation. Different formal voting procedures require further implementation.' },
      { question: 'Can approved minutes be edited?', answer: 'Approved minutes stay locked. Formal amendments appear alongside the original, with the decision recorded separately. Pending and rejected amendments stay within the board.' },
    ],
    notes: ['The current electronic workflow has one round. Advanced revotes, in-person vote aggregation, unanimous consent, recordings, and complete notice rules are not implemented.'], commands: ['createMeeting', 'attendance', 'motion', 'vote', 'decideMotion', 'minutes', 'approveMinutes', 'proposeAmendment', 'decideAmendment'],
  },
  {
    id: 'referrals', title: 'Agency referrals and receipt', icon: 'trade', audience: 'Coordinators, case handlers and agency recipients', route: '/referrals',
    summary: 'A referral records a scoped handoff. The designated agency account acknowledges receipt within CBS.',
    steps: [
      'In Agency referrals, a coordinator registers the organization with its local scope, authority reference and the account ID of an existing verified agency officer.',
      'A different coordinator checks the authority reference and verifies the agency. A coordinator can revoke the registration to remove recipient access.',
      'An authorized handler selects an eligible case and verified agency. Enter only the information authorized for sharing. The recipient can see the summary and does not get the full case file through the referral.',
      'The designated recipient signs in with MFA, opens Agency referrals and records a receipt reference. CBS records the account and time and notifies the handler.',
      'After acknowledgement, the designated recipient can add a response. An authorized case handler can mark each response Reviewed or Follow-up required and record an internal note.',
    ],
    questions: [
      { question: 'Who can see an agency response?', answer: 'The designated recipient and authorized case handlers can see the response. Handler follow-up notes remain internal. The reporter and public cannot see the referral history.' },
      { question: 'Who can acknowledge a referral?', answer: 'Only the designated recipient with a current agency officer grant in scope can acknowledge. The acknowledgement confirms receipt within CBS.' },
      { question: 'Can I try a referral locally?', answer: 'Yes. In the synthetic preview, use a coordinator to refer the water point case to the Synthetic Community Works Desk. Switch to Synthetic agency officer to acknowledge it.' },
    ],
    notes: ['The workflow uses in-app notifications and account acknowledgement. External delivery and institutional identity checks depend on the deployment and its authorized coordinators.'],
    commands: ['registerAgency','verifyAgency','revokeAgency','recordReferral','acknowledgeReferral','respondToReferral','reviewReferralResponse'],
  },
  {
    id: 'resolutions', title: 'Resolutions & follow-up actions', icon: 'resolutions', audience: 'Boards & public readers', route: '/resolutions',
    summary: 'A resolution must be traceable to an adopted motion and approved minutes. Follow-up tasks identify responsible active board members.',
    steps: [
      'After a motion is adopted and minutes are independently approved, an authorized chair/coordinator records the resolution title and approved text.',
      'Review the source meeting, vote result, and resolution reference. Publish only the information approved for public release.',
      'An authorized officer assigns a resolution action to an active board member with a title and due date.',
      'The owner submits evidence of completion. Its status becomes Review pending; that submission is distinct from an independently confirmed completion.',
      'A different authorized coordinator, chair or secretary opens Board review inbox, filters by board or submission age, then opens Review completion, checks the submitted evidence and records a reason with the decision.',
      'After three days awaiting review, CBS sends one in-app reminder per submission to each eligible coordinator in scope. Open the notification to reach the review inbox.',
      'Approval marks the task Completed. A correction request reopens the task so its owner can read the reason and submit revised evidence. Completion history preserves each submission and decision.',
    ],
    questions: [
      { question: 'Is a published resolution a binding government order?', answer: 'No. It records a board recommendation within its mandate. It does not prove that government funding was approved or that an institution accepted an assignment.' },
      { question: 'Can I assign a task to a government agency?', answer: 'The current task workflow is restricted to active board members. Full institution-accepted assignments are not operational and must not be represented as accepted agency work.' },
      { question: 'Who can approve completion, and what happens if evidence needs correction?', answer: 'A different authorized coordinator, chair or secretary reviews the submitted evidence and records a reason. Approval marks the task Completed. A correction request reopens it for the owner to resubmit. The tracker retains the submission and decision history.' },
      { question: 'When does CBS escalate a pending review?', answer: 'Eligible coordinators receive an in-app notification after a submission has waited at least three days. A corrected submission starts a new waiting period.' },
      { question: 'Why is a submission missing from my Board review inbox?', answer: 'The inbox shows only pending evidence you are eligible to review. Check the board and age filters, your current appointment and any conflict restrictions. Your own submissions are excluded.' },
    ],
    notes: ['Completion decisions and evidence are visible within the authorized board action tracker. Published resolutions show approved corrections alongside the original text.'], commands: ['adoptResolution', 'publishResolution', 'task', 'completeTask', 'reviewTaskCompletion'],
  },
  {
    id: 'privacy', title: 'Privacy, notifications & reports', icon: 'shield', audience: 'Everyone & reviewers', route: '/profile',
    summary: 'The server filters records for the current actor. Notifications are private in-app updates, and report counts reflect the records visible to that account.',
    steps: [
      'Open the bell to read in-app updates. Mark a notification read or open its related workflow. Notifications do not include confidential case narratives.',
      'Use Reports & insights to review case status distribution and metric definitions. Export authorized project/resolution records as JSON.',
      'From My profile & security, request access, correction, deletion review, restriction, or jurisdiction reassignment.',
      'An authorized platform administrator records a response to a privacy request. This is a documented request process, not an automatic data-erasure operation.',
      'A scoped auditor can inspect audit metadata. Technical administration does not automatically grant case plaintext or confidential audit snapshots.',
    ],
    questions: [
      { question: 'Why do my dashboard numbers differ from another person’s?', answer: 'Counts are calculated from the current actor’s authorized records. They are neither a national census nor an unrestricted overview. The synthetic pilot’s figures are fictional.' },
      { question: 'Are SMS and email case notifications already working?', answer: 'No. CBS case notifications are currently in-app only. Appwrite account verification/recovery emails are a separate identity-provider function and require a configured project.' },
      { question: 'Does a deletion request immediately remove every record?', answer: 'No. It creates a review request. Adopted retention obligations may require preservation of some case and audit records. Complete fulfilment/deletion jobs and operator policies remain outstanding.' },
    ],
    notes: ['The legal operator, support contact, retention policy, production privacy notice, external notification providers, and independent assurance must be established before public launch.'], commands: ['privacy', 'reviewPrivacy', 'readNotification'],
  },
  {
    id: 'help', title: 'Help pages & choosing new features', icon: 'info', audience: 'Everyone & project owner', route: '/feature-ideas',
    summary: 'FAQ gives quick answers; Documentation provides the detailed workflows. Both are generated from the same reviewed content. Feature ideas are proposals awaiting the owner’s selection.',
    steps: [
      'Search FAQ by question or keyword, or choose a topic to narrow the answers. Follow the linked documentation topic for the full workflow.',
      'Use Documentation’s topic navigation to follow the steps for your role and open the related part of the app.',
      'Open Feature ideas to compare at least three proposed additions. Select one, several, or all of them.',
      'Copy the prepared selection into this development chat. Selection alone does not change governance records or start implementation.',
      'Whenever a feature changes, update the shared help topic and regenerate the manuals in the same change. New backend commands must have help coverage or validation fails.',
    ],
    questions: [
      { question: 'Will FAQ and Documentation stay synchronized?', answer: 'Both pages read one content source, so an edited topic updates the FAQ answers and documentation together. The maintenance rules require a simultaneous help review for feature changes, and automated checks reject undocumented workflow commands. This does not automatically invent correct explanations from code.' },
      { question: 'Does choosing a feature automatically build it?', answer: 'No. The chooser prepares your request. Paste it into this chat to authorize the selected addition. Future feature changes should be accompanied by at least three optional suggestions here; none is implemented just because it was suggested.' },
      { question: 'Which features still need work before a production launch?', answer: 'Live Appwrite and scanner validation, complete agency workflows, native verification, advanced governance amendments, national-scale queries, and independent deployment/security/accessibility checks remain outstanding. Private evidence code is implemented but quarantines files when scanning is not configured. Documentation marks these boundaries rather than presenting unverified services as active.' },
    ],
    notes: ['The in-app chooser cannot directly control or send messages to this Codex chat. Copying and pasting your selection is the explicit handoff.'], commands: [],
  },
  {
    id:'walkthroughs',title:'Guided resident & officer walkthroughs',icon:'community',audience:'Signed-in residents & officers',route:'/walkthrough',
    summary:'Restartable walkthroughs explain the actual screens and save progress to your account. They guide participation without submitting or approving any operational record.',
    steps:[
      'Open Guided walkthroughs from Learn & grow. Sign in with your own account, or choose a synthetic profile in the local pilot.',
      'Choose Your community journey for the resident introduction. Authorized officers can choose The accountable officer workflow; the server still checks their effective scoped access and MFA.',
      'The guide appears above the current screen. Use its screen-opening action to visit the relevant area, then Next step or Back to continue at your pace.',
      'Pause for now saves a dismissed state. Return to Guided walkthroughs and Continue to resume. Restart returns to the first step.',
      'Finish on the final step to mark the tour completed. Starting a different tour pauses the previous one. Each account’s progress is separate.',
    ],
    questions:[
      {question:'Does the guided tour submit reports, approve members or cast votes?',answer:'No. It changes only your personal walkthrough progress. Every operational action still requires its own form, authorization and confirmation.'},
      {question:'Will my walkthrough resume after I sign out?',answer:'Progress is stored on the backend for your account. Sign in again and choose Continue. Restart is always available, and a new tour version can begin a fresh journey.'},
      {question:'Why is the officer walkthrough unavailable?',answer:'It requires an active scoped officer/reviewer grant, verified contact and MFA. Selecting a tour cannot create permissions or bypass appointment rules.'},
    ],
    notes:['Completing a walkthrough records that you navigated its guidance, not certification, eligibility, completed casework or a governance approval.'],commands:['tourProgress'],
  },
  {
    id:'evidence',title:'Private evidence uploads & safe downloads',icon:'shield',audience:'Case participants & authorized project officers',route:'/cases',
    summary:'Binary attachments inherit access from their case or project. A private upload remains quarantined until the configured malware scanner returns a clean result for its exact SHA-256 digest.',
    steps:[
      'Open a case you may read, or a project for which you have authorized evidence access. Public project visibility alone does not grant access to its private attachments.',
      'After submitting an issue, the app opens the case so you can attach media in Private evidence vault.',
      'Choose a PNG, JPEG, MP4 or PDF file up to 4 MiB. The server validates size, base64 encoding, extension, declared MIME and file signature. Avoid unnecessary personal data in the file and filename.',
      'Upload private evidence. The same selected file retains its request ID for a safe retry. Changing content or target under an existing request ID is rejected.',
      'Read the resulting status: Uploading, Stored, Failed, Quarantined, Clean or Rejected. Stored does not mean clean. An unavailable scanner leaves the file quarantined; Retry scan can check it after the scanner is configured.',
      'Download is enabled only for stored, clean evidence. The server issues a token valid for 60 seconds, bound to your account and file digest, then rechecks access and integrity before returning an attachment.',
      'If malware is detected, the record is rejected and cannot be released by repeatedly requesting a scan. Technical administrators do not gain case attachment access merely through their platform role.',
    ],
    questions:[
      {question:'Why is my attachment quarantined?',answer:'The scanner has not returned a clean result. In an unconfigured local preview this is expected. The file is private and stored, but downloading remains blocked. Configure and verify the real scanner before handling real production evidence.'},
      {question:'Is the scan in the local preview simulated?',answer:'No simulated clean verdict is used. Without a configured ClamAV service the result is Quarantined. Automated tests inject test scanners, which are never exposed as production scanning.'},
      {question:'Can I share the download link with someone else?',answer:'The short-lived token is bound to your account. Download still requires a current authenticated session, authorization for the parent record, a clean scan and a matching digest. A public URL does not grant file access.'},
      {question:'Can residents see attachments on a public project?',answer:'No. Public project pages do not expose private evidence metadata or bytes. Project attachments require an authorized officer, monitor or auditor role within the project’s scope.'},
    ],
    notes:['Appwrite stores files in a server-only bucket with encryption, file-level security and antivirus enabled. The gateway additionally uses a real ClamAV INSTREAM adapter. Service credentials and scanner configuration are deferred; live integration, retention/erasure policies and scanner operational assurance remain required.'],commands:[],
  },
  {
    id:'deadlines',title:'Action deadlines & private reminders',icon:'clock',audience:'Assigned handlers, members & supervisors',route:'/actions',
    summary:'My actions & deadlines groups authorized open case actions and board tasks into upcoming, due within 48 hours, and overdue. In-app reminders are generated without exposing case narratives.',
    steps:[
      'A case must have an assigned responsible officer before an independent authorized handler can set its action deadline. Open the case, use Set deadline, and record a future time and reason.',
      'An authorized secretary, chair or coordinator can reschedule an open board task using Change deadline on the action register. Enter times in your device timezone; stored times are UTC and displayed with Lagos timezone labels.',
      'Open My actions & deadlines. Search or filter by Upcoming, Due soon or Overdue. The queue contains only work the server authorizes you to see.',
      'The API checks deadlines at startup and every 15 minutes by default. It creates one due-soon and one overdue in-app notice per assigned owner and deadline; repeated checks and multiple processes do not duplicate a committed notice.',
      'Rescheduling creates a new reminder identity. Closed/rejected/duplicate cases and tasks already submitted for completion review are excluded. Expired/revoked appointments and access restrictions are rechecked.',
      'Use the bell to open the related record. Signed-in screens refresh in the foreground about once a minute; you can also reload to see the latest notices.',
    ],
    questions:[
      {question:'How soon does a deadline reminder appear?',answer:'The server checks at startup and every 15 minutes by default. Due soon means no more than 48 hours away; overdue means the recorded deadline has passed. The browser refreshes signed-in data about once a minute while visible.'},
      {question:'Will CBS send repeated reminder messages all day?',answer:'No. The reminder identity includes owner, record, exact deadline and phase. Each due-soon or overdue phase is recorded once for that deadline, even if its notification is marked read. Rescheduling can legitimately create a new reminder.'},
      {question:'Are these reminders email, SMS or automatic emergency escalations?',answer:'No. They are private in-app notices for assigned work. No external delivery provider or emergency-response integration is claimed. A deadline is a recorded work target, not an invented service-level guarantee.'},
    ],
    notes:['Reminder delivery requires the API process or the documented reminder command to be running. The default scheduler is in-process and must be monitored in Coolify. Infrastructure downtime can delay delivery.'],commands:['caseDeadline','taskDeadline'],
  },
];

export interface FeatureIdea { id: string; title: string; icon: string; benefit: string; scope: string; effort: string; request: string }
export const featureIdeas: FeatureIdea[] = [
  {id:'review-threshold',title:'Board-specific review deadlines',icon:'cases',benefit:'Match reminders to the board’s review schedule.',scope:'Authorized coordinators set a waiting period for each board.',effort:'Small',request:'Add configurable board review escalation deadlines.'},
  {id:'amendment-highlights',title:'Amendment change highlights',icon:'resolutions',benefit:'Make changed wording easier to spot.',scope:'Highlight additions and removals in the comparison.',effort:'Small',request:'Add text change highlights to the amendment comparison.'},
  {id:'referral-filters',title:'Referral follow-up filters',icon:'trade',benefit:'Find agency responses still awaiting action.',scope:'Filter referrals by agency and follow-up status.',effort:'Small',request:'Add agency and follow-up filters to the referral page.'},
];
