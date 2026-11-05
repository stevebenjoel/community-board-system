import { createContext, useContext } from 'react';
import type { Workspace } from '../shared/model';
import type { Field, FormSpec } from './components';
export interface CBSContext { w:Workspace; go:(path:string)=>void; form:(title:string,action:string,fixed:Record<string,unknown>,fields:Field[],description?:string,transform?:FormSpec['transform'])=>void; run:(action:string,payload:unknown)=>Promise<void>; refresh:()=>Promise<void>; open:(spec:FormSpec)=>void; message:(text:string)=>void; report:()=>void; signIn:()=>void }
export const Context=createContext<CBSContext|null>(null);
export function useCBS(){const ctx=useContext(Context);if(!ctx)throw new Error('Workspace provider missing');const {w}=ctx;const roles=w.me?.grants.map(g=>g.role)??[];const coordinator=roles.includes('LGA_COORDINATOR'),ethics=roles.includes('ETHICS_REVIEWER'),admin=roles.includes('PLATFORM_ADMIN'),auditor=roles.includes('AUDITOR');const officer=coordinator||roles.includes('BOARD_CHAIR')||roles.includes('BOARD_SECRETARY');return {...ctx,roles,coordinator,ethics,admin,auditor,officer,monitor:officer||roles.includes('BOARD_MEMBER'),name:(id:string)=>w.users.find(u=>u.id===id)?.name??'Authorized participant',geoName:(id:string)=>w.geos.find(g=>g.id===id)?.name??'Jurisdiction'};}
export const field=(name:string,label:string,type:Field['type']='text',extra:Partial<Field>={}):Field=>({name,label,type,...extra});
export const opts=(items:{id:string;name?:string;title?:string}[])=>items.map(x=>({value:x.id,label:x.name??x.title??x.id}));
export const enums=(values:string[])=>values.map(value=>({value,label:value.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}));
export const select=(name:string,label:string,options:{value:string;label:string}[],value?:string)=>field(name,label,'select',{options,value});
export const dateTime=(days=0)=>{const date=new Date(Date.now()+days*86400000);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export const boardIcons:Record<string,string>={EDU:'education',HLT:'health',SEC:'shield',INF:'projects',TRD:'trade',YTH:'youth',CUL:'culture'};
