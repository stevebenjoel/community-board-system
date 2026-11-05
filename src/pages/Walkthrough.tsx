import { Icon } from '../components';
import { useCBS } from '../context';
import { tours,type TourId } from '../../shared/tours';
import { command } from '../lib/api';
import { Heading } from './Cases';

export function Walkthroughs(){
  const {w,go,refresh,message,roles,signIn}=useCBS();
  const isOfficer=roles.some(role=>['LGA_COORDINATOR','BOARD_CHAIR','BOARD_SECRETARY','BOARD_MEMBER','ETHICS_REVIEWER','AUDITOR'].includes(role));
  async function start(id:TourId,restart=false){try{await command('tourProgress',{tourId:id,action:restart?'RESTART':'START'});await refresh();const progress=w.me?.tours?.[id];go(tours[id].steps[restart||progress?.status==='COMPLETED'?0:progress?.version===tours[id].version?progress.step:0].route);}catch(e){message(e instanceof Error?e.message:'Unable to start the walkthrough.');}}
  return <><Heading title="A little guidance. A confident start." description="Explore the real screens with a companion that explains each step. You remain in control."/><div className="tour-intro"><Icon name="community" size={34}/><div><h2>Learn the workflow without changing a record.</h2><p>These tours guide you through CBS. They never submit a case, approve an appointment, or cast a vote. Your progress is saved to your signed-in account.</p></div></div><div className="tour-cards">{(['resident','officer'] as const).map(id=>{const tour=tours[id],progress=w.me?.tours?.[id],allowed=id==='resident'||isOfficer;return <article className="tour-card" key={id}><span className="guide-symbol"><Icon name={id==='resident'?'community':'shield'} size={26}/></span><span className="eyebrow">{tour.steps.length} SHORT STEPS · {id.toUpperCase()}</span><h2>{tour.title}</h2><p>{tour.description}</p><ol>{tour.steps.map(step=><li key={step.title}>{step.title}</li>)}</ol>{progress&&<p className="tour-saved">{progress.status==='COMPLETED'?'Completed':`Saved at step ${progress.step+1} of ${tour.steps.length}`}</p>}<div className="action-row">{!w.me?<button className="button" onClick={signIn}>Sign in to start</button>:<><button className="button" disabled={!allowed} onClick={()=>void start(id)}>{progress&&progress.status!=='COMPLETED'?'Continue walkthrough':'Start walkthrough'}<Icon name="arrow" size={16}/></button>{progress&&<button className="button secondary" disabled={!allowed} onClick={()=>void start(id,true)}>Restart</button>}</>}</div>{!allowed&&<small>An active scoped officer role and MFA are required. The tour does not grant access.</small>}</article>;})}</div></>;
}

export function GuidedWalkthrough({path}:{path:string}){
  const {w,go,refresh,message}=useCBS();
  const entry=(['resident','officer'] as const).map(id=>({id,progress:w.me?.tours?.[id]})).find(({id,progress})=>progress?.status==='ACTIVE'&&progress.version===tours[id].version);
  if(!entry?.progress)return null;
  const {id,progress}=entry,tour=tours[id],step=tour.steps[progress.step];
  async function act(action:'NEXT'|'BACK'|'COMPLETE'|'DISMISS'){
    try{await command('tourProgress',{tourId:id,action});await refresh();if(action==='NEXT')go(tour.steps[Math.min(progress.step+1,tour.steps.length-1)].route);if(action==='BACK')go(tour.steps[Math.max(progress.step-1,0)].route);if(action==='COMPLETE')message('Walkthrough completed. You can restart it from Guided walkthroughs.');}catch(e){message(e instanceof Error?e.message:'Unable to save your walkthrough.');}
  }
  return <aside className="guided-step" aria-label={`${tour.title} walkthrough`}><div className="guided-marker"><Icon name="youth" size={25}/><span>{progress.step+1}/{tour.steps.length}</span></div><div className="guided-content"><span className="eyebrow">YOUR GUIDED WALKTHROUGH</span><h2>{step.title}</h2><p>{step.body}</p><div className="tour-progress-track" aria-label={`Step ${progress.step+1} of ${tour.steps.length}`}>{tour.steps.map((s,i)=><span key={s.title} className={i<=progress.step?'visited':''}/>)}</div><div className="guided-buttons">{path!==step.route&&<button className="button secondary small" onClick={()=>go(step.route)}>{step.action}</button>}<button className="button secondary small" disabled={progress.step===0} onClick={()=>void act('BACK')}>Back</button><button className="button small" onClick={()=>void act(progress.step===tour.steps.length-1?'COMPLETE':'NEXT')}>{progress.step===tour.steps.length-1?'Finish walkthrough':'Next step'}<Icon name="arrow" size={14}/></button><button className="text-button" onClick={()=>void act('DISMISS')}>Pause for now</button></div></div></aside>;
}
