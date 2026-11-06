import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { BOARD_TYPES, type Appointment, type Base, type Case, type CaseStatus, type Meeting, type Principal, type Role, type State, type Workspace } from '../shared/model.ts';
import { contactAllowed, activeGrant, assert, boardFor, canReadCase, caseOfficer, has, inScope, requireRole, restricted, userFor } from './policy.ts';
import { canUseEvidenceTarget } from './policy.ts';
import { actionItems } from './reminders.ts';
import { includeSettlement } from './inec-geography.ts';
import { config } from './config.ts';
import { tours } from '../shared/tours.ts';

const str = (min = 1, max = 1000) => z.string().trim().min(min).max(max);
const id = str(1,100);
const code = z.enum(['EDU','HLT','SEC','INF','TRD','YTH','CUL']);
const date = z.iso.datetime({ offset: true });
export const commands = {
  profile: z.object({ name: str(2,150) }).strict(),
  residency: z.object({ jurisdiction: id, method: z.enum(['COMMUNITY_ATTESTATION','MANUAL_REVIEW','ADDRESS_RECORD']), statement: str(20,2000) }).strict(),
  reviewResidency: z.object({ id, approved: z.boolean(), reason: str(10,1000) }).strict(),
  createBoard: z.object({ code, jurisdiction: id, authority: str(5), name: str(5,160) }).strict(),
  boardStatus: z.object({ id, status: z.enum(['SUBMITTED','UNDER_REVIEW','APPROVED','ACTIVE','SUSPENDED','ARCHIVED']), reason: str(5) }).strict(),
  charter: z.object({ id, version: str(), authority: str(5), capacity: z.number().int().min(3).max(50), quorumPercent: z.number().int().min(1).max(100), yesPercent: z.number().int().min(1).max(100), termMonths: z.number().int().min(1).max(120) }).strict(),
  nominate: z.object({ boardId: id, candidateId: id, position: z.enum(['BOARD_MEMBER','BOARD_SECRETARY','BOARD_CHAIR']), category: str(3) }).strict(),
  acceptNomination: z.object({ id }).strict(),
  screenNomination: z.object({ id, eligible: z.boolean(), note: str(10) }).strict(),
  approveNomination: z.object({ id, approved: z.boolean(), document: str(5) }).strict(),
  revokeAppointment: z.object({ id, reason: str(10) }).strict(),
  conflict: z.object({ boardId: id, matterId: id, description: str(10) }).strict(),
  reviewConflict: z.object({ id, restrict: z.boolean(), reason: str(10) }).strict(),
  submitCase: z.object({ category: z.enum(['EDU','HLT','SEC','INF','TRD','YTH','CUL','GENERAL','CONDUCT']), title: str(5,160), description: str(20,10000), jurisdiction: id, location: str(0,500), urgency: z.enum(['NORMAL','HIGH','URGENT']), clientRequestId: z.uuid() }).strict(),
  caseTransition: z.object({ id, status: z.enum(['INTAKE_REVIEW','NEEDS_INFORMATION','ACCEPTED','ASSIGNED','IN_PROGRESS','REFERRED','OUTCOME_PROPOSED','VERIFICATION','CLOSED','APPEALED','REOPENED','REJECTED_WITH_REASONS','DUPLICATE_LINKED']), note: str(10,5000), evidence: str(0,1000).default(''), duplicateId: str(0,100).default('') }).strict(),
  assignCase: z.object({ id, boardId: id, assigneeId: id }).strict(),
  caseNote: z.object({ id, note: str(5,5000), internal: z.boolean() }).strict(),
  createProject: z.object({ title: str(5,200), description: str(20,5000), jurisdiction: id, boardCode: code, authority: str(3), reference: str(3,100), source: str(5,1000), fiscalYear: z.number().int().min(2000).max(2100) }).strict(),
  publishProject: z.object({ id }).strict(),
  setProjectMedia: z.object({ id, caption: str(5,500).optional() }).strict(),
  recordDeliveryCredit: z.object({ id, name: str(3,150), office: str(3,150), source: str(10,500) }).strict(),
  projectStatus: z.object({ id, status: z.enum(['PLANNING','CONTRACTING','IMPLEMENTATION','COMPLETION_REPORTED','TECHNICAL_VERIFICATION','SUSPENDED','CANCELLED','DISPUTED']), reason: str(10) }).strict(),
  finance: z.object({ projectId: id, type: z.enum(['APPROPRIATED','APPROVED','RELEASED','DISBURSED','COMMITTED','PAID','SPENT','REFUNDED','ADJUSTED']), amount: z.string().regex(/^(0|[1-9]\d{0,14})\.\d{2}$/, 'Use a positive exact amount with two decimal places.'), currency: z.enum(['NGN','USD','GBP','EUR']), fiscalYear: z.number().int().min(2000).max(2100), source: str(5), evidence: str(5) }).strict(),
  verifyFinance: z.object({ id, verification: z.enum(['VERIFIED','DISPUTED','RETRACTED']), reason: str(10) }).strict(),
  acknowledgeFinance: z.object({ id, side: z.enum(['AUTHORITY','BOARD']) }).strict(),
  milestones: z.object({ id, reason: str(10), milestones: z.array(z.object({ title: str(3), dueAt: date, weight: z.number().int().min(1).max(100), acceptance: str(5), reported: z.number().int().min(0).max(100) }).strict()).min(1).max(20) }).strict(),
  inspection: z.object({ id, method: z.enum(['SITE_VISIT','DOCUMENT_REVIEW']), observedAt: date, note: str(20,5000), evidence: str(5) }).strict(),
  verifyMilestone: z.object({ id, milestoneId: id, verified: z.number().int().min(0).max(100), evidence: str(5) }).strict(),
  completion: z.object({ id, official: str(5), community: str(5), evidence: str(5) }).strict(),
  createMeeting: z.object({ boardId: id, title: str(5,200), startsAt: date, timezone: z.enum(['Africa/Lagos','UTC']), venue: str(3), agenda: str(10,5000), visibility: z.enum(['PUBLIC','INTERNAL']) }).strict(),
  attendance: z.object({ id, userId: id, present: z.boolean() }).strict(),
  motion: z.object({ id, text: str(10,5000) }).strict(),
  vote: z.object({ id, motionId: id, choice: z.enum(['YES','NO','ABSTAIN']) }).strict(),
  decideMotion: z.object({ id, motionId: id }).strict(),
  minutes: z.object({ id, text: str(20,10000) }).strict(),
  approveMinutes: z.object({ id }).strict(),
  proposeAmendment: z.object({ id, target: z.enum(['MINUTES','RESOLUTION']), text: str(20,10000), reason: str(10) }).strict(),
  decideAmendment: z.object({ id, target: z.enum(['MINUTES','RESOLUTION']), amendmentId: id, approved: z.boolean(), reason: str(10) }).strict(),
  registerAgency: z.object({ name: str(3,160), jurisdiction: id, recipientId: id, authority: str(10) }).strict(),
  verifyAgency: z.object({ id }).strict(),
  revokeAgency: z.object({ id, reason: str(10) }).strict(),
  recordReferral: z.object({ caseId: id, agencyId: id, summary: str(20,2000) }).strict(),
  acknowledgeReferral: z.object({ id, reference: str(5) }).strict(),
  respondToReferral: z.object({ id, text: str(20,2000) }).strict(),
  reviewReferralResponse: z.object({ id, responseId: id, status: z.enum(['REVIEWED','FOLLOW_UP_REQUIRED']), note: str(10,1000) }).strict(),
  adoptResolution: z.object({ id, motionId: id, title: str(5,200), text: str(20,5000) }).strict(),
  publishResolution: z.object({ id }).strict(),
  task: z.object({ boardId: id, resolutionId: str(0,100).default(''), title: str(5,200), ownerId: id, dueAt: date }).strict(),
  completeTask: z.object({ id, evidence: str(10) }).strict(),
  reviewTaskCompletion: z.object({
    id,
    revision: z.number().int().nonnegative(),
    decision: z.enum(['APPROVED', 'CORRECTIONS_REQUESTED']),
    reason: str(10, 1000),
  }).strict(),
  privacy: z.object({ type: z.enum(['ACCESS','CORRECTION','DELETION','RESTRICTION','JURISDICTION_CHANGE']), description: str(10,2000) }).strict(),
  reviewPrivacy: z.object({ id, response: str(10,2000) }).strict(),
  readNotification: z.object({ id }).strict(),
  tourProgress: z.object({ tourId:z.enum(['resident','officer']), action:z.enum(['START','NEXT','BACK','DISMISS','RESTART','COMPLETE']) }).strict(),
  caseDeadline: z.object({ id, dueAt:date, reason:str(10,1000) }).strict(),
  taskDeadline: z.object({ id, dueAt:date, reason:str(10,1000) }).strict(),
} as const;
export type Action = keyof typeof commands;
export const stamp = (synthetic = false): Base => ({ id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), synthetic });
function find<T extends { id: string }>(items: T[], value: string): T { const item = items.find(x=>x.id===value); assert(item,'Record not found.','NOT_FOUND',404); return item; }
export function moneyToMinor(amount: string): bigint { assert(/^(0|[1-9]\d*)\.\d{2}$/.test(amount),'Invalid financial amount.'); return BigInt(amount.replace('.','')); }
const coords: Role[] = ['LGA_COORDINATOR'];
const officers: Role[] = ['LGA_COORDINATOR','BOARD_CHAIR','BOARD_SECRETARY'];
const monitors: Role[] = [...officers,'BOARD_MEMBER'];
export const PROJECT_TRANSITIONS:Record<string,string[]>={REGISTERED:['PLANNING','SUSPENDED','CANCELLED'],PLANNING:['CONTRACTING','IMPLEMENTATION','SUSPENDED','CANCELLED'],CONTRACTING:['IMPLEMENTATION','SUSPENDED','CANCELLED'],IMPLEMENTATION:['COMPLETION_REPORTED','SUSPENDED','DISPUTED','CANCELLED'],COMPLETION_REPORTED:['TECHNICAL_VERIFICATION','IMPLEMENTATION','DISPUTED'],TECHNICAL_VERIFICATION:['IMPLEMENTATION','DISPUTED'],SUSPENDED:['PLANNING','IMPLEMENTATION','CANCELLED'],DISPUTED:['IMPLEMENTATION','SUSPENDED','CANCELLED'],CLOSED:[],CANCELLED:[]};
export function notify(s: State, userId: string, title: string, href: string): void { s.notifications.push({ ...stamp(),userId,title,href,read:false,delivery:'IN_APP' }); }
export function appendAudit(s: State, p: Principal, action: string, entityId: string, jurisdiction: string): void {
  const previousHash = s.audits.at(-1)?.hash ?? 'GENESIS';
  const entity=Object.values(s).flat().find(row=>row.id===entityId);
  const snapshot=JSON.stringify(entity??null);
  const entityDigest=createHash('sha256').update(snapshot).digest('hex');
  const event = { ...stamp(), actorId:p.id,action,entityId,jurisdiction,entityDigest,snapshot,previousHash };
  s.audits.push({ ...event, hash:createHash('sha256').update(JSON.stringify(event)).digest('hex') });
}
export function eligibleMembers(s: State, meeting: Meeting, at = meeting.startsAt): Appointment[] {
  return s.appointments.filter(a=>a.boardId===meeting.boardId && a.status==='ACTIVE' && a.startsAt<=at && a.endsAt>at);
}
export function quorum(s: State, meeting: Meeting, matterId = meeting.id) {
  const charter = meeting.charterSnapshot;
  assert(charter?.approved,'Governance configuration required.');
  const members = eligibleMembers(s,meeting).filter(a=>!restricted(s,a.userId,matterId) && !restricted(s,a.userId,meeting.id));
  const eligible = [...new Set(members.map(a=>a.userId))];
  const present = eligible.filter(userId=>meeting.attendance.includes(userId));
  const required = Math.ceil(eligible.length*charter.quorumPercent/100);
  return { eligible, present, required, valid: eligible.length>0 && present.length>=required, charterVersion:charter.version };
}
export const CASE_TRANSITIONS: Record<CaseStatus,CaseStatus[]> = {
  SUBMITTED:['INTAKE_REVIEW'], INTAKE_REVIEW:['NEEDS_INFORMATION','ACCEPTED','REJECTED_WITH_REASONS','DUPLICATE_LINKED'], NEEDS_INFORMATION:['INTAKE_REVIEW'], ACCEPTED:['ASSIGNED','REFERRED','IN_PROGRESS'], ASSIGNED:['IN_PROGRESS','REFERRED'], IN_PROGRESS:['NEEDS_INFORMATION','REFERRED','OUTCOME_PROPOSED'], REFERRED:['IN_PROGRESS','OUTCOME_PROPOSED'], OUTCOME_PROPOSED:['VERIFICATION','IN_PROGRESS'], VERIFICATION:['CLOSED','IN_PROGRESS'], CLOSED:['APPEALED'], APPEALED:['REOPENED','CLOSED'], REOPENED:['INTAKE_REVIEW','IN_PROGRESS'], REJECTED_WITH_REASONS:['APPEALED'], DUPLICATE_LINKED:['APPEALED'],
};
function event(c: Case,p: Principal,type: string,note: string,internal = false) { c.events.push({id:randomUUID(),at:new Date().toISOString(),actorId:p.id,type,note,internal}); c.updatedAt=new Date().toISOString(); }
export function projectAccess(s:State,p:Principal|null,project:State['projects'][number],roles:Role[]=monitors){return has(s,p,roles,project.jurisdiction)||s.boards.some(b=>b.code===project.boardCode&&b.status==='ACTIVE'&&inScope(s,b.jurisdiction,project.jurisdiction)&&has(s,p,roles,project.jurisdiction,b.id));}
function projectRole(s: State,p: Principal,projectId: string,roles=monitors) { const project=find(s.projects,projectId); assert(projectAccess(s,p,project,roles),'Project access denied.','ACCESS_DENIED',403); assert(!restricted(s,p.id,project.id),'You are recused from this project.','CONFLICT_RESTRICTION',403); return project; }
function meetingRole(s: State,p: Principal,meetingId: string,roles=officers) { const meeting=find(s.meetings,meetingId); const board=boardFor(s,meeting.boardId); assert(board.status==='ACTIVE','Board is not active.'); requireRole(s,p,roles,board.jurisdiction,board.id); assert(!restricted(s,p.id,meeting.id),'You are recused from this meeting.','CONFLICT_RESTRICTION',403); return meeting; }

