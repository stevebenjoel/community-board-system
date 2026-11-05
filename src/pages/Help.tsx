import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Empty, Icon } from '../components';
import { useCBS } from '../context';
import { featureIdeas, helpTopics, helpUpdated } from '../content/help';
import { Heading, Search } from './Cases';

function TopicLink({id,children}:{id:string;children:ReactNode}) {
  return <a href={`/documentation#guide-${id}`} className="text-button">{children}<Icon name="arrow" size={15}/></a>;
}

export function FAQ() {
  const [search,setSearch]=useState(''),[topic,setTopic]=useState('all');
  const {go}=useCBS();
  const questions=useMemo(()=>helpTopics.flatMap(t=>t.questions.map((q,i)=>({...q,topic:t,index:i}))),[]);
  const visible=questions.filter(q=>(topic==='all'||q.topic.id===topic)&&`${q.question} ${q.answer} ${q.topic.title}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <>
    <Heading title="A little clarity goes a long way." description="Straightforward answers to help you participate with confidence."/>
    <section className="help-hero">
      <span className="help-kicker"><Icon name="info" size={16}/> CBS HELP CENTRE</span>
      <h2>How can we help you?</h2>
      <p>Understand the people, processes, and protections behind your community workspace.</p>
      <Search value={search} set={setSearch} placeholder="Search questions, roles, reports, or projects…"/>
      <div className="help-shortcuts"><span>Try:</span>{['sign in','verification','funding','vote'].map(word=><button key={word} onClick={()=>setSearch(word)}>{word}</button>)}</div>
    </section>
    <div className="help-layout">
      <aside className="help-toc" aria-label="FAQ topics"><span className="eyebrow">BROWSE BY TOPIC</span><button className={topic==='all'?'selected':''} onClick={()=>setTopic('all')} aria-pressed={topic==='all'}><Icon name="cases" size={17}/>All questions<span>{questions.length}</span></button>{helpTopics.map(t=><button key={t.id} className={topic===t.id?'selected':''} onClick={()=>setTopic(t.id)} aria-pressed={topic===t.id}><Icon name={t.icon} size={17}/>{t.title}<span>{t.questions.length}</span></button>)}</aside>
      <div><div className="help-results-heading"><h2>{topic==='all'?'Your questions, answered':helpTopics.find(t=>t.id===topic)?.title}</h2><span aria-live="polite">{visible.length} answer{visible.length===1?'':'s'}</span></div>
        <div className="faq-list">{visible.map(q=><details className="faq-item" key={`${q.topic.id}-${q.index}`}><summary><span>{q.question}</span><Icon name="plus" size={17}/></summary><div className="faq-answer"><p>{q.answer}</p><TopicLink id={q.topic.id}>Read the step-by-step guide</TopicLink></div></details>)}</div>
        {!visible.length&&<Empty title="No matching answers" action={<button className="button secondary" onClick={()=>{setSearch('');setTopic('all');}}>Clear search & filters</button>}>Try another word or select a different topic.</Empty>}
        <div className="help-next"><span className="help-next-icon"><Icon name="resolutions" size={27}/></span><div><h3>Prefer a complete walkthrough?</h3><p>Follow every workflow, from joining your community to reviewing a resolution.</p></div><button className="button secondary" onClick={()=>go('/documentation')}>Open documentation<Icon name="arrow" size={16}/></button></div>
        <p className="help-review">Reviewed {helpUpdated} · Describes the current pilot, including its integration limits.</p>
      </div>
    </div>
  </>;
}

export function Documentation() {
  const {go}=useCBS();
  const [query,setQuery]=useState('');
  const topics=helpTopics.filter(t=>`${t.title} ${t.audience} ${t.summary} ${t.steps.join(' ')} ${t.notes.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(()=>{if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));target?.scrollIntoView({block:'start'});}},[]);
  return <>
    <Heading title="Your guide to a connected community." description="A practical handbook for residents, boards, reviewers, and administrators." action={<button className="button secondary" onClick={()=>go('/faq')}>Quick answers<Icon name="arrow" size={16}/></button>}/>
    <section className="documentation-intro"><span className="help-kicker"><Icon name="resolutions" size={17}/> THE CBS HANDBOOK</span><h2>From your first sign-in<br/>to accountable community action.</h2><p>Start with the big picture, then follow the steps for your role. Each guide explains what happens, who can act, and what still requires configuration.</p><div className="handbook-flow">{['Join your community','Report & participate','Review evidence','Record decisions'].map((label,i)=><span key={label}><b>0{i+1}</b>{label}{i<3&&<Icon name="chevron" size={13}/>}</span>)}</div></section>
    <div className="help-layout"><aside className="help-toc" aria-label="Documentation contents"><span className="eyebrow">IN THIS HANDBOOK</span>{helpTopics.map((t,i)=><a key={t.id} href={`#guide-${t.id}`} onClick={()=>setQuery('')}><span className="toc-number">{String(i+1).padStart(2,'0')}</span>{t.title}</a>)}<div className="help-toc-note"><Icon name="shield" size={20}/><p>Public information is open. Confidential workflows stay within authorized access.</p></div></aside>
      <div><div className="documentation-search"><Search value={query} set={setQuery} placeholder="Find a workflow in the handbook…"/></div>{topics.map(t=><section className="guide-section" key={t.id} id={`guide-${t.id}`} aria-labelledby={`title-${t.id}`}><header><span className="guide-symbol"><Icon name={t.icon} size={24}/></span><div><span className="guide-audience">{t.audience}</span><h2 id={`title-${t.id}`}>{t.title}</h2></div></header><p className="guide-summary">{t.summary}</p><ol className="guide-steps">{t.steps.map((step,i)=><li key={step}><span>{i+1}</span><p>{step}</p></li>)}</ol>{t.notes.map(note=><div className="guide-boundary" key={note}><Icon name="info" size={17}/><p>{note}</p></div>)}<button className="text-button" onClick={()=>go(t.route)}>Open this part of CBS<Icon name="arrow" size={16}/></button></section>)}{!topics.length&&<Empty title="No matching guides" action={<button className="button secondary" onClick={()=>setQuery('')}>Show all guides</button>}/>}
      <div className="help-next"><Icon name="info" size={25}/><div><h3>These guides grow with the app.</h3><p>FAQ and Documentation share one source. Feature changes require both explanations to be reviewed together.</p></div></div><p className="help-review">Reviewed {helpUpdated} · Public pilot handbook · No government endorsement implied.</p></div></div>
  </>;
}

