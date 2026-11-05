import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { tours } from '../shared/tours.ts';
import { execute,workspace } from '../server/domain.ts';
import { EvidenceService,MAX_EVIDENCE_BYTES,validateFile,type EvidenceStorage,type Scanner } from '../server/evidence.ts';
import { actionItems,phaseFor,produceReminders } from '../server/reminders.ts';
import { SqliteStore } from '../server/store.ts';
import { demoIds as ids,syntheticPrincipal,syntheticSeed } from '../server/seed.ts';
const actor=(key:keyof typeof ids)=>syntheticPrincipal(syntheticSeed().users.find(u=>u.id===ids[key])!);
const pdf=Buffer.from('%PDF-1.7\nSYNTHETIC test document\n%%EOF');
const upload=(targetId=syntheticSeed().cases[0].id)=>({targetType:'CASE' as const,targetId,filename:'synthetic-note.pdf',mime:'application/pdf' as const,contentBase64:pdf.toString('base64'),clientRequestId:randomUUID()});
async function vault(scanner:Scanner){const store=new SqliteStore(':memory:');await store.transaction(s=>Object.assign(s,syntheticSeed()));return {store,service:new EvidenceService(store,undefined,scanner)};}
test('walkthrough progress is per account, resumable, restartable and never changes operational records',()=>{const s=syntheticSeed(),before=JSON.stringify(s.cases);execute(s,actor('resident'),'tourProgress',{tourId:'resident',action:'START'});execute(s,actor('resident'),'tourProgress',{tourId:'resident',action:'NEXT'});assert.equal(s.users.find(u=>u.id===ids.resident)!.tours!.resident!.step,1);assert.equal(s.users.find(u=>u.id===ids.chair)!.tours,undefined);execute(s,actor('resident'),'tourProgress',{tourId:'resident',action:'DISMISS'});execute(s,actor('resident'),'tourProgress',{tourId:'resident',action:'START'});assert.equal(s.users.find(u=>u.id===ids.resident)!.tours!.resident!.step,1);execute(s,actor('resident'),'tourProgress',{tourId:'resident',action:'RESTART'});assert.equal(s.users.find(u=>u.id===ids.resident)!.tours!.resident!.step,0);assert.equal(JSON.stringify(s.cases),before);});
test('tour completion requires the final step and officer journeys require actual scoped access',()=>{const s=syntheticSeed(),p=actor('resident');assert.throws(()=>execute(s,p,'tourProgress',{tourId:'officer',action:'START'}),/officer role/);execute(s,p,'tourProgress',{tourId:'resident',action:'START'});assert.throws(()=>execute(s,p,'tourProgress',{tourId:'resident',action:'COMPLETE'}),/final step/);for(let n=1;n<tours.resident.steps.length;n++)execute(s,p,'tourProgress',{tourId:'resident',action:'NEXT'});execute(s,p,'tourProgress',{tourId:'resident',action:'COMPLETE'});assert.equal(s.users.find(u=>u.id===p.id)!.tours!.resident!.status,'COMPLETED');execute(s,p,'tourProgress',{tourId:'resident',action:'START'});assert.equal(s.users.find(u=>u.id===p.id)!.tours!.resident!.step,0);});
test('starting another tour pauses the previous one',()=>{const s=syntheticSeed(),p=actor('chair');execute(s,p,'tourProgress',{tourId:'resident',action:'START'});execute(s,p,'tourProgress',{tourId:'officer',action:'START'});const progress=s.users.find(u=>u.id===p.id)!.tours!;assert.equal(progress.resident!.status,'DISMISSED');assert.equal(progress.officer!.status,'ACTIVE');});
test('evidence validates exact size, encoding, signature, MIME and filename extension',()=>{const valid=upload();assert.equal(validateFile(valid).bytes.length,pdf.length);assert.throws(()=>validateFile({...valid,filename:'script.html'}),/signature/);assert.throws(()=>validateFile({...valid,mime:'image/png'}),/signature/);assert.throws(()=>validateFile({...valid,contentBase64:'not-base64!'}),/encoding/);assert.throws(()=>validateFile({...valid,contentBase64:Buffer.alloc(MAX_EVIDENCE_BYTES+1).toString('base64')}),/4 MiB/);});
test('unconfigured/unavailable scan keeps evidence quarantined and blocks tokens/downloads',async t=>{const {store,service}=await vault(async()=>({status:'QUARANTINED',engine:'scanner-not-configured'}));t.after(()=>store.close());const record=await service.upload(actor('resident'),upload());assert.equal(record.uploadStatus,'STORED');assert.equal(record.scanStatus,'QUARANTINED');await assert.rejects(service.token(actor('resident'),record.id),/quarantined/);assert.equal((await store.read()).evidence.length,1);});
test('clean evidence has expiring account-bound download tokens and integrity checks',async t=>{const {store,service}=await vault(async()=>({status:'CLEAN',engine:'test-fixture-scanner'}));t.after(()=>store.close());const p=actor('resident'),record=await service.upload(p,upload()),now=Date.now(),token=await service.token(p,record.id,now);const result=await service.download(p,record.id,token.token,now);assert.equal(result.bytes.toString(),pdf.toString());await assert.rejects(service.download(p,record.id,token.token,now+60001),/expired/);await assert.rejects(service.download(actor('chair'),record.id,token.token,now),/different account/);await assert.rejects(service.download(p,record.id,token.token+'tampered',now),/Invalid download/);});
test('evidence upload retry is idempotent and request IDs cannot replace content',async t=>{const {store,service}=await vault(async()=>({status:'CLEAN',engine:'test-fixture-scanner'}));t.after(()=>store.close());const d=upload(),first=await service.upload(actor('resident'),d),second=await service.upload(actor('resident'),d);assert.equal(first.id,second.id);assert.equal((await store.read()).evidence.length,1);await assert.rejects(service.upload(actor('resident'),{...d,filename:'different.pdf'}),/different file/);});
test('private case evidence is inaccessible to a technical administrator or public reader',async t=>{const {store,service}=await vault(async()=>({status:'CLEAN',engine:'test-fixture-scanner'}));t.after(()=>store.close());const record=await service.upload(actor('resident'),upload());await assert.rejects(service.token(actor('admin'),record.id),/outside your permissions/);await assert.rejects(service.upload(actor('admin'),upload()),/cannot attach/);assert.equal(workspace(await store.read(),null,'synthetic').evidence.length,0);assert.equal(workspace(await store.read(),actor('admin'),'synthetic').evidence.length,0);});
test('published project does not expose private evidence or grant residents upload permission',async t=>{const {store,service}=await vault(async()=>({status:'CLEAN',engine:'test-fixture-scanner'}));t.after(()=>store.close());const projectId=(await store.read()).projects[0].id;await service.upload(actor('monitor'),{...upload(),targetType:'PROJECT',targetId:projectId});assert.equal(workspace(await store.read(),actor('resident'),'synthetic').evidence.length,0);await assert.rejects(service.upload(actor('resident'),{...upload(),targetType:'PROJECT',targetId:projectId}),/cannot attach/);});
test('malware rejection is retained and cannot be overridden by retrying a scan',async t=>{const {store,service}=await vault(async()=>({status:'REJECTED',engine:'test-fixture-scanner'}));t.after(()=>store.close());const record=await service.upload(actor('resident'),upload());assert.equal(record.scanStatus,'REJECTED');await assert.rejects(service.token(actor('resident'),record.id),/rejected/);await assert.rejects(service.rescan(actor('resident'),record.id),/Rejected evidence/);});
test('rescanning quarantine can release only scanner-verified content',async t=>{let clean=false;const {store,service}=await vault(async()=>({status:clean?'CLEAN':'QUARANTINED',engine:'test-fixture-scanner'}));t.after(()=>store.close());const record=await service.upload(actor('resident'),upload());clean=true;const updated=await service.rescan(actor('resident'),record.id);assert.equal(updated.scanStatus,'CLEAN');assert.equal(updated.scannedSha256,updated.sha256);});
test('download rechecks permissions after appointment revocation',async t=>{const {store,service}=await vault(async()=>({status:'CLEAN',engine:'test-fixture-scanner'}));t.after(()=>store.close());const projectId=(await store.read()).projects[0].id,p=actor('monitor'),record=await service.upload(p,{...upload(),targetType:'PROJECT',targetId:projectId}),token=await service.token(p,record.id);await store.transaction(s=>{s.appointments.find(a=>a.userId===p.id)!.status='REVOKED';});await assert.rejects(service.download(p,record.id,token.token),/outside your permissions/);});
test('stored byte tampering prevents clean evidence download',async t=>{const {store,service}=await vault(async()=>({status:'CLEAN',engine:'test-fixture-scanner'}));t.after(()=>store.close());const p=actor('resident'),record=await service.upload(p,upload()),token=await service.token(p,record.id);store.db.prepare('UPDATE evidence_blobs SET content=? WHERE id=?').run(Buffer.from('altered bytes'),record.id);await assert.rejects(service.download(p,record.id,token.token),/integrity/);});
test('file storage failure remains safely quarantined and is retryable',async t=>{const store=new SqliteStore(':memory:');t.after(()=>store.close());await store.transaction(s=>Object.assign(s,syntheticSeed()));let failed=true;const map=new Map<string,Buffer>();const storage:EvidenceStorage={async put(id,bytes){if(failed)throw new Error('Storage failed');map.set(id,bytes);},async get(id){return map.get(id)!;}};const service=new EvidenceService(store,storage,async()=>({status:'CLEAN',engine:'test-fixture-scanner'})),d=upload();await assert.rejects(service.upload(actor('resident'),d),/Storage failed/);assert.equal((await store.read()).evidence[0].uploadStatus,'FAILED');failed=false;await service.upload(actor('resident'),d);assert.equal((await store.read()).evidence[0].uploadStatus,'STORED');});
test('only authorized independent handlers can assign future case deadlines',()=>{const s=syntheticSeed(),id=s.cases[0].id,dueAt=new Date(Date.now()+86400000).toISOString();assert.throws(()=>execute(s,actor('resident'),'caseDeadline',{id,dueAt,reason:'Resident tries to set an officer deadline.'}));execute(s,actor('coordinator'),'caseDeadline',{id,dueAt,reason:'Assessment visit is due within this recorded timeframe.'});assert.equal(s.cases[0].dueAt,dueAt);assert.throws(()=>execute(s,actor('coordinator'),'caseDeadline',{id,dueAt:'2020-01-01T00:00:00.000Z',reason:'Past deadline should fail.'}),/future/);});
test('deadline phases have a precise 48-hour boundary',()=>{const now=new Date('2026-11-03T10:00:00.000Z');assert.equal(phaseFor('2026-11-03T09:59:59.000Z',now),'OVERDUE');assert.equal(phaseFor('2026-11-05T10:00:00.000Z',now),'DUE_SOON');assert.equal(phaseFor('2026-11-05T10:00:01.000Z',now),'UPCOMING');});
test('reminders are private, deduplicated per deadline phase, and skip closed cases',()=>{const s=syntheticSeed(),now=new Date(),c=s.cases[0];c.dueAt=new Date(now.getTime()+3600000).toISOString();const before=s.notifications.length;assert.equal(produceReminders(s,now),1);assert.equal(produceReminders(s,now),0);const reminder=s.notifications.at(-1)!;assert.equal(reminder.userId,ids.monitor);assert(!reminder.title.includes(c.title));assert.equal(s.notifications.length,before+1);assert.equal(produceReminders(s,new Date(now.getTime()+7200000)),1);assert.equal(produceReminders(s,new Date(now.getTime()+7200000)),0);c.status='CLOSED';assert.equal(actionItems(s,actor('monitor'),now).length,0);assert.equal(actionItems(s,actor('resident'),now).length,0);});
test('rescheduling creates a new reminder identity and expired members stop receiving task notices',()=>{const s=syntheticSeed(),now=new Date(),at=now.toISOString();s.tasks.push({id:randomUUID(),createdAt:at,updatedAt:at,boardId:ids.board,title:'Synthetic inspection follow-up',ownerId:ids.monitor,dueAt:new Date(now.getTime()+3600000).toISOString(),status:'OPEN',evidence:''});assert.equal(produceReminders(s,now),1);execute(s,actor('secretary'),'taskDeadline',{id:s.tasks[0].id,dueAt:new Date(now.getTime()+7200000).toISOString(),reason:'Responsible officer recorded a revised appointment.'});assert.equal(produceReminders(s,now),1);s.appointments.find(a=>a.userId===ids.monitor)!.status='REVOKED';s.tasks[0].dueAt=new Date(now.getTime()-1000).toISOString();assert.equal(produceReminders(s,now),0);});
test('tasks submitted for completion review are excluded from owner reminders',()=>{const s=syntheticSeed(),at=new Date().toISOString();s.tasks.push({id:randomUUID(),createdAt:at,updatedAt:at,boardId:ids.board,title:'Synthetic already submitted action',ownerId:ids.monitor,dueAt:at,status:'REVIEW_PENDING',evidence:'Synthetic submission evidence'});assert.equal(actionItems(s,actor('monitor')).length,0);assert.equal(produceReminders(s),0);});
test('maximum-sized valid evidence does not exhaust the validation stack',()=>{const bytes=Buffer.alloc(MAX_EVIDENCE_BYTES);pdf.copy(bytes);assert.equal(validateFile({...upload(),contentBase64:bytes.toString('base64')}).bytes.length,MAX_EVIDENCE_BYTES);});
test('auditors can read project evidence but cannot upload new project content',async t=>{const {store,service}=await vault(async()=>({status:'CLEAN',engine:'test-fixture-scanner'}));t.after(()=>store.close());const targetId=(await store.read()).projects[0].id,record=await service.upload(actor('monitor'),{...upload(),targetType:'PROJECT',targetId});await assert.doesNotReject(service.token(actor('auditor'),record.id));await assert.rejects(service.upload(actor('auditor'),{...upload(),targetType:'PROJECT',targetId}),/cannot attach/);});