function canReviewTask(s: State,p: Principal|null,task: State['tasks'][number]) {
  const board=boardFor(s,task.boardId);
  return !!p && task.ownerId!==p.id && board.status==='ACTIVE' && has(s,p,officers,board.jurisdiction,board.id)
    && !restricted(s,p.id,task.id) && !restricted(s,p.id,board.id);
}

function recipientAccess(s: State,p: Principal|null,agency: State['agencies'][number],jurisdiction=agency.jurisdiction) {
  return !!agency.verifiedBy && !agency.revokedAt && p?.id===agency.recipientId && has(s,p,['AGENCY_OFFICER'],jurisdiction);
}

// Each caller runs this function within a repository transaction, including the audit and notifications.
export function execute(s: State,p: Principal,action: Action,input: unknown): { id: string } {
  assert(Object.hasOwn(commands,action),'Unknown command.');
  const me=userFor(s,p);
  let entityId=me.id, jurisdiction=s.geos.find(x=>x.type==='COUNTRY')?.id ?? '';
  const read=<K extends Action>(name: K): z.output<(typeof commands)[K]> => commands[name].parse(input) as z.output<(typeof commands)[K]>;
  const now=new Date().toISOString();
  switch(action) {
    case 'setProjectMedia': {
      const d=read(action),file=find(s.evidence,d.id);
      assert(file.targetType==='PROJECT','Case attachments are private.','ACCESS_DENIED',403);
      const project=projectRole(s,p,file.targetId,officers);
      if(d.caption){
        assert(project.publication==='PUBLIC'&&mediaReady(file),'Publish the project and use a clean, scanned photo or video.');
        assert(file.uploadedBy!==p.id,'A different authorized officer must review the media before publication.');
      }
      file.publicCaption=d.caption;
      file.updatedAt=now;
      entityId=file.id;
      jurisdiction=project.jurisdiction;
      break;
    }
    case 'recordDeliveryCredit': {
      const d=read(action),project=projectRole(s,p,d.id,coords);
      assert(project.publication==='PUBLIC'&&project.status==='CLOSED'&&project.completion,'Verified public completion is required before recording delivery credit.');
      assert(project.completion.reviewerId!==p.id,'A different coordinator must record delivery credit.');
      project.deliveryCredit={name:d.name,office:d.office,source:d.source};
      project.updatedAt=now;
      entityId=project.id;
      jurisdiction=project.jurisdiction;
      break;
    }
    case 'proposeAmendment':
    case 'decideAmendment': {
      const d=read(action);
      const record=d.target==='MINUTES'?find(s.meetings,d.id):find(s.resolutions,d.id);
      const meeting=meetingRole(s,p,'meetingId' in record?record.meetingId:record.id,
        action==='decideAmendment'?['BOARD_CHAIR','LGA_COORDINATOR']:officers);
      assert(!restricted(s,p.id,record.id)&&!restricted(s,p.id,meeting.boardId)
        && (!('motionId' in record)||!restricted(s,p.id,record.motionId)), 'You are recused from this matter.');
      assert('motionId' in record||record.minutes.some(minutes=>minutes.status==='APPROVED'),'Approved minutes are required.');
      const amendments=record.amendments??=[];
      if ('text' in d) {
        assert(!amendments.some(item=>!item.decision),'Decide the pending amendment first.');
        amendments.push({id:randomUUID(),text:d.text,reason:d.reason,proposedBy:p.id,proposedAt:now});
        record.amendments=amendments;
      } else {
        const amendment=find(amendments,d.amendmentId);
        assert(!amendment.decision,'This amendment has already been decided.');
        assert(amendment.proposedBy!==p.id,'An independent officer must decide the amendment.');
        amendment.decision={approved:d.approved,by:p.id,at:now,reason:d.reason};
      }
      record.updatedAt=now;
      entityId=record.id;
      jurisdiction=boardFor(s,record.boardId).jurisdiction;
      break;
    }
    case 'registerAgency': {
      const d=read(action);
      includeSettlement(s,d.jurisdiction);
      const geo=find(s.geos,d.jurisdiction);
      assert(['LGA','WARD','COMMUNITY'].includes(geo.type),'Choose a local jurisdiction.');
      requireRole(s,p,coords,geo.id);
      const recipient=find(s.users,d.recipientId);
      assert(recipient.id!==p.id && contactAllowed(recipient) && recipient.grants.some(g=>g.role==='AGENCY_OFFICER' && !g.boardId && activeGrant(s,recipient,g) && inScope(s,g.jurisdiction,geo.id)),'Choose a verified recipient with an active agency officer grant in this jurisdiction.');
      assert(!s.agencies.some(a=>!a.revokedAt&&a.jurisdiction===geo.id&&a.name.toLowerCase()===d.name.toLowerCase()),'This agency is already registered in the jurisdiction.');
      const agency={...stamp(),...d,proposedBy:p.id};
      s.agencies.push(agency);
      entityId=agency.id;
      jurisdiction=geo.id;
      break;
    }
    case 'verifyAgency':
    case 'revokeAgency': {
      const d=read(action),agency=find(s.agencies,d.id);
      requireRole(s,p,coords,agency.jurisdiction);
      assert(!agency.revokedAt,'This agency registration was revoked.');
      if ('reason' in d) {
        agency.revokedAt=now;
        agency.revocationReason=d.reason;
      } else {
        assert(!agency.verifiedBy && agency.proposedBy!==p.id && agency.recipientId!==p.id,'Independent agency verification is required.');
        const recipient=find(s.users,agency.recipientId);
        assert(has(s,{...recipient,mfa:true},['AGENCY_OFFICER'],agency.jurisdiction),'The designated recipient no longer has an eligible agency officer grant.');
        agency.verifiedBy=p.id;
      }
      agency.updatedAt=now;
      entityId=agency.id;
      jurisdiction=agency.jurisdiction;
      break;
    }
    case 'recordReferral': {
      const d=read(action),c=find(s.cases,d.caseId),agency=find(s.agencies,d.agencyId);
      caseOfficer(s,p,c);
      assert(!c.boardId||!restricted(s,p.id,c.boardId),'You are recused from this board.');
      assert(['ACCEPTED','ASSIGNED','IN_PROGRESS','REFERRED'].includes(c.status),'This case is outside the referral stage.');
      assert(agency.recipientId!==p.id && agency.recipientId!==c.reporterId,'The referral needs an independent recipient.');
      const recipient=find(s.users,agency.recipientId);
      assert(inScope(s,agency.jurisdiction,c.jurisdiction)&&recipientAccess(s,{...recipient,mfa:true},agency,c.jurisdiction)
        && !restricted(s,recipient.id,c.id),'Choose an active verified agency with an eligible recipient in this jurisdiction.');
      assert(!s.referrals.some(r=>r.caseId===c.id&&r.agencyId===agency.id),'A referral to this agency is already recorded for this case.');
      const referral={...stamp(),...d,recipientId:agency.recipientId,recordedBy:p.id};
      s.referrals.push(referral);
      c.status='REFERRED';
      event(c,p,'REFERRED','An agency referral was recorded. Receipt is awaiting acknowledgement.');
      notify(s,recipient.id,'An agency referral is awaiting acknowledgement.','/referrals');
      entityId=referral.id;
      jurisdiction=c.jurisdiction;
      break;
    }
    case 'respondToReferral': {
      const d=read(action),referral=find(s.referrals,d.id),agency=find(s.agencies,referral.agencyId),c=find(s.cases,referral.caseId);
      assert(referral.recipientId===p.id&&recipientAccess(s,p,agency,c.jurisdiction)&&!restricted(s,p.id,c.id),'Only the designated agency recipient can respond.','ACCESS_DENIED',403);
      assert(referral.acknowledgement,'Acknowledge receipt before responding.');
      (referral.responses??=[]).push({id:randomUUID(),at:now,by:p.id,text:d.text});
      referral.updatedAt=now;
      notify(s,referral.recordedBy,'An agency response is available for review.','/referrals');
      entityId=referral.id;
      jurisdiction=c.jurisdiction;
      break;
    }
    case 'reviewReferralResponse': {
      const d=read(action),referral=find(s.referrals,d.id),c=find(s.cases,referral.caseId);
      caseOfficer(s,p,c);
      assert(referral.recipientId!==p.id&&(!c.boardId||!restricted(s,p.id,c.boardId)),'An independent case handler must review the response.','ACCESS_DENIED',403);
      const response=find(referral.responses??[],d.responseId);
      const last=response.followUps?.at(-1);
      assert(!last||last.status==='FOLLOW_UP_REQUIRED'&&d.status==='REVIEWED','This response already has a follow-up decision.');
      (response.followUps??=[]).push({at:now,by:p.id,status:d.status,note:d.note});
      referral.updatedAt=now;
      entityId=referral.id;
      jurisdiction=c.jurisdiction;
      break;
    }
    case 'acknowledgeReferral': {
      const d=read(action),referral=find(s.referrals,d.id),agency=find(s.agencies,referral.agencyId),c=find(s.cases,referral.caseId);
      assert(referral.recipientId===p.id&&recipientAccess(s,p,agency,c.jurisdiction)&&!restricted(s,p.id,c.id),'Only the designated agency recipient can acknowledge this referral.','ACCESS_DENIED',403);
      assert(!referral.acknowledgement,'Receipt has already been acknowledged.');
      referral.acknowledgement={at:now,by:p.id,reference:d.reference};
      referral.updatedAt=now;
      notify(s,referral.recordedBy,'The designated agency recipient acknowledged your referral.','/referrals');
      entityId=referral.id;
      jurisdiction=c.jurisdiction;
      break;
    }
    case 'tourProgress': {
      const d=read(action),tour=tours[d.tourId];
      if(d.tourId==='officer')assert(me.grants.some(g=>has(s,p,['LGA_COORDINATOR','BOARD_CHAIR','BOARD_SECRETARY','BOARD_MEMBER','ETHICS_REVIEWER','AUDITOR'],g.jurisdiction,g.boardId)),'An active officer role with MFA is required for this walkthrough.','ACCESS_DENIED',403);
      me.tours??={};const prior=me.tours[d.tourId];let step=prior?.version===tour.version?prior.step:0;
      if(['START','RESTART'].includes(d.action)){step=d.action==='RESTART'||prior?.status==='COMPLETED'?0:step;for(const other of ['resident','officer'] as const)if(other!==d.tourId&&me.tours[other]?.status==='ACTIVE')me.tours[other]!.status='DISMISSED';}
      else {assert(prior?.status==='ACTIVE'&&prior.version===tour.version,'Start this walkthrough first.');if(d.action==='NEXT')step=Math.min(step+1,tour.steps.length-1);if(d.action==='BACK')step=Math.max(step-1,0);if(d.action==='COMPLETE')assert(step===tour.steps.length-1,'Visit the final step before completing this walkthrough.');}
      me.tours[d.tourId]={version:tour.version,step,status:d.action==='DISMISS'?'DISMISSED':d.action==='COMPLETE'?'COMPLETED':'ACTIVE',updatedAt:now};break;
    }
    case 'caseDeadline': {const d=read(action),c=find(s.cases,d.id);caseOfficer(s,p,c);assert(c.assigneeId,'Assign a responsible officer before setting a deadline.');assert(!['CLOSED','REJECTED_WITH_REASONS','DUPLICATE_LINKED'].includes(c.status),'This case no longer has an open action.');assert(new Date(d.dueAt).getTime()>Date.now(),'A new deadline must be in the future.');c.dueAt=new Date(d.dueAt).toISOString();c.deadlineReason=d.reason;event(c,p,'DEADLINE_SET',`Action deadline: ${d.dueAt}. ${d.reason}`);entityId=c.id;jurisdiction=c.jurisdiction;break;}
    case 'taskDeadline': {const d=read(action),t=find(s.tasks,d.id),b=boardFor(s,t.boardId);requireRole(s,p,officers,b.jurisdiction,b.id);assert(!restricted(s,p.id,t.id),'You are recused from this action.');assert(t.status==='OPEN','Only open tasks can be rescheduled.');assert(new Date(d.dueAt).getTime()>Date.now(),'A new deadline must be in the future.');t.dueAt=new Date(d.dueAt).toISOString();t.updatedAt=now;entityId=t.id;jurisdiction=b.jurisdiction;break;}
    case 'profile': { const d=read(action); me.name=d.name; me.updatedAt=now; break; }
    case 'residency': {
      assert(contactAllowed(p),'Verify your email address before requesting community membership.','VERIFICATION_REQUIRED',403);
      const d=read(action); includeSettlement(s,d.jurisdiction); assert(s.geos.some(g=>g.id===d.jurisdiction && g.type==='COMMUNITY'),'Select an imported community.');
      assert(!s.residencies.some(r=>r.userId===p.id && r.status==='PENDING'),'A residency review is already pending.');
      const r={...stamp(),...d,userId:p.id,status:'PENDING'}; s.residencies.push(r); entityId=r.id;jurisdiction=d.jurisdiction; break;
    }
    case 'reviewResidency': {
      const d=read(action),r=find(s.residencies,d.id); requireRole(s,p,coords,r.jurisdiction); assert(r.userId!==p.id,'You cannot verify your own residency.'); assert(r.status==='PENDING','Review is already complete.');
      if(d.approved) for(const old of s.residencies.filter(x=>x.userId===r.userId && x.status==='VERIFIED')) old.status='HISTORICAL';
      r.status=d.approved?'VERIFIED':'REJECTED';r.reviewerId=p.id;r.reason=d.reason;entityId=r.id;jurisdiction=r.jurisdiction;notify(s,r.userId,'Your community verification has been reviewed.','/community');break;
    }
    case 'createBoard': {
      const d=read(action);requireRole(s,p,coords,d.jurisdiction);assert(s.geos.some(g=>g.id===d.jurisdiction && ['LGA','WARD'].includes(g.type)),'Boards must be scoped to an imported LGA or ward.');
      assert(!s.boards.some(b=>b.code===d.code && b.jurisdiction===d.jurisdiction && b.status!=='ARCHIVED'),'A board of this type already exists here.');
      const b={...stamp(),...d,status:'DRAFT',charter:null,submittedBy:p.id};s.boards.push(b);entityId=b.id;jurisdiction=b.jurisdiction;break;
    }
    case 'charter': {
      const d=read(action),b=boardFor(s,d.id);requireRole(s,p,coords,b.jurisdiction);assert(!['ACTIVE','ARCHIVED'].includes(b.status),'Suspend the board before adopting a new charter.');
      b.charter={version:d.version,authority:d.authority,approved:true,capacity:d.capacity,quorumPercent:d.quorumPercent,yesPercent:d.yesPercent,termMonths:d.termMonths};entityId=b.id;jurisdiction=b.jurisdiction;break;
    }
    case 'boardStatus': {
      const d=read(action),b=boardFor(s,d.id);requireRole(s,p,coords,b.jurisdiction);
      const next: Record<string,string[]>={DRAFT:['SUBMITTED'],SUBMITTED:['UNDER_REVIEW'],UNDER_REVIEW:['APPROVED'],APPROVED:['ACTIVE'],ACTIVE:['SUSPENDED'],SUSPENDED:['ACTIVE','ARCHIVED']};
      assert(next[b.status]?.includes(d.status),'Invalid board transition.');if(['APPROVED','ACTIVE'].includes(d.status)) assert(b.charter?.approved,'Governance configuration required.');
      if(d.status==='APPROVED'){assert(b.submittedBy!==p.id,'Board establishment requires an independent approval.');b.approvedBy=p.id;}
      b.status=d.status;entityId=b.id;jurisdiction=b.jurisdiction;break;
    }
    case 'nominate': {
      const d=read(action),b=boardFor(s,d.boardId);assert(b.status==='ACTIVE','Board is not active.');find(s.users,d.candidateId);
      assert(s.residencies.some(r=>r.userId===p.id && r.status==='VERIFIED' && inScope(s,b.jurisdiction,r.jurisdiction)) || has(s,p,officers,b.jurisdiction,b.id),'Verified community membership is required.','ACCESS_DENIED',403);
      const n={...stamp(),...d,nominatorId:p.id,accepted:false,status:'NOMINATED'};s.nominations.push(n);entityId=n.id;jurisdiction=b.jurisdiction;notify(s,n.candidateId,'You have a board nomination to review.','/members');break;
    }
    case 'acceptNomination': {const d=read(action),n=find(s.nominations,d.id);assert(n.candidateId===p.id && n.status==='NOMINATED','Only the nominated candidate may accept.');n.accepted=true;n.status='ACCEPTED';entityId=n.id;break;}
    case 'screenNomination': {
      const d=read(action),n=find(s.nominations,d.id),b=boardFor(s,n.boardId);requireRole(s,p,[...coords,'ETHICS_REVIEWER'],b.jurisdiction);assert(n.candidateId!==p.id,'You cannot screen yourself.');assert(n.accepted && n.status==='ACCEPTED','Candidate acceptance is required.');
      assert(s.residencies.some(r=>r.userId===n.candidateId && r.status==='VERIFIED' && inScope(s,b.jurisdiction,r.jurisdiction)),'Verified candidate residency is required.');n.status=d.eligible?'ELIGIBLE':'REJECTED';n.screeningBy=p.id;n.screeningNote=d.note;entityId=n.id;jurisdiction=b.jurisdiction;break;
    }
    case 'approveNomination': {
      const d=read(action),n=find(s.nominations,d.id),b=boardFor(s,n.boardId);requireRole(s,p,coords,b.jurisdiction);assert(p.id!==n.candidateId && p.id!==n.screeningBy,'Independent final approval is required.');assert(n.status==='ELIGIBLE','Eligibility screening is required.');assert(b.status==='ACTIVE' && b.charter?.approved,'Active board and approved charter required.');
      n.status=d.approved?'APPOINTED':'REJECTED';n.approvedBy=p.id;
      if(d.approved){assert(s.appointments.filter(a=>a.boardId===b.id && a.status==='ACTIVE' && a.endsAt>now).length<b.charter.capacity,'Board membership capacity reached.');assert(!s.appointments.some(a=>a.boardId===b.id&&a.userId===n.candidateId&&a.status==='ACTIVE'&&a.endsAt>now),'Candidate already has an active appointment.');
        const end=new Date(now);end.setUTCMonth(end.getUTCMonth()+b.charter.termMonths);
        const a: Appointment={...stamp(),boardId:b.id,userId:n.candidateId,position:n.position,startsAt:now,endsAt:end.toISOString(),status:'ACTIVE',authority:b.charter.authority,document:d.document,nominationId:n.id};s.appointments.push(a);
        find(s.users,n.candidateId).grants.push({role:n.position,jurisdiction:b.jurisdiction,boardId:b.id,startsAt:a.startsAt,endsAt:a.endsAt});notify(s,n.candidateId,'Your board appointment has been approved.','/members');}
      entityId=n.id;jurisdiction=b.jurisdiction;break;
    }
    case 'revokeAppointment': {const d=read(action),a=find(s.appointments,d.id),b=boardFor(s,a.boardId);requireRole(s,p,coords,b.jurisdiction);a.status='REVOKED';a.updatedAt=now;entityId=a.id;jurisdiction=b.jurisdiction;notify(s,a.userId,'Your appointment status has changed.','/members');break;}
    case 'conflict': {const d=read(action),b=boardFor(s,d.boardId);requireRole(s,p,monitors,b.jurisdiction,b.id);const c={...stamp(),...d,userId:p.id,status:'PENDING'};s.conflicts.push(c);entityId=c.id;jurisdiction=b.jurisdiction;break;}
    case 'reviewConflict': {const d=read(action),c=find(s.conflicts,d.id),b=boardFor(s,c.boardId);requireRole(s,p,['ETHICS_REVIEWER'],b.jurisdiction);assert(c.userId!==p.id,'Independent conflict review required.');assert(c.status==='PENDING','Conflict already reviewed.');c.status=d.restrict?'RESTRICTED':'CLEARED';c.reviewerId=p.id;entityId=c.id;jurisdiction=b.jurisdiction;break;}
    case 'submitCase': {
      const d=read(action);assert(contactAllowed(p),'Verify your contact before submitting a report.','CONTACT_VERIFICATION_REQUIRED',403);
      includeSettlement(s,d.jurisdiction);
      assert(s.geos.some(g=>g.id===d.jurisdiction && g.type==='COMMUNITY'),'Select a registered community.');
      const prior=s.cases.find(c=>c.reporterId===p.id && c.clientRequestId===d.clientRequestId);if(prior)return {id:prior.id};
      const c: Case={...stamp(),...d,reference:`CBS-${new Date().getUTCFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`,reporterId:p.id,boardCode:d.category,classification:d.category==='SEC'?'HIGHLY_RESTRICTED':'CONFIDENTIAL',status:'SUBMITTED',events:[]};
      event(c,p,'SUBMITTED','Report received. Awaiting authorized intake review.');s.cases.push(c);entityId=c.id;jurisdiction=c.jurisdiction;
      // Restricted safety cases are assigned only to explicitly scoped duty handlers.
      if(c.boardCode==='SEC'){c.assigneeId=s.users.find(u=>has(s,{id:u.id,name:u.name,email:u.email,verified:true,mfa:true},['SECURITY_HANDLER'],c.jurisdiction))?.id;}
      notify(s,p.id,'Your report has been received.','/cases');break;
    }
    case 'assignCase': {
      const d=read(action),c=find(s.cases,d.id);caseOfficer(s,p,c);assert(c.status==='ACCEPTED','Accept the case before assignment.');const b=boardFor(s,d.boardId),u=find(s.users,d.assigneeId);
      assert(b.status==='ACTIVE'&&b.code===c.boardCode&&inScope(s,b.jurisdiction,c.jurisdiction),'Assignment must match the case board and jurisdiction.');
      assert(has(s,{id:u.id,name:u.name,email:u.email,verified:true,mfa:true},c.boardCode==='SEC'?['SECURITY_HANDLER']:monitors,c.jurisdiction,b.id),'Assignee lacks an active scoped role.');assert(!restricted(s,u.id,c.id),'Assignee has a conflict restriction.');
      c.boardId=b.id;c.assigneeId=u.id;c.status='ASSIGNED';event(c,p,'ASSIGNED','Case assigned to the responsible board officer.');notify(s,u.id,'A case has been assigned to you.','/cases');entityId=c.id;jurisdiction=c.jurisdiction;break;
    }
    case 'caseTransition': {
      const d=read(action),c=find(s.cases,d.id);assert(CASE_TRANSITIONS[c.status].includes(d.status),'This case transition is not permitted.','INVALID_TRANSITION');
      if(d.status==='APPEALED'){assert(c.reporterId===p.id,'Only the reporter may appeal.','ACCESS_DENIED',403);}
      else {caseOfficer(s,p,c);assert(d.status!=='ASSIGNED','Use the validated assignment action.');}
      if(c.status==='ACCEPTED'&&d.status==='IN_PROGRESS')assert(c.boardCode==='CONDUCT','Assign an officer before starting investigation.');
      if(d.status==='OUTCOME_PROPOSED'){assert(d.evidence,'Outcome evidence reference is required.');c.outcomeBy=p.id;c.sourceEvidence=d.evidence;}
      if(d.status==='VERIFICATION'){assert(c.outcomeBy && c.outcomeBy!==p.id,'An independent outcome reviewer is required.');assert(d.evidence,'Review evidence is required.');c.verifiedBy=p.id;}
      if(d.status==='CLOSED') assert(c.verifiedBy && c.outcomeBy && c.verifiedBy!==c.outcomeBy,'Independent outcome verification is required before closure.');
      if(d.status==='DUPLICATE_LINKED'){const master=find(s.cases,d.duplicateId);assert(master.id!==c.id && canReadCase(s,p,master) && master.jurisdiction===c.jurisdiction,'Invalid duplicate target.');c.duplicateId=master.id;}
      c.status=d.status;event(c,p,d.status,d.note);notify(s,c.reporterId,'Your CBS case has been updated. Sign in to view it.','/cases');entityId=c.id;jurisdiction=c.jurisdiction;break;
    }
    case 'caseNote': {const d=read(action),c=find(s.cases,d.id);assert(canReadCase(s,p,c),'Case access denied.','ACCESS_DENIED',403);if(d.internal)caseOfficer(s,p,c);event(c,p,'NOTE',d.note,d.internal);entityId=c.id;jurisdiction=c.jurisdiction;break;}
    case 'createProject': {const d=read(action);includeSettlement(s,d.jurisdiction);assert(s.geos.some(g=>g.id===d.jurisdiction),'Unknown jurisdiction.');assert(projectAccess(s,p,{...stamp(),...d,status:'REGISTERED',publication:'DRAFT',versions:[],inspections:[]},officers),'Project creation denied.','ACCESS_DENIED',403);assert(!s.projects.some(x=>x.reference===d.reference),'Duplicate project reference.');const project={...stamp(),...d,status:'REGISTERED',publication:'DRAFT' as const,versions:[],inspections:[]};s.projects.push(project);entityId=project.id;jurisdiction=d.jurisdiction;break;}
    case 'publishProject': {const d=read(action),project=projectRole(s,p,d.id,officers);assert(project.source,'Source provenance required.');project.publication='PUBLIC';entityId=project.id;jurisdiction=project.jurisdiction;break;}
    case 'projectStatus': {const d=read(action),project=projectRole(s,p,d.id,officers);assert(PROJECT_TRANSITIONS[project.status]?.includes(d.status),'Invalid project stage transition.');if(d.status==='IMPLEMENTATION')assert(project.versions.length,'A versioned milestone baseline is required before implementation.');(project.stageHistory??=[]).push({from:project.status,to:d.status,reason:d.reason,actorId:p.id,at:now});project.status=d.status;entityId=project.id;jurisdiction=project.jurisdiction;break;}
    case 'finance': {const d=read(action),project=projectRole(s,p,d.projectId,officers);assert(moneyToMinor(d.amount)>0n,'Amount must be greater than zero.');const f={...stamp(),...d,recordedBy:p.id,verification:'UNVERIFIED'};s.finances.push(f);entityId=f.id;jurisdiction=project.jurisdiction;for(const u of s.users.filter(u=>u.grants.some(g=>activeGrant(s,u,g)&&inScope(s,g.jurisdiction,project.jurisdiction)&&['LGA_COORDINATOR','BOARD_CHAIR','AGENCY_OFFICER'].includes(g.role))))notify(s,u.id,'A funding disclosure is available for acknowledgement.','/projects');break;}
    case 'verifyFinance': {const d=read(action),f=find(s.finances,d.id),project=projectRole(s,p,f.projectId,['LGA_COORDINATOR','BOARD_CHAIR','AUDITOR']);assert(f.recordedBy!==p.id,'Financial evidence needs independent review.');assert(f.evidence&&f.source,'Source evidence is required.');f.verification=d.verification;f.reviewedBy=p.id;entityId=f.id;jurisdiction=project.jurisdiction;break;}
    case 'acknowledgeFinance': {const d=read(action),f=find(s.finances,d.id),project=find(s.projects,f.projectId);assert(projectAccess(s,p,project,d.side==='AUTHORITY'?['AGENCY_OFFICER']:['BOARD_CHAIR','BOARD_SECRETARY']),'Acknowledgement permission denied.','ACCESS_DENIED',403);assert(!restricted(s,p.id,project.id),'You are recused from this project.');if(d.side==='AUTHORITY')f.authorityAcknowledgedBy=p.id;else f.boardAcknowledgedBy=p.id;entityId=f.id;jurisdiction=project.jurisdiction;break;}
    case 'milestones': {const d=read(action),project=projectRole(s,p,d.id,officers);assert(d.milestones.reduce((a,m)=>a+m.weight,0)===100,'Milestone weights must total 100%.');project.versions.push({version:project.versions.length+1,at:now,actorId:p.id,reason:d.reason,milestones:d.milestones.map(m=>({...m,id:randomUUID(),verified:0,evidence:''}))});entityId=project.id;jurisdiction=project.jurisdiction;break;}
    case 'inspection': {const d=read(action),project=projectRole(s,p,d.id);assert(d.observedAt<=now,'Inspection time cannot be in the future.');project.inspections.push({...stamp(),inspectorId:p.id,method:d.method,observedAt:d.observedAt,note:d.note,evidence:d.evidence});entityId=project.id;jurisdiction=project.jurisdiction;break;}
    case 'verifyMilestone': {const d=read(action),project=projectRole(s,p,d.id,['LGA_COORDINATOR','BOARD_CHAIR','AUDITOR']);const baseline=project.versions.at(-1);assert(baseline,'Create a milestone baseline first.');assert(baseline.actorId!==p.id,'Independent milestone verification is required.');assert(project.inspections.length,'Inspection evidence is required.');const m=find(baseline.milestones,d.milestoneId);project.versions.push({...structuredClone(baseline),version:baseline.version+1,at:now,actorId:p.id,reason:'Milestone verification',milestones:baseline.milestones.map(x=>x.id===m.id?{...x,verified:d.verified,evidence:d.evidence}:structuredClone(x))});entityId=project.id;jurisdiction=project.jurisdiction;break;}
    case 'completion': {const d=read(action),project=projectRole(s,p,d.id,['LGA_COORDINATOR','BOARD_CHAIR']);assert(project.status==='TECHNICAL_VERIFICATION','Project must be in technical verification.');const milestones=project.versions.at(-1)?.milestones;assert(milestones?.length&&milestones.every(m=>m.verified===100),'All milestones require verified completion.');assert(project.inspections.some(i=>i.method==='SITE_VISIT'&&i.inspectorId!==p.id),'An independent physical inspection is required.');project.completion={official:d.official,community:d.community,evidence:d.evidence,reviewerId:p.id};project.status='CLOSED';entityId=project.id;jurisdiction=project.jurisdiction;break;}
    case 'createMeeting': {const d=read(action),b=boardFor(s,d.boardId);requireRole(s,p,officers,b.jurisdiction,b.id);assert(b.status==='ACTIVE'&&b.charter?.approved,'Governance configuration required.');assert(d.startsAt>now,'Meeting date must be in the future.');const m={...stamp(),...d,status:'SCHEDULED',attendance:[],motions:[],minutes:[],charterSnapshot:structuredClone(b.charter)};s.meetings.push(m);entityId=m.id;jurisdiction=b.jurisdiction;for(const a of eligibleMembers(s,m))notify(s,a.userId,'A board meeting has been scheduled.','/meetings');break;}
    case 'attendance': {const d=read(action),m=meetingRole(s,p,d.id);assert(eligibleMembers(s,m).some(a=>a.userId===d.userId),'Member is not eligible on the meeting date.');m.attendance=m.attendance.filter(x=>x!==d.userId);if(d.present)m.attendance.push(d.userId);entityId=m.id;jurisdiction=boardFor(s,m.boardId).jurisdiction;break;}
    case 'motion': {const d=read(action),m=meetingRole(s,p,d.id,monitors);assert(m.startsAt<=now,'Motions may be recorded after the meeting starts.');assert(!m.minutes.some(x=>x.status==='APPROVED'),'Meeting record is locked.');m.motions.push({id:randomUUID(),text:d.text,proposerId:p.id,round:1,votes:[]});entityId=m.id;jurisdiction=boardFor(s,m.boardId).jurisdiction;break;}
    case 'vote': {const d=read(action),m=meetingRole(s,p,d.id,monitors),motion=find(m.motions,d.motionId);assert(m.startsAt<=now,'Voting opens when the meeting starts.');assert(!motion.result,'Voting round is closed.');assert(!restricted(s,p.id,motion.id),'You are recused from this motion.','CONFLICT_RESTRICTION',403);const q=quorum(s,m,motion.id);assert(q.valid,'Formal voting is blocked: quorum not met.');assert(q.present.includes(p.id),'Verified attendance and voting eligibility required.');assert(!motion.votes.some(v=>v.voterId===p.id),'One vote is permitted per member per round.');motion.votes.push({voterId:p.id,choice:d.choice,at:now});entityId=m.id;jurisdiction=boardFor(s,m.boardId).jurisdiction;break;}
    case 'decideMotion': {const d=read(action),m=meetingRole(s,p,d.id),motion=find(m.motions,d.motionId);assert(!motion.result,'Decision already recorded.');const q=quorum(s,m,motion.id);assert(q.valid,'Formal decision blocked: quorum not met.');const votes=motion.votes.filter(v=>q.present.includes(v.voterId));assert(votes.length===q.present.length,'Every present eligible member must vote or abstain.');const yes=votes.filter(v=>v.choice==='YES').length,no=votes.filter(v=>v.choice==='NO').length,abstain=votes.length-yes-no;const required=Math.ceil(q.present.length*m.charterSnapshot!.yesPercent/100);motion.result={eligible:q.eligible.length,present:q.present.length,yes,no,abstain,required,adopted:yes>=required,charterVersion:q.charterVersion,at:now};entityId=m.id;jurisdiction=boardFor(s,m.boardId).jurisdiction;break;}
    case 'minutes': {const d=read(action),m=meetingRole(s,p,d.id);assert(!m.minutes.some(x=>x.status==='APPROVED'),'Approved minutes are locked; a formal correction workflow is required.');assert(m.motions.every(x=>x.result),'Close outstanding voting rounds first.');m.minutes.push({version:m.minutes.length+1,text:d.text,submittedBy:p.id,status:'SUBMITTED'});m.status='MINUTES_PENDING';entityId=m.id;jurisdiction=boardFor(s,m.boardId).jurisdiction;break;}
    case 'approveMinutes': {const d=read(action),m=meetingRole(s,p,d.id,['BOARD_CHAIR','LGA_COORDINATOR']),minutes=m.minutes.at(-1);assert(minutes&&minutes.status==='SUBMITTED','Submitted minutes required.');assert(minutes.submittedBy!==p.id,'Independent minutes approval required.');minutes.status='APPROVED';minutes.approvedBy=p.id;m.status='MINUTES_APPROVED';entityId=m.id;jurisdiction=boardFor(s,m.boardId).jurisdiction;break;}
    case 'adoptResolution': {const d=read(action),m=meetingRole(s,p,d.id,['BOARD_CHAIR','LGA_COORDINATOR']),motion=find(m.motions,d.motionId);assert(m.minutes.at(-1)?.status==='APPROVED'&&motion.result?.adopted,'Approved minutes and an adopted motion are required.');assert(!s.resolutions.some(r=>r.motionId===motion.id),'Resolution already exists for this motion.');const r={...stamp(),boardId:m.boardId,meetingId:m.id,motionId:motion.id,reference:`RES-${randomUUID().slice(0,8).toUpperCase()}`,title:d.title,text:d.text,publication:'DRAFT' as const,adoptedAt:now,result:motion.result};s.resolutions.push(r);entityId=r.id;jurisdiction=boardFor(s,m.boardId).jurisdiction;break;}
    case 'publishResolution': {const d=read(action),r=find(s.resolutions,d.id),b=boardFor(s,r.boardId);requireRole(s,p,['BOARD_CHAIR','LGA_COORDINATOR'],b.jurisdiction,b.id);assert(!restricted(s,p.id,r.motionId),'You are recused from this matter.');r.publication='PUBLIC';entityId=r.id;jurisdiction=b.jurisdiction;break;}
    case 'task': {const d=read(action),b=boardFor(s,d.boardId);requireRole(s,p,officers,b.jurisdiction,b.id);assert(s.appointments.some(a=>a.boardId===b.id&&a.userId===d.ownerId&&a.status==='ACTIVE'&&a.endsAt>now),'Assign tasks only to active board members.');if(d.resolutionId)assert(find(s.resolutions,d.resolutionId).boardId===b.id,'Resolution belongs to a different board.');const t={...stamp(),...d,status:'OPEN',evidence:''};s.tasks.push(t);entityId=t.id;jurisdiction=b.jurisdiction;notify(s,t.ownerId,'A board action has been assigned to you.','/resolutions');break;}
    case 'completeTask': {
      const d = read(action), task = find(s.tasks, d.id), board = boardFor(s, task.boardId);
      assert(task.ownerId === p.id, 'Only the task owner can submit completion.');
      requireRole(s, p, monitors, board.jurisdiction, board.id);
      assert(board.status === 'ACTIVE' && !restricted(s, p.id, task.id) && !restricted(s, p.id, board.id), 'This board action is outside your current authority.');
      assert(task.status === 'OPEN', 'Only open tasks can be submitted.');
      task.status = 'REVIEW_PENDING';
      task.evidence = d.evidence;
      task.updatedAt = now;
      (task.completionHistory ??= []).push({ kind: 'SUBMITTED', at: now, actorId: p.id, evidence: d.evidence });
      entityId = task.id;
      jurisdiction = board.jurisdiction;
      break;
    }
    case 'reviewTaskCompletion': {
      const d = read(action), task = find(s.tasks, d.id), board = boardFor(s, task.boardId);
      requireRole(s, p, officers, board.jurisdiction, board.id);
      assert(task.ownerId !== p.id, 'The task owner cannot review their own submission.');
      assert(board.status === 'ACTIVE' && !restricted(s, p.id, task.id) && !restricted(s, p.id, board.id), 'This board action is outside your current authority.');
      assert(task.status === 'REVIEW_PENDING' && task.evidence.trim(), 'This task has no pending evidence to review.');
      const history = task.completionHistory ??= [];
      assert(history.length === d.revision, 'The submission changed. Reopen the review and read the latest evidence.', 'CONCURRENT_UPDATE', 409);
      if (!history.length) {
        history.push({ kind: 'SUBMITTED', at: task.updatedAt, actorId: task.ownerId, evidence: task.evidence, legacy: true });
      }
      history.push({ kind: d.decision, at: now, actorId: p.id, reason: d.reason });
      task.status = d.decision === 'APPROVED' ? 'COMPLETED' : 'OPEN';
      task.updatedAt = now;
      notify(s, task.ownerId, d.decision === 'APPROVED' ? 'Your board action completion was approved.' : 'Your board action needs corrections. Open the action tracker for details.', '/resolutions');
      entityId = task.id;
      jurisdiction = board.jurisdiction;
      break;
    }
    case 'privacy': {const d=read(action),r={...stamp(),...d,userId:p.id,status:'RECEIVED'};s.privacyRequests.push(r);entityId=r.id;break;}
    case 'reviewPrivacy': {const d=read(action),r=find(s.privacyRequests,d.id);requireRole(s,p,['PLATFORM_ADMIN'],jurisdiction);r.response=d.response;r.status='RESPONDED';entityId=r.id;notify(s,r.userId,'Your privacy request has a response.','/profile');break;}
    case 'readNotification': {const d=read(action),n=find(s.notifications,d.id);assert(n.userId===p.id,'Notification access denied.','ACCESS_DENIED',403);n.read=true;entityId=n.id;break;}
  }
  appendAudit(s,p,action,entityId,jurisdiction);
  return {id:entityId};
}

