import { Badge, Empty, Panel, formatDate } from '../components';
import { field, useCBS } from '../context';
import { Heading } from './Cases';

export function ProjectMedia({projectId}:{projectId:string}){
  const {w}=useCBS();
  const files=w.projectMedia.filter(file=>file.projectId===projectId);
  return <Panel title="Public progress gallery">
    {files.length?<div className="project-media-grid">{files.map(file=>{
      const url='/api/v1/project-media/'+file.id;
      return <figure key={file.id}>
        {file.mime==='video/mp4'
          ?<video src={url} controls playsInline preload="none" aria-label={file.caption}/>
          :<img src={url} alt={file.caption} loading="lazy"/>}
        <figcaption>{file.caption}</figcaption>
      </figure>;
    })}</div>:<Empty title="No published photos or videos yet"/>}
  </Panel>;
}

export function Honors(){
  const {w,geoName}=useCBS();
  const projects=w.projects.filter(project=>project.publication==='PUBLIC');
  const achievements=projects.filter(project=>project.status==='CLOSED'&&project.completion);
  const now=new Date().toISOString();
  const flagged=projects.filter(project=>!['CLOSED','CANCELLED'].includes(project.status))
    .flatMap(project=>{
      const milestones=project.versions.at(-1)?.milestones.filter(item=>item.dueAt<now&&item.verified<100)??[];
      return milestones.length?[{project,milestones}]:[];
    });
  return <>
    <Heading title="Global honors board" description="Follow verified public achievements and overdue project milestones from anywhere."/>
    <Panel title="Verified achievements">
      {achievements.length?achievements.map(project=><article key={project.id} className="record-block">
        <Badge>VERIFIED COMPLETION</Badge>
        <h3><a href={'/projects/'+project.id}>{project.title}</a></h3>
        <p>{geoName(project.jurisdiction)} · {project.authority}</p>
        {project.deliveryCredit&&<p><strong>{project.deliveryCredit.name}</strong> · {project.deliveryCredit.office}<br/>Attribution reference: {project.deliveryCredit.source}</p>}
      </article>):<Empty title="No verified public completions yet"/>}
    </Panel>
    <Panel title="Projects flagged for follow-up">
      {flagged.length?flagged.map(({project,milestones})=><article key={project.id} className="record-block">
        <h3><a href={'/projects/'+project.id}>{project.title}</a></h3>
        <p>{geoName(project.jurisdiction)} · {project.authority}</p>
        <ul>{milestones.map(item=><li key={item.id}><strong>{item.title}</strong> · Due {formatDate(item.dueAt)} · {item.reported===0&&item.verified===0?'No progress recorded':item.reported+'% reported · '+item.verified+'% verified'}</li>)}</ul>
      </article>):<Empty title="No overdue milestones in published project records"/>}
      <p className="muted">Flags reflect the dates and progress in the latest published milestone baseline. Follow the project record for updates and verification.</p>
    </Panel>
  </>;
}

export function DeliveryCredit({projectId}:{projectId:string}){
  const {w,coordinator,form}=useCBS();
  const project=w.projects.find(item=>item.id===projectId);
  if(!project||!coordinator||project.publication!=='PUBLIC'||project.status!=='CLOSED'||!project.completion||project.completion.reviewerId===w.me?.id)return null;
  return <button className="button secondary" onClick={()=>form('Record public delivery credit','recordDeliveryCredit',{id:project.id},[
    field('name','Official’s name','text',{value:project.deliveryCredit?.name}),
    field('office','Office and delivery role','text',{value:project.deliveryCredit?.office}),
    field('source','Public attribution reference','text',{value:project.deliveryCredit?.source}),
  ],'Use a public source that documents the official’s role in delivering this verified project.')}>Record delivery credit</button>;
}