test('completion review preserves corrections and rejects stale decisions and self-approval', () => {
  const state = syntheticSeed();
  const at = new Date().toISOString();
  const id = randomUUID();
  state.tasks.push({ id, createdAt: at, updatedAt: at, boardId: ids.board, ownerId: ids.secretary, title: 'Synthetic board action', dueAt: at, status: 'OPEN', evidence: '' });
  const submit = (evidence: string) => execute(state, actor('secretary'), 'completeTask', { id, evidence });
  const approval = { id, revision: 1, decision: 'APPROVED', reason: 'The revised work is independently verified.' };
  submit('Initial synthetic evidence.');
  assert.throws(() => submit('Attempt to overwrite pending evidence.'), /Only open tasks/);
  assert.throws(() => execute(state, actor('secretary'), 'reviewTaskCompletion', approval), /cannot review their own/);
  execute(state, actor('chair'), 'reviewTaskCompletion', { ...approval, decision: 'CORRECTIONS_REQUESTED', reason: 'Include the dated inspection record.' });
  assert.equal(state.tasks[0].status, 'OPEN');
  submit('Corrected synthetic evidence with inspection date.');
  assert.throws(() => execute(state, actor('chair'), 'reviewTaskCompletion', approval), /submission changed/);
  execute(state, actor('chair'), 'reviewTaskCompletion', { ...approval, revision: 3 });
  assert.equal(state.tasks[0].status, 'COMPLETED');
  assert.deepEqual(state.tasks[0].completionHistory?.map(event => event.kind), ['SUBMITTED', 'CORRECTIONS_REQUESTED', 'SUBMITTED', 'APPROVED']);
  assert.equal(state.notifications.at(-1)?.userId, ids.secretary);
  assert.equal(actionItems(state, actor('secretary')).length, 0);
  assert.throws(() => submit('Attempt to replace approved evidence.'), /Only open tasks/);
});

