import { createHash,createHmac,randomBytes,timingSafeEqual } from 'node:crypto';
import { createConnection } from 'node:net';
import { z } from 'zod';
import type { Evidence,Principal,State } from '../shared/model.ts';
import { config } from './config.ts';
import { appwrite,SqliteStore,type Store } from './store.ts';
import { assert,canUseEvidenceTarget } from './policy.ts';
import { appendAudit,isPublicProjectMedia } from './domain.ts';

export const MAX_EVIDENCE_BYTES=4*1024*1024;
export const uploadSchema=z.object({targetType:z.enum(['CASE','PROJECT']),targetId:z.string().min(1).max(100),filename:z.string().min(1).max(180),mime:z.enum(['image/png','image/jpeg','application/pdf','video/mp4']),contentBase64:z.string().min(4).max(Math.ceil(MAX_EVIDENCE_BYTES/3)*4),clientRequestId:z.uuid()}).strict();
export type UploadInput=z.infer<typeof uploadSchema>;
export interface EvidenceStorage { put(id:string,bytes:Buffer,filename:string,mime:string):Promise<void>;get(id:string):Promise<Buffer> }
export interface ScanResult {status:Evidence['scanStatus'];engine:string}
export type Scanner=(bytes:Buffer)=>Promise<ScanResult>;
const jurisdictionFor=(s:State,e:Evidence)=>e.targetType==='CASE'?s.cases.find(c=>c.id===e.targetId)?.jurisdiction??'':s.projects.find(p=>p.id===e.targetId)?.jurisdiction??'';
const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
export function safeFilename(name:string){return name.replaceAll('\\','/').split('/').at(-1)!.replace(/[\x00-\x1f\x7f]/g,'').replace(/[^\p{L}\p{N}._ ()-]/gu,'_').slice(0,150)||'evidence';}
export function validateFile(input:UploadInput){
  assert(input.contentBase64.length<=Math.ceil(MAX_EVIDENCE_BYTES/3)*4,'Files must be between 1 byte and 4 MiB.','FILE_SIZE',413);
  assert(input.contentBase64.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(input.contentBase64),'Invalid file encoding.');
  const bytes=Buffer.from(input.contentBase64,'base64');assert(bytes.length>0&&bytes.length<=MAX_EVIDENCE_BYTES,'Files must be between 1 byte and 4 MiB.','FILE_SIZE',413);
  assert(bytes.toString('base64')===input.contentBase64,'Invalid file encoding.');
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255,pdf=bytes.subarray(0,5).toString()==='%PDF-';
  const filename=safeFilename(input.filename),extension=filename.split('.').at(-1)?.toLowerCase();
  const mp4=bytes.length>=16&&bytes.toString('ascii',4,8)==='ftyp'&&bytes.readUInt32BE(0)>=16&&bytes.readUInt32BE(0)<=bytes.length;
  assert((input.mime==='video/mp4'&&mp4&&extension==='mp4')||(input.mime==='image/png'&&png&&extension==='png')||(input.mime==='image/jpeg'&&jpeg&&['jpg','jpeg'].includes(extension??''))||(input.mime==='application/pdf'&&pdf&&extension==='pdf'),'File extension, declared type, and file signature must match.','FILE_TYPE');
  return {bytes,filename,sha256:digest(bytes)};
}
export function canReadEvidence(s:State,p:Principal|null,e:Evidence){return canUseEvidenceTarget(s,p,e.targetType,e.targetId);}
export function createEvidenceStorage(store:Store):EvidenceStorage {
  if(store instanceof SqliteStore)return {
    async put(id,bytes){const prior=store.db.prepare('SELECT content FROM evidence_blobs WHERE id=?').get(id) as {content:Uint8Array}|undefined;if(prior){assert(digest(Buffer.from(prior.content))===digest(bytes),'Evidence content is immutable.');return;}store.db.prepare('INSERT INTO evidence_blobs VALUES(?,?)').run(id,bytes);},
    async get(id){const row=store.db.prepare('SELECT content FROM evidence_blobs WHERE id=?').get(id) as {content:Uint8Array}|undefined;assert(row,'Evidence content is unavailable.','NOT_FOUND',404);return Buffer.from(row.content);},
  };
  const root=`/storage/buckets/${encodeURIComponent(config.APPWRITE_EVIDENCE_BUCKET_ID)}`;
  const headers=()=>({'X-Appwrite-Project':config.APPWRITE_PROJECT_ID!,'X-Appwrite-Key':config.APPWRITE_API_KEY!});
  return {
    async put(id,bytes,filename,mime){
      const bucket=await appwrite(root);
      assert(Array.isArray(bucket.$permissions)&&bucket.$permissions.length===0&&bucket.fileSecurity===true&&bucket.encryption===true&&bucket.antivirus===true,'Evidence bucket must be server-only with file security, encryption, and antivirus enabled.','STORAGE_CONFIGURATION',503);
      const form=new FormData();form.append('fileId',id);form.append('file',new Blob([new Uint8Array(bytes)],{type:mime}),filename);
      const response=await fetch(`${config.APPWRITE_ENDPOINT}${root}/files`,{method:'POST',headers:headers(),body:form,signal:AbortSignal.timeout(60000)});
      if(response.status===409){const prior=await this.get(id);assert(digest(prior)===digest(bytes),'Evidence content is immutable.');return;}
      assert(response.ok,'Private storage rejected the upload. No file was released.','STORAGE_UNAVAILABLE',503);
      const file=await response.json() as {$permissions?:unknown[];sizeOriginal?:number};assert(file.$permissions?.length===0&&file.sizeOriginal===bytes.length,'Storage returned an unexpected upload result.','STORAGE_UNAVAILABLE',503);
    },
    async get(id){const response=await fetch(`${config.APPWRITE_ENDPOINT}${root}/files/${id}/download`,{headers:headers(),signal:AbortSignal.timeout(30000)});assert(response.ok,'Evidence content is unavailable.','STORAGE_UNAVAILABLE',503);const bytes=Buffer.from(await response.arrayBuffer());assert(bytes.length<=MAX_EVIDENCE_BYTES,'Stored evidence exceeds the file limit.');return bytes;},
  };
}
export const scanWithClamAV:Scanner=async bytes=>{
  if(!config.CBS_CLAMAV_HOST)return {status:'QUARANTINED',engine:'scanner-not-configured'};
  return new Promise(resolve=>{
    const socket=createConnection({host:config.CBS_CLAMAV_HOST!,port:config.CBS_CLAMAV_PORT});let text='',settled=false;
    const finish=(result:ScanResult)=>{if(settled)return;settled=true;socket.destroy();resolve(result);};
    socket.setTimeout(15000,()=>finish({status:'QUARANTINED',engine:'clamav-timeout'}));
    socket.on('error',()=>finish({status:'QUARANTINED',engine:'clamav-unavailable'}));
    socket.on('close',()=>finish({status:'QUARANTINED',engine:'clamav-incomplete-response'}));
    socket.on('connect',()=>{socket.write('zINSTREAM\0');for(let offset=0;offset<bytes.length;offset+=65536){const chunk=bytes.subarray(offset,offset+65536),length=Buffer.alloc(4);length.writeUInt32BE(chunk.length);socket.write(length);socket.write(chunk);}socket.write(Buffer.alloc(4));});
    socket.on('data',chunk=>{text+=chunk.toString();if(text.length>4096){finish({status:'QUARANTINED',engine:'clamav-invalid-response'});return;}if(!text.includes('\0')&&!text.includes('\n'))return;const result=text.replace(/[\0\r\n]+$/,'');if(result==='stream: OK')finish({status:'CLEAN',engine:'clamav-instream'});else if(/^stream: .+ FOUND$/.test(result))finish({status:'REJECTED',engine:'clamav-instream'});else finish({status:'QUARANTINED',engine:'clamav-scan-error'});});
  });
};