export function FeatureIdeas() {
  const {message}=useCBS();
  const [chosen,setChosen]=useState<string[]>([]);
  const [copied,setCopied]=useState(false);
  const selected=featureIdeas.filter(idea=>chosen.includes(idea.id));
  const request=selected.length?`Please implement ${selected.length===featureIdeas.length?'all of these CBS additions':'the following CBS addition'+(selected.length>1?'s':'')}:\n\n${selected.map((idea,i)=>`${i+1}. ${idea.request}`).join('\n')}\n\nKeep Appwrite as the backend and Coolify as the hosting target. Update FAQ and Documentation together, preserve existing data, and run the relevant checks.`:'';
  function toggle(id:string){setChosen(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);setCopied(false);}
  return <>
    <Heading title="What should we build next?" description="Thoughtful additions for a smoother community experience. You choose the direction."/>
    <section className="idea-advisor"><div className="advisor-identity"><span><Icon name="youth" size={23}/></span><div><strong>CBS feature companion</strong><small>Product planning · You stay in control</small></div><span className="proposal-label">IDEAS, NOT ACTIVE FEATURES</span></div><div className="advisor-message"><p>I’ve picked three useful ways to improve CBS.</p><p>Choose the one that matters most, combine a few, or select all three. I’ll prepare a clear request for your development chat.</p></div>
      <div className="idea-cards">{featureIdeas.map((idea,i)=><label className={`idea-card ${chosen.includes(idea.id)?'chosen':''}`} key={idea.id}><div className="idea-card-top"><span className="idea-symbol"><Icon name={idea.icon} size={24}/></span><input type="checkbox" aria-label={`Select ${idea.title}`} checked={chosen.includes(idea.id)} onChange={()=>toggle(idea.id)}/></div><span className="idea-number">ADDITION 0{i+1}</span><h2>{idea.title}</h2><p>{idea.benefit}</p><div className="idea-scope">{idea.scope}</div><span className="idea-effort">{idea.effort}</span></label>)}</div>
      <div className="idea-controls"><div><button className="text-button" onClick={()=>{setChosen(featureIdeas.map(i=>i.id));setCopied(false);}}>Select all three</button><span>·</span><button className="text-button" onClick={()=>{setChosen([]);setCopied(false);}}>Clear selection</button></div><strong aria-live="polite">{selected.length} of {featureIdeas.length} selected</strong></div>
      {selected.length>0?<div className="idea-handoff"><div className="spread"><h3>Your next-build request</h3><span className="proposal-label">READY TO COPY</span></div><label htmlFor="feature-request" className="sr-only">Prepared feature request for this chat</label><textarea id="feature-request" value={request} readOnly rows={8}/><div className="idea-handoff-footer"><p>Paste this into the development chat. Nothing is sent or implemented automatically.</p><button className="button" onClick={async()=>{try{await navigator.clipboard.writeText(request);setCopied(true);message('Selection copied. Paste it into this chat to request implementation.');}catch{setCopied(false);message('Clipboard is unavailable. Select and copy the prepared request above.');}}}>{copied?'Copied':'Copy choices for this chat'}<Icon name={copied?'check':'arrow'} size={17}/></button></div></div>:<div className="idea-empty"><Icon name="check" size={20}/><p>Your next improvement starts with a choice. Select one or more cards above.</p></div>}
    </section><div className="help-next"><Icon name="shield" size={24}/><div><h3>A suggestion is always your decision.</h3><p>Ideas do not alter records, grants, or governance rules. Chosen features are built only after your request, with FAQ and Documentation updated in the same change.</p></div></div>
  </>;
}