test('existing pending evidence can be reviewed without fabricating a submission timestamp', () => {
  const state = syntheticSeed();
  const at = new Date().toISOString();
  const id = randomUUID();
  state.tasks.push({ id, createdAt: at, updatedAt: at, boardId: ids.board, ownerId: ids.monitor, title: 'Legacy board action', dueAt: at, status: 'REVIEW_PENDING', evidence: 'Existing synthetic evidence.' });
  const approval = { id, revision: 0, decision: 'APPROVED', reason: 'Existing evidence was independently verified.' };
  assert.throws(() => execute(state, actor('resident'), 'reviewTaskCompletion', approval), /permission/);
  execute(state, actor('chair'), 'reviewTaskCompletion', approval);
  assert.equal(state.tasks[0].status, 'COMPLETED');
  const original = state.tasks[0].completionHistory?.[0];
  assert.ok(original?.kind === 'SUBMITTED' && original.legacy && original.evidence === 'Existing synthetic evidence.');
});

test('review inbox omits owners, residents, and recused reviewers',()=>{
  const state=syntheticSeed();
  const task={id:randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),boardId:ids.board,title:'Review this submission',ownerId:ids.chair,dueAt:new Date().toISOString(),status:'REVIEW_PENDING',evidence:'Synthetic evidence for independent review'};
  state.tasks.push(task);
  assert.deepEqual(workspace(state,actor('secretary'),'synthetic').reviewTaskIds,[task.id]);
  assert.deepEqual(workspace(state,actor('chair'),'synthetic').reviewTaskIds,[]);
  assert.deepEqual(workspace(state,actor('resident'),'synthetic').reviewTaskIds,[]);
  state.conflicts.push({id:randomUUID(),createdAt:task.createdAt,updatedAt:task.updatedAt,userId:ids.secretary,boardId:ids.board,matterId:task.id,description:'Conflict with task owner',status:'RESTRICTED'});
  assert.deepEqual(workspace(state,actor('secretary'),'synthetic').reviewTaskIds,[]);
});

