import { useState } from 'react';
import type { Amendment } from '../../shared/model';
import { Badge, Empty, Panel, formatDate } from '../components';
import { field, opts, select, useCBS } from '../context';
import { Heading } from './Cases';
import { TaskCompletion } from './TaskCompletion';

export function ReviewInbox() {
  const {w,geoName}=useCBS();
  const [board,setBoard]=useState('');
  const [age,setAge]=useState('');
  const tasks=w.tasks.filter(task=>w.reviewTaskIds.includes(task.id));
  const submitted=(task:typeof tasks[number])=>task.completionHistory?.at(-1)?.at??task.updatedAt;
  const cutoff=Date.now()-Number(age)*86400000;
  const visible=tasks.filter(task=>(!board||task.boardId===board)&&(!age||Date.parse(submitted(task))<=cutoff))
    .sort((a,b)=>submitted(a).localeCompare(submitted(b)));
  return <>
    <Heading title="Board review inbox" description="Review completion evidence for tasks in your current board scope."/>
    <div className="filter-bar">
      <select aria-label="Board" value={board} onChange={event=>setBoard(event.target.value)}>
        <option value="">All boards</option>
        {w.boards.filter(item=>tasks.some(task=>task.boardId===item.id)).map(item=><option key={item.id} value={item.id}>{item.name} · {geoName(item.jurisdiction)}</option>)}
      </select>
      <select aria-label="Submission age" value={age} onChange={event=>setAge(event.target.value)}>
        <option value="">Any age</option><option value="3">At least 3 days old</option><option value="7">At least 7 days old</option><option value="30">At least 30 days old</option>
      </select>
    </div>
    <p className="muted">Eligible coordinators receive an in-app reminder after three days.</p>
    <Panel title="Awaiting independent review">
      {visible.length?visible.map(task=><article className="record-block" key={task.id}>
        <h3>{task.title}</h3><small>{w.boards.find(item=>item.id===task.boardId)?.name} · Submitted {formatDate(submitted(task))}</small>
        <TaskCompletion task={task}/>
      </article>):<Empty title="No submissions match these filters"/>}
    </Panel>
  </>;
}

export function Amendments({id,target,items=[],original,canPropose}:{id:string;target:'MINUTES'|'RESOLUTION';items?:Amendment[];original:string;canPropose:boolean}) {
  const {w,officer,roles,form}=useCBS();
  const reviewer=roles.includes('BOARD_CHAIR')||roles.includes('LGA_COORDINATOR');
  if (!items.length && (!officer || !canPropose)) return null;
  return <section className="record-block" aria-label="Formal amendments">
    <h3>Formal amendments</h3>
    {items.map((item,index)=><article className="record-block" key={item.id}>
      <div className="spread"><strong>Amendment {index+1}</strong><Badge>{item.decision?(item.decision.approved?'APPROVED':'REJECTED'):'PENDING'}</Badge></div>
      <div className="board-activity"><div><h4>Original record</h4><p className="body-copy">{original}</p></div><div><h4>Amendment text</h4><p className="body-copy">{item.text}</p></div></div>
      {item.reason&&<p>Proposal reason. {item.reason}</p>}
      {item.decision&&<p>Decided {formatDate(item.decision.at)}{item.decision.reason&&` · ${item.decision.reason}`}</p>}
      {!item.decision&&reviewer&&item.proposedBy!==w.me?.id&&<button className="button secondary" onClick={()=>form('Decide amendment','decideAmendment',{id,target,amendmentId:item.id},[
        select('approved','Decision',[{value:'true',label:'Approve correction'},{value:'false',label:'Reject correction'}]),
        field('reason','Decision reason','textarea'),
      ],item.text,data=>({...data,approved:data.approved==='true'}))}>Decide amendment</button>}
    </article>)}
    {officer&&canPropose&&!items.some(item=>!item.decision)&&<button className="button secondary" onClick={()=>form('Propose formal amendment','proposeAmendment',{id,target},[
      field('text','Correction or supplement','textarea'),field('reason','Reason for the amendment','textarea'),
    ],'Approved amendments are appended to the original record.')}>Propose amendment</button>}
  </section>;
}

