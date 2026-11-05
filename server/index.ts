import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { type Principal } from '../shared/model.ts';
import { config } from './config.ts';
import { appwrite, createStore } from './store.ts';
import { appendAudit, commands, execute, workspace, type Action } from './domain.ts';
import { assert, DomainError } from './policy.ts';
import { addBoardSamples, syntheticPrincipal, syntheticSeed } from './seed.ts';
import { wardSettlements } from './inec-geography.ts';
import { EvidenceService,MAX_EVIDENCE_BYTES } from './evidence.ts';
import { produceReminders } from './reminders.ts';

const store=createStore();
const evidenceService=new EvidenceService(store);
if(config.CBS_MODE==='synthetic')await store.transaction(s=>{
  if(!s.users.length)Object.assign(s,syntheticSeed());
  else addBoardSamples(s);
});
const sessions=new Map<string,{userId:string;expires:number}>();
const limits=new Map<string,{count:number;reset:number}>();
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.ico':'image/x-icon'};
function send(res:ServerResponse,status:number,data:unknown){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req:IncomingMessage,maxBytes=131072){assert(req.headers['content-type']?.startsWith('application/json'),'Send JSON content.','UNSUPPORTED_MEDIA_TYPE',415);let text='';for await(const chunk of req){text+=chunk;assert(Buffer.byteLength(text)<=maxBytes,'Request is too large.','PAYLOAD_TOO_LARGE',413);}try{return JSON.parse(text||'{}') as unknown;}catch{throw new DomainError('INVALID_JSON','Request body must be valid JSON.');}}
async function principal(req:IncomingMessage):Promise<Principal|null>{
  if(config.CBS_MODE==='synthetic'){
    const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('cbs_session='))?.split('=')[1];
    const session=token?sessions.get(token):undefined;if(!session||session.expires<Date.now())return null;
    const user=(await store.read()).users.find(x=>x.id===session.userId);return user?syntheticPrincipal(user):null;
  }
  const auth=req.headers.authorization;if(!auth?.startsWith('Bearer '))return null;
  const credential={jwt:auth.slice(7)};
  try{const account=await appwrite('/account','GET',undefined,credential);const session=await appwrite('/account/sessions/current','GET',undefined,credential);
    return {id:String(account.$id),name:String(account.name||'Resident'),email:String(account.email||''),verified:account.emailVerification===true||account.phoneVerification===true,mfa:Array.isArray(session.factors)&&session.factors.length>=2};
  }catch{throw new DomainError('SESSION_INVALID','Your session expired. Please sign in again.',401);}
}
export async function handleRequest(req:IncomingMessage,res:ServerResponse){
  const requestId=randomUUID();res.setHeader('X-Request-Id',requestId);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  // Appwrite is contacted by the client only for identity. All CBS data stays behind this API.
  const authOrigin=config.APPWRITE_ENDPOINT?new URL(config.APPWRITE_ENDPOINT).origin:'';
  if(config.NODE_ENV==='production')res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ${authOrigin}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`);
  try{
    const url=new URL(req.url??'/',config.APP_ORIGIN),path=url.pathname;
    if(path==='/health'){send(res,200,{status:'ok',mode:config.CBS_MODE});return;}
    if(path.startsWith('/api/')){
      const ip=req.socket.remoteAddress??'unknown';const current=limits.get(ip);if(!current||current.reset<Date.now())limits.set(ip,{count:1,reset:Date.now()+60000});else {current.count++;assert(current.count<=180,'Too many requests. Please wait a minute.','RATE_LIMITED',429);}
      if(limits.size>10000)for(const [key,limit] of limits)if(limit.reset<Date.now())limits.delete(key);
      const publicMediaPath=path.match(/^\/api\/v1\/project-media\/([a-f0-9]{32})$/);
      if(publicMediaPath&&req.method==='GET'){
        const {evidence,bytes}=await evidenceService.publicMedia(publicMediaPath[1]);
        const headers={'Content-Type':evidence.mime,'Cache-Control':'no-store','Accept-Ranges':'bytes'};
        const range=req.headers.range;
        if(!range){res.writeHead(200,{...headers,'Content-Length':bytes.length});res.end(bytes);return;}
        const parts=/^bytes=(\d*)-(\d*)$/.exec(range);
        const start=parts?.[1]?Number(parts[1]):Math.max(0,bytes.length-Number(parts?.[2]??0));
        const end=parts?.[1]&&parts[2]?Math.min(Number(parts[2]),bytes.length-1):bytes.length-1;
        if(!parts||start>end||!Number.isSafeInteger(start)||start>=bytes.length){
          res.writeHead(416,{...headers,'Content-Range':`bytes */${bytes.length}`});res.end();return;
        }
        res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${bytes.length}`});
        res.end(bytes.subarray(start,end+1));return;
      }
      if(req.method!=='GET'){
        const origin=req.headers.origin;
        assert(!origin||origin===config.APP_ORIGIN,'This request origin is not allowed.','ORIGIN_DENIED',403);
        if(config.CBS_MODE==='synthetic')assert(req.headers['x-cbs-client']==='web','Missing request protection.','CSRF_DENIED',403);
      }
      if(path==='/api/v1/config'&&req.method==='GET'){send(res,200,{mode:config.CBS_MODE,appwriteEndpoint:config.APPWRITE_ENDPOINT??'',appwriteProjectId:config.APPWRITE_PROJECT_ID??''});return;}
      if(path==='/api/v1/demo-session'&&req.method==='POST'){
        assert(config.CBS_MODE==='synthetic'&&config.NODE_ENV!=='production','Not found.','NOT_FOUND',404);
        const d=z.object({userId:z.string()}).strict().parse(await body(req));const user=(await store.read()).users.find(u=>u.id===d.userId&&u.synthetic);assert(user,'Unknown synthetic profile.');
        const token=randomBytes(32).toString('hex');sessions.set(token,{userId:user.id,expires:Date.now()+8*3600000});res.setHeader('Set-Cookie',`cbs_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);send(res,200,{ok:true});return;
      }
      if(path==='/api/v1/logout'&&req.method==='POST'){const token=req.headers.cookie?.match(/(?:^|;\s*)cbs_session=([^;]+)/)?.[1];if(token)sessions.delete(token);res.setHeader('Set-Cookie','cbs_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');send(res,200,{ok:true});return;}
      const wardPath=path.match(/^\/api\/v1\/wards\/([a-f0-9-]{36})\/communities$/);
      if(wardPath&&req.method==='GET'){
        const state=await store.read();
        assert(state.geos.some(geo=>geo.id===wardPath[1]&&geo.type==='WARD'),'Ward not found.','NOT_FOUND',404);
        send(res,200,wardSettlements(state,wardPath[1]).map(({id,name})=>({id,name})));
        return;
      }
      const p=await principal(req);
      if(path==='/api/v1/evidence'&&req.method==='POST'){
        assert(p,'Sign in to attach evidence.','UNAUTHENTICATED',401);
        const result=await evidenceService.upload(p,await body(req,Math.ceil(MAX_EVIDENCE_BYTES/3)*4+4096));send(res,201,result);return;
      }
      const evidencePath=path.match(/^\/api\/v1\/evidence\/([a-f0-9]{32})\/(scan|download-token|download)$/);
      if(evidencePath){
        assert(p,'Sign in to access evidence.','UNAUTHENTICATED',401);const [,id,operation]=evidencePath;
        if(operation==='scan'&&req.method==='POST'){z.object({}).strict().parse(await body(req));send(res,200,await evidenceService.rescan(p,id));return;}
        if(operation==='download-token'&&req.method==='POST'){z.object({}).strict().parse(await body(req));send(res,200,await evidenceService.token(p,id));return;}
        if(operation==='download'&&req.method==='GET'){
          const result=await evidenceService.download(p,id,url.searchParams.get('token')??'');
          res.writeHead(200,{'Content-Type':result.evidence.mime,'Content-Disposition':`attachment; filename="evidence.${result.evidence.filename.split('.').at(-1)}"; filename*=UTF-8''${encodeURIComponent(result.evidence.filename).replaceAll("'",'%27')}`,'Content-Length':String(result.bytes.length),'Cache-Control':'no-store','Content-Security-Policy':"sandbox; default-src 'none'"});res.end(result.bytes);return;
        }
        throw new DomainError('METHOD_NOT_ALLOWED','Method not allowed.',405);
      }
      if(path==='/api/v1/session'&&req.method==='POST'){
        assert(p,'Sign in to Appwrite first.','UNAUTHENTICATED',401);
        await store.transaction(s=>{const user=s.users.find(x=>x.id===p.id);if(user){user.verified=p.verified;user.email=p.email;}else s.users.push({id:p.id,name:p.name,email:p.email,verified:p.verified,grants:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});});send(res,200,{ok:true});return;
      }
      if(path==='/api/v1/workspace'&&req.method==='GET'){send(res,200,workspace(await store.read(),p,config.CBS_MODE));return;}
      if(path==='/api/v1/commands'&&req.method==='POST'){
        assert(p,'Sign in to continue.','UNAUTHENTICATED',401);
        const d=z.object({action:z.string(),payload:z.unknown()}).strict().parse(await body(req));assert(Object.hasOwn(commands,d.action),'Unknown command.');
        const result=await store.transaction(s=>execute(s,p,d.action as Action,d.payload));send(res,200,result);return;
      }
      if(path==='/api/v1/export'&&req.method==='GET'){
        const view=workspace(await store.read(),p,config.CBS_MODE);
        // Exports are generated from the same authorized projections as the interface.
        res.setHeader('Content-Disposition','attachment; filename="cbs-authorized-report.json"');send(res,200,{generatedAt:new Date().toISOString(),synthetic:config.CBS_MODE==='synthetic',definitions:'Counts represent records visible to the current session. Financial amounts are grouped by event type and currency, never combined.',counts:view.counts,projects:view.projects,resolutions:view.resolutions});return;
      }
      throw new DomainError('NOT_FOUND','API endpoint not found.',404);
    }
    assert(req.method==='GET'||req.method==='HEAD','Method not allowed.','METHOD_NOT_ALLOWED',405);
    const root=resolve('dist');let file=resolve(root,`.${decodeURIComponent(path)}`);assert(file===root||file.startsWith(root+'/')||file.startsWith(root+'\\'),'Invalid path.','NOT_FOUND',404);
    if(!existsSync(file)||!extname(file))file=resolve(root,'index.html');const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':file.includes('assets')?'public, max-age=31536000, immutable':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
  }catch(error){
    const isDomain=error instanceof DomainError,isValidation=error instanceof z.ZodError;
    const status=isDomain?error.status:isValidation?400:500;
    const message=isDomain?error.message:isValidation?error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '):'The service could not complete this request. Please retry.';
    if(status===500)console.error(JSON.stringify({requestId,event:'request_failed',errorType:error instanceof Error?error.name:'unknown'}));
    send(res,status,{error:{code:isDomain?error.code:isValidation?'VALIDATION_ERROR':'SERVICE_ERROR',message,requestId}});
  }
}
export const server=createServer(handleRequest);
export function closeStore(){store.close();}
export async function runReminderCycle(now=new Date()){
  return store.transaction(s=>{const count=produceReminders(s,now);if(count)appendAudit(s,{id:'system-reminders',name:'Reminder service',email:'',verified:true,mfa:true},'reminders.delivered',String(count),s.geos.find(g=>g.type==='COUNTRY')?.id??'');return count;});
}
if(resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
  server.listen(config.PORT,config.HOST,()=>console.log(`CBS ${config.CBS_MODE} API: http://${config.HOST}:${config.PORT}`));
  const remind=()=>runReminderCycle().catch(()=>console.error(JSON.stringify({event:'reminder_cycle_failed'})));
  void remind();const timer=setInterval(()=>void remind(),config.CBS_REMINDER_INTERVAL_MS);timer.unref();
  for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{clearInterval(timer);server.close(()=>{store.close();process.exit(0);});});
}