test('formal amendments preserve source text and only publish approved resolution corrections',()=>{
  const state=syntheticSeed(),meeting=state.meetings[0];
  meeting.minutes.push({version:1,text:'Original approved minutes',submittedBy:ids.secretary,status:'APPROVED',approvedBy:ids.chair});
  const resolution={
    id:randomUUID(),createdAt:meeting.createdAt,updatedAt:meeting.updatedAt,boardId:meeting.boardId,meetingId:meeting.id,motionId:randomUUID(),
    reference:'TEST-RES',title:'Test resolution',text:'Original resolution text',publication:'PUBLIC' as const,adoptedAt:meeting.createdAt,
    result:{eligible:3,present:3,yes:3,no:0,abstain:0,required:2,adopted:true,charterVersion:'1',at:meeting.createdAt},
  };
  state.resolutions.push(resolution);
  for(const [target,id] of [['MINUTES',meeting.id],['RESOLUTION',resolution.id]] as const){
    const proposal={id,target,text:'A formal correction to the original wording.',reason:'Correct the recorded location.'};
    execute(state,actor('coordinator'),'proposeAmendment',proposal);
    const record=target==='MINUTES'?meeting:state.resolutions[0];
    const decision={id,target,amendmentId:record.amendments![0].id,approved:true,reason:'Verified the signed source record.'};
    assert.throws(()=>execute(state,actor('coordinator'),'decideAmendment',decision),/independent/);
    if(target==='RESOLUTION')assert.deepEqual(workspace(state,null,'synthetic').resolutions[0].amendments,[]);
    execute(state,actor('approver'),'decideAmendment',decision);
    assert.throws(()=>execute(state,actor('approver'),'decideAmendment',decision),/already been decided/);
  }
  const publicView=workspace(state,null,'synthetic');
  assert.equal(publicView.meetings[0].amendments,undefined);
  assert.equal(meeting.minutes[0].text,'Original approved minutes');
  assert.equal(publicView.resolutions[0].text,'Original resolution text');
  assert.equal(publicView.resolutions[0].amendments?.[0].text,'A formal correction to the original wording.');
});