export function Referrals() {
  const {w,coordinator,form,run,geoName}=useCBS();
  const cases=w.cases.filter(item=>item.reporterId!==w.me?.id&&['ACCEPTED','ASSIGNED','IN_PROGRESS','REFERRED'].includes(item.status));
  const agencies=w.agencies.filter(item=>!item.revokedAt&&(item.verifiedBy||!item.proposedBy)&&item.recipientId!==w.me?.id);
  return <>
    <Heading title="Agency referrals" description="Record an authorized handoff and track the designated recipient’s acknowledgement."/>
    {coordinator&&<Panel title="Agency register" aside={<button className="button secondary" onClick={()=>form('Register an agency','registerAgency',{},[
      field('name','Organization name'),
      select('jurisdiction','Jurisdiction',opts(w.geos.filter(geo=>['LGA','WARD','COMMUNITY'].includes(geo.type)))),
      field('recipientId','Existing agency officer account ID'),
      field('authority','Authorization or verification reference'),
    ])}>Register agency</button>}>
      {w.agencies.filter(item=>item.proposedBy).map(item=><article className="record-block" key={item.id}>
        <div className="spread"><strong>{item.name}</strong><Badge>{item.revokedAt?'REVOKED':item.verifiedBy?'VERIFIED':'PENDING'}</Badge></div>
        <p>{geoName(item.jurisdiction)} · {item.authority}</p>
        {item.revocationReason&&<p>{item.revocationReason}</p>}
        <div className="action-row">
          {!item.revokedAt&&!item.verifiedBy&&item.proposedBy!==w.me?.id&&item.recipientId!==w.me?.id&&<button className="button secondary" onClick={()=>run('verifyAgency',{id:item.id})}>Verify agency</button>}
          {!item.revokedAt&&<button className="button secondary" onClick={()=>form('Revoke agency access','revokeAgency',{id:item.id},[field('reason','Revocation reason','textarea')])}>Revoke access</button>}
        </div>
      </article>)}
    </Panel>}
    <Panel title="Referral records" aside={cases.length>0&&agencies.length>0&&<button className="button secondary" onClick={()=>form('Record agency referral','recordReferral',{},[
      select('caseId','Case',cases.map(item=>({value:item.id,label:item.reference+' · '+item.title}))),
      select('agencyId','Verified agency',agencies.map(item=>({value:item.id,label:item.name+' · '+geoName(item.jurisdiction)}))),
      field('summary','Minimum information authorized for sharing','textarea'),
    ],'The designated recipient can read this summary. Include only information authorized for the handoff.')}>Record referral</button>}>
      {w.referrals.length?w.referrals.map(item=><article className="record-block" key={item.id}>
        <div className="spread"><strong>{w.agencies.find(agency=>agency.id===item.agencyId)?.name??'Agency referral'}</strong><Badge>{item.acknowledgement?'ACKNOWLEDGED':'AWAITING RECEIPT'}</Badge></div>
        <p className="body-copy">{item.summary}</p>
        {item.caseId&&<a href={`/cases/${item.caseId}`}>Open linked case</a>}
        {item.acknowledgement&&<p>Acknowledged {formatDate(item.acknowledgement.at)} · {item.acknowledgement.reference}</p>}
        {item.responses?.map(response=>{
          const status=response.followUps?.at(-1)?.status;
          return <section className="record-block" key={response.id}>
            <h3>Agency response · {formatDate(response.at)}</h3>
            <p className="body-copy">{response.text}</p>
            {response.followUps?.map((entry,index)=><p key={index}><Badge>{entry.status}</Badge> {entry.note} · {formatDate(entry.at)}</p>)}
            {item.caseId&&item.recipientId!==w.me?.id&&status!=='REVIEWED'&&<button className="button secondary" onClick={()=>form('Record response follow-up','reviewReferralResponse',{id:item.id,responseId:response.id},[
              select('status','Follow-up status',status==='FOLLOW_UP_REQUIRED'?[{value:'REVIEWED',label:'Reviewed'}]:[{value:'REVIEWED',label:'Reviewed'},{value:'FOLLOW_UP_REQUIRED',label:'Follow-up required'}]),
              field('note','Internal handler note','textarea'),
            ])}>Record follow-up</button>}
          </section>;
        })}
        {item.acknowledgement&&item.recipientId===w.me?.id&&<button className="button secondary" onClick={()=>form('Add agency response','respondToReferral',{id:item.id},[field('text','Response for the authorized case handler','textarea')])}>Add response</button>}
        {!item.acknowledgement&&item.recipientId===w.me?.id&&<button className="button secondary" onClick={()=>form('Acknowledge receipt','acknowledgeReferral',{id:item.id},[field('reference','Agency receipt reference')])}>Acknowledge receipt</button>}
      </article>):<Empty title="No referral records available"/>}
    </Panel>
  </>;
}
