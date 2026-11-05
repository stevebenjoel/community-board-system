import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { COLLECTIONS, emptyState, type Base, type Collection, type State } from '../shared/model.ts';
import { appwriteKey,config } from './config.ts';
import { addInecGeography, isReferenceGeo } from './inec-geography.ts';
import { DomainError } from './policy.ts';

export interface Store { read():Promise<State>; transaction<T>(work:(state:State)=>T):Promise<T>; close():void }
export class SqliteStore implements Store {
  db:DatabaseSync;
  private queue:Promise<unknown>=Promise.resolve();
  constructor(path=config.CBS_DB_PATH){
    mkdirSync(dirname(path),{recursive:true});this.db=new DatabaseSync(path);this.db.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, ordinal INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS records_kind ON records(kind);
      CREATE TABLE IF NOT EXISTS evidence_blobs(id TEXT PRIMARY KEY,content BLOB NOT NULL);
      CREATE TRIGGER IF NOT EXISTS protect_audit_update BEFORE UPDATE ON records WHEN OLD.kind='audits' BEGIN SELECT RAISE(ABORT,'Audit records are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS protect_audit_delete BEFORE DELETE ON records WHEN OLD.kind='audits' BEGIN SELECT RAISE(ABORT,'Audit records are append-only'); END;
      INSERT OR IGNORE INTO schema_migrations VALUES(1,datetime('now'));
      INSERT OR IGNORE INTO schema_migrations VALUES(2,datetime('now'));`);
  }
  private readState(){const s=emptyState();for(const row of this.db.prepare('SELECT kind,payload FROM records ORDER BY ordinal,id').all() as {kind:Collection;payload:string}[])(s[row.kind] as Base[]).push(JSON.parse(row.payload));return addInecGeography(s);}
  async read(){return this.readState();}
  transaction<T>(work:(state:State)=>T):Promise<T>{
    const task=this.queue.then(()=>this.transact(work));this.queue=task.catch(()=>{});return task;
  }
  private async transact<T>(work:(state:State)=>T){
    this.db.exec('BEGIN IMMEDIATE');try{const s=this.readState(),before=serialized(s),result=work(s),after=serialized(s);let ordinal=Number((this.db.prepare('SELECT coalesce(max(ordinal),0) AS n FROM records').get() as {n:number}).n);
      for(const [key,row] of after)if(before.get(key)?.payload!==row.payload){if(before.has(key))this.db.prepare('UPDATE records SET payload=? WHERE id=?').run(row.payload,key);else this.db.prepare('INSERT INTO records VALUES(?,?,?,?)').run(key,row.kind,row.payload,++ordinal);}
      this.db.exec('COMMIT');return result;
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  close(){this.db.close();}
}
function serialized(s:State){const result=new Map<string,{kind:Collection;payload:string}>();for(const kind of COLLECTIONS)for(const row of s[kind])if(kind!=='geos'||!isReferenceGeo(row.id))result.set(row.id,{kind,payload:JSON.stringify(row)});return result;}
export async function appwrite(path:string,method='GET',body?:unknown,credential?:{jwt:string}){
  const headers:Record<string,string>={'X-Appwrite-Project':config.APPWRITE_PROJECT_ID!,'Content-Type':'application/json'};
  if(credential)headers['X-Appwrite-JWT']=credential.jwt;else headers['X-Appwrite-Key']=appwriteKey!;
  const response=await fetch(`${config.APPWRITE_ENDPOINT}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await response.json() as Record<string,unknown>;
  if(!response.ok){if(response.status===409)throw new DomainError('CONCURRENT_UPDATE','Data changed during this action. Refresh and retry.',409);const error=new Error(`Appwrite request failed (${response.status}).`) as Error&{status:number;code:unknown};error.status=response.status;error.code=data.type;throw error;}return data;
}
function seal(payload:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(config.APPWRITE_DATA_KEY!,'base64'),iv);const content=Buffer.concat([cipher.update(payload,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),content]).toString('base64');}
function unseal(payload:string){const data=Buffer.from(payload,'base64'),cipher=createDecipheriv('aes-256-gcm',Buffer.from(config.APPWRITE_DATA_KEY!,'base64'),data.subarray(0,12));cipher.setAuthTag(data.subarray(12,28));return Buffer.concat([cipher.update(data.subarray(28)),cipher.final()]).toString('utf8');}
export class AppwriteStore implements Store {
  root=`/tablesdb/${config.APPWRITE_DATABASE_ID}/tables/cbs_records/rows`;
  async read(transactionId?:string){const s=emptyState();let cursor='';for(;;){const query=new URLSearchParams();query.append('queries[]',JSON.stringify({method:'limit',values:[100]}));query.append('queries[]',JSON.stringify({method:'orderAsc',attribute:'ordinal'}));if(cursor)query.append('queries[]',JSON.stringify({method:'cursorAfter',values:[cursor]}));if(transactionId)query.set('transactionId',transactionId);const page=await appwrite(`${this.root}?${query}`) as {rows:{kind:Collection;payload:string;$id:string}[]};for(const row of page.rows)(s[row.kind] as Base[]).push(JSON.parse(unseal(row.payload)));if(page.rows.length<100)break;cursor=page.rows.at(-1)!.$id;}return addInecGeography(s);}
  async transaction<T>(work:(state:State)=>T){
    const tx=await appwrite('/tablesdb/transactions','POST',{ttl:60});const transactionId=String(tx.$id);
    try{
      // Stage the revision guard before reading. Concurrent commands contend on this row.
      await appwrite(`/tablesdb/${config.APPWRITE_DATABASE_ID}/tables/cbs_control/rows/revision/revision/increment`,'PATCH',{value:1,transactionId});
      const s=await this.read(transactionId),before=serialized(s),result=work(s),after=serialized(s);
      let ordinal=Date.now()*100;
      for(const [rowId,row] of after)if(before.get(rowId)?.payload!==row.payload){if(row.kind==='audits'&&before.has(rowId))throw new Error('Audit records are append-only.');const body={data:{kind:row.kind,payload:seal(row.payload),...(!before.has(rowId)?{ordinal:++ordinal}:{})},transactionId};if(before.has(rowId))await appwrite(`${this.root}/${rowId}`,'PATCH',body);else await appwrite(this.root,'POST',{...body,rowId,permissions:[]});}
      await appwrite(`/tablesdb/transactions/${transactionId}`,'PATCH',{commit:true});return result;
    }catch(e){await appwrite(`/tablesdb/transactions/${transactionId}`,'PATCH',{rollback:true}).catch(()=>{});throw e;}
  }
  close(){}
}
export const createStore=():Store=>config.CBS_MODE==='appwrite'?new AppwriteStore():new SqliteStore();