test('agency verification and acknowledgement are independent and referral scope excludes the case file',()=>{
  const state=syntheticSeed(),c=state.cases[0];
  const recipient=syntheticPrincipal(state.users.find(user=>user.id===state.agencies[0].recipientId)!);
  const {id:agencyId}=execute(state,actor('coordinator'),'registerAgency',{
    name:'Test agency',jurisdiction:ids.ward,recipientId:recipient.id,authority:'Synthetic authorization reference',
  });
  const draft={caseId:c.id,agencyId,summary:'Inspect the water point and confirm receipt.'};
  assert.throws(()=>execute(state,actor('coordinator'),'recordReferral',draft),/active verified agency/);
  assert.throws(()=>execute(state,actor('coordinator'),'verifyAgency',{id:agencyId}),/Independent/);
  execute(state,actor('approver'),'verifyAgency',{id:agencyId});
  const {id}=execute(state,actor('coordinator'),'recordReferral',draft);
  assert.throws(()=>execute(state,actor('coordinator'),'recordReferral',draft),/already recorded/);
  const view=workspace(state,recipient,'synthetic');
  assert.equal(view.cases.length,0);
  assert.equal(view.referrals[0].caseId,'');
  assert.equal(workspace(state,actor('resident'),'synthetic').referrals.length,0);
  assert.throws(()=>execute(state,actor('approver'),'acknowledgeReferral',{id,reference:'RECEIPT-1'}),/designated/);
  const response={id,text:'The agency scheduled a site assessment.'};
  assert.throws(()=>execute(state,recipient,'respondToReferral',response),/Acknowledge receipt/);
  execute(state,recipient,'acknowledgeReferral',{id,reference:'RECEIPT-1'});
  assert.equal(state.referrals[0].acknowledgement?.by,recipient.id);
  assert.throws(()=>execute(state,actor('approver'),'respondToReferral',response),/designated/);
  execute(state,recipient,'respondToReferral',response);
  const responseId=state.referrals[0].responses![0].id;
  execute(state,actor('coordinator'),'reviewReferralResponse',{id,responseId,status:'FOLLOW_UP_REQUIRED',note:'Internal check on next steps.'});
  execute(state,actor('coordinator'),'reviewReferralResponse',{id,responseId,status:'REVIEWED',note:'The handler confirmed the next steps.'});
  assert.equal(workspace(state,actor('coordinator'),'synthetic').referrals[0].responses![0].followUps?.length,2);
  assert.equal(workspace(state,recipient,'synthetic').referrals[0].responses![0].followUps,undefined);
  execute(state,actor('approver'),'revokeAgency',{id:agencyId,reason:'The authorization expired.'});
  assert.equal(workspace(state,recipient,'synthetic').referrals.length,0);
});

