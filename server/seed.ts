import { createHash } from 'node:crypto';
import { BOARD_TYPES, emptyState, type Board, type Grant, type State, type User } from '../shared/model.ts';
import { appendAudit } from './domain.ts';

export function fixedId(name: string) { const h=createHash('sha256').update(`cbs:${name}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`; }
const at='2026-11-01T08:00:00.000Z';
const base=(key:string,synthetic=true)=>({id:fixedId(key),createdAt:at,updatedAt:at,synthetic});
export const demoIds={community:fixedId('demo-community'),ward:fixedId('demo-ward'),lga:fixedId('demo-lga'),board:fixedId('demo-board-INF'),resident:fixedId('resident'),coordinator:fixedId('coordinator'),approver:fixedId('approver'),chair:fixedId('chair'),secretary:fixedId('secretary'),monitor:fixedId('monitor'),ethics:fixedId('ethics'),auditor:fixedId('auditor'),admin:fixedId('admin')};
// Maintained name reference, not a claim to imported ward/LGA boundaries or official codes.
export const zoneStates: Record<string,string[]>={
  'North Central':['Benue','Kogi','Kwara','Nasarawa','Niger','Plateau','Federal Capital Territory'],
  'North East':['Adamawa','Bauchi','Borno','Gombe','Taraba','Yobe'],
  'North West':['Jigawa','Kaduna','Kano','Katsina','Kebbi','Sokoto','Zamfara'],
  'South East':['Abia','Anambra','Ebonyi','Enugu','Imo'],
  'South South':['Akwa Ibom','Bayelsa','Cross River','Delta','Edo','Rivers'],
  'South West':['Ekiti','Lagos','Ogun','Ondo','Osun','Oyo'],
};
export function referenceSeed(): State {
  const s=emptyState();s.geos.push({...base('nigeria',false),name:'Nigeria',type:'COUNTRY',parentId:null,source:'Maintained CBS state-name reference; no official administrative codes',version:'2026-11-03'});
  for(const [zone,states] of Object.entries(zoneStates)){
    const z={...base(zone,false),name:zone,type:'ZONE' as const,parentId:fixedId('nigeria'),source:'Maintained CBS reference',version:'2026-11-03'};s.geos.push(z);
    for(const name of states)s.geos.push({...base(`state-${name}`,false),name,type:'STATE',parentId:z.id,source:'Maintained CBS reference; boundaries not imported',version:'2026-11-03'});
  }
  return s;
}
export function syntheticSeed(): State {
  const s=referenceSeed();
  s.geos.push({...base('demo-state'),name:'SYNTHETIC Pilot State',type:'STATE',parentId:fixedId('nigeria'),source:'SYNTHETIC test fixture',version:'1'},
    {...base('demo-lga'),name:'SYNTHETIC Unity LGA',type:'LGA',parentId:fixedId('demo-state'),source:'SYNTHETIC test fixture',version:'1'},
    {...base('demo-ward'),name:'SYNTHETIC Ward 01',type:'WARD',parentId:demoIds.lga,source:'SYNTHETIC test fixture',version:'1'},
    {...base('demo-community'),name:'SYNTHETIC Greenfield Community',type:'COMMUNITY',parentId:demoIds.ward,source:'SYNTHETIC test fixture',version:'1'});
  const grant=(role:Grant['role'],jurisdiction=demoIds.lga,boardId?:string):Grant=>({role,jurisdiction,boardId,startsAt:at,endsAt:'2035-01-01T00:00:00.000Z'});
  const profiles: {key:keyof typeof demoIds;name:string;grants:Grant[]}[]=[
    {key:'resident',name:'Ada Okafor',grants:[grant('RESIDENT',demoIds.community)]},
    {key:'coordinator',name:'Chidi Bello',grants:[grant('LGA_COORDINATOR')]},
    {key:'approver',name:'Fatima Musa',grants:[grant('LGA_COORDINATOR')]},
    {key:'chair',name:'Amara Eze',grants:[grant('BOARD_CHAIR',demoIds.ward,demoIds.board)]},
    {key:'secretary',name:'Tunde Adeyemi',grants:[grant('BOARD_SECRETARY',demoIds.ward,demoIds.board)]},
    {key:'monitor',name:'Zainab Ibrahim',grants:[grant('BOARD_MEMBER',demoIds.ward,demoIds.board)]},
    {key:'ethics',name:'Emeka Obi',grants:[grant('ETHICS_REVIEWER')]},
    {key:'auditor',name:'Amina Yusuf',grants:[grant('AUDITOR')]},
    {key:'admin',name:'Technical administrator',grants:[grant('PLATFORM_ADMIN',fixedId('nigeria'))]},
  ];
  for(const u of profiles){s.users.push({...base(u.key),name:u.name,email:`${u.key}@synthetic.invalid`,grants:u.grants,verified:true});s.residencies.push({...base(`residency-${u.key}`),userId:demoIds[u.key],jurisdiction:demoIds.community,method:'COMMUNITY_ATTESTATION',statement:'SYNTHETIC residency attestation for local testing.',status:'VERIFIED',reviewerId:demoIds.approver});}
  const charter={version:'SYNTHETIC-1',authority:'SYNTHETIC pilot charter — no statutory powers',approved:true,capacity:9,quorumPercent:60,yesPercent:51,termMonths:24};
  const board: Board={...base('demo-board-INF'),code:'INF',jurisdiction:demoIds.ward,name:'Greenfield Infrastructure Board',status:'ACTIVE',authority:charter.authority,charter,submittedBy:demoIds.coordinator,approvedBy:demoIds.approver};s.boards.push(board);
  for(const key of ['chair','secretary','monitor'] as const){const u=s.users.find(u=>u.id===demoIds[key])!;s.appointments.push({...base(`appointment-${key}`),boardId:board.id,userId:u.id,position:u.grants[0].role as 'BOARD_MEMBER'|'BOARD_SECRETARY'|'BOARD_CHAIR',startsAt:at,endsAt:'2035-01-01T00:00:00.000Z',status:'ACTIVE',authority:charter.authority,document:'SYNTHETIC appointment record',nominationId:fixedId(`seed-nomination-${key}`)});}
  s.cases.push({...base('demo-case-water'),reference:'SYNTHETIC-CBS-001',reporterId:demoIds.resident,jurisdiction:demoIds.community,category:'INF',boardCode:'INF',title:'Community water point needs repair',description:'SYNTHETIC: The community water point has been unavailable for several days. Residents request an assessment and a documented repair plan.',location:'SYNTHETIC community water point',urgency:'HIGH',classification:'CONFIDENTIAL',status:'IN_PROGRESS',boardId:board.id,assigneeId:demoIds.monitor,clientRequestId:fixedId('seed-request-water'),events:[{id:fixedId('event-water-1'),at,actorId:demoIds.resident,type:'SUBMITTED',note:'SYNTHETIC report received.',internal:false},{id:fixedId('event-water-2'),at:'2026-11-02T10:00:00.000Z',actorId:demoIds.coordinator,type:'IN_PROGRESS',note:'The board has requested a site assessment. No repair has yet been verified.',internal:false}]});
  s.projects.push({...base('demo-project-water'),reference:'SYNTHETIC-PRJ-001',title:'Greenfield community water scheme',description:'SYNTHETIC demonstration of a water rehabilitation project, including documentary funding disclosure and community monitoring.',jurisdiction:demoIds.community,boardCode:'INF',authority:'SYNTHETIC Community Works Office',source:'SYNTHETIC disclosure document CBS-DEMO-001',fiscalYear:2026,status:'IMPLEMENTATION',publication:'PUBLIC',versions:[{version:1,at,actorId:demoIds.secretary,reason:'SYNTHETIC approved baseline',milestones:[{id:fixedId('milestone-1'),title:'Assessment and site preparation',dueAt:'2026-11-10T00:00:00.000Z',weight:30,acceptance:'Assessment report and site access documented.',reported:100,verified:100,evidence:'SYNTHETIC inspection report'},{id:fixedId('milestone-2'),title:'Rehabilitation and water quality checks',dueAt:'2026-12-15T00:00:00.000Z',weight:70,acceptance:'Functional water point and independent quality assessment.',reported:40,verified:0,evidence:''}]}],inspections:[{...base('demo-inspection'),inspectorId:demoIds.monitor,method:'SITE_VISIT',observedAt:'2026-11-02T09:00:00.000Z',note:'SYNTHETIC: Site preparation observed. Rehabilitation remains in progress.',evidence:'SYNTHETIC inspection evidence CBS-DEMO-002'}]});
  s.finances.push({...base('demo-finance'),projectId:fixedId('demo-project-water'),type:'APPROVED',amount:'45000000.00',currency:'NGN',fiscalYear:2026,source:'SYNTHETIC funding notice',evidence:'SYNTHETIC source document CBS-DEMO-001',recordedBy:demoIds.secretary,verification:'VERIFIED',reviewedBy:demoIds.auditor});
  s.meetings.push({...base('demo-meeting'),boardId:board.id,title:'Infrastructure priorities and water access review',startsAt:'2026-11-02T14:00:00.000Z',timezone:'Africa/Lagos',venue:'SYNTHETIC community meeting room',agenda:'1. Review water-point assessment\n2. Discuss rehabilitation priorities\n3. Assign monitoring responsibilities',visibility:'PUBLIC',status:'SCHEDULED',attendance:[],motions:[],minutes:[],charterSnapshot:charter});
  const resident=s.users.find(u=>u.id===demoIds.resident)!;s.notifications.push({...base('demo-notification'),userId:resident.id,title:'Your water-point report has a progress update.',href:'/cases',read:false,delivery:'IN_APP'});
  appendAudit(s,{id:demoIds.coordinator,name:'SYNTHETIC seed',email:'seed@synthetic.invalid',verified:true,mfa:true},'synthetic.seed','fixture',demoIds.lga);
  addBoardSamples(s);
  return s;
}

const boardScenarios = {
  EDU: ['Safer classrooms before the rainy season', 'Two classrooms have roof leaks that interrupt lessons. The board has recorded the affected rooms and will ask school staff to confirm which repairs should come first.', 'Inspect the classrooms and agree on repair priorities', 'A condition checklist and repair priorities signed off by the school lead'],
  HLT: ['Handwashing stations at the community clinic', 'The clinic entrance lacks a reliable handwashing point. Staff have identified a location near the entrance and will agree who checks water and soap supplies each day.', 'Confirm the location and assign restocking duties', 'A working station with water and soap, plus a signed restocking rota'],
  SEC: ['Public safety reporting awareness session', 'Residents asked how to share safety concerns privately. The board will review a draft guide using fictional examples and check that the public handout contains no identifying details.', 'Review the confidential reporting guide', 'A plain-language handout that explains who can receive sensitive reports'],
  INF: ['Clear drainage near the community footpath', 'Standing water blocks the footpath after rainfall. A walk-through identified blocked drain sections and the board will ask the works team to confirm where clearing can safely begin.', 'Map the obstructions and agree on a clearing schedule', 'A site checklist confirming cleared sections and safe pedestrian access'],
  TRD: ['Fair stall allocation at the community market', 'Market traders asked for a clearer way to apply for stalls. The board has drafted eligibility criteria and will invite feedback before posting the application timetable.', 'Consult traders on the draft allocation criteria', 'Published criteria, an application timetable and a contact for questions'],
  YTH: ['Apprenticeship orientation for young residents', 'Young residents asked for practical training close to home. Local workshop owners have expressed interest and the board will confirm available places and supervision before opening registration.', 'Confirm host workshops and supervision arrangements', 'A list of confirmed hosts, training places and safety requirements'],
  CUL: ['Community heritage storytelling day', 'Residents proposed recording local stories for younger generations. The board has outlined a storytelling day and will ask participants how they want their recordings credited and shared.', 'Agree on accessibility and recording consent', 'An accessible event plan and clear consent choices for storytellers'],
} satisfies Record<Board['code'], [string, string, string, string]>;

export function addBoardSamples(s: State) {
  if (!s.geos.some(geo => geo.id === demoIds.ward && geo.synthetic)) return;
  const recipientId=fixedId('demo-agency-officer');
  if (!s.users.some(user=>user.id===recipientId)) {
    s.users.push({...base('demo-agency-officer'),name:'Synthetic agency officer',email:'agency@synthetic.invalid',verified:true,
      grants:[{role:'AGENCY_OFFICER',jurisdiction:demoIds.lga,startsAt:at,endsAt:'2035-01-01T00:00:00.000Z'}]});
  }
  if (!s.agencies.some(agency=>agency.id===fixedId('demo-agency'))) {
    s.agencies.push({...base('demo-agency'),name:'Synthetic Community Works Desk',jurisdiction:demoIds.lga,recipientId,
      authority:'SYNTHETIC local demonstration reference',proposedBy:demoIds.coordinator,verifiedBy:demoIds.approver});
  }
  const charter = { version: 'SYNTHETIC-1', authority: 'SYNTHETIC pilot charter', approved: true, capacity: 9, quorumPercent: 60, yesPercent: 51, termMonths: 24 };
  for (const { code, name } of BOARD_TYPES) {
    const key = `demo-board-${code}`;
    const board = s.boards.find(item => item.code === code && item.jurisdiction === demoIds.ward);
    const boardId = board?.id ?? fixedId(key);
    if (!board) s.boards.push({ ...base(key), code, jurisdiction: demoIds.ward, name: `Greenfield ${name} Board`, status: 'ACTIVE', authority: charter.authority, charter, submittedBy: demoIds.coordinator, approvedBy: demoIds.approver });
    const [title, context, nextStep, acceptance] = boardScenarios[code];
    const projectKey = `demo-project-scenario-${code}`;
    if (!s.projects.some(item => item.id === fixedId(projectKey))) {
      s.projects.push({
        ...base(projectKey), reference: `SYNTHETIC-PRJ-${code}`, title: `Demo · ${title}`,
        description: `${context} Next step. ${nextStep}. Completion evidence. ${acceptance}.`,
        jurisdiction: demoIds.community, boardCode: code, authority: 'SYNTHETIC pilot charter', source: 'Fictional scenario for the local preview',
        fiscalYear: 2026, status: 'IMPLEMENTATION', publication: 'PUBLIC', inspections: [],
        versions: [{ version: 1, at, actorId: demoIds.coordinator, reason: 'Demo baseline for community monitoring', milestones: [{
          id: fixedId(`${projectKey}-milestone`), title: nextStep, dueAt: '2026-12-11T00:00:00.000Z', weight: 100, acceptance, reported: 0, verified: 0, evidence: '',
        }] }],
      });
    }
    const meetingKey = `demo-meeting-scenario-${code}`;
    if (!s.meetings.some(item => item.id === fixedId(meetingKey))) {
      s.meetings.push({
        ...base(meetingKey), boardId, title: `Demo · ${name} project review`,
        startsAt: '2026-11-20T14:00:00.000Z', timezone: 'Africa/Lagos', venue: 'SYNTHETIC community meeting room',
        agenda: `1. Review the issue and proposed response for “${title}”.\n2. ${nextStep}.\n3. Agree who will collect the completion evidence and report back.`,
        visibility: 'PUBLIC', status: 'SCHEDULED', attendance: [], motions: [], minutes: [], charterSnapshot: board?.charter ?? charter,
      });
    }
  }
}
export const boardDefinitions=BOARD_TYPES;
export function syntheticPrincipal(user:User){return {id:user.id,name:user.name,email:user.email,verified:true,mfa:true};}
