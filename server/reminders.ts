import { randomUUID } from 'node:crypto';
import type { ActionItem,Principal,State } from '../shared/model.ts';
import { canReadCase,has,restricted } from './policy.ts';
const terminalCases=new Set(['CLOSED','REJECTED_WITH_REASONS','DUPLICATE_LINKED']);
export const reviewEscalationDays=3;
export function phaseFor(dueAt:string,now=new Date()):ActionItem['phase'] { const remaining=new Date(dueAt).getTime()-now.getTime();return remaining<0?'OVERDUE':remaining<=48*3600000?'DUE_SOON':'UPCOMING'; }
export function actionItems(s:State,p:Principal|null,now=new Date()):ActionItem[]{
  if(!p)return [];
  const result:ActionItem[]=[];
  for(const c of s.cases)if(c.dueAt&&!terminalCases.has(c.status)&&canReadCase(s,p,c)&&c.reporterId!==p.id){
    result.push({id:c.id,type:'CASE',title:c.title,dueAt:c.dueAt,ownerId:c.assigneeId??'',href:`/cases/${c.id}`,phase:phaseFor(c.dueAt,now),status:c.status});
  }
  for(const task of s.tasks){const b=s.boards.find(b=>b.id===task.boardId);if(task.status!=='OPEN'||!b||restricted(s,p.id,task.id))continue;
    if(has(s,p,['LGA_COORDINATOR','BOARD_CHAIR','BOARD_SECRETARY'],b.jurisdiction,b.id)||(task.ownerId===p.id&&has(s,p,['BOARD_MEMBER','BOARD_CHAIR','BOARD_SECRETARY'],b.jurisdiction,b.id)))result.push({id:task.id,type:'TASK',title:task.title,dueAt:task.dueAt,ownerId:task.ownerId,href:'/resolutions',phase:phaseFor(task.dueAt,now),status:task.status});
  }
  return result.sort((a,b)=>new Date(a.dueAt).getTime()-new Date(b.dueAt).getTime());
}
// Called inside the same repository transaction as the notification inserts.
export function produceReminders(s:State,now=new Date()):number {
  let created=0;
  for(const user of s.users){const p={id:user.id,name:user.name,email:user.email,verified:user.verified,mfa:true};
    for(const item of actionItems(s,p,now)){
      if(item.ownerId!==user.id||item.phase==='UPCOMING')continue;
      const sourceKey=`deadline:${item.type}:${item.id}:${item.dueAt}:${item.phase}`;
      if(s.notifications.some(n=>n.userId===user.id&&n.sourceKey===sourceKey))continue;
      const at=now.toISOString();s.notifications.push({id:randomUUID(),createdAt:at,updatedAt:at,userId:user.id,title:`An assigned ${item.type==='CASE'?'case action':'board action'} is ${item.phase==='OVERDUE'?'overdue':'due within 48 hours'}. Sign in to review it.`,href:item.href,read:false,delivery:'IN_APP',sourceKey});created++;
    }
    for(const task of s.tasks){
      if(task.status!=='REVIEW_PENDING'||task.ownerId===user.id||!task.evidence.trim())continue;
      const board=s.boards.find(item=>item.id===task.boardId);
      if(board?.status!=='ACTIVE'||!has(s,p,['LGA_COORDINATOR'],board.jurisdiction,board.id,now.toISOString())
        ||restricted(s,user.id,board.id)||restricted(s,user.id,task.id))continue;
      const submitted=task.completionHistory?.at(-1)?.at??task.updatedAt;
      if(!(now.getTime()-Date.parse(submitted)>=reviewEscalationDays*86400000))continue;
      const sourceKey=`review:${task.id}:${task.completionHistory?.length??0}:${submitted}`;
      if(s.notifications.some(item=>item.userId===user.id&&item.sourceKey===sourceKey))continue;
      const at=now.toISOString();
      s.notifications.push({id:randomUUID(),createdAt:at,updatedAt:at,userId:user.id,title:'A board submission has been awaiting review for at least three days.',href:'/review-inbox',read:false,delivery:'IN_APP',sourceKey});
      created++;
    }
  }
  return created;
}