test('review escalation alerts only eligible coordinators once per submission',()=>{
  const state=syntheticSeed(),at='2026-11-05T12:00:00.000Z';
  const task={id:randomUUID(),createdAt:at,updatedAt:at,boardId:ids.board,title:'Private pending task',ownerId:ids.coordinator,dueAt:at,status:'REVIEW_PENDING',evidence:'Private submission evidence'};
  state.tasks.push(task);
  assert.equal(produceReminders(state,new Date('2026-11-08T11:59:59.999Z')),0);
  assert.equal(produceReminders(state,new Date('2026-11-08T12:00:00.000Z')),1);
  const alert=state.notifications.at(-1)!;
  assert.equal(alert.userId,ids.approver);
  assert.equal(alert.href,'/review-inbox');
  assert(!alert.title.includes(task.title));
  assert.equal(produceReminders(state,new Date('2026-11-09T12:00:00.000Z')),0);
  task.updatedAt='2026-11-09T12:00:00.000Z';
  assert.equal(produceReminders(state,new Date('2026-11-12T12:00:00.000Z')),1);
});

test('public progress clips require independent release and become inaccessible after withdrawal',async t=>{
  const {store,service}=await vault(async()=>({status:'CLEAN',engine:'test-fixture-scanner'}));
  t.after(()=>store.close());
  const state=await store.read();
  const project=state.projects[0],c=state.cases[0];
  const mp4=Buffer.from('00000018667479706d703432000000006d70343269736f6d','hex');
  const clip={filename:'progress.mp4',mime:'video/mp4' as const,contentBase64:mp4.toString('base64')};
  const privateFile=await service.upload(actor('resident'),{...clip,targetType:'CASE',targetId:c.id,clientRequestId:randomUUID()});
  const publicFile=await service.upload(actor('secretary'),{...clip,targetType:'PROJECT',targetId:project.id,clientRequestId:randomUUID()});
  const release={id:publicFile.id,caption:'Water point progress clip'};
  await assert.rejects(service.publicMedia(publicFile.id),/not found/i);
  await assert.rejects(store.transaction(s=>execute(s,actor('coordinator'),'setProjectMedia',{...release,id:privateFile.id})),/private/);
  await assert.rejects(store.transaction(s=>execute(s,actor('secretary'),'setProjectMedia',release)),/different/);
  await store.transaction(s=>execute(s,actor('coordinator'),'setProjectMedia',release));
  assert.deepEqual((await service.publicMedia(publicFile.id)).bytes,mp4);
  const view=workspace(await store.read(),null,'synthetic');
  assert.deepEqual(view.projectMedia,[{id:publicFile.id,projectId:project.id,mime:clip.mime,caption:release.caption}]);
  assert.equal(view.evidence.length,0);
  await store.transaction(s=>execute(s,actor('coordinator'),'setProjectMedia',{id:publicFile.id}));
  await assert.rejects(service.publicMedia(publicFile.id),/not found/i);
});