export function projectFlags(project: State['projects'][number], finances: State['finances']) {
  const flags: string[]=[];const milestones=project.versions.at(-1)?.milestones ?? [];
  if(!finances.some(f=>f.projectId===project.id))flags.push('Funding source not yet disclosed');
  if(milestones.some(m=>m.dueAt<new Date().toISOString()&&m.verified<100))flags.push('Milestone overdue');
  if(milestones.some(m=>m.reported>m.verified))flags.push('Reported progress awaits verification');
  if(!project.inspections.length)flags.push('Inspection evidence pending');
  if(project.status==='COMPLETION_REPORTED'&&!project.completion)flags.push('Completion claim awaits verification');
  return flags;
}

function mediaReady(file:State['evidence'][number]){
  return ['image/png','image/jpeg','video/mp4'].includes(file.mime)&&file.uploadStatus==='STORED'&&file.scanStatus==='CLEAN'&&file.scannedSha256===file.sha256;
}

export function isPublicProjectMedia(s:State,file:State['evidence'][number]){
  return file.targetType==='PROJECT'&&!!file.publicCaption&&mediaReady(file)
    &&s.projects.some(project=>project.id===file.targetId&&project.publication==='PUBLIC');
}

export function workspace(s: State,p: Principal|null,mode: 'synthetic'|'appwrite'): Workspace {
  const me=p?s.users.find(u=>u.id===p.id)??null:null;
  const boardAccess=(boardId:string)=>{const b=boardFor(s,boardId);return has(s,p,monitors,b.jurisdiction,b.id);};
  const cases=s.cases.filter(c=>canReadCase(s,p,c)).map(c=>({...c,events:c.events.filter(e=>!e.internal||c.reporterId!==p?.id)}));
  const boards=s.boards.filter(b=>['ACTIVE','SUSPENDED','ARCHIVED'].includes(b.status)||has(s,p,coords,b.jurisdiction));
  const projects=s.projects.filter(project=>project.publication==='PUBLIC'||projectAccess(s,p,project));
  // Public projections deliberately exclude notes, source URLs, internal inspections and amendment actors.
  const safeProjects=projects.map(project=>projectAccess(s,p,project)&&!restricted(s,p?.id??'',project.id)?project:{...project,source:'Source retained for authorized review',stageHistory:[],inspections:[],versions:project.versions.map(v=>({...v,actorId:'',reason:'Published baseline',milestones:v.milestones.map(m=>({...m,evidence:''}))})),completion:project.completion?{...project.completion,evidence:'',reviewerId:''}:undefined});
  const meetings=s.meetings.filter(m=>m.visibility==='PUBLIC'||boardAccess(m.boardId)).map(m=>boardAccess(m.boardId)?m:{...m,attendance:[],motions:[],minutes:[],amendments:undefined});
  const resolutions=s.resolutions.filter(r=>r.publication==='PUBLIC'||boardAccess(r.boardId)).map(r=>boardAccess(r.boardId)?r:{...r,amendments:r.amendments?.filter(a=>a.decision?.approved).map(a=>({...a,reason:'',proposedBy:'',decision:a.decision?{...a.decision,by:'',reason:''}:undefined}))});
  const country=s.geos.find(g=>g.type==='COUNTRY')?.id??'';
  const admin=has(s,p,['PLATFORM_ADMIN'],country);
  const peerIds=new Set(s.appointments.filter(a=>boards.some(b=>b.id===a.boardId)&&boardAccess(a.boardId)).map(a=>a.userId));
  for(const residency of s.residencies)if(has(s,p,coords,residency.jurisdiction))peerIds.add(residency.userId);
  const users=s.users.filter(u=>u.id===p?.id||peerIds.has(u.id)||(mode==='synthetic'&&p)).map(u=>u.id===p?.id?u:{...u,email:'',tours:undefined,grants:u.grants.filter(g=>has(s,p,[...coords,'ETHICS_REVIEWER'],g.jurisdiction))});
  const scoped=(jurisdiction:string)=>has(s,p,[...coords,'ETHICS_REVIEWER'],jurisdiction);
  return {
    projectMedia:s.evidence.filter(file=>isPublicProjectMedia(s,file)).map(file=>({id:file.id,projectId:file.targetId,mime:file.mime,caption:file.publicCaption!})),
    reviewTaskIds:s.tasks.filter(t=>t.status==='REVIEW_PENDING'&&t.evidence.trim()&&canReviewTask(s,p,t)).map(t=>t.id),
    agencies:s.agencies.filter(a=>has(s,p,coords,a.jurisdiction)||recipientAccess(s,p,a)
      || (!!a.verifiedBy&&!a.revokedAt&&cases.some(c=>p?.id!==c.reporterId&&inScope(s,a.jurisdiction,c.jurisdiction))))
      .map(a=>has(s,p,coords,a.jurisdiction)?a:{...a,authority:'',proposedBy:'',verifiedBy:undefined,revocationReason:undefined,recipientId:p?.id===a.recipientId?a.recipientId:''}),
    referrals:s.referrals.filter(r=>{
      const c=find(s.cases,r.caseId),agency=find(s.agencies,r.agencyId);
      return (p?.id!==c.reporterId&&canReadCase(s,p,c))||(r.recipientId===p?.id&&recipientAccess(s,p,agency,c.jurisdiction)&&!restricted(s,p.id,c.id));
    }).map(r=>cases.some(c=>c.id===r.caseId)?r:{...r,caseId:'',recordedBy:'',responses:r.responses?.map(response=>({...response,followUps:undefined}))}),
    me,mode,testingMode:config.CBS_TESTING_MODE,boardTypes:BOARD_TYPES,demoProfiles:mode==='synthetic'?s.users.filter(u=>u.synthetic).map(u=>({id:u.id,name:u.name,role:u.grants[0]?.role??'RESIDENT'})):[],
    users,geos:s.geos,residencies:s.residencies.filter(r=>r.userId===p?.id||scoped(r.jurisdiction)),boards,
    evidence:s.evidence.filter(e=>canUseEvidenceTarget(s,p,e.targetType,e.targetId)),actionItems:actionItems(s,p),
    nominations:s.nominations.filter(n=>n.candidateId===p?.id||n.nominatorId===p?.id||scoped(boardFor(s,n.boardId).jurisdiction)),
    appointments:s.appointments.filter(a=>a.userId===p?.id||boardAccess(a.boardId)||scoped(boardFor(s,a.boardId).jurisdiction)),
    conflicts:s.conflicts.filter(c=>c.userId===p?.id||has(s,p,['ETHICS_REVIEWER'],boardFor(s,c.boardId).jurisdiction)),cases,projects:safeProjects,
    finances:s.finances.filter(f=>projects.some(pr=>pr.id===f.projectId)&&(f.verification==='VERIFIED'||projectAccess(s,p,find(s.projects,f.projectId)))).map(f=>projectAccess(s,p,find(s.projects,f.projectId))&&!restricted(s,p?.id??'',f.projectId)?f:{...f,evidence:'',source:'Published disclosure',recordedBy:'',reviewedBy:undefined,authorityAcknowledgedBy:undefined,boardAcknowledgedBy:undefined}),
    meetings,resolutions,tasks:s.tasks.filter(t=>boardAccess(t.boardId)),privacyRequests:s.privacyRequests.filter(r=>r.userId===p?.id||admin),notifications:s.notifications.filter(n=>n.userId===p?.id),
    audits:s.audits.filter(a=>has(s,p,['AUDITOR'],a.jurisdiction)).map(a=>({...a,snapshot:undefined})),
    counts:{cases:cases.length,openCases:cases.filter(c=>!['CLOSED','REJECTED_WITH_REASONS','DUPLICATE_LINKED'].includes(c.status)).length,projects:projects.length,boards:boards.filter(b=>b.status==='ACTIVE').length,resolutions:resolutions.length,meetings:meetings.length},
  };
}
