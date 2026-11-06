import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CommunitySelect } from './CommunitySelect';
import { command } from './lib/api';

export function Icon({name,size=20}:{name:string;size?:number}){
  const paths:Record<string,ReactNode>={
    home:<><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></>,
    cases:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3"/></>,
    projects:<><path d="M3 21h18M5 21V7h14v14M9 7V3h6v4M9 11h1m4 0h1m-6 4h1m4 0h1M10 21v-3h4v3"/></>,
    boards:<><circle cx="9" cy="7" r="3"/><path d="M2 21v-4a7 7 0 0 1 14 0v4M17 4a3 3 0 0 1 0 6m3 11v-4a7 7 0 0 0-3-5"/></>,
    meetings:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-14 4h2m3 0h2m3 0h1M7 18h2"/></>,
    resolutions:<><path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7m-7 4h7"/></>,
    community:<><path d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6M3 9h18"/><path d="M10 10h4"/></>,
    profile:<><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></>,
    settings:<><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    shield:<><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z"/><path d="m8 12 3 3 5-6"/></>,
    search:<><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4"/></>,
    arrow:<><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    plus:<path d="M12 4v16M4 12h16"/>,
    check:<path d="m5 12 4 4L20 5"/>,
    chevron:<path d="m9 5 7 7-7 7"/>,
    down:<path d="m6 9 6 6 6-6"/>,
    pin:<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
    education:<><path d="m2 8 10-5 10 5-10 5zM6 10v7c3 3 9 3 12 0v-7M22 8v9"/></>,
    health:<><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M5 12h4l2-4 2 8 2-4h4"/></>,
    trade:<><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12a21 21 0 0 0 18 0M10 12h4v4h-4z"/></>,
    youth:<><path d="M12 21V9M12 14C4 14 3 8 4 3c7 0 8 4 8 8m0 4c0-7 5-9 9-9 1 7-3 11-9 11"/></>,
    culture:<><path d="m2 8 10-5 10 5H2zm1 13h18M5 11v7m5-7v7m4-7v7m5-7v7"/></>,
    download:<><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
    menu:<path d="M3 6h18M3 12h18M3 18h18"/>,
    close:<path d="m6 6 12 12M6 18 18 6"/>,
    logout:<><path d="M10 4H3v16h7m4-16 7 8-7 8m-6-8h13"/></>,
    info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
    chart:<><path d="M3 3v18h18M7 17v-6m5 6V7m5 10v-9"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]??paths.community}</svg>;
}
export const pretty=(s:string)=>s.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
export const formatDate=(s:string)=>new Date(s).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Lagos'});
export function Badge({children}:{children:ReactNode}){const text=String(children);return <span className={`badge ${/active|verified|approved|closed|public|adopted/i.test(text)&&!/unverified|pending/i.test(text)?'positive':/disputed|rejected|restricted|overdue|revoked/i.test(text)?'negative':'neutral'}`}>{pretty(text)}</span>;}
export function Empty({title='No records yet',children,action}:{title?:string;children?:ReactNode;action?:ReactNode}){return <div className="empty"><span className="empty-icon"><Icon name="cases" size={28}/></span><h3>{title}</h3><p>{children??'Records will appear here when they are available to your account.'}</p>{action}</div>;}
export function Panel({title,aside,children,className=''}:{title?:string;aside?:ReactNode;children:ReactNode;className?:string}){return <section className={`panel ${className}`}>{title&&<div className="panel-title"><h2>{title}</h2>{aside}</div>}{children}</section>;}
export interface Field {name:string;label:string;type?:'text'|'textarea'|'number'|'date'|'datetime-local'|'select'|'community'|'email'|'password';options?:{value:string;label:string}[];value?:string|number;required?:boolean;hint?:string;min?:number;max?:number}
export interface FormSpec {title:string;description?:string;action?:string;fields:Field[];fixed?:Record<string,unknown>;draftKey?:string;transform?:(data:Record<string,unknown>)=>unknown;submit?:(data:Record<string,unknown>)=>Promise<unknown>;onSuccess?:(result:unknown)=>void;submitLabel?:string}
export function ModalForm({spec,onClose,onSaved}:{spec:FormSpec;onClose:()=>void;onSaved:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),formId=useId();const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [draft]=useState<{values:Record<string,string>;fixed:Record<string,unknown>}|null>(()=>{try{return spec.draftKey?JSON.parse(sessionStorage.getItem(spec.draftKey)??'null'):null;}catch{return null;}});
  const [draftSaved,setDraftSaved]=useState(false);
  useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
  return <dialog ref={dialog} className="modal" onCancel={onClose} aria-labelledby={formId}><header><div><p className="eyebrow">COMMUNITY BOARD SYSTEM</p><h2 id={formId}>{spec.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></header>{spec.description&&<p className="muted">{spec.description}</p>}
    <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const values:Record<string,unknown>={...spec.fixed,...draft?.fixed};const form=new FormData(e.currentTarget);for(const f of spec.fields){const raw=String(form.get(f.name)??'');values[f.name]=f.type==='number'?Number(raw):f.type==='datetime-local'?new Date(raw).toISOString():raw;}try{const payload=spec.transform?spec.transform(values):values;const result=spec.submit?await spec.submit(values):await command(spec.action!,payload);if(spec.draftKey)sessionStorage.removeItem(spec.draftKey);spec.onSuccess?.(result);onSaved();onClose();}catch(err){setError(err instanceof Error?err.message:'Could not save. Please retry.');}finally{setBusy(false);}}}>
      <div className="form-fields">{spec.fields.map(f=>f.type==='community'?<CommunitySelect key={f.name} name={f.name} value={draft?.values[f.name]??f.value} draft={draft?.values} required={f.required!==false}/>:<label key={f.name} htmlFor={`${formId}-${f.name}`}>{f.label}{f.required!==false&&<span className="required"> *</span>}{f.type==='textarea'?<textarea id={`${formId}-${f.name}`} name={f.name} defaultValue={draft?.values[f.name]??f.value} rows={4} required={f.required!==false} aria-describedby={f.hint?`${formId}-${f.name}-hint`:undefined}/>:f.type==='select'?<select id={`${formId}-${f.name}`} name={f.name} defaultValue={draft?.values[f.name]??f.value??''} required={f.required!==false}><option value="" disabled>Select an option</option>{f.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<input id={`${formId}-${f.name}`} name={f.name} type={f.type??'text'} defaultValue={draft?.values[f.name]??f.value} required={f.required!==false} min={f.min} max={f.max} autoComplete={f.type==='password'?'current-password':'off'}/>}{f.hint&&<small id={`${formId}-${f.name}-hint`}>{f.hint}</small>}</label>)}</div>
      {error&&<p className="form-error" role="alert">{error}</p>}{draftSaved&&<p role="status">Draft saved in this tab for your account. It has not been submitted.</p>}<footer>{spec.draftKey&&<button className="button secondary" type="button" onClick={e=>{const element=e.currentTarget.form!;const values=Object.fromEntries(new FormData(element).entries());if(values.category==='SEC'){setError('Safety reports cannot be saved as browser drafts. Submit through the confidential channel.');return;}try{sessionStorage.setItem(spec.draftKey!,JSON.stringify({values,fixed:{...spec.fixed,...draft?.fixed}}));setDraftSaved(true);}catch{setError('Draft storage is unavailable. Keep this form open until you can submit.');}}}>Save draft</button>}<button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button" disabled={busy}>{busy?'Saving…':spec.submitLabel??'Save record'}<Icon name="arrow" size={16}/></button></footer>
    </form></dialog>;
}
