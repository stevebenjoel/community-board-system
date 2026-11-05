export type TourId = 'resident' | 'officer';
export interface TourProgress { version: number; step: number; status: 'ACTIVE'|'DISMISSED'|'COMPLETED'; updatedAt: string }
export interface TourStep { title:string; body:string; route:string; action:string }
export const tours: Record<TourId,{title:string;description:string;version:number;steps:TourStep[]}> = {
  resident: { title:'Your community journey',description:'A short introduction to participation, private reporting and public accountability.',version:1,steps:[
    {title:'Get your bearings',body:'Overview shows only the records your account can see. Pilot figures are synthetic; public information remains available without joining a board.',route:'/',action:'Open overview'},
    {title:'Find your community',body:'Use State/FCT → LGA → ward → community. Request residency review with a statement or attestation. A different authorized reviewer decides the outcome.',route:'/community',action:'Explore my community'},
    {title:'Raise a private concern',body:'Use Report an issue, then follow its case history here. Only a confirmed server response means it was submitted. This tour never submits a report for you.',route:'/cases',action:'Explore cases'},
    {title:'Follow evidence, not just promises',body:'Open a project to compare reported and verified milestones. Approved, released and spent funding are separate financial events.',route:'/projects',action:'Explore projects'},
    {title:'Stay in control',body:'Manage your profile, MFA and privacy requests here. Restart this tour at any time from Guided walkthroughs.',route:'/profile',action:'Explore my profile'},
  ]},
  officer: {title:'The accountable officer workflow',description:'Learn the review boundaries that protect residents and legitimate board decisions.',version:1,steps:[
    {title:'Work within your mandate',body:'An officer needs verified contact, MFA, an active grant and the correct jurisdiction. A tour grants no privileges and never performs approvals.',route:'/',action:'Open overview'},
    {title:'Keep appointments independent',body:'Candidates accept nominations, an authorized reviewer screens them, and a different authority approves. Disclose and review conflicts before acting.',route:'/members',action:'Explore membership'},
    {title:'Investigate and document',body:'Review, accept and assign cases to qualified handlers. Add evidence and deadlines; separate an officer-proposed outcome from independent verification.',route:'/cases',action:'Explore case management'},
    {title:'Check what needs attention',body:'Your action queue groups upcoming, due-soon and overdue work. Reminders are private in-app notices, not an emergency escalation service.',route:'/actions',action:'Open my actions'},
    {title:'Verify project evidence',body:'Record funding and inspections with source evidence. A second reviewer must verify funding and milestone progress.',route:'/projects',action:'Explore project oversight'},
    {title:'Record legitimate decisions',body:'Confirm eligible attendance, meet the adopted charter’s quorum, record one vote per member and approve minutes independently before adopting resolutions.',route:'/meetings',action:'Explore meetings'},
  ]},
};
