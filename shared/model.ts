export const BOARD_TYPES = [
  { code: 'EDU', name: 'Education', description: 'Schools, learning, attendance and education infrastructure', icon: 'GraduationCap' },
  { code: 'HLT', name: 'Health', description: 'Primary healthcare, sanitation and community wellbeing', icon: 'HeartPulse' },
  { code: 'SEC', name: 'Security and Intelligence Gathering', description: 'Confidential safety reporting and lawful agency referrals', icon: 'ShieldCheck' },
  { code: 'INF', name: 'Infrastructure', description: 'Roads, drainage, water, power and public facilities', icon: 'Building2' },
  { code: 'TRD', name: 'Trade, Investment and Tourism', description: 'Enterprise, agriculture, markets and local opportunity', icon: 'BriefcaseBusiness' },
  { code: 'YTH', name: 'Skills and Youth Development', description: 'Skills, apprenticeships, mentoring and employment readiness', icon: 'Sprout' },
  { code: 'CUL', name: 'Culture and Moral Values', description: 'Heritage, civic ethics, inclusion and social cohesion', icon: 'Landmark' },
] as const;
export type BoardCode = typeof BOARD_TYPES[number]['code'];
export type Role = 'RESIDENT' | 'BOARD_MEMBER' | 'BOARD_SECRETARY' | 'BOARD_CHAIR' | 'LGA_COORDINATOR' | 'ETHICS_REVIEWER' | 'PLATFORM_ADMIN' | 'SECURITY_ADMIN' | 'SECURITY_HANDLER' | 'AUDITOR' | 'AGENCY_OFFICER' | 'DESK_FACILITATOR';
export interface Base { id: string; createdAt: string; updatedAt: string; synthetic?: boolean }
export interface Grant { role: Role; jurisdiction: string; boardId?: string; startsAt: string; endsAt: string }
export interface User extends Base { name: string; email: string; grants: Grant[]; verified: boolean; tours?: Partial<Record<import('./tours').TourId,import('./tours').TourProgress>> }
export interface Geo extends Base { name: string; type: 'COUNTRY' | 'ZONE' | 'STATE' | 'LGA' | 'WARD' | 'COMMUNITY'; parentId: string | null; source: string; version: string }
export interface Residency extends Base { userId: string; jurisdiction: string; method: string; statement: string; status: string; reviewerId?: string; reason?: string }
export interface Charter { version: string; authority: string; approved: boolean; capacity: number; quorumPercent: number; yesPercent: number; termMonths: number }
export interface Board extends Base { code: BoardCode; jurisdiction: string; name: string; status: string; authority: string; charter: Charter | null; submittedBy: string; approvedBy?: string }
export interface Nomination extends Base { boardId: string; candidateId: string; nominatorId: string; position: 'BOARD_MEMBER' | 'BOARD_SECRETARY' | 'BOARD_CHAIR'; category: string; accepted: boolean; status: string; screeningBy?: string; screeningNote?: string; approvedBy?: string }
export interface Appointment extends Base { boardId: string; userId: string; position: 'BOARD_MEMBER' | 'BOARD_SECRETARY' | 'BOARD_CHAIR'; startsAt: string; endsAt: string; status: string; authority: string; document: string; nominationId: string }
export interface Conflict extends Base { userId: string; boardId: string; matterId: string; description: string; status: string; reviewerId?: string }
export type CaseStatus = 'SUBMITTED' | 'INTAKE_REVIEW' | 'NEEDS_INFORMATION' | 'ACCEPTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'REFERRED' | 'OUTCOME_PROPOSED' | 'VERIFICATION' | 'CLOSED' | 'APPEALED' | 'REOPENED' | 'REJECTED_WITH_REASONS' | 'DUPLICATE_LINKED';
export interface CaseEvent { id: string; at: string; actorId: string; type: string; note: string; internal: boolean }
export interface DeskConsent extends Base { residentId:string; jurisdiction:string; digest:string; expiresAt:string; voice:boolean; caseId?:string }
export interface Case extends Base { desk?:{ facilitatorId:string; consentId:string; voice:boolean }; reference: string; reporterId: string; jurisdiction: string; category: string; boardCode: BoardCode | 'GENERAL' | 'CONDUCT'; title: string; description: string; location: string; urgency: string; classification: 'CONFIDENTIAL' | 'HIGHLY_RESTRICTED'; status: CaseStatus; boardId?: string; assigneeId?: string; dueAt?: string; deadlineReason?: string; events: CaseEvent[]; outcomeBy?: string; verifiedBy?: string; sourceEvidence?: string; duplicateId?: string; clientRequestId: string }
export interface Finance extends Base { projectId: string; type: string; amount: string; currency: string; fiscalYear: number; source: string; evidence: string; recordedBy: string; verification: string; reviewedBy?: string; authorityAcknowledgedBy?: string; boardAcknowledgedBy?: string }
export interface Milestone { id: string; title: string; dueAt: string; weight: number; acceptance: string; reported: number; verified: number; evidence: string }
export interface ProjectVersion { version: number; at: string; actorId: string; reason: string; milestones: Milestone[] }
export interface Inspection extends Base { inspectorId: string; method: 'SITE_VISIT' | 'DOCUMENT_REVIEW'; observedAt: string; note: string; evidence: string }
export interface Project extends Base { deliveryCredit?: { name: string; office: string; source: string }; reference: string; title: string; description: string; jurisdiction: string; boardCode: BoardCode; authority: string; source: string; fiscalYear: number; status: string; stageHistory?:{from:string;to:string;reason:string;actorId:string;at:string}[]; publication: 'DRAFT' | 'PUBLIC'; versions: ProjectVersion[]; inspections: Inspection[]; completion?: { official: string; community: string; evidence: string; reviewerId: string } }
export interface Motion { id: string; text: string; proposerId: string; round: number; votes: { voterId: string; choice: 'YES' | 'NO' | 'ABSTAIN'; at: string }[]; result?: { eligible: number; present: number; yes: number; no: number; abstain: number; required: number; adopted: boolean; charterVersion: string; at: string } }
export interface Minutes { version: number; text: string; submittedBy: string; status: 'DRAFT' | 'SUBMITTED' | 'APPROVED'; approvedBy?: string }
export interface Amendment { id: string; text: string; reason: string; proposedBy: string; proposedAt: string; decision?: { approved: boolean; by: string; at: string; reason: string } }
export interface Meeting extends Base { amendments?: Amendment[]; boardId: string; title: string; startsAt: string; timezone: string; venue: string; agenda: string; visibility: 'INTERNAL' | 'PUBLIC'; status: string; attendance: string[]; motions: Motion[]; minutes: Minutes[]; charterSnapshot: Charter | null }
export interface Resolution extends Base { amendments?: Amendment[]; boardId: string; meetingId: string; motionId: string; reference: string; title: string; text: string; publication: 'DRAFT' | 'PUBLIC'; adoptedAt: string; result: NonNullable<Motion['result']> }
export interface Task extends Base {
  boardId: string;
  resolutionId?: string;
  title: string;
  ownerId: string;
  dueAt: string;
  status: string;
  evidence: string;
  completionHistory?: TaskCompletionEvent[];
}
export type TaskCompletionEvent = { at: string; actorId: string } & (
  { kind: 'SUBMITTED'; evidence: string; legacy?: true } |
  { kind: 'APPROVED' | 'CORRECTIONS_REQUESTED'; reason: string }
);
export interface PrivacyRequest extends Base { userId: string; type: string; description: string; status: string; response?: string }
export interface Notification extends Base { userId: string; title: string; href: string; read: boolean; delivery: 'IN_APP'; sourceKey?: string }
export interface Evidence extends Base { publicCaption?: string; targetType:'CASE'|'PROJECT'; targetId:string; uploadedBy:string; filename:string; mime:string; size:number; sha256:string; clientRequestId:string; uploadStatus:'UPLOADING'|'STORED'|'FAILED'; scanStatus:'QUARANTINED'|'CLEAN'|'REJECTED'; scanEngine:string; scannedAt?:string; scannedSha256?:string }
export interface ActionItem { id:string; type:'CASE'|'TASK'; title:string; dueAt:string; ownerId:string; href:string; phase:'UPCOMING'|'DUE_SOON'|'OVERDUE'; status:string }
export interface Audit extends Base { actorId: string; action: string; entityId: string; jurisdiction: string; entityDigest: string; snapshot?: string; previousHash: string; hash: string }
export interface Agency extends Base { name: string; jurisdiction: string; recipientId: string; authority: string; proposedBy: string; verifiedBy?: string; revokedAt?: string; revocationReason?: string }
export interface ReferralResponse { id: string; at: string; by: string; text: string; followUps?: { at: string; by: string; status: "REVIEWED" | "FOLLOW_UP_REQUIRED"; note: string }[] }
export interface Referral extends Base { responses?: ReferralResponse[]; caseId: string; agencyId: string; recipientId: string; summary: string; recordedBy: string; acknowledgement?: { at: string; by: string; reference: string } }
export interface State { deskConsents: DeskConsent[]; agencies: Agency[]; referrals: Referral[]; users: User[]; geos: Geo[]; residencies: Residency[]; boards: Board[]; nominations: Nomination[]; appointments: Appointment[]; conflicts: Conflict[]; cases: Case[]; projects: Project[]; finances: Finance[]; meetings: Meeting[]; resolutions: Resolution[]; tasks: Task[]; privacyRequests: PrivacyRequest[]; notifications: Notification[]; audits: Audit[]; evidence:Evidence[] }
export type Collection = keyof State;
export const COLLECTIONS: Collection[] = ['deskConsents','agencies','referrals','users','geos','residencies','boards','nominations','appointments','conflicts','cases','projects','finances','meetings','resolutions','tasks','privacyRequests','notifications','audits','evidence'];
export const emptyState = (): State => Object.fromEntries(COLLECTIONS.map(key => [key, []])) as unknown as State;
export interface Principal { id: string; name: string; email: string; verified: boolean; mfa: boolean }
export interface Workspace extends State { deskFacilitator:boolean; deskCommunityIds:string[]; testingMode: boolean; projectMedia: { id: string; projectId: string; mime: string; caption: string }[]; reviewTaskIds: string[]; me: User | null; mode: 'synthetic' | 'appwrite'; boardTypes: typeof BOARD_TYPES; demoProfiles: { id: string; name: string; role: string }[]; actionItems:ActionItem[]; counts: { cases: number; openCases: number; projects: number; boards: number; resolutions: number; meetings: number } }