export class EvidenceService {
  private signingKey:Buffer;
  constructor(private store:Store,private storage:EvidenceStorage=createEvidenceStorage(store),private scanner:Scanner=scanWithClamAV,signingKey?:Buffer){this.signingKey=signingKey??(config.APPWRITE_DATA_KEY?createHmac('sha256',Buffer.from(config.APPWRITE_DATA_KEY,'base64')).update('cbs-evidence-download-v1').digest():randomBytes(32));}
  private authorized(s:State,p:Principal,id:string){const e=s.evidence.find(e=>e.id===id);assert(e&&canReadEvidence(s,p,e),'Evidence is unavailable or outside your permissions.','ACCESS_DENIED',403);return e;}
  async upload(p:Principal,raw:unknown){
    const input=uploadSchema.parse(raw),file=validateFile(input);
    const fileId=createHash('sha256').update(`${p.id}:${input.clientRequestId}`).digest('hex').slice(0,32);
    const reserved=await this.store.transaction(s=>{
      assert(canUseEvidenceTarget(s,p,input.targetType,input.targetId,true),'You cannot attach evidence to this record.','ACCESS_DENIED',403);
      const previous=s.evidence.find(e=>e.id===fileId);
      if(previous){assert(previous.sha256===file.sha256&&previous.targetId===input.targetId&&previous.targetType===input.targetType&&previous.filename===file.filename&&previous.mime===input.mime,'This request ID belongs to a different file or target.','IDEMPOTENCY_CONFLICT',409);return previous;}
      const at=new Date().toISOString();const e:Evidence={id:fileId,createdAt:at,updatedAt:at,targetType:input.targetType,targetId:input.targetId,uploadedBy:p.id,filename:file.filename,mime:input.mime,size:file.bytes.length,sha256:file.sha256,clientRequestId:input.clientRequestId,uploadStatus:'UPLOADING',scanStatus:'QUARANTINED',scanEngine:'scan-pending'};
      s.evidence.push(e);appendAudit(s,p,'evidence.reserved',e.id,jurisdictionFor(s,e));return e;
    });
    if(reserved.uploadStatus==='STORED')return reserved;
    try{await this.storage.put(fileId,file.bytes,file.filename,input.mime);const scan=await this.scanner(file.bytes);
      return await this.store.transaction(s=>{const e=this.authorized(s,p,fileId);e.uploadStatus='STORED';e.scanStatus=scan.status;e.scanEngine=scan.engine;e.scannedAt=new Date().toISOString();e.scannedSha256=scan.status==='CLEAN'?e.sha256:undefined;e.updatedAt=e.scannedAt;appendAudit(s,p,'evidence.uploaded',e.id,jurisdictionFor(s,e));return e;});
    }catch(error){await this.store.transaction(s=>{const e=s.evidence.find(e=>e.id===fileId);if(e&&e.uploadStatus!=='STORED'){e.uploadStatus='FAILED';e.scanStatus='QUARANTINED';e.scanEngine='upload-failed';e.updatedAt=new Date().toISOString();}}).catch(()=>{});throw error;}
  }
  async rescan(p:Principal,id:string){const e=this.authorized(await this.store.read(),p,id);assert(e.uploadStatus==='STORED','Upload must complete before scanning.');assert(e.scanStatus!=='REJECTED','Rejected evidence cannot be released by a rescan.');const bytes=await this.storage.get(id);assert(digest(bytes)===e.sha256,'Evidence integrity check failed.');const scan=await this.scanner(bytes);return this.store.transaction(s=>{const current=this.authorized(s,p,id);assert(current.sha256===e.sha256,'Evidence changed during scanning.');current.scanStatus=scan.status;current.scanEngine=scan.engine;current.scannedAt=new Date().toISOString();current.scannedSha256=scan.status==='CLEAN'?current.sha256:undefined;current.updatedAt=current.scannedAt;appendAudit(s,p,'evidence.scanned',id,jurisdictionFor(s,current));return current;});}
  async publicMedia(id:string){
    const published=(state:State)=>state.evidence.find(file=>file.id===id&&isPublicProjectMedia(state,file));
    const evidence=published(await this.store.read());
    assert(evidence,'Public media not found.','NOT_FOUND',404);
    const bytes=await this.storage.get(id);
    assert(digest(bytes)===evidence.sha256,'Evidence integrity check failed.','EVIDENCE_INTEGRITY',409);
    assert(published(await this.store.read())?.sha256===evidence.sha256,'Public media not found.','NOT_FOUND',404);
    return {evidence,bytes};
  }
  async token(p:Principal,id:string,now=Date.now()){
    const e=this.authorized(await this.store.read(),p,id);assert(e.uploadStatus==='STORED'&&e.scanStatus==='CLEAN'&&e.scannedSha256===e.sha256,'This file is quarantined, rejected, or has not passed scanning.','EVIDENCE_NOT_RELEASED',423);
    const encoded=Buffer.from(JSON.stringify({id,userId:p.id,sha256:e.sha256,expires:now+60000})).toString('base64url');const signature=createHmac('sha256',this.signingKey).update(encoded).digest('base64url');return {token:`${encoded}.${signature}`,expiresAt:new Date(now+60000).toISOString()};
  }
  async download(p:Principal,id:string,token:string,now=Date.now()){
    assert(token.length<2000,'Invalid download token.','INVALID_TOKEN',403);const [encoded,signature]=token.split('.');assert(encoded&&signature,'Invalid download token.','INVALID_TOKEN',403);const expected=createHmac('sha256',this.signingKey).update(encoded).digest(),received=Buffer.from(signature,'base64url');assert(received.length===expected.length&&timingSafeEqual(received,expected),'Invalid download token.','INVALID_TOKEN',403);
    let claims:{id:string;userId:string;sha256:string;expires:number};try{claims=JSON.parse(Buffer.from(encoded,'base64url').toString());}catch{throw new Error('Invalid download token.');}
    assert(claims.id===id&&claims.userId===p.id&&Number.isFinite(claims.expires)&&claims.expires>now,'Download token expired or belongs to a different account.','INVALID_TOKEN',403);
    const e=this.authorized(await this.store.read(),p,id);assert(e.scanStatus==='CLEAN'&&e.scannedSha256===e.sha256&&claims.sha256===e.sha256,'Evidence has not been released.','EVIDENCE_NOT_RELEASED',423);
    const bytes=await this.storage.get(id);assert(digest(bytes)===e.sha256,'Evidence integrity check failed.','EVIDENCE_INTEGRITY',409);
    await this.store.transaction(s=>{const current=this.authorized(s,p,id);assert(current.scanStatus==='CLEAN'&&current.scannedSha256===current.sha256,'Evidence is no longer released.','EVIDENCE_NOT_RELEASED',423);appendAudit(s,p,'evidence.downloaded',id,jurisdictionFor(s,current));});return {evidence:e,bytes};
  }
}
