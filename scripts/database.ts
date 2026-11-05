import { config } from '../server/config.ts';
import { appwrite, createStore } from '../server/store.ts';
import { addBoardSamples, referenceSeed, syntheticSeed, boardDefinitions } from '../server/seed.ts';

const operation=process.argv[2];
async function tolerateConflict(path:string,method:string,body:unknown){try{return await appwrite(path,method,body);}catch(error){if((error as {status?:number}).status!==409)throw error;}}
if(operation==='migrate'&&config.CBS_MODE==='appwrite'){
  await tolerateConflict('/tablesdb','POST',{databaseId:config.APPWRITE_DATABASE_ID,name:'Community Board System'});
  const root=`/tablesdb/${config.APPWRITE_DATABASE_ID}/tables`;
  for(const table of ['cbs_records','cbs_control','cbs_board_types'])await tolerateConflict(root,'POST',{tableId:table,name:table,permissions:[],rowSecurity:true});
  for(const [table,key,size] of [['cbs_records','kind',50],['cbs_records','payload',1000000],['cbs_board_types','code',10],['cbs_board_types','name',150],['cbs_board_types','description',1000]] as const)await tolerateConflict(`${root}/${table}/columns/string`,'POST',{key,size,required:true,array:false});
  for(const [table,key] of [['cbs_records','ordinal'],['cbs_control','revision']] as const)await tolerateConflict(`${root}/${table}/columns/integer`,'POST',{key,required:true,array:false,min:0,max:9007199254740991});
  // Attribute creation is asynchronous. Wait for Appwrite to make all columns available.
  for(let attempt=0;attempt<60;attempt++){
    const tables=await Promise.all(['cbs_records','cbs_control','cbs_board_types'].map(t=>appwrite(`${root}/${t}/columns`)));
    const columns=tables.flatMap(t=>t.columns as {status:string}[]);
    if(columns.some(c=>['failed','stuck'].includes(c.status)))throw new Error('Appwrite column creation failed. Inspect the console.');
    if(columns.every(c=>c.status==='available'))break;
    if(attempt===59)throw new Error('Timed out waiting for Appwrite columns.');
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  for(const key of ['kind','ordinal'])await tolerateConflict(`${root}/cbs_records/indexes`,'POST',{key,type:'key',columns:[key],orders:['ASC']});
  await tolerateConflict(`${root}/cbs_control/rows`,'POST',{rowId:'revision',data:{revision:0},permissions:[]});
  for(const b of boardDefinitions)await tolerateConflict(`${root}/cbs_board_types/rows`,'POST',{rowId:b.code,data:{code:b.code,name:b.name,description:b.description},permissions:[]});
  const bucket={name:'CBS private evidence',permissions:[],fileSecurity:true,enabled:true,maximumFileSize:4194304,allowedFileExtensions:['png','jpg','jpeg','pdf','mp4'],compression:'none',encryption:true,antivirus:true};
  await tolerateConflict('/storage/buckets','POST',{bucketId:config.APPWRITE_EVIDENCE_BUCKET_ID,...bucket});
  await appwrite(`/storage/buckets/${config.APPWRITE_EVIDENCE_BUCKET_ID}`,'PUT',bucket);
  console.log('Appwrite schema migration submitted. Confirm indexes are available in the console before serving traffic.');
}else if(operation==='migrate'){
  const store=createStore();store.close();console.log('Local synthetic SQLite migrations 1–2 applied (including private evidence blobs).');
}else if(operation==='seed'){
  const store=createStore();await store.transaction(s=>{
    if(!s.geos.length)Object.assign(s,config.CBS_MODE==='synthetic'?syntheticSeed():referenceSeed());
    else if(config.CBS_MODE==='synthetic')addBoardSamples(s);
  });store.close();console.log('Idempotent seed complete.');
}else throw new Error('Use migrate or seed.');
